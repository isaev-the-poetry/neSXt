# NeSXt = NestJS + NextJS over TRPC с Декораторами.

Мне очень хотелось иметь в архитектуре упорядоченность, модульность и DI от NestJs, при этом для frontend очень нужны функции NextJs, и конечно же typesafe коммцникация между ними.
В этом starter репозитории я связал эти фреймворки через trpc, импортировал общий роутер во frontend и добавил декораторы, для более нативного вида в NestJS. 


## 🚀 Быстрый старт

```bash
# 1. Клонируйте репозиторий
git clone [<repo-url>](https://github.com/isaev-the-poetry/neSXt)
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

## ✨ TRPC Декораторы
 
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
│   │   ├── trpc/         # TRPC конфигурация и контроллеры
│   │   │   ├── decorators/ # 🆕 TRPC декораторы
│   │   │   │   ├── procedure.decorators.ts
│   │   │   │   ├── input-output.decorators.ts
│   │   │   │   ├── trpc-metadata.ts
│   │   │   │   └── index.ts
│   │   │   ├── base.controller.ts # 🆕 Базовый класс контроллера
│   │   │   ├── main.controller.ts # 🔄 Главный TRPC контроллер
│   │   │   ├── trpc.module.ts
│   │   │   └── trpc.service.ts
│   │   ├── prisma/       # Prisma сервис
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma # Схема базы данных SQLite
│   └── package.json
└── frontend/             # NextJS приложение
    ├── src/
    │   ├── pages/        # Страницы NextJS
    │   │   ├── _app.tsx  # TRPC провайдер
    │   │   └── index.tsx # 🔄 Обновлен с примерами декораторов
    │   └── utils/        # TRPC клиент
    │       └── trpc.ts
    └── package.json
```

## 🛠 Технологии

- **Backend**: NestJS 10.x + Prisma 5.x + SQLite + TRPC 10.x + **Собственные декораторы**
- **Frontend**: NextJS 14.x + TRPC Client 10.x + React Query
- **Language**: TypeScript
- **Database**: SQLite (через Prisma)
- **Validation**: Zod

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

- **`getHello()`** - возвращает строку приветствия
- **`getMessageById(id: string)`** - возвращает персонализированное сообщение 
- **`createUser(data: {name, email})`** - создает нового пользователя

### Пример использования во frontend

```typescript
// В React компоненте
import { trpc } from '../utils/trpc';

export default function Home() {
  // Query без параметров
  const { data: hello } = trpc.getHello.useQuery();

  // Query с параметрами и валидацией
  const { data: message } = trpc.getMessageById.useQuery('user123');

  // Mutation с валидацией
  const createUser = trpc.createUser.useMutation();

  const handleCreate = () => {
    createUser.mutate({
      name: 'John Doe',
      email: 'john@example.com'
    });
  };

  return (
    <div>
      <p>{hello}</p> {/* "Hello World from TRPC!" */}
      <p>{message?.message}</p> {/* "Hello user with ID: user123!" */}
      <button onClick={handleCreate}>Create User</button>
    </div>
  );
}
```

## ✨ Особенности

- ✅ **TRPC Декораторы** - NestJS-стиль для TRPC методов
- ✅ **Type-safe связь** между frontend и backend через TRPC
- ✅ **CORS настроен** для работы между приложениями
- ✅ **Prisma с SQLite** базой данных
- ✅ **Workspaces** для удобного управления проектом
- ✅ **Hot reload** для обоих приложений
- ✅ **TypeScript везде** с полной типизацией
- ✅ **Автоматическая валидация** входных и выходных данных
- ✅ **React Query интеграция** для кеширования

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

### Преимущества контроллерного подхода

- **Читаемость**: Код выглядит как обычные NestJS контроллеры
- **Валидация**: Автоматическая валидация через Zod
- **Типизация**: Полная типизация без дополнительных настроек
- **NestJS стиль**: Привычный подход с контроллерами для NestJS разработчиков

## 🚀 Деплой

Для деплоя в продакшн:

1. Соберите приложения: `npm run build`
2. Настройте переменные окружения
3. Запустите: `npm run start`

## 📝 Лицензия

MIT

---

**Создано с ❤️ используя NestJS, NextJS, TRPC и собственные декораторы в стиле контроллеров** 
