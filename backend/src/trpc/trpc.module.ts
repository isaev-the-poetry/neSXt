import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { MainController } from './main.controller';

@Module({
  imports: [],
  controllers: [],
  providers: [TrpcService, MainController],
})
export class TrpcModule {} 