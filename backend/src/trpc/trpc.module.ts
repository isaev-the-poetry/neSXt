import { Module, forwardRef } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { MainController } from './main.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [],
  providers: [TrpcService, MainController],
  exports: [TrpcService],
})
export class TrpcModule {} 