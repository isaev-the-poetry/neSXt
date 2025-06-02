# NeSXt = NestJS + NextJS over TRPC с Декораторами и Авторизацией

Мне очень хотелось иметь в архитектуре упорядоченность, модульность и DI от NestJs, при этом для frontend очень нужны функции NextJs, а еще очень
хотелось иметь typesafe потоки данных.

Мне очень хотелось иметь в архитектуре упорядоченность, модульность и DI от NestJs, при этом для современного frontend просто необходимы SSR, SSG, Router (NextJs), и конечно же typesafe коммуникация между ними.
В этом starter репозитории я связал эти фреймворки через trpc, импортировал общий роутер во frontend и добавил декораторы, для более нативного вида в NestJS. 

**🆕 Добавлена авторизация через Google OAuth с TRPC методами!**

## 🚀 Быстрый старт

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/isaev-the-poetry/neSXt
cd neSXt

# 2. Установите зависимости и настройте базу данных
npm run setup

# 3. Запустите оба приложения
npm run dev
```

Приложение будет доступно по адресам:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **TRPC Endpoint**: http://localhost:4000/trpc

## ✨ TRPC Декораторы + Авторизация
 
### Пример использования декораторов:

```typescript
@Injectable()
export class MainController extends BaseTrpcController {
  appRouter = this.createRouter();

  @Query()
  getHello() {
    return 'Hello World from TRPC!';
  }

  @Query()
  @Input(z.string().min(1))
  @Output(z.object({
    id: z.string(),
    message: z.string(),
  }))
  getMessageById({ input }: { input: string }) {
    return {
      id: input,
      message: `Hello user with ID: ${input}!`,
    };
  }

  @Mutation()
  @Input(z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }))
  createUser({ input }) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...input,
      createdAt: new Date(),
    };
  }
}
```

### Авторизация через TRPC:

```typescript
@Injectable()
export class AuthController extends BaseTrpcController {
  @Mutation()
  @Input(z.object({ token: z.string().optional() }))
  @Output(z.object({
    success: z.boolean(),
    message: z.string(),
    user: z.object({...}).optional(),
  }))
  async signIn({ input }) {
    return await this.authService.signIn(input.token);
  }

  @Mutation()
  async signOut() {
    return await this.authService.signOut();
  }
}
```

### Доступные декораторы:

- **@Query()** - для получения данных
- **@Mutation()** - для изменения данных  
- **@Input(schema)** - валидация входных данных
- **@Output(schema)** - валидация выходных данных

## 📁 Структура проекта

```
neSXt/
├── package.json          # Корневой package.json с workspaces
├── backend/              # NestJS приложение
│   ├── src/
│   │   ├── auth/         # 🆕 Модуль авторизации
│   │   │   ├── auth.controller.ts    # TRPC контроллер авторизации
│   │   │   ├── auth.service.ts       # Сервис авторизации
│   │   │   ├── auth-rest.controller.ts # REST контроллер для OAuth
│   │   │   ├── google.strategy.ts    # Google OAuth стратегия
│   │   │   ├── auth.types.ts         # TypeScript типы
│   │   │   └── auth.module.ts        # Модуль авторизации
│   │   ├── trpc/         # TRPC конфигурация и контроллеры
│   │   │   ├── decorators/ # TRPC декораторы
│   │   │   │   ├── procedure.decorators.ts
│   │   │   │   ├── input-output.decorators.ts
│   │   │   │   ├── trpc-metadata.ts
│   │   │   │   └── index.ts
│   │   │   ├── base.controller.ts # Базовый класс контроллера
│   │   │   ├── main.controller.ts # Главный TRPC контроллер
│   │   │   ├── trpc.module.ts
│   │   │   └── trpc.service.ts
│   │   ├── prisma/       # Prisma сервис
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma # Схема базы данных SQLite
│   ├── env.example       # 🆕 Пример переменных окружения
│   └── package.json
└── frontend/             # NextJS приложение
    ├── src/
    │   ├── contexts/     # 🆕 React контексты
    │   │   └── AuthContext.tsx # Контекст авторизации
    │   ├── pages/        # Страницы NextJS
    │   │   ├── auth/     # 🆕 Страницы авторизации
    │   │   │   ├── callback.tsx # OAuth callback
    │   │   │   └── error.tsx    # Ошибки авторизации
    │   │   ├── _app.tsx  # TRPC провайдер + Auth провайдер
    │   │   └── index.tsx # Обновлен с примерами авторизации
    │   └── utils/        # TRPC клиент
    │       └── trpc.ts
    └── package.json
```

## 🛠 Технологии

- **Backend**: NestJS 10.x + Prisma 5.x + SQLite + TRPC 10.x + **Собственные декораторы** + **Google OAuth**
- **Frontend**: NextJS 14.x + TRPC Client 10.x + React Query + **Auth Context**
- **Language**: TypeScript
- **Database**: SQLite (через Prisma)
- **Validation**: Zod
- **Authentication**: Google OAuth 2.0 + JWT

## 📋 Доступные команды

```bash
# Разработка
npm run dev                 # Запуск обоих приложений одновременно
npm run backend             # Запуск только backend
npm run frontend            # Запуск только frontend

# Сборка
npm run build              # Сборка обоих приложений

# Продакшн
npm run start              # Запуск в продакшн режиме

# Утилиты
npm run setup              # Установка зависимостей + настройка БД
npm run clean              # Удаление node_modules и build файлов

# Prisma (из папки backend)
cd backend
npx prisma studio          # Открыть Prisma Studio
npx prisma generate        # Генерация Prisma Client
npx prisma db push         # Применение изменений схемы
```

## 🔧 API

### TRPC Контроллер с декораторами

Backend предоставляет следующие методы через TRPC:

**Основные методы:**
- **`getHello()`** - возвращает строку приветствия
- **`getMessageById(id: string)`** - возвращает персонализированное сообщение 
- **`createUser(data: {name, email})`** - создает нового пользователя

**Auth методы:**
- **`auth.getAuthStatus()`** - статус сервиса авторизации
- **`auth.signIn(token?: string)`** - вход в систему
- **`auth.signOut()`** - выход из системы
- **`auth.getAllUsers()`** - список всех пользователей
- **`auth.getGoogleAuthUrl()`** - URL для Google OAuth

### Пример использования во frontend

```typescript
// В React компоненте
import { trpc } from '../utils/trpc';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();

  // Query без параметров
  const { data: hello } = trpc.getHello.useQuery();

  // Query с параметрами и валидацией
  const { data: message } = trpc.getMessageById.useQuery('user123');

  // Auth queries
  const { data: authStatus } = trpc.auth.getAuthStatus.useQuery();
  const { data: googleAuthUrl } = trpc.auth.getGoogleAuthUrl.useQuery();

  // Mutations
  const createUser = trpc.createUser.useMutation();
  const signOut = trpc.auth.signOut.useMutation();

  const handleGoogleSignIn = () => {
    if (googleAuthUrl?.authUrl) {
      window.location.href = googleAuthUrl.authUrl;
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Привет, {user?.name}!</p>
          <button onClick={() => signOut.mutate()}>Выйти</button>
        </div>
      ) : (
        <button onClick={handleGoogleSignIn}>Войти через Google</button>
      )}
    </div>
  );
}
```

## 🔐 Настройка Google OAuth

Для полноценной работы авторизации необходимо настроить Google OAuth credentials.

**Быстрая настройка:**
1. Скопируйте `backend/env.example` в `backend/.env`
2. Следуйте инструкциям в [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
3. Раскомментируйте `GoogleStrategy` в `backend/src/auth/auth.module.ts`
4. Перезапустите приложение

## ✨ Особенности

- ✅ **TRPC Декораторы** - NestJS-стиль для TRPC методов
- ✅ **Google OAuth** - полноценная авторизация через Google
- ✅ **JWT токены** - безопасная аутентификация
- ✅ **Type-safe связь** между frontend и backend через TRPC
- ✅ **CORS настроен** для работы между приложениями
- ✅ **Prisma с SQLite** базой данных
- ✅ **Workspaces** для удобного управления проектом
- ✅ **Hot reload** для обоих приложений
- ✅ **TypeScript везде** с полной типизацией
- ✅ **Автоматическая валидация** входных и выходных данных
- ✅ **React Query интеграция** для кеширования
- ✅ **Auth Context** для управления состоянием авторизации

## 🔄 Разработка

### Создание нового TRPC метода

1. **Добавьте метод в контроллер** (`backend/src/trpc/main.controller.ts`):

```typescript
@Query()
@Input(z.object({ userId: z.string() }))
@Output(z.object({ profile: z.object({ name: z.string(), age: z.number() }) }))
getUserProfile({ input }) {
  return {
    profile: {
      name: 'John Doe',
      age: 30
    }
  };
}
```

2. **Используйте в frontend** (типы автоматически доступны):

```typescript
const { data } = trpc.getUserProfile.useQuery({ userId: '123' });
// data имеет тип { profile: { name: string, age: number } }
```

### Добавление нового auth метода

1. **Добавьте в AuthController**:

```typescript
@Query()
@Output(z.object({ isAdmin: z.boolean() }))
checkAdminStatus() {
  return { isAdmin: false };
}
```

2. **Используйте в frontend**:

```typescript
const { data } = trpc.auth.checkAdminStatus.useQuery();
```

## 🚀 Деплой

Для деплоя в продакшн:

1. Соберите приложения: `npm run build`
2. Настройте переменные окружения (включая Google OAuth для production)
3. Запустите: `npm run start`

## 📝 Лицензия

MIT

---

**Создано с ❤️ используя NestJS, NextJS, TRPC, Google OAuth и собственные декораторы в стиле контроллеров**
