import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Configure CORS to allow frontend requests.
  // By default allow common dev origins and an optional FRONTEND_URL env var for production.
  const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`;
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin like mobile apps or server-to-server
      if (!origin) return callback(null, true);
      const allowed = [
        frontendUrl,
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3001',
      ];
      if (allowed.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  });

  // Increase body size limits to handle large amounts of text data
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Optionally auto-sync database schema on boot (use for first-time deployments only)
  if (process.env.DB_SYNC_ON_BOOT === 'true') {
    try {
      const dataSource = app.get(DataSource);
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }
      await dataSource.synchronize();
    } catch (err) {
      // If sync fails, fall back to normal startup
      console.error('DB schema sync on boot failed:', err);
    }
  }

  const port = Number(process.env.PORT) || 5000;
  const host = '0.0.0.0';
  await app.listen(port, host);
  console.log(`API listening on http://${host}:${port}`);
}
bootstrap();
