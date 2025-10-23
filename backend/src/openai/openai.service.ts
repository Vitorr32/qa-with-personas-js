import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from "openai";
import { APIPromise } from 'openai';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openaiClient: OpenAI;

  private get apiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  }

  constructor(private configService: ConfigService) {
    this.openaiClient = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY')
    });
  }

  /**
   * Stream chat completion from OpenAI and yield raw chunks as they arrive.
   * The caller is responsible for parsing the SSE-like stream that OpenAI returns.
   */
  async streamChatCompletion(payload: any, signal?: AbortSignal): Promise<any> {
    if (!this.apiKey) {
      this.logger.error('OPENAI_API_KEY not set');
      throw new InternalServerErrorException('OpenAI API key not configured');
    }

    return this.openaiClient.chat.completions.create(payload, { signal });
  }

  /** Upload a file to OpenAI and return the parsed JSON response. Expects an Express file (multer). */
  async uploadFile(file: Express.Multer.File, purpose = 'user_data'): Promise<any> {
    if (!this.apiKey) {
      this.logger.error('OPENAI_API_KEY not set');
      throw new InternalServerErrorException('OpenAI API key not configured');
    }

    // Use global FormData / Blob available in modern Node
    const form = new FormData();
    // Create a Blob from the buffer so fetch can send it
    const arr = new Uint8Array(file.buffer as any);
    const blob = new Blob([arr], { type: file.mimetype });
    form.append('file', blob, file.originalname);
    form.append('purpose', purpose);
    form.append('expires_after', JSON.stringify({
      anchor: 'created_at',
      seconds: process.env.OPENAI_FILE_TTL_SECONDS || 60 * 60, // Defaults to 1 hour
    }))

    const res = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      } as any,
      body: form as any,
    } as any);

    if (!res.ok) {
      const text = await res.text().catch(() => '<no body>');
      this.logger.error(`OpenAI file upload error ${res.status}: ${text}`);
      throw new InternalServerErrorException('OpenAI file upload failed');
    }

    return await res.json();
  }
}
