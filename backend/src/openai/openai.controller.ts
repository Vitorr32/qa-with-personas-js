import {
  Controller,
  Post,
  Body,
  Res,
  NotFoundException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { OpenAIService } from './openai.service';
import { PersonasService } from 'src/persona/persona.services';
import { PromptsService } from 'src/prompt/prompt.service';

class StreamRequestDto {
  personaId: string;
  question: string;
  fileId?: string;
}

@Controller('openai')
export class OpenAIController {
  constructor(
    private readonly openai: OpenAIService,
    private readonly personas: PersonasService,
    private readonly prompts: PromptsService,
  ) {}

  @Post('stream')
  async stream(@Body() dto: StreamRequestDto, @Res() res: any) {
    if (!dto || !dto.personaId || !dto.question) {
      throw new BadRequestException('personaId and question are required');
    }

    const persona = await this.personas.findOne(dto.personaId);
    if (!persona) throw new NotFoundException('Persona not found');

    const prompts = await this.prompts.getPrompts();

    // Compose messages: main prompt, persona description/greeting, then user question
    const systemContent = `${prompts.mainPrompt}\n\nPersona:\nName: ${persona.name}\nGreeting: ${persona.greeting}\nDescription: ${persona.description}`;

    // If a fileId was provided, include a short hint in the system content and
    // include it on the top-level payload for downstream use if required.
    const systemWithFile = dto.fileId ? `${systemContent}\n\nReference file id: ${dto.fileId}` : systemContent;

    const payload: any = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemWithFile },
        { role: 'user', content: dto.question },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    };

    if (dto.fileId) payload.file = dto.fileId;

    // Create AbortController so we can abort the OpenAI request when the
    // client disconnects.
    const ac = new AbortController();
    res.on('close', () => {
      try {
        ac.abort();
      } catch (e) {
        /* ignore */
      }
    });

    // Call OpenAI and proxy the streaming response to the client as text/event-stream (SSE)
    const openaiRes = await this.openai.streamChatCompletion(payload, ac.signal);

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const stream = openaiRes.body as any;
    const { TextDecoder } = require('util');
    const decoder = new TextDecoder();

    // Helper to send a JSON-text data event to client
    const sendTextEvent = (text: string) => {
      // Ensure we send a stable JSON object with a `text` field.
      const safe = JSON.stringify({ text });
      res.write(`data: ${safe}\n\n`);
    };

    try {
      if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
        for await (const chunk of stream) {
          const chunkText = typeof chunk === 'string' ? chunk : decoder.decode(chunk);
          const lines = chunkText.split('\n').filter(Boolean);
          for (const line of lines) {
            // OpenAI stream uses lines like: 'data: {...}\n\n' and 'data: [DONE]'
            if (line.trim() === 'data: [DONE]') {
              // Send final done marker and end
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
              await new Promise((r) => setTimeout(r, 10));
              return res.end();
            }
            if (line.startsWith('data: ')) {
              const payloadRaw = line.replace(/^data: /, '');
              try {
                const parsed = JSON.parse(payloadRaw);
                // The typical partial delta is in parsed.choices[0].delta.content
                const choices = parsed.choices || [];
                for (const ch of choices) {
                  const delta = ch.delta || {};
                  const text = delta?.content || '';
                  if (text && text.length > 0) {
                    sendTextEvent(text);
                  }
                }
              } catch (err) {
                // Non-JSON or unexpected chunk, forward raw as text
                sendTextEvent(payloadRaw);
              }
            }
          }
        }
        return res.end();
      }

      if (stream && typeof stream.pipe === 'function') {
        // If it's a Node stream, read it in chunks and parse lines
        const reader = require('readable-stream').Readable.from(stream);
        for await (const chunk of reader) {
          const chunkText = typeof chunk === 'string' ? chunk : decoder.decode(chunk);
          const lines = chunkText.split('\n').filter(Boolean);
          for (const line of lines) {
            if (line.trim() === 'data: [DONE]') {
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
              return res.end();
            }
            if (line.startsWith('data: ')) {
              const payloadRaw = line.replace(/^data: /, '');
              try {
                const parsed = JSON.parse(payloadRaw);
                const choices = parsed.choices || [];
                for (const ch of choices) {
                  const text = (ch.delta && ch.delta.content) || '';
                  if (text) sendTextEvent(text);
                }
              } catch {
                sendTextEvent(payloadRaw);
              }
            }
          }
        }
        return res.end();
      }

      // Fallback: non-streaming response
      const text = await openaiRes.text();
      sendTextEvent(text);
      res.end();
    } catch (err: any) {
      // If aborted, end quietly
      if (err && err.name === 'AbortError') {
        // client disconnected
        return;
      }
      // otherwise send an error event
      res.write(`data: ${JSON.stringify({ error: 'OpenAI stream error' })}\n\n`);
      res.end();
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
