import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { setupApiDocs } from './api-docs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const allowedOrigins = [
    process.env.ADMIN_APP_ORIGIN ?? 'http://localhost:3000',
    process.env.STOREFRONT_APP_ORIGIN ?? 'http://localhost:3002',
  ];
  app.enableCors({ origin: allowedOrigins, credentials: true });
  setupApiDocs(app);
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
