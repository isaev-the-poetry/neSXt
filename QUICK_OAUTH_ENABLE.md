# Быстрое включение Google OAuth

После настройки Google OAuth credentials (см. [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)):

## 🔧 Шаги для активации

### 1. Раскомментируйте GoogleStrategy

В файле `backend/src/auth/auth.module.ts`:

```typescript
// import { GoogleStrategy } from './google.strategy'; // ❌ Убрать комментарий
import { GoogleStrategy } from './google.strategy';   // ✅ Должно быть так

@Module({
  // ...
  providers: [
    AuthService,
    AuthController,
    // GoogleStrategy, // ❌ Убрать комментарий
    GoogleStrategy,   // ✅ Должно быть так
    TrpcService,
  ],
  // ...
})
```

### 2. Включите OAuth guards

В файле `backend/src/auth/oauth.controller.ts`:

```typescript
// import { AuthGuard } from '@nestjs/passport'; // ❌ Убрать комментарий
import { AuthGuard } from '@nestjs/passport';   // ✅ Должно быть так

export class OAuthController {
  @Get('google')
  // @UseGuards(AuthGuard('google')) // ❌ Убрать комментарий
  @UseGuards(AuthGuard('google'))   // ✅ Должно быть так
  async googleAuth(@Req() req: Request) {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  // @UseGuards(AuthGuard('google')) // ❌ Убрать комментарий
  @UseGuards(AuthGuard('google'))   // ✅ Должно быть так
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
}
```

### 3. Настройте .env файл

Убедитесь, что `backend/.env` содержит ваши Google OAuth credentials:

```bash
GOOGLE_CLIENT_ID="your-actual-google-client-id"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret"
```

### 4. Перезапустите приложение

```bash
npm run dev
```

## ✅ После включения

- Кнопка "Войти через Google" будет работать
- OAuth flow будет перенаправлять в Google
- После авторизации пользователь вернется с токеном
- Frontend покажет информацию о пользователе

## 🧪 Тестирование

1. Откройте http://localhost:3000
2. Нажмите "Войти через Google"
3. Войдите в ваш Google аккаунт
4. Должны быть перенаправлены обратно как авторизованный пользователь 

В файле `backend/src/auth/oauth.controller.ts`:

```typescript
@Controller('auth')
export class OAuthController {
} 