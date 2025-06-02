import { SetMetadata } from '@nestjs/common';
import { z } from 'zod';
import { TRPC_INPUT_METADATA, TRPC_OUTPUT_METADATA, InputMetadata, OutputMetadata } from './trpc-metadata';

/**
 * Декоратор для валидации входных данных TRPC процедуры
 * @param schema Zod схема для валидации
 */
export function Input<T extends z.ZodType<any>>(schema: T) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const metadata: InputMetadata = {
      schema,
    };
    
    SetMetadata(TRPC_INPUT_METADATA, metadata)(target, propertyKey, descriptor);
  };
}

/**
 * Декоратор для валидации выходных данных TRPC процедуры
 * @param schema Zod схема для валидации
 */
export function Output<T extends z.ZodType<any>>(schema: T) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const metadata: OutputMetadata = {
      schema,
    };
    
    SetMetadata(TRPC_OUTPUT_METADATA, metadata)(target, propertyKey, descriptor);
  };
} 