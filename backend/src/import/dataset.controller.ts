import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors, Body, Query, Get, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { DatasetImportService } from './dataset.service';

@Controller('import')
export class DatasetImportController {
  constructor(private readonly importService: DatasetImportService) {}

  @Post('personas')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = path.join(process.cwd(), 'uploads', 'imports');
        try {
          fs.mkdirSync(dir, { recursive: true });
        } catch {}
        cb(null, dir);
      },
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
    }),
    limits: { files: 1 },
  }))
  async importPersonas(
    @UploadedFile() file: Express.Multer.File,
    @Body('parser') parserKeyBody?: string,
    @Query('parser') parserKeyQuery?: string,
    @Body('batchSize') batchSizeBody?: string,
    @Query('batchSize') batchSizeQuery?: string,
  ) {
    // Dynamically set multer options using the service
    // Note: Nest doesn't allow dynamic options per-route easily; instead, configure globally.
    // As a workaround, we rely on default disk storage configured by Nest platform-express.
    if (!file) throw new BadRequestException('No file uploaded. Use field name "file".');

    const parserKey = (parserKeyBody || parserKeyQuery || 'default') as any;
    const batchSize = parseInt((batchSizeBody ?? batchSizeQuery) || '', 10) || undefined;

    // Start async job and return jobId immediately
    return this.importService.startImport(file.path, parserKey, batchSize);
  }

  @Get('status/:id')
  getStatus(@Param('id') id: string) {
    const job = this.importService.getJob(id);
    if (!job) throw new BadRequestException('Unknown job id');
    return job;
  }
}
