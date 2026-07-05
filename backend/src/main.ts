// src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level}] ${message}`;
          }),
        ),
      }),
      // Descomenta si quieres guardar logs en archivo
      // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      // new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: logger,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });

  await app.listen(port);

  const appLogger = new Logger('Bootstrap');
  appLogger.log(`🚀 VibeDJ Backend running on http://localhost:${port}`);
  appLogger.log(`Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
}

bootstrap().catch((err) => {
  console.error('Error starting application:', err);
  process.exit(1);
});