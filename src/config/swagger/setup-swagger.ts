import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import {
  SWAGGER_THEME_CSS,
  SWAGGER_THEME_TOGGLE_JS,
  SWAGGER_UI_CDN,
} from './swagger-ui-theme';

export function buildSwaggerDocument(app: INestApplication, port: number) {
  const builder = new DocumentBuilder()
    .setTitle('WhatsApp Hub API')
    .setDescription('WhatsApp Hub backend API')
    .setVersion('1.0')
    // Relative to the host serving /docs — works on Vercel and any deployed URL.
    .addServer('/', 'Current host')
    .addServer(`http://localhost:${port}/`, 'Local')
    .addBearerAuth();

  const publicUrl = process.env.PUBLIC_API_URL?.trim();
  if (publicUrl) {
    const normalized = publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`;
    builder.addServer(normalized, 'Public / production');
  }

  const swaggerConfig = builder.build();
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
