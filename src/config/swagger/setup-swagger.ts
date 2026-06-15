import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import {
  SWAGGER_THEME_CSS,
  SWAGGER_THEME_TOGGLE_JS,
  SWAGGER_UI_CDN,
} from './swagger-ui-theme';

export function buildSwaggerDocument(app: INestApplication, port: number) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('WhatsApp Hub API')
    .setDescription('WhatsApp Hub backend API')
    .setVersion('1.0')
    .addServer(`http://localhost:${port}/`, 'Local v1')
    .addBearerAuth()
    .build();

  const rawDocument = SwaggerModule.createDocument(app, swaggerConfig);
  return cleanupOpenApiDoc(rawDocument);
}

export function setupSwagger(
  app: INestApplication,
  document: ReturnType<typeof buildSwaggerDocument>,
): void {
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCss: SWAGGER_THEME_CSS,
    customCssUrl: SWAGGER_UI_CDN.css,
    customJs: [SWAGGER_UI_CDN.bundle, SWAGGER_UI_CDN.standalone],
    customJsStr: [SWAGGER_THEME_TOGGLE_JS],
  });
}