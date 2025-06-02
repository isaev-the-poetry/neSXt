import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GoogleProfile, User, AuthResult } from './auth.types';

@Injectable()
export class AuthService {
  // В реальном приложении здесь была бы база данных
  private users: Map<string, User> = new Map();

  constructor(private jwtService: JwtService) {}

  async validateGoogleUser(profile: GoogleProfile): Promise<User> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new Error('No email found in Google profile');
    }

    // Проверяем, существует ли пользователь
    let user = Array.from(this.users.values()).find(u => u.googleId === profile.id);
    
    if (!user) {
      // Создаем нового пользователя
      user = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`,
        avatar: profile.photos?.[0]?.value,
        googleId: profile.id,
      };
      
      this.users.set(user.id, user);
    }

    return user;
  }

  async generateToken(user: User): Promise<string> {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      name: user.name 
    };
    
    return this.jwtService.sign(payload);
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token);
      const user = this.users.get(payload.sub);
      return user || null;
    } catch {
      return null;
    }
  }

  async signIn(googleToken: string): Promise<AuthResult> {
    try {
      // В реальном приложении здесь была бы проверка Google токена
      // Для демо возвращаем успешный результат
      return {
        success: true,
        message: 'Please use Google OAuth flow for authentication'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Authentication failed'
      };
    }
  }

  async signOut(): Promise<AuthResult> {
    return {
      success: true,
      message: 'Successfully signed out'
    };
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
} 