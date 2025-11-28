import {
  Controller,
  Post,
  Body,
  Res,
  NotFoundException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Logger,
  Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { OpenAIService } from './openai.service';
import { PersonasService } from 'src/persona/persona.services';
import { PromptsService } from 'src/prompt/prompt.service';

class StreamRequestDto {
  personaId: string;
  question: string;
  fileIds?: string[];
}

class AnalyzeRequestDto {
  question: string;
  responses: Array<{ persona: string; response: string }>;
  fileIds?: string[];
}

@Controller('openai')
export class OpenAIController {
  private readonly logger = new Logger(OpenAIController.name);
  constructor(
    private readonly openai: OpenAIService,
    private readonly personas: PersonasService,
    private readonly prompts: PromptsService,
  ) { }

  @Post('stream')
  @UseInterceptors(FilesInterceptor('files'))
  async stream(@Body() dto: StreamRequestDto, @UploadedFiles() files: Express.Multer.File[], @Res() res: any, @Req() req: any) {
    if (!dto || !dto.personaId || !dto.question) {
      throw new BadRequestException('personaId and question are required');
    }

    // Sanitize inputs (handle CRLF from multipart forms)
    dto.personaId = String(dto.personaId).trim();
    dto.question = String(dto.question).trim();

    const persona = await this.personas.findOne(dto.personaId);
    if (!persona) throw new NotFoundException('Persona not found');

    const prompts = await this.prompts.getPromptsForUser(req.user.sub);

    // Compose messages: main prompt, persona description/greeting, then user question
    const systemContent = `${prompts.mainPrompt}\n\nPersona:\nName: ${persona.name}\nDescription: ${persona.description}`;

    // If a fileId was provided, include a short hint in the system content and
    // include it on the top-level payload for downstream use if required.
    // If files were included, upload them to OpenAI and collect file_ids
    let uploadedFileIds: string[] = [];
    if (Array.isArray(files) && files.length > 0) {
      try {
        for (const f of files) {
          const up = await (this as any).openai.uploadFile(f);
          if (up?.id) uploadedFileIds.push(up.id);
        }
      } catch (e) {
        this.logger.error('Failed to upload files to OpenAI', e as any);
      }
    }

    const allFileIds = (dto.fileIds && dto.fileIds.length > 0) ? dto.fileIds : uploadedFileIds;
    const finalPrompt = allFileIds?.length ? `${systemContent}\n\nReference file(s) id: ${allFileIds.join(",")}` : systemContent;

    const fileInputs = allFileIds?.map(id => ({ type: "file", file_id: id })) || [];

    const mainTemp = Math.max(0.1, Math.min(2, Number((prompts as any).temperature ?? 0.7)));

    const payload: any = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: finalPrompt },
        {
          role: 'user', content: [{
            type: "text",
            text: dto.question
          },
          ...fileInputs
          ]
        },
      ],
      stream: true,
      temperature: mainTemp,
      max_tokens: 1000,
    };

    // Create AbortController so we can abort the OpenAI request when the
    // client disconnects. The 'close' event fires even when the response
    // finishes normally, so track whether the stream completed and only
    // abort if the client disconnected early.
    const ac = new AbortController();
    let streamFinished = false;
    res.on('close', () => {
      if (streamFinished) return; // response finished normally
      try {
        ac.abort();
      } catch (e) {
        /* ignore */
      }
    });

    const openaiStreamResponse = await this.openai.streamChatCompletion(payload, ac.signal);

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    for await (const event of openaiStreamResponse) {
      try {
        res.write(`data: ${JSON.stringify({ text: event.choices[0].delta.content })}\n\n`);
      } catch (e) {
        res.write(`data: ${JSON.stringify({ error: e?.data?.message || e?.message })}\n\n`);
      }
    }
    // Mark finished before ending the response so the 'close' handler does
    // not treat this as a client disconnect and abort the controller.
    streamFinished = true;
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }

  @Post('analyze')
  @UseInterceptors(FilesInterceptor('files'))
  async analyze(@Body() dto: AnalyzeRequestDto, @UploadedFiles() _files: Express.Multer.File[], @Req() req: any) {
    if (!dto || !dto.responses || !Array.isArray(dto.responses)) {
      // If multipart form, parse responses JSON
      if (dto && (dto as any).responses && typeof (dto as any).responses === 'string') {
        try {
          (dto as any).responses = JSON.parse((dto as any).responses);
        } catch {
          throw new BadRequestException('responses array is required');
        }
      } else {
        throw new BadRequestException('responses array is required');
      }
    }

    if (dto.responses.length === 0) {
      throw new BadRequestException('responses array cannot be empty');
    }

    // Validate response structure
    for (const item of dto.responses) {
      if (!item.persona || !item.response) {
        throw new BadRequestException('each response must have persona and response fields');
      }
    }

    const prompts = await this.prompts.getPromptsForUser(req.user.sub);

    // Format the responses for analysis
    let messageList: { role: string, content: string }[] = [{ role: 'user', content: `Question Asked: ${dto.question}` }];

    for (const item of dto.responses) {
      const persona = await this.personas.findOne(item.persona);
      if (!persona) continue;
      messageList.push({ role: 'user', content: `Persona: ${persona.name}\nResponse: ${item.response}` });
    }

    const payload: any = {
      model: process.env.OPENAI_ANALYSIS_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompts.analystPrompt },
        ...messageList
      ],
      // Ensure we request enough space for the full analysis
      max_tokens: Number(process.env.OPENAI_ANALYSIS_MAX_TOKENS || 2000),
      temperature: 0.3,
    };

    try {
      const result = await this.openai.chatCompletion(payload);

      return {
        analysis: result.choices[0].message.content,
        metadata: {
          model: result.model,
          tokensUsed: result.usage,
          responsesAnalyzed: dto.responses.length,
        },
      };
    } catch (error) {
      this.logger.error('Analysis failed:', error);
      throw new BadRequestException('Failed to analyze responses');
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const result = await (this as any).openai.uploadFile(file);
    return { id: result.id, raw: result };
  }

  @Post('check')
  @UseInterceptors(FileInterceptor('file'))
  async check(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    // Allowed mimetypes and max size are configurable via env vars.
    const allowed = (process.env.OPENAI_ALLOWED_MIMETYPES || 'image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document').split(',').map(s => s.trim());
    const maxBytes = parseInt(process.env.OPENAI_MAX_FILE_BYTES || '') || 10 * 1024 * 1024; // default 10 MB

    // Check size
    if (file.size > maxBytes) {
      return { ok: false, reason: `file too large (max ${maxBytes} bytes)` };
    }

    // Check mimetype with simple wildcard support
    const mime = file.mimetype || '';
    const match = allowed.some(a => {
      if (a.endsWith('/*')) {
        const prefix = a.slice(0, -2);
        return mime.startsWith(prefix + '/');
      }
      return a === mime;
    });
    if (!match) {
      return { ok: false, reason: `mimetype ${mime} not allowed` };
    }

    return { ok: true };
  }
}