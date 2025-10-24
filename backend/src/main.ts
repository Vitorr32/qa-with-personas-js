import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Configure CORS to allow frontend requests.
  // By default allow common dev origins and an optional FRONTEND_URL env var for production.
  const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`;
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin like mobile apps or server-to-server
      if (!origin) return callback(null, true);
      const allowed = [frontendUrl, 'http://localhost:3000', 'http://localhost:3001'];
      if (allowed.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  });

  // Increase body size limits to handle large amounts of text data
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
