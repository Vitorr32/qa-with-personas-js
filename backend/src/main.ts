import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Standardize all backend routes under /api to match frontend proxying
  app.setGlobalPrefix('api');
  // Configure CORS to allow frontend requests.
  const isProd = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`;

  if (isProd) {
    // In production behind a proxy, reflect the Origin to avoid false blocks
    app.enableCors({ origin: true, credentials: true });
  } else {
    // Allow common dev origins explicitly
    const allowed = new Set<string>();
    const add = (u?: string) => { if (!u) return; allowed.add(u.replace(/\/$/, '')); };
    add(frontendUrl);
    add('http://localhost:5173');
    add('http://localhost:3000');
    add('http://localhost:3001');
    add('http://127.0.0.1:5173');
    add('http://127.0.0.1:3000');
    add('http://127.0.0.1:3001');

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        try {
          const url = new URL(origin);
          const isDefaultPort = (url.protocol === 'http:' && (url.port === '' || url.port === '80'))
            || (url.protocol === 'https:' && (url.port === '' || url.port === '443'));
          const normalized = `${url.protocol}//${url.hostname}${isDefaultPort ? '' : ':' + url.port}`;
          if (allowed.has(normalized)) return callback(null, true);
        } catch { /* ignore */ }
        if (allowed.has((origin || '').replace(/\/$/, ''))) return callback(null, true);
        return callback(new Error('Origin not allowed by CORS'));
      },
      credentials: true,
    });
  }

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
