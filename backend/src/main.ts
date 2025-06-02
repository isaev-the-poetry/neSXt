import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MainController } from './trpc/main.controller';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // Setup TRPC
  const trpc = app.get(MainController);
  trpc.applyMiddleware(app.getHttpAdapter().getInstance());
  
  await app.listen(4000);
  console.log('Backend is running on http://localhost:4000');
  console.log('TRPC endpoint: http://localhost:4000/trpc');
}
bootstrap(); 