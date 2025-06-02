import { Module, MiddlewareConsumer, NestModule, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthTRPCController } from './auth.controller.trpc';
import { OAuthController } from './oauth.controller';
import { GoogleStrategy } from './google.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { TrpcModule } from '../trpc/trpc.module';
import { AuthMiddleware, AuthGuard, OptionalAuthGuard } from './auth.middleware';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    forwardRef(() => TrpcModule),
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key-change-this'),
        signOptions: {
          expiresIn: '7d',
          issuer: 'nesxt-auth',
          audience: 'nesxt-users',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    OAuthController, // OAuth контроллер для OAuth flow
  ],
  providers: [
    AuthService,
    AuthTRPCController, // TRPC контроллер (новый)
    GoogleStrategy,
    AuthGuard,
    OptionalAuthGuard,
    AuthMiddleware,
  ],
  exports: [
    AuthService,
    AuthTRPCController,
    AuthGuard,
    OptionalAuthGuard,
    AuthMiddleware,
    JwtModule,
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Применяем middleware аутентификации ко всем маршрутам
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
} 