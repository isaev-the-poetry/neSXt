import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthContext } from './auth.types';

// Расширяем интерфейс Request для добавления auth контекста
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Извлекаем токен из заголовка Authorization
      const authHeader = req.headers.authorization;
      let token = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        // Попробуем извлечь токен из cookies
        token = req.cookies?.['auth-token'];
      }

      if (token) {
        // Валидируем токен
        const validation = await this.authService.validateToken(token, {
          requireActive: true,
          allowExpired: false,
          updateLastUsed: true,
        });

        if (validation.isValid && validation.user && validation.token) {
          // Создаем контекст аутентификации
          req.auth = {
            user: validation.user,
            token: validation.token,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
          };
        }
      }

      next();
    } catch (error) {
      // В случае ошибки просто продолжаем без аутентификации
      // Конкретные эндпоинты сами решат, требуется ли аутентификация
      next();
    }
  }
}

// Декоратор для получения аутентифицированного пользователя
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const auth = request.auth;

    if (!auth?.user) {
      throw new UnauthorizedException('Authentication required');
    }

    return auth.user;
  },
);

export const OptionalAuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.auth?.user || null;
  },
);

export const AuthToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const auth = request.auth;

    if (!auth?.token) {
      throw new UnauthorizedException('Authentication required');
    }

    return auth.token;
  },
);

export const AuthContextDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthContext | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.authContext || null;
  },
);

// Guard для проверки аутентификации
import { CanActivate } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const auth = request.auth;

    if (!auth?.user) {
      throw new UnauthorizedException('Authentication required');
    }

    return true;
  }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Всегда пропускаем, но контекст аутентификации будет доступен если токен валидный
    return true;
  }
} 