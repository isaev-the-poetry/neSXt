# Changelog

## [1.2.0] - 2025-06-02

### Added
- 🔐 **Модуль авторизации** с Google OAuth 2.0
- 🎯 **TRPC Auth контроллер** с декораторами (`auth.signIn`, `auth.signOut`, `auth.getAuthStatus`)
- 🔑 **JWT токены** для безопасной аутентификации
- 👤 **Google Strategy** через Passport.js
- 🍪 **Auth Context** для React с cookie управлением
- 📄 **OAuth страницы** (callback, error) для frontend
- 🛡 **REST контроллер** для OAuth flow
- 📋 **TypeScript типы** для авторизации
- 📖 **Документация** по настройке Google OAuth

### Technical Details
- Интеграция с `@nestjs/passport` и `passport-google-oauth20`
- JWT модуль с настраиваемым секретом
- React Context для управления состоянием авторизации
- Cookie-based сессии с `js-cookie`
- Автоматическое перенаправление после OAuth
- Валидация auth данных через Zod схемы

## [1.1.0] - 2025-06-02

### Added
- ✨ TRPC декораторы в стиле NestJS (`@Query`, `@Mutation`, `@Input`, `@Output`)
- 🏗 Базовый класс `BaseTrpcController` для автоматического создания роутеров
- 📝 Полная документация декораторов
- 🎯 Автоматическая валидация входных и выходных данных через Zod
  
## [1.0.0] - 2025-06-02

### Added
- 🚀 Базовая структура проекта с NestJS backend и NextJS frontend
- 🔗 TRPC интеграция для type-safe API
- 💾 Prisma ORM с SQLite базой данных
- 🌐 CORS настройка для связи frontend-backend
- 📦 Workspaces для управления монорепозиторием
- 📋 Скрипты для разработки и продакшн
- 📖 Документация проекта 