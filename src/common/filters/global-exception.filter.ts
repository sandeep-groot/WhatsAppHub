import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorBody = {
  statusCode: number;
  error: string;
  message: string;
  correlationId?: string;
  details?: unknown;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = request.correlationId;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message = 'An unexpected error occurred';
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      error = HttpStatus[statusCode] ?? error;
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const body = exceptionResponse as Record<string, unknown>;
        message =
          typeof body.message === 'string'
            ? body.message
            : Array.isArray(body.message)
              ? body.message.join(', ')
              : message;
        details = body.details ?? body.errors;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        JSON.stringify({ correlationId, message: exception.message }),
        exception.stack,
      );
    }

    const body: ErrorBody = {
      statusCode,
      error,
      message,
      correlationId,
      ...(details !== undefined ? { details } : {}),
    };

    response.status(statusCode).json(body);
  }
}
