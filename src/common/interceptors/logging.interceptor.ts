import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { CORRELATION_ID_HEADER } from '../constants/http.constants';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const { method, originalUrl } = request;
    const correlationId =
      (request.headers[CORRELATION_ID_HEADER] as string | undefined) ??
      request.correlationId;
    const started = Date.now();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - started;
        this.logger.log(
          JSON.stringify({
            correlationId,
            method,
            path: originalUrl,
            statusCode: response.statusCode,
            durationMs,
          }),
        );
      }),
    );
  }
}
