# NeSXt = NestJS + NextJS over TRPC с Декораторами и Авторизацией

Мне очень хотелось иметь в архитектуре упорядоченность, модульность и DI от NestJs, при этом для frontend очень нужны функции NextJs, а еще очень
хотелось иметь typesafe потоки данных. При этом для современного frontend просто необходимы SSR, SSG, Router (NextJs), и конечно же typesafe коммуникация между ними.
В этом starter репозитории я связал эти фреймворки через trpc, импортировал общий роутер во frontend и добавил декораторы, для более нативного вида в NestJS. 

**🆕 Добавлена авторизация через Google OAuth с TRPC методами!**

## 🚀 Быстрый старт

### 1. Клонирование и установка
```bash
# 1. Клонируйте репозиторий
git clone https://github.com/isaev-the-poetry/neSXt
cd neSXt

# Установка зависимостей для backend
cd backend
npm install

# Установка зависимостей для frontend
cd ../frontend
npm install
```

### 2. Настройка переменных окружения
```bash
# В backend/.env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:4000"
```

### 3. Настройка базы данных
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name "init"
```

### 4. Запуск приложения
```bash
# Терминал 1: Backend
cd backend
npm run start:dev

# Терминал 2: Frontend  
cd frontend
npm run dev
```

### 5. Открыть приложение
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Тест аутентификации**: http://localhost:3000/test-auth

## 🔐 Система аутентификации

### 🌟 Особенности универсальной системы

#### Множественные провайдеры
- ✅ **Google OAuth** - Полностью настроен
- 🚧 **GitHub OAuth** - Готов к настройке
- 🚧 **Discord OAuth** - Готов к настройке
- 🚧 **Facebook OAuth** - Готов к настройке
- 🚧 **Twitter OAuth** - Готов к настройке
- 🚧 **Apple OAuth** - Готов к настройке

#### Управление токенами
```typescript
// Получить активные токены пользователя
const { data: tokens } = trpc.auth.getUserTokens.useQuery({ activeOnly: true });

// Отозвать все токены (выйти со всех устройств)
await revokeAllTokensMutation.mutateAsync();

// Очистить просроченные токены
await cleanupTokensMutation.mutateAsync();
```

#### Защищенные endpoints
```typescript
// TRPC endpoint с аутентификацией
@Query()
@Output(UserSchema)
async getCurrentUser(@AuthUser() user: User) {
  return user;
}

// Frontend использование
const { user, isAuthenticated, logout } = useAuth();
```

### 🔄 Поток аутентификации

1. **Пользователь** нажимает "Войти через Google"
2. **Перенаправление** на Google OAuth
3. **Google callback** → валидация → создание токена
4. **Сохранение** в базе данных с метаданными
5. **Frontend** получает токен и данные пользователя
6. **Автоматическая валидация** при каждом запросе

### 📊 База данных

Универсальная схема поддерживает:
- **users** - Основные данные пользователей
- **auth_providers** - Конфигурация провайдеров OAuth
- **user_providers** - Связка пользователей с провайдерами
- **user_tokens** - JWT токены с метаданными
- **user_sessions** - Управление сессиями (опционально)

## 🎨 TRPC с Custom Decorators

### Создание endpoints
```typescript
@Injectable()
export class ExampleController {
  @Query()
  @Output(z.object({ message: z.string() }))
  async hello() {
    return { message: 'Hello from TRPC!' };
  }

  @Mutation()
  @Input(z.object({ name: z.string() }))
  @Output(z.object({ greeting: z.string() }))
  async greet(@Input() input: { name: string }) {
    return { greeting: `Hello, ${input.name}!` };
  }

  @Query()
  @Output(UserSchema)
  async getProfile(@AuthUser() user: User) {
    return user;
  }
}
```

### Frontend использование
```typescript
// Query
const { data: hello } = trpc.example.hello.useQuery();

// Mutation
const greetMutation = trpc.example.greet.useMutation();
const handleGreet = () => {
  greetMutation.mutate({ name: 'World' });
};

// Аутентифицированный запрос
const { data: profile } = trpc.example.getProfile.useQuery();
```

## 🛡️ Безопасность

### Аутентификация и авторизация
- **JWT токены** в базе данных
- **Мгновенный отзыв** токенов
- **IP и User-Agent** отслеживание
- **Автоматическое истечение** токенов
- **Детальное логирование** событий

### Middleware валидации
```typescript
// Автоматическая валидация для всех запросов
export class AuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const validation = await this.authService.validateToken(token);
      if (validation.isValid) {
        req.auth = { user: validation.user, token: validation.token };
      }
    }
    next();
  }
}
```

## 📚 Документация

### Основные руководства
- **[UNIVERSAL_AUTH_SYSTEM.md](UNIVERSAL_AUTH_SYSTEM.md)** - Полная документация по системе аутентификации
- **[ROLES_SYSTEM.md](ROLES_SYSTEM.md)** - Система ролей и контроль доступа
- **[GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)** - Настройка Google OAuth
- **[QUICK_OAUTH_ENABLE.md](QUICK_OAUTH_ENABLE.md)** - Быстрая активация OAuth

### API Reference
```typescript
// Основные TRPC endpoints
auth.getGoogleAuthUrl()              // Получить URL для OAuth
auth.getAvailableProviders()         // Список провайдеров
auth.getCurrentUser()                // Текущий пользователь
auth.getUserProfile()                // Детальный профиль
auth.getUserTokens()                 // Токены пользователя
auth.signOut()                       // Выход из системы
auth.revokeToken()                   // Отозвать токен
auth.revokeAllTokens()              // Отозвать все токены
auth.cleanupExpiredTokens()         // Очистить просроченные
```

## 🔧 Разработка

### Добавление нового провайдера
1. Создать стратегию Passport.js
2. Добавить REST endpoints
3. Обновить типы и конфигурацию
4. Протестировать OAuth flow

### Кастомные декораторы
```typescript
// Создание нового декоратора
export const CustomDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.customData;
  },
);

// Использование
@Query()
async method(@CustomDecorator() data: any) {
  return data;
}
```

### База данных
```bash
# Создание миграции
npx prisma migrate dev --name "add_new_feature"

# Генерация клиента
npx prisma generate

# Просмотр данных
npx prisma studio
```

## 🎯 Примеры использования

### Страница с аутентификацией
```tsx
function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div>Загрузка...</div>;
  if (!isAuthenticated) return <LoginPage />;
  
  return (
    <div>
      <h1>Привет, {user.name}!</h1>
      <UserProfile user={user} />
    </div>
  );
}
```

### Защищенный API endpoint
```typescript
@Query()
@Output(z.array(PostSchema))
async getUserPosts(@AuthUser() user: User) {
  return this.postsService.getPostsByUser(user.id);
}
```

### Управление токенами
```tsx
function TokenManager() {
  const { data: tokens } = trpc.auth.getUserTokens.useQuery();
  const revokeAllMutation = trpc.auth.revokeAllTokens.useMutation();
  
  return (
    <div>
      <h2>Активные сессии: {tokens?.tokens.length}</h2>
      {tokens?.tokens.map(token => (
        <TokenInfo key={token.id} token={token} />
      ))}
      <button onClick={() => revokeAllMutation.mutate()}>
        Выйти со всех устройств
      </button>
    </div>
  );
}
```

## 🚀 Развертывание

### Production настройки
```bash
# Переменные окружения для production
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="super-secure-secret-key"
FRONTEND_URL="https://yourdomain.com"
BACKEND_URL="https://api.yourdomain.com"
```

### Docker (опционально)
```dockerfile
# Dockerfile для backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
```

## 📈 Мониторинг

### Логирование событий
- `LOGIN_SUCCESS` / `LOGIN_FAILED`
- `TOKEN_CREATED` / `TOKEN_REVOKED`
- `PROVIDER_LINKED` / `PROVIDER_UNLINKED`
- `ROLE_ASSIGNED` / `ROLE_REMOVED`

### Метрики
- Активные пользователи
- Популярность провайдеров
- Среднее время сессии
- Распределение по ролям

## 🎯 Примеры системы ролей

### Контроль доступа в TRPC
```typescript
// Только для администраторов
@Mutation()
@Auth()
@HasRole(Role.ADMIN)
async assignUserRole(input: { userId: string; role: string }) {
  return this.authService.assignRole(input.userId, input.role);
}

// Для менеджеров и выше
@Query()
@Auth()
@HasRole(Role.MANAGER)
async getAllUsers() {
  return this.authService.getAllUsers();
}

// Множественные роли (OR логика)
@Query()
@Auth()
@HasRole([Role.MANAGER, Role.ADMIN])
async getReports() {
  return this.reportsService.generate();
}
```

### Frontend с проверкой ролей
```tsx
function AdminPanel() {
  const { user, hasRole } = useAuth();
  
  if (!hasRole('ADMIN')) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <UserRoleManager />
      <SystemSettings />
    </div>
  );
}
```

## 🤝 Контрибьюция

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 Лицензия

Этот проект распространяется под лицензией MIT. См. `LICENSE` для деталей.

## 🎉 Особенности

### ✅ Что уже работает
- 🔐 Полнофункциональная система аутентификации
- 🌐 Google OAuth интеграция  
- 💾 Управление токенами в БД
- 👥 Система ролей с контролем доступа
- 🎨 Custom TRPC декораторы
- 📱 Responsive frontend
- 🛡️ Middleware безопасности
- 📊 Детальное логирование

---

**NeSXt** - современное решение для быстрой разработки full-stack приложений с продвинутой аутентификацией и контролем доступа! 🚀
