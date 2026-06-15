import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import {
  buildSwaggerDocument,
  setupSwagger,
} from './config/swagger/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) =>

    o.trim(),

  ) ?? [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://whats-app-hub-frontend.vercel.app',
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
