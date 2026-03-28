import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.configure';
import { INestApplication } from '@nestjs/common';

let app: INestApplication;

async function bootstrap(): Promise<INestApplication> {
  if (app) return app;

  app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'unpkg.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'unpkg.com'],
          imgSrc: ["'self'", 'data:', 'unpkg.com'],
          connectSrc: ["'self'"],
        },
      },
    }),
  );

  configureApp(app);

  await app.init();
  return app;
}

export default async function handler(req: any, res: any) {
  const nestApp = await bootstrap();
  const httpAdapter = nestApp.getHttpAdapter();
  httpAdapter.getInstance()(req, res);
}
