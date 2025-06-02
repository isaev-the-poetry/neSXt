import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthRestController } from './auth-rest.controller';
// import { GoogleStrategy } from './google.strategy';
import { TrpcService } from '../trpc/trpc.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthRestController],
  providers: [
    AuthService,
    AuthController,
    // GoogleStrategy, // Временно отключено
    TrpcService, // Нужен для BaseTrpcController
  ],
  exports: [AuthService, AuthController],
})
export class AuthModule {} 