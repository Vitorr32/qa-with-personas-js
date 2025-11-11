import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import {
  BedrockClient,
  ListFoundationModelsCommand,
  GetFoundationModelCommand,
} from '@aws-sdk/client-bedrock';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

@Injectable()
export class BedrockService {
  private readonly logger = new Logger(BedrockService.name);
  private client: BedrockRuntimeClient;
  private controlClient: any;

  constructor() {
    const region = process.env.BEDROCK_REGION || process.env.AWS_REGION;
    if (!region) {
      this.logger.warn('AWS region not set (BEDROCK_REGION or AWS_REGION).');
    }
    this.client = new BedrockRuntimeClient({ region });
    this.controlClient = new BedrockClient({ region }) as any;
  }

  private get modelId(): string {
    return (
      process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0'
    );
  }

  private get analysisModelId(): string {
    return process.env.BEDROCK_ANALYSIS_MODEL_ID || this.modelId;
  }

  async converse(
    input: {
      system: string;
      messages: ChatMessage[];
      temperature?: number;
      maxTokens?: number;
      useAnalysisModel?: boolean;
      messagesOverride?: any[];
      systemOverride?: any[];
      modelIdOverride?: string;
      analysisModelIdOverride?: string;
    },
    signal?: AbortSignal,
  ): Promise<{
    text: string;
    raw: any;
    usage?: any;
    model: string;
  }> {
    if (!process.env.BEDROCK_REGION && !process.env.AWS_REGION) {
      this.logger.error('AWS region not configured');
      throw new InternalServerErrorException('AWS region not configured');
    }

    const modelId = input.useAnalysisModel
      ? input.analysisModelIdOverride || this.analysisModelId
      : input.modelIdOverride || this.modelId;

    const messages = input.messagesOverride
      ? input.messagesOverride
      : input.messages.map((m) => ({
          role: m.role,
          content: [{ text: m.content }],
        }));

    const cmd = new ConverseCommand({
      modelId,
      system: input.systemOverride
        ? input.systemOverride
        : input.system
        ? [{ text: input.system }]
        : undefined,
      messages,
      inferenceConfig: {
        temperature: input.temperature ?? 0.7,
        maxTokens: input.maxTokens ?? 1000,
      },
    } as any);

    const resp = await this.client.send(cmd, { abortSignal: signal as any });
    const outputMsg = (resp as any).output?.message;
    const text =
      outputMsg?.content?.map((c: any) => c?.text || '').join('') ?? '';
    return { text, raw: resp, usage: (resp as any).usage, model: modelId };
  }

  async *streamConverse(
    input: {
      system: string;
      messages: ChatMessage[];
      temperature?: number;
      maxTokens?: number;
      messagesOverride?: any[];
      systemOverride?: any[];
      modelIdOverride?: string;
    },
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, unknown> {
    if (!process.env.BEDROCK_REGION && !process.env.AWS_REGION) {
      this.logger.error('AWS region not configured');
      throw new InternalServerErrorException('AWS region not configured');
    }

  const modelId = input.modelIdOverride || this.modelId;

    const messages = input.messagesOverride
      ? input.messagesOverride
      : input.messages.map((m) => ({
          role: m.role,
          content: [{ text: m.content }],
        }));

    const cmd = new ConverseStreamCommand({
      modelId,
      system: input.systemOverride
        ? input.systemOverride
        : input.system
        ? [{ text: input.system }]
        : undefined,
      messages,
      inferenceConfig: {
        temperature: input.temperature ?? 0.7,
        maxTokens: input.maxTokens ?? 1000,
      },
    } as any);

    const resp = await this.client.send(cmd, { abortSignal: signal as any });
    for await (const event of (resp as any).stream) {
      if ((event as any).contentBlockDelta?.delta?.text) {
        yield (event as any).contentBlockDelta.delta.text as string;
      } else if ((event as any).messageStop) {
        break;
      } else if ((event as any).error) {
        const err = (event as any).error;
        this.logger.error(
          `Bedrock stream error: ${err?.message || JSON.stringify(err)}`,
        );
        throw new InternalServerErrorException('Bedrock streaming failed');
      }
    }
  }

  async listFoundationModels(): Promise<
    Array<{
      modelId: string;
      modelName?: string;
      providerName?: string;
      inputModalities?: string[];
      outputModalities?: string[];
      inferenceTypesSupported?: string[];
      contextWindow?: number | null;
      raw?: any;
    }>
  > {
    const region = process.env.BEDROCK_REGION || process.env.AWS_REGION;
    if (!region) {
      this.logger.error('AWS region not configured');
      throw new InternalServerErrorException('AWS region not configured');
    }

    const list = await this.controlClient.send(
      new ListFoundationModelsCommand({})
    );

    const summaries = (list as any).modelSummaries || [];

    const results: Array<{
      modelId: string;
      modelName?: string;
      providerName?: string;
      inputModalities?: string[];
      outputModalities?: string[];
      inferenceTypesSupported?: string[];
      contextWindow?: number | null;
      raw?: any;
    }> = [];

    // Fetch detailed model info to attempt to extract context window if available
    for (const s of summaries) {
      const modelId: string = s.modelId;
      let detail: any = undefined;
      try {
        const resp = await this.controlClient.send(
          new GetFoundationModelCommand({ modelIdentifier: modelId })
        );
        detail = (resp as any).model;
      } catch (e) {
        // Non-fatal; continue with summary info
        this.logger.debug(`GetFoundationModel failed for ${modelId}: ${e}`);
      }

      // Best-effort extraction of a context/token limit (varies by provider)
      let contextWindow: number | null = null;
      const candidates = [
        'contextWindow',
        'tokenContextSize',
        'maxInputTokens',
        'inputTokenLimit',
        'maxContextTokens',
        'maxPromptTokens',
      ];
      for (const key of candidates) {
        const val = detail?.[key] ?? s?.[key];
        if (typeof val === 'number') {
          contextWindow = val;
          break;
        }
      }

      results.push({
        modelId,
        modelName: s.modelName ?? detail?.modelName,
        providerName: s.providerName ?? detail?.providerName,
        inputModalities: s.inputModalities ?? detail?.inputModalities,
        outputModalities: s.outputModalities ?? detail?.outputModalities,
        inferenceTypesSupported:
          s.inferenceTypesSupported ?? detail?.inferenceTypesSupported,
        contextWindow,
        raw: detail || s,
      });
    }

    return results;
  }
}
