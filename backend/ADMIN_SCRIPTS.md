# 🛡️ Скрипты управления администраторами

Набор утилит для управления ролями администраторов в системе NeSXt.

## 📋 Доступные скрипты

### 1. `make-admin.js` - Интерактивный скрипт назначения администратора

**Описание**: Интерактивный скрипт с пошаговым интерфейсом для назначения роли администратора.

**Особенности**:
- 👥 Показывает список всех пользователей
- 🔍 Поиск по email или ID
- ✅ Подтверждение перед назначением роли
- 📊 Отображение текущих ролей пользователя

**Запуск**:
```bash
# Через npm script
npm run admin:make

# Напрямую
node scripts/make-admin.js
# или
./scripts/make-admin.js
```

**Пример использования**:
```
🛡️  Скрипт назначения администратора NeSXt
══════════════════════════════════════════════════

👥 Последние 10 пользователей:
────────────────────────────────────────────────────────────────────────────────
1. user@example.com
   ID: cmbflbbz900008k5u7lmlbl1d
   Имя: John Doe
   Роли: USER
   Провайдеры: google
   Токенов: 5
   Создан: 6/3/2025, 12:16:49 AM

🔍 Введите email или ID пользователя для назначения админом: user@example.com

✅ Пользователь найден:
📧 Email: user@example.com
🆔 ID: cmbflbbz900008k5u7lmlbl1d
👤 Имя: John Doe
📅 Создан: 6/3/2025, 12:16:49 AM
🎭 Текущие роли: USER

❓ Назначить роль ADMIN этому пользователю? (y/N): y

⚡ Назначение роли ADMIN...
🎉 Роль ADMIN успешно назначена!
```

### 2. `quick-admin.js` - Быстрое назначение администратора

**Описание**: Простой неинтерактивный скрипт для быстрого назначения роли администратора по email.

**Особенности**:
- 🚀 Быстрое назначение одной командой
- 📋 Просмотр списка администраторов
- 🔄 Защита от дублирования ролей
- 📊 Автоматический отчет после назначения

**Синтаксис**:
```bash
# Назначить администратора
npm run admin:quick <email>
node scripts/quick-admin.js <email>

# Показать список администраторов  
npm run admin:list
node scripts/quick-admin.js --list

# Показать справку
node scripts/quick-admin.js
```

**Примеры**:
```bash
# Назначить роль ADMIN пользователю
npm run admin:quick user@example.com

# Показать всех администраторов
npm run admin:list

# Прямой вызов скрипта
node scripts/quick-admin.js user@example.com
./scripts/quick-admin.js --list
```

**Вывод при назначении**:
```
🛡️  Быстрое назначение администратора NeSXt
══════════════════════════════════════════════════

🔍 Назначение роли ADMIN для: user@example.com
🎉 Роль ADMIN успешно назначена пользователю user@example.com
📋 ID роли: cmbfndyob0001j31od27la4aq
⏰ Назначена: 6/3/2025, 1:14:51 AM

📊 Текущие администраторы:
👨‍💻 Администраторы в системе (1):
────────────────────────────────────────────────────────────
1. user@example.com
   Имя: John Doe
   Назначен админом: 6/3/2025, 1:14:51 AM
```

## 🚀 Быстрый старт

### Назначить первого администратора

1. **Убедитесь, что у вас есть пользователь в системе**:
   - Войдите в приложение через OAuth (Google)
   - Или проверьте список пользователей: `npm run admin:make`

2. **Назначьте роль администратора**:
   ```bash
   npm run admin:quick your-email@example.com
   ```

3. **Проверьте результат**:
   ```bash
   npm run admin:list
   ```

### Создание дополнительных администраторов

После того, как у вас есть первый администратор, вы можете:

1. **Использовать TRPC API** (через frontend или Postman):
   ```typescript
   // В приложении
   await trpc.auth.assignUserRole.mutate({
     userId: 'target-user-id',
     role: 'ADMIN'
   });
   ```

2. **Продолжать использовать скрипты** для быстрого управления:
   ```bash
   npm run admin:quick another-user@example.com
   ```

## 🛡️ Безопасность

### Важные моменты:

1. **Скрипты имеют прямой доступ к БД** - используйте только в development/staging
2. **В production** рекомендуется использовать TRPC API с проверкой прав доступа
3. **Первый администратор** должен назначаться через скрипты, т.к. некому еще давать права

### Рекомендуемый порядок действий:

1. **Development**: Используйте скрипты свободно
2. **Staging**: Используйте скрипты для начальной настройки
3. **Production**: 
   - Назначьте первого админа через скрипт
   - Далее используйте только TRPC API
   - Ограничьте доступ к скриптам

## 🔧 Возможные ошибки

### Пользователь не найден
```
❌ Пользователь с email "test@example.com" не найден
```
**Решение**: Убедитесь, что пользователь зарегистрирован в системе

### Ошибка доступа к БД
```
❌ Критическая ошибка: Can't reach database server
```
**Решение**: 
- Проверьте `.env` файл
- Убедитесь, что БД запущена
- Выполните `npx prisma generate`

### Пользователь уже администратор
```
ℹ️  Пользователь user@example.com уже имеет роль ADMIN
```
**Это нормально** - система предотвращает дублирование ролей

## 📝 Логирование

Все операции назначения ролей логируются в:
- **Консоль** - с цветной подсветкой
- **База данных** - в таблице `user_roles` с меткой времени
- **AuthService** - через встроенную систему логирования NestJS

## 🎯 Примеры использования

### Сценарий 1: Первая настройка проекта
```bash
# 1. Войдите в приложение через Google OAuth
# 2. Назначьте себя администратором
npm run admin:quick your-email@gmail.com

# 3. Проверьте результат
npm run admin:list
```

### Сценарий 2: Массовое назначение ролей
```bash
# Назначить нескольких администраторов
npm run admin:quick admin1@company.com
npm run admin:quick admin2@company.com
npm run admin:quick admin3@company.com

# Проверить результат
npm run admin:list
```

### Сценарий 3: Отладка системы ролей
```bash
# Интерактивное исследование пользователей
npm run admin:make
# Выберите пользователя и изучите его роли

# Быстрая проверка администраторов  
npm run admin:list
```

---

**💡 Совет**: Сохраните ссылку на этот файл - он поможет вам быстро управлять ролями в системе!

## 🔗 Связанные документы

- [ROLES_SYSTEM.md](../ROLES_SYSTEM.md) - Полная документация по системе ролей
- [README.md](../README.md) - Основная документация проекта
- [UNIVERSAL_AUTH_SYSTEM.md](../UNIVERSAL_AUTH_SYSTEM.md) - Система аутентификации 