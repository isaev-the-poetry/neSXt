import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TrpcModule } from './trpc/trpc.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, TrpcModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 