# 🛡️ Система ролей NeSXt

Гибкая система ролей с иерархическим контролем доступа для TRPC endpoints.

## 📋 Обзор системы

### Доступные роли

| Роль | Значение | Описание | Уровень доступа |
|------|----------|----------|-----------------|
| `USER` | По умолчанию | Обычный пользователь | 1 |
| `MANAGER` | Менеджер | Управление пользователями | 2 |
| `ADMIN` | Администратор | Полный доступ | 3 |

### Иерархия ролей

- **ADMIN** может делать все что **MANAGER** + административные функции
- **MANAGER** может делать все что **USER** + управленческие функции  
- **USER** имеет базовый доступ к своим данным

## 🎨 Использование декораторов

### `@HasRole(role | role[])`

Проверяет наличие указанной роли у пользователя:

```typescript
// Только для админов
@Mutation()
@Auth()
@HasRole(Role.ADMIN)
async assignUserRole(input: { userId: string; role: string }) {
  // Только администраторы могут назначать роли
}

// Для менеджеров и выше
@Query()
@Auth()
@HasRole(Role.MANAGER)
async getAllUsers() {
  // Менеджеры и администраторы могут видеть всех пользователей
}

// Для нескольких ролей
@Query()
@Auth()
@HasRole([Role.MANAGER, Role.ADMIN])
async getReports() {
  // Доступно для менеджеров И администраторов
}
```

### `@Auth()` - базовая аутентификация

```typescript
@Query()
@Auth()
async getCurrentUser() {
  // Требует только аутентификации (любая роль)
}
```

## 🗄️ Структура базы данных

### Модель User
```prisma
model User {
  id        String     @id @default(cuid())
  email     String     @unique
  name      String?
  image     String?
  userRoles UserRole[] // Связь с ролями
  // ... другие поля
}
```

### Модель UserRole
```prisma
model UserRole {
  id         String   @id @default(cuid())
  userId     String
  role       String   // USER | MANAGER | ADMIN
  assignedAt DateTime @default(now())
  assignedBy String?  // ID администратора, назначившего роль
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, role]) // Предотвращает дублирование ролей
}
```

## 🔧 API методы для управления ролями

### AuthService методы

```typescript
// Назначить роль пользователю
await authService.assignRole('user-id', 'MANAGER', 'admin-id');

// Удалить роль у пользователя
await authService.removeRole('user-id', 'MANAGER');

// Получить роли пользователя
const roles = await authService.getUserRoles('user-id');
// ['USER', 'MANAGER']

// Проверить роль
const hasManager = await authService.userHasRole('user-id', 'MANAGER');
// true
```

### TRPC endpoints

```typescript
// 🔓 Публичные методы
trpc.auth.getAuthStatus()            // Статус аутентификации
trpc.auth.getGoogleAuthUrl()         // URL для OAuth

// 👤 Методы для пользователей (@Auth)
trpc.auth.getCurrentUser()           // Текущий пользователь с ролями
trpc.auth.signOut()                  // Выход из системы

// 👨‍💼 Методы для менеджеров (@Auth + @HasRole(MANAGER))
trpc.auth.getAllUsers()              // Список всех пользователей

// 👨‍💻 Методы для админов (@Auth + @HasRole(ADMIN))
trpc.auth.assignUserRole()           // Назначить роль
trpc.auth.removeUserRole()           // Удалить роль
```

## 📝 Примеры использования

### Frontend (React/Next.js)

```tsx
import { trpc } from '../utils/trpc';
import { useAuth } from '../contexts/AuthContext';

function AdminPanel() {
  const { user, hasRole } = useAuth();
  const assignRoleMutation = trpc.auth.assignUserRole.useMutation();
  
  // Проверка роли на фронтенде
  if (!hasRole('ADMIN')) {
    return <div>Access denied</div>;
  }

  const handleAssignRole = async (userId: string, role: string) => {
    try {
      await assignRoleMutation.mutateAsync({ userId, role });
      alert('Role assigned successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div>
      <h1>Admin Panel</h1>
      {/* UI для назначения ролей */}
    </div>
  );
}
```

### Backend (контроллер)

```typescript
@Injectable()
export class AdminController extends BaseTrpcController {
  
  @Query()
  @Auth()
  @HasRole(Role.ADMIN)
  @Output(SystemStatsSchema)
  async getSystemStats() {
    // Только администраторы могут видеть статистику системы
    return {
      totalUsers: await this.userService.count(),
      activeTokens: await this.tokenService.countActive(),
      // ... другая статистика
    };
  }

  @Mutation()
  @Auth()
  @HasRole([Role.MANAGER, Role.ADMIN])
  @Input(UserActionSchema)
  async moderateUser(input: { userId: string; action: string }) {
    // Менеджеры и администраторы могут модерировать пользователей
    return this.userService.moderate(input.userId, input.action);
  }
}
```

## 🔄 Автоматические процессы

### Назначение роли по умолчанию

Новые пользователи автоматически получают роль `USER`:

```typescript
// В AuthService.findOrCreateUser()
const user = await this.prisma.user.create({ /* ... */ });
await this.ensureDefaultUserRole(user.id); // Назначает роль USER
```

### Загрузка ролей при аутентификации

Роли загружаются автоматически при валидации токена:

```typescript
// В AuthService.validateToken()
const token = await this.prisma.userToken.findUnique({
  include: { 
    user: {
      include: { userRoles: true } // ← Загружаем роли
    }
  }
});

const userWithRoles = {
  ...token.user,
  roles: token.user.userRoles.map(ur => ur.role) // ['USER', 'MANAGER']
};
```

## 🛡️ Безопасность

### Проверка ролей в middleware

```typescript
// В base.controller.ts
if (requiredRoles && requiredRoles.length > 0) {
  procedure = procedure.use(({ ctx, next }) => {
    if (!ctx.user) {
      throw new Error('Authentication required');
    }

    const userRoles = ctx.user.roles || [];
    
    if (!hasRole(userRoles, requiredRoles)) {
      throw new Error(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return next({ ctx });
  });
}
```

### Функции проверки ролей

```typescript
// Точная проверка ролей
export function hasRole(userRoles: string[], requiredRoles: Role | Role[]): boolean {
  const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return required.some(role => userRoles.includes(role));
}

// Иерархическая проверка (ADMIN может делать все что MANAGER)
export function hasRoleOrHigher(userRoles: string[], minRole: Role): boolean {
  const userHighestRole = Math.max(...userRoles.map(role => ROLE_HIERARCHY[role] || 0));
  return userHighestRole >= ROLE_HIERARCHY[minRole];
}
```

## 📊 Мониторинг и логирование

Все изменения ролей логируются:

```typescript
// В AuthService.assignRole()
this.logger.log(`Assigned role ${role} to user ${userId}`);

// В AuthService.removeRole()  
this.logger.log(`Removed role ${role} from user ${userId}`);
```

## 🚀 Миграция существующих пользователей

Для добавления ролей существующим пользователям:

```sql
-- Назначить роль USER всем пользователям без ролей
INSERT INTO user_roles (id, userId, role, assignedAt)
SELECT 
  'role_' || substr(u.id, 1, 8) || '_' || substr(hex(randomblob(4)), 1, 8),
  u.id,
  'USER',
  datetime('now')
FROM users u
WHERE u.id NOT IN (SELECT DISTINCT userId FROM user_roles);
```

## 🎯 Практические сценарии

### Сценарий 1: Назначение администратора

```typescript
// 1. Создать первого администратора через код
await authService.assignRole('first-user-id', 'ADMIN');

// 2. Теперь этот пользователь может назначать роли другим
const result = await trpc.auth.assignUserRole.mutate({
  userId: 'another-user-id',
  role: 'MANAGER'
});
```

### Сценарий 2: Временное повышение прав

```typescript
// Назначить временную роль MANAGER
await authService.assignRole(userId, 'MANAGER', adminId);

// Через время удалить роль
setTimeout(async () => {
  await authService.removeRole(userId, 'MANAGER');
}, 24 * 60 * 60 * 1000); // 24 часа
```

### Сценарий 3: Мультиролевый пользователь

```typescript
// Пользователь может иметь несколько ролей
await authService.assignRole(userId, 'USER');     // Базовая роль
await authService.assignRole(userId, 'MANAGER');  // Управленческая роль

// Проверка любой из ролей
@HasRole([Role.USER, Role.MANAGER]) // OR логика
@HasRole(Role.MANAGER) // Конкретная роль
```

## 🔧 Настройка и конфигурация

### Добавление новых ролей

1. Обновить enum в `auth.types.ts`:
```typescript
export enum Role {
  USER = 'USER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR', // ← Новая роль
}
```

2. Обновить иерархию:
```typescript
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.USER]: 1,
  [Role.MODERATOR]: 2,
  [Role.MANAGER]: 3,
  [Role.ADMIN]: 4,
};
```

3. Использовать в контроллерах:
```typescript
@HasRole(Role.MODERATOR)
async moderateContent() {
  // Модерация контента
}
```

---

**Система ролей NeSXt** предоставляет мощный и гибкий контроль доступа для ваших TRPC endpoints! 🚀 