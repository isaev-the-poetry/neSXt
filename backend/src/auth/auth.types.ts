export interface GoogleProfile {
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };
  emails: Array<{
    value: string;
    verified: boolean;
  }>;
  photos: Array<{
    value: string;
  }>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  googleId: string;
}

export interface AuthSession {
  user?: User;
  accessToken?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  message?: string;
} 