import { SetMetadata } from '@nestjs/common';
import { ProcedureType, TRPC_PROCEDURE_METADATA, ProcedureMetadata } from './trpc-metadata';

export interface ProcedureOptions {
  path?: string;
}

/**
 * Декоратор для TRPC Query процедур
 * @param options Опции процедуры
 */
export function Query(options: ProcedureOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const metadata: ProcedureMetadata = {
      type: ProcedureType.QUERY,
      path: options.path || propertyKey,
    };
    
    SetMetadata(TRPC_PROCEDURE_METADATA, metadata)(target, propertyKey, descriptor);
  };
}

/**
 * Декоратор для TRPC Mutation процедур
 * @param options Опции процедуры
 */
export function Mutation(options: ProcedureOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const metadata: ProcedureMetadata = {
      type: ProcedureType.MUTATION,
      path: options.path || propertyKey,
    };
    
    SetMetadata(TRPC_PROCEDURE_METADATA, metadata)(target, propertyKey, descriptor);
  };
} 