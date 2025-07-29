import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { 
  User, 
  UserWithAccounts, 
  AuthResult, 
  ProviderProfile, 
  AuthProviderType,
  TokenType,
  AccountType,
  CreateTokenOptions,
  ValidateTokenOptions,
  TokenValidationResult,
  AuthContext,
  AuthEvent,
  PROVIDER_CONFIGS,
  Account,
} from './auth.types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ========== ОСНОВНЫЕ МЕТОДЫ АУТЕНТИФИКАЦИИ ==========

  async authenticateWithProvider(
    profile: ProviderProfile,
    options?: {
      userAgent?: string;
      ipAddress?: string;
      deviceInfo?: any;
      tokens?: {
        access_token?: string;
        refresh_token?: string;
        id_token?: string;
        expires_at?: number;
        token_type?: string;
        scope?: string;
        session_state?: string;
      };
    }
  ): Promise<AuthResult> {
    try {
      this.logger.log(`Authenticating user with ${profile.provider}: ${profile.email}`);

      // Найти или создать пользователя и аккаунт
      const { user, isNewUser } = await this.findOrCreateUser(profile, options?.tokens);

      // Создать JWT токен
      const token = await this.createToken(user.id, {
        type: TokenType.ACCESS,
        userAgent: options?.userAgent,
        ipAddress: options?.ipAddress,
        deviceInfo: options?.deviceInfo,
      });

      // Обновить последнее использование аккаунта
      await this.updateAccountLastUsed(user.id, profile.provider);

      // Логировать событие
      await this.logAuthEvent(AuthEvent.LOGIN_SUCCESS, {
        userId: user.id,
        provider: profile.provider,
        tokenId: token.id,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
      });

      return {
        user,
        token: token.token,
        expiresAt: token.expiresAt,
        isNewUser,
        provider: profile.provider,
      };
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`, error.stack);
      
      await this.logAuthEvent(AuthEvent.LOGIN_FAILED, {
        metadata: { error: error.message, email: profile.email },
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
      });

      throw new UnauthorizedException('Authentication failed');
    }
  }

  async validateToken(
    tokenString: string,
    options?: ValidateTokenOptions
  ): Promise<TokenValidationResult> {
    try {
      // Найти токен в базе данных
      const token = await this.prisma.userToken.findUnique({
        where: { token: tokenString },
        include: { 
          user: {
            include: {
              userRoles: true, // Загружаем роли пользователя
            }
          }
        },
      });

      if (!token) {
        return { isValid: false, error: 'Token not found' };
      }

      // Проверить активность токена
      if (options?.requireActive !== false && !token.isActive) {
        return { isValid: false, error: 'Token is inactive' };
      }

      // Проверить срок действия
      if (options?.allowExpired !== true && token.expiresAt < new Date()) {
        return { isValid: false, error: 'Token has expired' };
      }

      // Проверить активность пользователя
      if (!token.user.isActive) {
        return { isValid: false, error: 'User is inactive' };
      }

      // Обновить последнее использование если нужно
      if (options?.updateLastUsed) {
        await this.prisma.userToken.update({
          where: { id: token.id },
          data: { updatedAt: new Date() },
        });
      }

      // Добавляем роли к объекту пользователя
      const userWithRoles = {
        ...token.user,
        roles: token.user.userRoles.map(ur => ur.role),
      };

      return {
        isValid: true,
        user: userWithRoles as any,
        token: token as any, // Cast to avoid type issues
      };
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`, error.stack);
      return { isValid: false, error: 'Token validation failed' };
    }
  }

  async logout(tokenString: string): Promise<void> {
    try {
      const token = await this.prisma.userToken.findUnique({
        where: { token: tokenString },
        include: { user: true },
      });

      if (token) {
        // Деактивировать токен
        await this.prisma.userToken.update({
          where: { id: token.id },
          data: { isActive: false },
        });

        // Логировать событие
        await this.logAuthEvent(AuthEvent.LOGOUT, {
          userId: token.user.id,
          tokenId: token.id,
        });

        this.logger.log(`User ${token.user.email} logged out`);
      }
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ========== РАБОТА С ПОЛЬЗОВАТЕЛЯМИ И АККАУНТАМИ ==========

  private async findOrCreateUser(
    profile: ProviderProfile,
    tokens?: {
      access_token?: string;
      refresh_token?: string;
      id_token?: string;
      expires_at?: number;
      token_type?: string;
      scope?: string;
      session_state?: string;
    }
  ): Promise<{ user: User; isNewUser: boolean }> {
    // Validate required profile fields
    if (!profile.id) {
      throw new Error(`Provider account ID is missing for ${profile.provider} provider`);
    }

    if (!profile.email) {
      throw new Error(`Email is missing for ${profile.provider} provider`);
    }

    if (!profile.provider) {
      throw new Error('Provider type is missing');
    }

    // Попробовать найти существующий аккаунт провайдера
    const existingAccount = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.id,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      // Обновить токены аккаунта если они предоставлены
      if (tokens) {
        await this.prisma.account.update({
          where: { id: existingAccount.id },
          data: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            id_token: tokens.id_token,
            expires_at: tokens.expires_at,
            token_type: tokens.token_type,
            scope: tokens.scope,
            session_state: tokens.session_state,
            lastUsed: new Date(),
            providerData: JSON.stringify(profile.raw || {}),
          },
        });
      }

      return { user: existingAccount.user, isNewUser: false };
    }

    // Попробовать найти пользователя по email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingUser) {
      // Создать новый аккаунт для существующего пользователя
      await this.prisma.account.create({
        data: {
          userId: existingUser.id,
          type: AccountType.OAUTH,
          provider: profile.provider,
          providerAccountId: profile.id,
          access_token: tokens?.access_token,
          refresh_token: tokens?.refresh_token,
          id_token: tokens?.id_token,
          expires_at: tokens?.expires_at,
          token_type: tokens?.token_type,
          scope: tokens?.scope,
          session_state: tokens?.session_state,
          providerData: JSON.stringify(profile.raw || {}),
        },
      });

      await this.logAuthEvent(AuthEvent.ACCOUNT_LINKED, {
        userId: existingUser.id,
        provider: profile.provider,
        metadata: { provider: profile.provider },
      });

      return { user: existingUser, isNewUser: false };
    }

    // Создать нового пользователя с аккаунтом
    const user = await this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        image: profile.avatar,
        accounts: {
          create: {
            type: AccountType.OAUTH,
            provider: profile.provider,
            providerAccountId: profile.id,
            access_token: tokens?.access_token,
            refresh_token: tokens?.refresh_token,
            id_token: tokens?.id_token,
            expires_at: tokens?.expires_at,
            token_type: tokens?.token_type,
            scope: tokens?.scope,
            session_state: tokens?.session_state,
            providerData: JSON.stringify(profile.raw || {}),
          },
        },
      },
    });

    // Назначить роль USER по умолчанию для нового пользователя
    await this.ensureDefaultUserRole(user.id);

    this.logger.log(`Created new user: ${user.email}`);
    return { user, isNewUser: true };
  }

  private async updateAccountLastUsed(userId: string, provider: AuthProviderType): Promise<void> {
    await this.prisma.account.updateMany({
      where: { userId, provider },
      data: { lastUsed: new Date() },
    });
  }

  // ========== РАБОТА С ТОКЕНАМИ ==========

  async createToken(userId: string, options?: CreateTokenOptions): Promise<{
    id: string;
    token: string;
    expiresAt: Date;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create a unique identifier for this token
    const tokenId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Создать JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      jti: tokenId, // Add unique token identifier
      iat: Math.floor(Date.now() / 1000),
    };

    // Определить время жизни токена
    const expiresIn = options?.expiresIn || '7d';
    const expiresAt = new Date();
    
    if (typeof expiresIn === 'string') {
      // Парсим строку типа '7d', '1h', '30m'
      const match = expiresIn.match(/^(\d+)([dhm])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        
        switch (unit) {
          case 'd':
            expiresAt.setDate(expiresAt.getDate() + value);
            break;
          case 'h':
            expiresAt.setHours(expiresAt.getHours() + value);
            break;
          case 'm':
            expiresAt.setMinutes(expiresAt.getMinutes() + value);
            break;
        }
      } else {
        expiresAt.setDate(expiresAt.getDate() + 7); // По умолчанию 7 дней
      }
    } else {
      expiresAt.setTime(expiresAt.getTime() + expiresIn);
    }

    // Создать JWT токен
    const jwtToken = this.jwtService.sign(payload, {
      expiresIn: expiresIn,
    });

    // Сохранить токен в базе данных
    const token = await this.prisma.userToken.create({
      data: {
        userId: user.id,
        token: jwtToken,
        type: options?.type || TokenType.ACCESS,
        expiresAt,
        userAgent: options?.userAgent,
        ipAddress: options?.ipAddress,
        deviceInfo: options?.deviceInfo ? JSON.stringify(options.deviceInfo) : null,
      },
    });

    await this.logAuthEvent(AuthEvent.TOKEN_CREATED, {
      userId: user.id,
      tokenId: token.id,
      metadata: { type: token.type },
    });

    return {
      id: token.id,
      token: jwtToken,
      expiresAt,
    };
  }

  async revokeToken(tokenString: string): Promise<void> {
    const token = await this.prisma.userToken.findUnique({
      where: { token: tokenString },
    });

    if (token) {
      await this.prisma.userToken.update({
        where: { id: token.id },
        data: { isActive: false },
      });

      await this.logAuthEvent(AuthEvent.TOKEN_REVOKED, {
        userId: token.userId,
        tokenId: token.id,
      });
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.userToken.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    this.logger.log(`Revoked all tokens for user: ${userId}`);
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.userToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: false,
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired tokens`);
    return result.count;
  }

  // ========== ПОЛУЧЕНИЕ ДАННЫХ ==========

  async getUserById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async getUserWithAccounts(userId: string): Promise<UserWithAccounts | null> {
    const result = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          orderBy: { lastUsed: 'desc' },
        },
        tokens: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!result) return null;

    // Transform to match our interface
    return {
      ...result,
      accounts: result.accounts.map(account => ({
        ...account,
        type: account.type,
        provider: account.provider,
        providerData: account.providerData || undefined,
      })),
      tokens: result.tokens.map(token => ({
        ...token,
        type: token.type,
        deviceInfo: token.deviceInfo || undefined,
      })),
    } as UserWithAccounts;
  }

  async getUserTokens(userId: string, activeOnly: boolean = true): Promise<any[]> {
    return this.prisma.userToken.findMany({
      where: { 
        userId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ========== УПРАВЛЕНИЕ ПРОВАЙДЕРАМИ ==========

  getAvailableProviders() {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    
    return Object.values(PROVIDER_CONFIGS).map(config => ({
      name: config.name,
      displayName: config.displayName,
      authUrl: `${baseUrl}${config.authUrl}`,
      isActive: config.isActive,
    }));
  }

  getProviderConfig(provider: AuthProviderType) {
    return PROVIDER_CONFIGS[provider];
  }

  // ========== ЛОГИРОВАНИЕ СОБЫТИЙ ==========

  private async logAuthEvent(
    event: AuthEvent,
    data: {
      userId?: string;
      provider?: AuthProviderType;
      accountId?: string;
      tokenId?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: any;
    }
  ): Promise<void> {
    try {
      // В данном примере просто логируем в консоль
      // В реальном приложении можно создать отдельную таблицу для логов
      this.logger.log(`Auth Event: ${event}`, {
        event,
        ...data,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to log auth event: ${error.message}`);
    }
  }

  // ========== GOOGLE OAUTH СОВМЕСТИМОСТЬ ==========

  // Адаптер для совместимости с существующим Google OAuth кодом
  async validateGoogleUser(profile: any): Promise<User> {
    // Validate required profile data
    if (!profile) {
      throw new Error('Google profile is missing');
    }

    if (!profile.id) {
      throw new Error('Google profile ID is missing');
    }

    if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
      throw new Error('Google profile email is missing');
    }

    const googleProfile: ProviderProfile = {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName || profile.name?.givenName + ' ' + profile.name?.familyName || 'Unknown User',
      avatar: profile.photos?.[0]?.value,
      provider: AuthProviderType.GOOGLE,
      googleId: profile.id,
      familyName: profile.name?.familyName,
      givenName: profile.name?.givenName,
      raw: profile,
    } as any;

    const result = await this.authenticateWithProvider(googleProfile);
    return result.user;
  }

  /**
   * Получить всех пользователей (для административных целей)
   */
  async getAllUsers(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          accounts: {
            select: {
              id: true,
              provider: true,
              providerAccountId: true,
              lastUsed: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              tokens: true,
              accounts: true,
            },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // ========== УПРАВЛЕНИЕ РОЛЯМИ ==========

  /**
   * Назначить роль пользователю
   */
  async assignRole(userId: string, role: string, assignedBy?: string): Promise<void> {
    try {
      await this.prisma.userRole.create({
        data: {
          userId,
          role,
          assignedBy,
        },
      });

      this.logger.log(`Assigned role ${role} to user ${userId}`);
    } catch (error) {
      // Игнорируем ошибку если роль уже назначена (unique constraint)
      if (error.code === 'P2002') {
        this.logger.warn(`Role ${role} already assigned to user ${userId}`);
        return;
      }
      throw error;
    }
  }

  /**
   * Удалить роль у пользователя
   */
  async removeRole(userId: string, role: string): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: { userId, role },
    });

    this.logger.log(`Removed role ${role} from user ${userId}`);
  }

  /**
   * Получить роли пользователя
   */
  async getUserRoles(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: true },
    });

    return userRoles.map(ur => ur.role);
  }

  /**
   * Проверить наличие роли у пользователя
   */
  async userHasRole(userId: string, role: string): Promise<boolean> {
    const userRole = await this.prisma.userRole.findFirst({
      where: { userId, role },
    });

    return !!userRole;
  }

  /**
   * Назначить роль USER по умолчанию для нового пользователя
   */
  private async ensureDefaultUserRole(userId: string): Promise<void> {
    const hasAnyRole = await this.prisma.userRole.findFirst({
      where: { userId },
    });

    if (!hasAnyRole) {
      await this.assignRole(userId, 'USER');
    }
  }
} 