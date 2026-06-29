import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import {
  buildSwaggerDocument,
  setupSwagger,
} from './config/swagger/setup-swagger';

async function bootstrap() {
  // Pin the entire process to UTC so all server-side Date handling, logging,
  // and formatting are timezone-independent — a single UTC source of truth.
  process.env.TZ = 'UTC';


  const app = await NestFactory.create(AppModule, { rawBody: true });

  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) =>

    o.trim(),

  ) ?? [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://localhost:3000',
    'https://whats-app-hub-frontend.vercel.app',
    'https://whats-app-hub-git-development-sandeepgroots-projects.vercel.app',
    'http://localhost:10000',
    'http://localhost:5000'
  ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('v1');

  const configService = app.get(ConfigService<AppConfig, true>);
  const port = configService.get('port', { infer: true });

  const document = buildSwaggerDocument(app, port);
  setupSwagger(app, document);

  await app.listen(port);
}

void bootstrap();
