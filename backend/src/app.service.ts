import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'NeSXt Backend is running! Visit /trpc for TRPC endpoints and /auth for authentication.';
  }
} 