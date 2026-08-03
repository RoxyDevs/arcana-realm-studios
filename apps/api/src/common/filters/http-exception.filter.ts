import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // HttpException.getResponse() for `new ConflictException("...")` etc. is not
    // the plain string passed in — it's NestJS's default body shape,
    // `{ message, error, statusCode }`. Passing that through as-is meant
    // clients saw a nested object instead of the message, rendering as
    // "[object Object]". Normalize to always emit a flat string (joining
    // ValidationPipe's string[] messages) so every client can just read
    // `body.message` directly.
    const rawResponse = exception instanceof HttpException ? exception.getResponse() : "Internal server error";
    const rawMessage =
      typeof rawResponse === "string" ? rawResponse : (rawResponse as Record<string, unknown>).message;
    const message = Array.isArray(rawMessage) ? rawMessage.join(", ") : (rawMessage ?? "Internal server error");

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
