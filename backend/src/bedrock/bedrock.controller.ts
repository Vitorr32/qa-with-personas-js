import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  NotFoundException,
  Post,
  Res,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BedrockService } from './bedrock.service';
import { PersonasService } from 'src/persona/persona.services';
import { PromptsService } from 'src/prompt/prompt.service';

class StreamRequestDto {
  personaId: string;
  question: string;
  fileIds?: string[]; // ignored for Bedrock for now
}

class AnalyzeRequestDto {
  question: string;
  responses: Array<{ persona: string; response: string }>;
  fileIds?: string[]; // ignored for Bedrock for now
}

@Controller('bedrock')
export class BedrockController {
  private readonly logger = new Logger(BedrockController.name);
  constructor(
    private readonly bedrock: BedrockService,
    private readonly personas: PersonasService,
    private readonly prompts: PromptsService,
  ) {}

  @Post('stream')
  @UseInterceptors(FilesInterceptor('files'))
  async stream(@Body() dto: StreamRequestDto, @UploadedFiles() files: Express.Multer.File[], @Res() res: any) {
    if (!dto || !dto.personaId || !dto.question) {
      throw new BadRequestException('personaId and question are required');
    }

    const persona = await this.personas.findOne(dto.personaId);
    if (!persona) throw new NotFoundException('Persona not found');

    const prompts = await this.prompts.getPrompts();

    const systemContent = `${prompts.mainPrompt}\n\nPersona:\nName: ${persona.name}\nDescription: ${persona.description}`;
    const finalSystem = dto?.fileIds?.length
      ? `${systemContent}\n\nReference file(s) id: ${dto.fileIds?.join(',')}`
      : systemContent;

    const mainTemp = Math.max(
      0.1,
      Math.min(2, Number((prompts as any).temperature ?? 0.7)),
    );

    // Abort when client disconnects
    const ac = new AbortController();
    let streamFinished = false;
    res.on('close', () => {
      if (streamFinished) return;
      try {
        ac.abort();
      } catch {}
    });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    try {
      // If files attached, prepare document blocks per Bedrock Converse API
      const hasFiles = Array.isArray(files) && files.length > 0;
      let messagesOverride: any[] | undefined;
      if (hasFiles) {
        const content: any[] = [{ text: String(dto.question || '') }];
        for (const f of files) {
          // Map mimetype to format; default to 'txt'
          const mime = f.mimetype || '';
          let format: string = 'txt';
          if (mime.includes('pdf')) format = 'pdf';
          else if (mime.includes('html')) format = 'html';
          else if (mime.includes('markdown') || f.originalname.endsWith('.md')) format = 'md';
          else if (mime.includes('csv') || f.originalname.endsWith('.csv')) format = 'csv';
          else if (mime.includes('word') || f.originalname.endsWith('.docx')) format = 'docx';
          else if (f.originalname.endsWith('.doc')) format = 'doc';
          else if (mime.includes('excel') || f.originalname.endsWith('.xlsx')) format = 'xlsx';
          else if (f.originalname.endsWith('.xls')) format = 'xls';
          // Add document block with bytes
          content.push({
            document: {
              format,
              name: f.originalname,
              source: { bytes: new Uint8Array(f.buffer) },
            },
          });
        }
        messagesOverride = [{ role: 'user', content }];
      }

      const iterator = this.bedrock.streamConverse(
        {
          system: finalSystem,
          messages: [
            { role: 'user', content: dto.question },
          ],
          messagesOverride,
          temperature: mainTemp,
          maxTokens: 1000,
        },
        ac.signal,
      );

      for await (const chunk of iterator) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      streamFinished = true;
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (e: any) {
      this.logger.error('Bedrock streaming failed', e);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
      }
      try {
        res.write(`data: ${JSON.stringify({ error: e?.message || 'stream error' })}\n\n`);
      } catch {}
      try { res.end(); } catch {}
    }
  }

  @Post('analyze')
  @UseInterceptors(FilesInterceptor('files'))
  async analyze(@Body() dto: AnalyzeRequestDto, @UploadedFiles() files: Express.Multer.File[]) {
    if (!dto || !dto.responses || !Array.isArray(dto.responses)) {
      throw new BadRequestException('responses array is required');
    }
    if (dto.responses.length === 0) {
      throw new BadRequestException('responses array cannot be empty');
    }

    for (const item of dto.responses) {
      if (!item.persona || !item.response) {
        throw new BadRequestException(
          'each response must have persona and response fields',
        );
      }
    }

    const prompts = await this.prompts.getPrompts();

    const hasFiles = Array.isArray(files) && files.length > 0;
    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: `Question Asked: ${dto.question}` },
    ];
    for (const item of dto.responses) {
      const persona = await this.personas.findOne(item.persona);
      if (!persona) continue;
      messages.push({
        role: 'user',
        content: `Persona: ${persona.name}\nResponse: ${item.response}`,
      });
    }

    try {
      // If files present, attach them as documents in the first user message
      let messagesOverride: any[] | undefined;
      if (hasFiles) {
        const firstContent: any[] = [{ text: `Question Asked: ${dto.question}` }];
        for (const f of files) {
          const mime = f.mimetype || '';
          let format: string = 'txt';
          if (mime.includes('pdf')) format = 'pdf';
          else if (mime.includes('html')) format = 'html';
          else if (mime.includes('markdown') || f.originalname.endsWith('.md')) format = 'md';
          else if (mime.includes('csv') || f.originalname.endsWith('.csv')) format = 'csv';
          else if (mime.includes('word') || f.originalname.endsWith('.docx')) format = 'docx';
          else if (f.originalname.endsWith('.doc')) format = 'doc';
          else if (mime.includes('excel') || f.originalname.endsWith('.xlsx')) format = 'xlsx';
          else if (f.originalname.endsWith('.xls')) format = 'xls';
          firstContent.push({
            document: {
              format,
              name: f.originalname,
              source: { bytes: new Uint8Array(f.buffer) },
            },
          });
        }
        messagesOverride = [
          { role: 'user', content: firstContent },
          ...messages.slice(1).map((m) => ({ role: m.role, content: [{ text: m.content }] })),
        ];
      }

      const result = await this.bedrock.converse({
        system: prompts.analystPrompt,
        messages,
        messagesOverride,
        maxTokens: Number(process.env.BEDROCK_ANALYSIS_MAX_TOKENS || 2000),
        temperature: 0.3,
        useAnalysisModel: true,
      });

      return {
        analysis: result.text,
        metadata: {
          model: result.model,
          tokensUsed: result.usage,
          responsesAnalyzed: dto.responses.length,
        },
      };
    } catch (error) {
      this.logger.error('Bedrock analysis failed:', error);
      throw new BadRequestException('Failed to analyze responses');
    }
  }
}
