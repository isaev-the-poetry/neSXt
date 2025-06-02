export enum AuthProviderType {
  GOOGLE = 'google',
  GITHUB = 'github',
  FACEBOOK = 'facebook',
  DISCORD = 'discord',
  TWITTER = 'twitter',
  APPLE = 'apple',
}

export const TokenType = {
  ACCESS: 'ACCESS',
  REFRESH: 'REFRESH',
  RESET: 'RESET',
  VERIFY: 'VERIFY',
} as const;

export type TokenType = typeof TokenType[keyof typeof TokenType];

export const AccountType = {
  OAUTH: 'oauth',
  EMAIL: 'email',
  CREDENTIALS: 'credentials',
} as const;

export type AccountType = typeof AccountType[keyof typeof AccountType];

export interface ProviderConfig {
  name: AuthProviderType;
  displayName: string;
  isActive: boolean;
  authUrl: string;
  callbackUrl: string;
  scope?: string[];
  additionalParams?: Record<string, any>;
}

export const PROVIDER_CONFIGS: Record<AuthProviderType, ProviderConfig> = {
  [AuthProviderType.GOOGLE]: {
    name: AuthProviderType.GOOGLE,
    displayName: 'Google',
    isActive: true,
    authUrl: '/auth/google',
    callbackUrl: '/auth/google/callback',
    scope: ['profile', 'email'],
  },
  [AuthProviderType.GITHUB]: {
    name: AuthProviderType.GITHUB,
    displayName: 'GitHub',
    isActive: false,
    authUrl: '/auth/github',
    callbackUrl: '/auth/github/callback',
    scope: ['user:email'],
  },
  [AuthProviderType.FACEBOOK]: {
    name: AuthProviderType.FACEBOOK,
    displayName: 'Facebook',
    isActive: false,
    authUrl: '/auth/facebook',
    callbackUrl: '/auth/facebook/callback',
    scope: ['email', 'public_profile'],
  },
  [AuthProviderType.DISCORD]: {
    name: AuthProviderType.DISCORD,
    displayName: 'Discord',
    isActive: false,
    authUrl: '/auth/discord',
    callbackUrl: '/auth/discord/callback',
    scope: ['identify', 'email'],
  },
  [AuthProviderType.TWITTER]: {
    name: AuthProviderType.TWITTER,
    displayName: 'Twitter',
    isActive: false,
    authUrl: '/auth/twitter',
    callbackUrl: '/auth/twitter/callback',
  },
  [AuthProviderType.APPLE]: {
    name: AuthProviderType.APPLE,
    displayName: 'Apple',
    isActive: false,
    authUrl: '/auth/apple',
    callbackUrl: '/auth/apple/callback',
    scope: ['name', 'email'],
  },
};

export interface BaseProviderProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: AuthProviderType;
  raw?: any;
}

export interface GoogleProfile extends BaseProviderProfile {
  provider: AuthProviderType.GOOGLE;
  googleId: string;
  familyName?: string;
  givenName?: string;
  locale?: string;
  verified?: boolean;
}

export interface GitHubProfile extends BaseProviderProfile {
  provider: AuthProviderType.GITHUB;
  githubId: string;
  username?: string;
  bio?: string;
  location?: string;
  company?: string;
  blog?: string;
  followers?: number;
  following?: number;
  publicRepos?: number;
}

export interface FacebookProfile extends BaseProviderProfile {
  provider: AuthProviderType.FACEBOOK;
  facebookId: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  locale?: string;
  timezone?: number;
  verified?: boolean;
}

export interface DiscordProfile extends BaseProviderProfile {
  provider: AuthProviderType.DISCORD;
  discordId: string;
  username?: string;
  discriminator?: string;
  avatar?: string;
  verified?: boolean;
  locale?: string;
}

export type ProviderProfile = GoogleProfile | GitHubProfile | FacebookProfile | DiscordProfile;

export interface User {
  id: string;
  name?: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
  providerData?: string;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithAccounts extends User {
  accounts: Account[];
  tokens?: UserToken[];
  sessions?: UserSession[];
}

export interface UserToken {
  id: string;
  userId: string;
  token: string;
  type: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface UserSession {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastAccessAt: Date;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface AuthResult {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  isNewUser: boolean;
  provider: AuthProviderType;
}

export interface AuthContext {
  user: User;
  token: UserToken;
  session?: UserSession;
  ipAddress?: string;
  userAgent?: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
  additionalParams?: Record<string, any>;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  avatar?: string;
  providerProfile: ProviderProfile;
}

export interface CreateTokenOptions {
  type?: TokenType;
  expiresIn?: string | number;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: any;
}

export interface ValidateTokenOptions {
  requireActive?: boolean;
  allowExpired?: boolean;
  updateLastUsed?: boolean;
}

export interface TokenValidationResult {
  isValid: boolean;
  user?: User;
  token?: UserToken;
  error?: string;
}

export enum AuthEvent {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  TOKEN_CREATED = 'token_created',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_REVOKED = 'token_revoked',
  ACCOUNT_LINKED = 'account_linked',
  ACCOUNT_UNLINKED = 'account_unlinked',
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',
}

export interface AuthEventLog {
  event: AuthEvent;
  userId?: string;
  provider?: AuthProviderType;
  accountId?: string;
  tokenId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  timestamp: Date;
}

// ========== РОЛИ ПОЛЬЗОВАТЕЛЕЙ ==========

export enum Role {
  USER = 'USER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN'
}

// Проверка ролей
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.USER]: 1,
  [Role.MANAGER]: 2,
  [Role.ADMIN]: 3,
};

// Проверка доступа по ролям
export function hasRole(userRoles: string[], requiredRoles: Role | Role[]): boolean {
  const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return required.some(role => userRoles.includes(role));
}

// Проверка иерархии ролей (например, ADMIN может делать все что MANAGER)
export function hasRoleOrHigher(userRoles: string[], minRole: Role): boolean {
  const userHighestRole = Math.max(...userRoles.map(role => ROLE_HIERARCHY[role as Role] || 0));
  const requiredLevel = ROLE_HIERARCHY[minRole];
  return userHighestRole >= requiredLevel;
} 