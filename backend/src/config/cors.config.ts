import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';

export function setupCors(app: INestApplication) {
  const configService = app.get(ConfigService);

  const corsOrigins = (
    configService.get<string>('CORS_ORIGIN') ??
    'http://localhost:5173,http://127.0.0.1:5173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const corsConfig: CorsOptions = {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Content-Type'],
  };

  return corsConfig;
}