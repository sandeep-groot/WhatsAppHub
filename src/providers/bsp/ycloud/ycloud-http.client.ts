import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../config/configuration';

export type YCloudRequestOptions = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

@Injectable()
export class YcloudHttpClient {
  private readonly baseUrl =
    process.env.YCLOUD_API_BASE_URL ?? 'https://api.ycloud.com/v2';

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async request<T>(options: YCloudRequestOptions): Promise<T> {
    const ycloudConfig = this.configService.get('ycloud', { infer: true });
    const apiKey = ycloudConfig?.apiKey || process.env.YCLOUD_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('YCLOUD_API_KEY is not configured');
    }

    const url = new URL(`${this.baseUrl}${options.path}`);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      accept: 'application/json',
      'X-API-Key': apiKey,
    };

    const init: RequestInit = { method: options.method, headers };
    if (options.body !== undefined) {
      headers['content-type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), init);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      throw new BadGatewayException(`YCloud request failed: ${message}`);
    }

    const text = await response.text();
    let body: unknown = text;
    if (text.length > 0) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      console.error('YCloud API error details:', {
        status: response.status,
        body,
      });

      let errorMessage = 'YCloud API returned an error';
      if (body && typeof body === 'object') {
        const errorObj = (body as any).error;
        if (errorObj) {
          errorMessage = errorObj.message || errorMessage;
        } else if (typeof (body as any).message === 'string') {
          errorMessage = (body as any).message;
        }
      } else if (typeof body === 'string' && body.trim().length > 0) {
        errorMessage = body;
      }

      throw new BadGatewayException({
        message: errorMessage,
        status: response.status,
        ycloudBody: body,
      });
    }

    return body as T;
  }
}