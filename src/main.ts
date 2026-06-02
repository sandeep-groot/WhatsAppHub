import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('v1');

  const configService = app.get(ConfigService<AppConfig, true>);
  const port = configService.get('port', { infer: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WhatsApp Hub API')
    .setDescription('WhatsApp Hub backend API')
    .setVersion('1.0')
    .addServer(`http://localhost:${port}/`, 'Local v1')
    .addBearerAuth()
    .build();

  const rawDocument = SwaggerModule.createDocument(app, swaggerConfig);
  const document = cleanupOpenApiDoc(rawDocument);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
}

void bootstrap();
