import { SetMetadata } from '@nestjs/common';
import { ProcedureType, TRPC_PROCEDURE_METADATA, ProcedureMetadata } from './trpc-metadata';
import { Role } from '../../auth/auth.types';

export interface ProcedureOptions {
  path?: string;
}

/**
 * Декоратор для TRPC Query процедур
 * @param options Опции процедуры
 */
export const Query = (options?: ProcedureOptions) => {
  const metadata: ProcedureMetadata = {
    type: ProcedureType.QUERY,
    path: options?.path,
  };
  return SetMetadata(TRPC_PROCEDURE_METADATA, metadata);
};

/**
 * Декоратор для TRPC Mutation процедур
 * @param options Опции процедуры
 */
export const Mutation = (options?: ProcedureOptions) => {
  const metadata: ProcedureMetadata = {
    type: ProcedureType.MUTATION,
    path: options?.path,
  };
  return SetMetadata(TRPC_PROCEDURE_METADATA, metadata);
};

// Декоратор для методов, требующих аутентификации
export const Auth = () => {
  return SetMetadata('TRPC_AUTH', true);
};

// Декоратор для проверки ролей пользователя
export const HasRole = (roles: Role | Role[]) => {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  return SetMetadata('TRPC_ROLES', requiredRoles);
}; 