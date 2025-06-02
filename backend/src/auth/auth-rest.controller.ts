import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthRestController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    try {
      const { user, accessToken } = req.user;
      const token = await this.authService.generateToken(user);
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Authentication failed')}`);
    }
  }

  @Get('status')
  getStatus() {
    return {
      message: 'Auth service is running',
      googleAuthUrl: '/auth/google',
      environment: process.env.NODE_ENV || 'development'
    };
  }
} 