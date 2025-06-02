import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { MainController } from './main.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [TrpcService, MainController],
})
export class TrpcModule {} 