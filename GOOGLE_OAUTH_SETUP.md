# Настройка Google OAuth

Для полноценной работы авторизации через Google необходимо настроить Google OAuth credentials.

## 🔧 Шаги настройки

### 1. Создание проекта в Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API (или People API)

### 2. Настройка OAuth consent screen

1. В боковом меню выберите "APIs & Services" > "OAuth consent screen"
2. Выберите "External" для типа пользователей
3. Заполните обязательные поля:
   - App name: `NeSXt App`
   - User support email: ваш email
   - Developer contact information: ваш email
4. Добавьте scopes: `email`, `profile`
5. Добавьте test users (ваш email)

### 3. Создание OAuth 2.0 credentials

1. Перейдите в "APIs & Services" > "Credentials"
2. Нажмите "Create Credentials" > "OAuth 2.0 Client IDs"
3. Выберите "Web application"
4. Настройте:
   - Name: `NeSXt OAuth Client`
   - Authorized JavaScript origins: `http://localhost:4000`
   - Authorized redirect URIs: `http://localhost:4000/auth/google/callback`
5. Сохраните Client ID и Client Secret

### 4. Настройка переменных окружения

Создайте файл `backend/.env` на основе `backend/env.example`:

```bash
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-very-secure-jwt-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-actual-google-client-id"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/auth/google/callback"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# App
NODE_ENV="development"
```

### 5. Включение Google Strategy

Раскомментируйте Google Strategy в `backend/src/auth/auth.module.ts`:

```typescript
import { GoogleStrategy } from './google.strategy';

@Module({
  // ...
  providers: [
    AuthService,
    AuthController,
    GoogleStrategy, // Раскомментировать
    TrpcService,
  ],
  // ...
})
```

### 6. Перезапуск приложения

```bash
npm run dev
```

## 🧪 Тестирование

1. Откройте http://localhost:3000
2. Нажмите "Войти через Google"
3. Пройдите OAuth flow
4. Вы должны быть перенаправлены обратно с токеном

## 🔒 Безопасность

- Никогда не коммитьте `.env` файл с реальными credentials
- Используйте разные credentials для development и production
- В production используйте HTTPS URLs

## 🚀 Production

Для production измените URLs в Google Console:
- JavaScript origins: `https://yourdomain.com`
- Redirect URIs: `https://yourdomain.com/auth/google/callback` 