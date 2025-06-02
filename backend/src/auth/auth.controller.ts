import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTrpcController } from '../trpc/base.controller';
import { Query, Mutation, Input, Output } from '../trpc/decorators';
import { AuthService } from './auth.service';
import { TrpcService } from '../trpc/trpc.service';

@Injectable()
export class AuthController extends BaseTrpcController {
  // Создаем роутер автоматически из декорированных методов
  authRouter = this.createRouter();

  constructor(
    private authService: AuthService,
    trpcService: TrpcService
  ) {
    super(trpcService);
  }

  @Query()
  @Output(z.object({
    success: z.boolean(),
    message: z.string(),
  }))
  getAuthStatus() {
    return {
      success: true,
      message: 'Auth service is running. Use signIn to authenticate with Google.'
    };
  }

  @Mutation()
  @Input(z.object({
    token: z.string().optional(),
  }))
  @Output(z.object({
    success: z.boolean(),
    message: z.string(),
    user: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
      avatar: z.string().optional(),
    }).optional(),
  }))
  async signIn({ input }: { input: { token?: string } }) {
    const result = await this.authService.signIn(input.token || '');
    return result;
  }

  @Mutation()
  @Output(z.object({
    success: z.boolean(),
    message: z.string(),
  }))
  async signOut() {
    const result = await this.authService.signOut();
    return result;
  }

  @Query()
  @Output(z.array(z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
    googleId: z.string(),
  })))
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Query()
  @Output(z.object({
    authUrl: z.string(),
    instructions: z.string(),
  }))
  getGoogleAuthUrl() {
    return {
      authUrl: 'http://localhost:4000/auth/google',
      instructions: 'Navigate to this URL to authenticate with Google'
    };
  }
} 