import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthRestController {
  constructor(private authService: AuthService) {}

  @Get('google')
  // @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request, @Res() res: Response) {
    // Временно отключено - настройте Google OAuth credentials
    res.status(501).json({
      message: 'Google OAuth не настроен. Следуйте инструкциям в GOOGLE_OAUTH_SETUP.md',
      setupGuide: '/GOOGLE_OAUTH_SETUP.md'
    });
  }

  @Get('google/callback')
  // @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    // Временно отключено - настройте Google OAuth credentials
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Google OAuth не настроен')}`);
  }

  @Get('status')
  getStatus() {
    return {
      message: 'Auth service is running',
      googleAuthUrl: '/auth/google (отключено - настройте credentials)',
      environment: process.env.NODE_ENV || 'development',
      note: 'Следуйте инструкциям в GOOGLE_OAUTH_SETUP.md для настройки Google OAuth'
    };
  }
} 