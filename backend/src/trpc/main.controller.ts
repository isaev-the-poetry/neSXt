import { Injectable } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';
import { BaseTrpcController } from './base.controller';
import { Query, Mutation, Input, Output } from './decorators';
import { AuthTRPCController } from '../auth/auth.controller.trpc';
import { TrpcService, TRPCContext } from './trpc.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MainController extends BaseTrpcController {
  constructor(
    private authController: AuthTRPCController,
    private authService: AuthService,
    trpcService: TrpcService
  ) {
    super(trpcService);
  }

  // Создаем основной роутер с подключением auth роутера
  appRouter = this.trpc.router({
    // Основные методы
    ...this.createRouter()._def.record,
    
    // Auth методы под префиксом auth
    auth: this.authController.createRouter(),
  });

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
        createContext: async ({ req }): Promise<TRPCContext> => {
          // Извлекаем токен из заголовков или cookies
          const authHeader = req.headers.authorization;
          let token = authHeader?.replace('Bearer ', '') || req.headers['x-auth-token'] as string;
          
          // Если токена нет в заголовках, проверяем cookies
          if (!token && req.headers.cookie) {
            const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
              const [key, value] = cookie.trim().split('=');
              // Decode URL-encoded cookie values
              acc[key] = value ? decodeURIComponent(value) : value;
              return acc;
            }, {} as Record<string, string>);
            
            token = cookies['auth-token'];
            
            // Debug logging
            console.log('[TRPC Context] Cookies found:', Object.keys(cookies));
            console.log('[TRPC Context] Auth token from cookies:', token ? '***' + token.slice(-10) : 'none');
          }
          
          let user = null;
          let tokenData = null;
          
          if (token) {
            try {
              console.log('[TRPC Context] Validating token...');
              const validation = await this.authService.validateToken(token);
              if (validation.isValid) {
                user = validation.user;
                tokenData = validation.token;
                console.log('[TRPC Context] Token valid, user:', user?.email);
              } else {
                console.log('[TRPC Context] Token invalid:', validation.error);
              }
            } catch (error) {
              console.log('[TRPC Context] Token validation error:', error.message);
            }
          } else {
            console.log('[TRPC Context] No token found in headers or cookies');
          }
          
          return {
            user,
            token: tokenData,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
          };
        },
      }),
    );
  }
}

export type AppRouter = MainController['appRouter']; 