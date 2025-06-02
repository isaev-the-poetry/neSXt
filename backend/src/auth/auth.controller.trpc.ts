import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import { BaseTrpcController } from '../trpc/base.controller';
import { Query, Mutation, Input, Output, Auth, HasRole } from '../trpc/decorators';
import { AuthService } from './auth.service';
import { Role } from './auth.types';
import { z } from 'zod';

@Injectable()
export class AuthTRPCController extends BaseTrpcController {
  constructor(
    private authService: AuthService,
    trpcService: TrpcService
  ) {
    super(trpcService);
  }

  // ========== ПУБЛИЧНЫЕ МЕТОДЫ ==========

  @Query()
  async getGoogleAuthUrl() {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    return `${baseUrl}/auth/google`;
  }

  @Query()
  async getAvailableProviders() {
    return this.authService.getAvailableProviders();
  }

  @Query()
  @Output(z.object({
    isAuthenticated: z.boolean(),
    user: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string().nullable(),
      image: z.string().url().nullable().optional(),
      roles: z.array(z.string()),
    }).optional(),
    availableProviders: z.array(z.object({
      name: z.string(),
      displayName: z.string(),
      isActive: z.boolean(),
    })),
  }))
  async getAuthStatus({ ctx }: { ctx?: any }) {
    try {
      const availableProviders = [
        {
          name: 'google',
          displayName: 'Google',
          isActive: true,
        },
      ];

      // Проверяем, есть ли аутентифицированный пользователь
      if (ctx?.user) {
        // Получаем роли пользователя
        const userRoles = await this.authService.getUserRoles(ctx.user.id);

        return {
          isAuthenticated: true,
          user: {
            id: ctx.user.id,
            email: ctx.user.email,
            name: ctx.user.name,
            image: ctx.user.image,
            roles: userRoles,
          },
          availableProviders,
        };
      }

      return {
        isAuthenticated: false,
        availableProviders,
      };
    } catch (error) {
      console.error('Get auth status error:', error);
      return {
        isAuthenticated: false,
        availableProviders: [
          {
            name: 'google',
            displayName: 'Google',
            isActive: true,
          },
        ],
      };
    }
  }

  // ========== МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ (требуют аутентификации) ==========

  @Query()
  @Auth()
  @Output(z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    image: z.string().url().nullable().optional(),
    roles: z.array(z.string()),
  }))
  async getCurrentUser({ ctx }: { ctx: any }) {
    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    // Получаем роли пользователя
    const userRoles = await this.authService.getUserRoles(ctx.user.id);

    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      image: ctx.user.image,
      roles: userRoles,
    };
  }

  @Query()
  @Auth()
  @Output(z.object({
    user: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string().nullable(),
      image: z.string().url().nullable().optional(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
    providers: z.array(z.object({
      provider: z.enum(['GOOGLE', 'GITHUB', 'DISCORD', 'FACEBOOK', 'TWITTER', 'APPLE']),
      providerId: z.string(),
      createdAt: z.date(),
    })),
  }))
  async getUserProfile({ ctx }: { ctx: any }) {
    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    const userWithAccounts = await this.authService.getUserWithAccounts(ctx.user.id);
    
    if (!userWithAccounts) {
      throw new Error('User not found');
    }

    return {
      user: {
        id: userWithAccounts.id,
        email: userWithAccounts.email,
        name: userWithAccounts.name,
        image: userWithAccounts.image,
        createdAt: userWithAccounts.createdAt,
        updatedAt: userWithAccounts.updatedAt,
      },
      providers: userWithAccounts.accounts.map(account => ({
        provider: account.provider.toUpperCase() as any,
        providerId: account.providerAccountId,
        createdAt: account.createdAt,
      })),
    };
  }

  @Query()
  @Auth()
  @Input(z.object({
    activeOnly: z.boolean().optional(),
  }).optional())
  @Output(z.object({
    tokens: z.array(z.object({
      id: z.string(),
      createdAt: z.date(),
      expiresAt: z.date(),
      lastUsedAt: z.date().nullable(),
      isActive: z.boolean(),
      userAgent: z.string().nullable(),
      ipAddress: z.string().nullable(),
    })),
    totalCount: z.number(),
  }))
  async getUserTokens({ ctx, input }: { ctx: any; input?: { activeOnly?: boolean } }) {
    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    const tokens = await this.authService.getUserTokens(ctx.user.id, input?.activeOnly !== false);

    return {
      tokens: tokens.map(token => ({
        id: token.id,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        lastUsedAt: token.updatedAt,
        isActive: token.isActive,
        userAgent: token.userAgent,
        ipAddress: token.ipAddress,
      })),
      totalCount: tokens.length,
    };
  }

  @Mutation()
  @Auth()
  @Output(z.object({
    success: z.boolean(),
    message: z.string(),
  }))
  async signOut({ ctx }: { ctx: any }) {
    if (!ctx.user || !ctx.token) {
      throw new Error('User not authenticated');
    }

    try {
      await this.authService.logout(ctx.token.token);
      return {
        success: true,
        message: 'Successfully signed out',
      };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        message: 'Failed to sign out',
      };
    }
  }

  @Mutation()
  @Auth()
  @Input(z.object({
    tokenId: z.string(),
  }))
  @Output(z.object({
    success: z.boolean(),
    message: z.string(),
  }))
  async revokeToken({ ctx, input }: { ctx: any; input: { tokenId: string } }) {
    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    try {
      // Найти токен и убедиться что он принадлежит текущему пользователю
      const userTokens = await this.authService.getUserTokens(ctx.user.id, false);
      const targetToken = userTokens.find(token => token.id === input.tokenId);

      if (!targetToken) {
        throw new Error('Token not found');
      }

      await this.authService.revokeToken(targetToken.token);
      return {
        success: true,
        message: 'Token revoked successfully',
      };
    } catch (error) {
      console.error('Revoke token error:', error);
      return {
        success: false,
        message: 'Failed to revoke token',
      };
    }
  }

  @Mutation()
  @Auth()
  @Output(z.object({
    revokedCount: z.number(),
    success: z.boolean(),
    message: z.string(),
  }))
  async revokeAllTokens({ ctx }: { ctx: any }) {
    if (!ctx.user) {
      throw new Error('User not authenticated');
    }

    try {
      const tokensBefore = await this.authService.getUserTokens(ctx.user.id, true);
      await this.authService.revokeAllUserTokens(ctx.user.id);
      
      return {
        revokedCount: tokensBefore.length,
        success: true,
        message: `Successfully revoked ${tokensBefore.length} tokens`,
      };
    } catch (error) {
      console.error('Revoke all tokens error:', error);
      return {
        revokedCount: 0,
        success: false,
        message: 'Failed to revoke tokens',
      };
    }
  }

  @Mutation()
  @Auth()
  @Output(z.object({
    cleanedCount: z.number(),
    success: z.boolean(),
    message: z.string(),
  }))
  async cleanupExpiredTokens() {
    try {
      const deletedCount = await this.authService.cleanupExpiredTokens();
      return {
        cleanedCount: deletedCount,
        success: true,
        message: `Successfully cleaned up ${deletedCount} expired tokens`,
      };
    } catch (error) {
      console.error('Cleanup expired tokens error:', error);
      return {
        cleanedCount: 0,
        success: false,
        message: 'Failed to cleanup expired tokens',
      };
    }
  }

  // ========== УПРАВЛЕНИЕ АККАУНТАМИ ==========

  @Query()
  @Auth()
  async getUserAccounts({ ctx }: { ctx: any }) {
    const userWithAccounts = await this.authService.getUserWithAccounts(ctx.user.id);
    
    if (!userWithAccounts) {
      return [];
    }

    return userWithAccounts.accounts.map(account => ({
      id: account.id,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      lastUsed: account.lastUsed,
      createdAt: account.createdAt,
      // Метаданные без чувствительных токенов
      hasAccessToken: !!account.access_token,
      hasRefreshToken: !!account.refresh_token,
      tokenExpiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
    }));
  }

  @Mutation()
  @Auth()
  @Input(z.object({
    accountId: z.string(),
  }))
  async unlinkAccount({ ctx, input }: { ctx: any; input: { accountId: string } }) {
    const userWithAccounts = await this.authService.getUserWithAccounts(ctx.user.id);
    
    if (!userWithAccounts) {
      throw new Error('User not found');
    }

    // Проверить, что у пользователя остается хотя бы один способ входа
    if (userWithAccounts.accounts.length <= 1) {
      throw new Error('Cannot unlink the last authentication method');
    }

    const account = userWithAccounts.accounts.find(a => a.id === input.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Удалить аккаунт (это также удалит связанные токены благодаря каскадному удалению)
    await this.authService['prisma'].account.delete({
      where: { id: input.accountId },
    });

    return { success: true };
  }

  // ========== МЕТОДЫ ДЛЯ МЕНЕДЖЕРОВ ==========

  @Query()
  @Auth()
  @HasRole(Role.ADMIN)
  @Input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
  }))
  @Output(z.object({
    users: z.array(z.object({
      id: z.string(),
      email: z.string(),
      name: z.string().nullable(),
      image: z.string().url().nullable().optional(),
      createdAt: z.date(),
      updatedAt: z.date(),
      accountsCount: z.number(),
      tokensCount: z.number(),
      roles: z.array(z.string()),
    })),
    totalCount: z.number(),
    totalPages: z.number(),
    currentPage: z.number(),
  }))
  async getAllUsers(input: { page: number; limit: number }) {
    try {
      const result = await this.authService.getAllUsers(input.page, input.limit);
      
      const transformedUsers = await Promise.all(result.users.map(async user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        accountsCount: user._count.accounts,
        tokensCount: user._count.tokens,
        roles: await this.authService.getUserRoles(user.id),
      })));

      return {
        users: transformedUsers,
        totalCount: result.pagination.total,
        totalPages: result.pagination.pages,
        currentPage: result.pagination.page,
      };
    } catch (error) {
      console.error('Get all users error:', error);
      throw new Error('Failed to get users list');
    }
  }

  // ========== АДМИНИСТРАТИВНЫЕ МЕТОДЫ (только для админов) ==========

  @Mutation()
  @Auth()
  @HasRole(Role.ADMIN)
  @Input(z.object({
    userId: z.string(),
    role: z.enum(['USER', 'MANAGER', 'ADMIN']),
  }))
  @Output(z.object({
    success: z.boolean(),
    message: z.string(),
  }))
  async assignUserRole(input: { userId: string; role: string }) {
    try {
      await this.authService.assignRole(input.userId, input.role);
      return {
        success: true,
        message: `Role ${input.role} assigned to user ${input.userId}`,
      };
    } catch (error) {
      console.error('Assign role error:', error);
      return {
        success: false,
        message: 'Failed to assign role',
      };
    }
  }

  @Mutation()
  @Auth()
  @HasRole(Role.ADMIN)
  @Input(z.object({
    userId: z.string(),
    role: z.enum(['USER', 'MANAGER', 'ADMIN']),
  }))
  @Output(z.object({
    success: z.boolean(),
    message: z.string(),
  }))
  async removeUserRole(input: { userId: string; role: string }) {
    try {
      await this.authService.removeRole(input.userId, input.role);
      return {
        success: true,
        message: `Role ${input.role} removed from user ${input.userId}`,
      };
    } catch (error) {
      console.error('Remove role error:', error);
      return {
        success: false,
        message: 'Failed to remove role',
      };
    }
  }

  // ========== АДМИНИСТРАТИВНЫЕ МЕТОДЫ ==========

  @Mutation()
  @Auth()
  @HasRole(Role.ADMIN)
  @Input(z.object({
    provider: z.enum(['GOOGLE', 'GITHUB', 'DISCORD', 'FACEBOOK', 'TWITTER', 'APPLE']),
  }))
  @Output(z.object({
    success: z.boolean(),
    message: z.string(),
  }))
  async unlinkProvider(input: { provider: string }) {
    // Implementation will be handled by AuthUser decorator in middleware
    throw new Error('This should be overridden by auth middleware');
  }
} 