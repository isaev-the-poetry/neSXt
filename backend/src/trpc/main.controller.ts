import { Injectable } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';
import { BaseTrpcController } from './base.controller';
import { Query, Mutation, Input, Output } from './decorators';

@Injectable()
export class MainController extends BaseTrpcController {
  // Создаем роутер автоматически из декорированных методов
  appRouter = this.createRouter();

  @Query()
  getHello() {
    return 'Hello World from TRPC!';
  }

  @Query()
  @Input(z.string().min(1, 'ID cannot be empty'))
  @Output(z.object({
    id: z.string(),
    message: z.string(),
  }))
  getMessageById({ input }: { input: string }) {
    return {
      id: input,
      message: `Hello user with ID: ${input}!`,
    };
  }

  @Mutation()
  @Input(z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
  }))
  @Output(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    createdAt: z.date(),
  }))
  createUser({ input }: { input: { name: string; email: string } }) {
    // Имитация создания пользователя
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: input.name,
      email: input.email,
      createdAt: new Date(),
    };
  }

  async applyMiddleware(app: any) {
    app.use(
      '/trpc',
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
        createContext: () => ({}),
      }),
    );
  }
}

export type AppRouter = MainController['appRouter']; 