import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  // const httpsOptions = {
  //   key: fs.readFileSync('./key.pem'),
  //   cert: fs.readFileSync('./cert.pem'),
  // };

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Meli Vision API Integration')
    .setDescription(
      `A NestJS API integration with Mercado Libre marketplace. 
      This API provides access to various Mercado Libre resources including items, 
      categories, users, orders, and more.`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your Mercado Libre access token',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Authentication', 'OAuth 2.0 authentication endpoints')
    .addTag('Sites', 'Mercado Libre sites information')
    .addTag('Locations', 'Countries, states, and cities')
    .addTag('Categories', 'Product categories and attributes')
    .addTag('Items', 'Product items and listings')
    .addTag('Search', 'Search for products')
    .addTag('Users', 'User information and reputation')
    .addTag('Orders', 'Order management (requires authentication)')
    .addTag('Messages', 'Messaging (requires authentication)')
    .addTag('Currencies', 'Currency information')
    .addTag('Attributes', 'Product attributes')
    .addTag('Brands', 'Brand information')
    .addTag('Trends', 'Market trends')
    .addTag('Health', 'API health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Mercado Libre API Docs',
    customfavIcon:
      'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.1/mercadolibre/favicon.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0; }
      .swagger-ui .info .title { font-size: 36px; }
    `,
  });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation available at: http://localhost:${port}/docs`);
}

bootstrap();
