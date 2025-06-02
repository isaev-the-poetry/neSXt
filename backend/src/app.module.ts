import { Module } from '@nestjs/common';
import { TrpcModule } from './trpc/trpc.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [TrpcModule, PrismaModule],
})
export class AppModule {} 