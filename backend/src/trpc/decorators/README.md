# TRPC Декораторы для NestJS

Эта библиотека предоставляет декораторы в стиле NestJS для создания TRPC контроллеров.

## Доступные декораторы

### @Query(options?)
Создает TRPC query процедуру (для получения данных).

```typescript
@Query()
getHello() {
  return 'Hello World!';
}

@Query({ path: 'customPath' })
getCustom() {
  return 'Custom response';
}
```

### @Mutation(options?)
Создает TRPC mutation процедуру (для изменения данных).

```typescript
@Mutation()
createUser({ input }) {
  // логика создания пользователя
  return { id: '1', name: input.name };
}
```

### @Input(schema)
Добавляет валидацию входных данных с помощью Zod.

```typescript
@Query()
@Input(z.string().min(1))
getUserById({ input }: { input: string }) {
  return { id: input, name: 'John' };
}

@Mutation()
@Input(z.object({
  name: z.string().min(2),
  email: z.string().email()
}))
createUser({ input }) {
  return { id: '1', ...input };
}
```

### @Output(schema)
Добавляет валидацию выходных данных с помощью Zod.

```typescript
@Query()
@Output(z.object({
  id: z.string(),
  name: z.string()
}))
getUser() {
  return { id: '1', name: 'John' };
}
```

## Полный пример

```typescript
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BaseTrpcController } from './base.controller';
import { Query, Mutation, Input, Output } from './decorators';

@Injectable()
export class UserController extends BaseTrpcController {
  appRouter = this.createRouter();

  @Query()
  getAllUsers() {
    return [
      { id: '1', name: 'John', email: 'john@example.com' },
      { id: '2', name: 'Jane', email: 'jane@example.com' },
    ];
  }

  @Query()
  @Input(z.string())
  @Output(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }))
  getUserById({ input }: { input: string }) {
    // Поиск пользователя по ID
    return { id: input, name: 'John', email: 'john@example.com' };
  }

  @Mutation()
  @Input(z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }))
  @Output(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    createdAt: z.date(),
  }))
  createUser({ input }) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: input.name,
      email: input.email,
      createdAt: new Date(),
    };
  }
}
```

## Как это работает

1. **Метаданные**: Декораторы сохраняют информацию о типе процедуры, валидации и пути в метаданных класса.

2. **BaseTrpcController**: Базовый класс автоматически сканирует все методы контроллера и создает TRPC роутер на основе метаданных.

3. **Автоматическая регистрация**: Вам нужно только наследоваться от `BaseTrpcController` и вызвать `this.createRouter()`.

## Преимущества

- ✅ **Чистый код**: Методы выглядят как обычные функции контроллера
- ✅ **Type Safety**: Полная типизация с TypeScript
- ✅ **Валидация**: Автоматическая валидация входных и выходных данных
- ✅ **NestJS стиль**: Привычные декораторы и именование для NestJS разработчиков
- ✅ **Меньше boilerplate**: Не нужно вручную создавать TRPC роутер 