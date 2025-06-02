import { z } from 'zod';

// Константы для ключей метаданных
export const TRPC_PROCEDURE_METADATA = 'trpc:procedure';
export const TRPC_INPUT_METADATA = 'trpc:input';
export const TRPC_OUTPUT_METADATA = 'trpc:output';

// Типы процедур
export enum ProcedureType {
  QUERY = 'query',
  MUTATION = 'mutation',
}

// Интерфейс для метаданных процедуры
export interface ProcedureMetadata {
  type: ProcedureType;
  path?: string;
}

// Интерфейс для метаданных ввода
export interface InputMetadata {
  schema: z.ZodType<any>;
}

// Интерфейс для метаданных вывода
export interface OutputMetadata {
  schema: z.ZodType<any>;
} 