import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Validation globale des payloads (DTOs)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Préfixe global selon le cahier des charges
  app.setGlobalPrefix('api/v1');
  
  // CORS pour autoriser le frontend Vite
  app.enableCors();
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
