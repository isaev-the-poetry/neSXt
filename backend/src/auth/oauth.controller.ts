import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthProviderType } from './auth.types';

@Controller('auth')
export class OAuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {
    // Инициируем Google OAuth процесс
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const authData = req.user as any;
      
      if (!authData || !authData.user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?message=Authentication failed`);
      }

      const { user, accessToken } = authData;

      // Создаем профиль Google пользователя для универсальной системы
      const googleProfile = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.image,
        provider: AuthProviderType.GOOGLE,
        googleId: user.id,
        raw: user,
      };

      // Аутентифицируем через универсальную систему
      const authResult = await this.authService.authenticateWithProvider(
        googleProfile as any,
        {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.connection.remoteAddress,
          tokens: {
            access_token: accessToken,
          },
        }
      );

      // Формируем URL для перенаправления с токеном
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const callbackUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(authResult.token)}&user=${encodeURIComponent(JSON.stringify({
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        image: authResult.user.image,
      }))}`;

      // Устанавливаем куки с токеном (должен быть доступен для JavaScript)
      res.cookie('auth-token', authResult.token, {
        httpOnly: false, // Разрешаем доступ из JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
        path: '/', // Убеждаемся, что cookie доступен на всех путях
      });

      return res.redirect(callbackUrl);
    } catch (error) {
      console.error('Google auth callback error:', error);
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Authentication failed')}`);
    }
  }

  // Дополнительные методы для других провайдеров (пока заглушки)
  
  @Get('github')
  async githubAuth(@Res() res: Response) {
    return res.status(501).json({
      error: 'GitHub authentication not implemented yet',
      message: 'Please use Google authentication for now',
    });
  }

  @Get('discord')
  async discordAuth(@Res() res: Response) {
    return res.status(501).json({
      error: 'Discord authentication not implemented yet',
      message: 'Please use Google authentication for now',
    });
  }

  @Get('facebook')
  async facebookAuth(@Res() res: Response) {
    return res.status(501).json({
      error: 'Facebook authentication not implemented yet',
      message: 'Please use Google authentication for now',
    });
  }

  // Метод для проверки статуса аутентификации
  @Get('status')
  async getAuthStatus(@Req() req: Request) {
    const auth = (req as any).auth;
    
    return {
      isAuthenticated: !!auth?.user,
      user: auth?.user || null,
      providers: [
        {
          name: 'google',
          displayName: 'Google',
          available: true,
        },
        {
          name: 'github',
          displayName: 'GitHub',
          available: false,
        },
        {
          name: 'discord',
          displayName: 'Discord',
          available: false,
        },
      ],
    };
  }

  // Метод для выхода из системы
  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const auth = (req as any).auth;
      
      if (auth?.token) {
        await this.authService.logout(auth.token.token);
      }

      // Очищаем куки
      res.clearCookie('auth-token', {
        path: '/',
        sameSite: 'lax',
      });
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}?logout=success`);
    } catch (error) {
      console.error('Logout error:', error);
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}?logout=error`);
    }
  }
} 