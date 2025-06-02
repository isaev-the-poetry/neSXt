import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TrpcService, protectedProcedure, publicProcedure } from './trpc.service';
import {
  TRPC_PROCEDURE_METADATA,
  TRPC_INPUT_METADATA,
  TRPC_OUTPUT_METADATA,
  ProcedureMetadata,
  InputMetadata,
  OutputMetadata,
  ProcedureType,
} from './decorators';
import { z } from 'zod';
import { Role, hasRole } from '../auth/auth.types';

@Injectable()
export abstract class BaseTrpcController {
  protected reflector = new Reflector();

  constructor(protected readonly trpc: TrpcService) {}

  /**
   * Автоматически создает TRPC роутер из методов контроллера с декораторами
   */
  public createRouter() {
    const router: Record<string, any> = {};
    const prototype = Object.getPrototypeOf(this);
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) => name !== 'constructor' && typeof prototype[name] === 'function'
    );

    for (const methodName of methodNames) {
      const metadata = this.reflector.get<ProcedureMetadata>(TRPC_PROCEDURE_METADATA, prototype[methodName]);
      const inputMetadata = this.reflector.get<InputMetadata>(TRPC_INPUT_METADATA, prototype[methodName]);
      const outputMetadata = this.reflector.get<OutputMetadata>(TRPC_OUTPUT_METADATA, prototype[methodName]);
      const isAuth = this.reflector.get<boolean>('TRPC_AUTH', prototype[methodName]);
      const requiredRoles = this.reflector.get<Role[]>('TRPC_ROLES', prototype[methodName]);

      if (metadata) {
        // Определяем тип процедуры
        let procedure = isAuth ? protectedProcedure : publicProcedure;

        // Добавляем проверку ролей если требуется
        if (requiredRoles && requiredRoles.length > 0) {
          procedure = procedure.use(({ ctx, next }) => {
            // Убеждаемся что пользователь аутентифицирован
            if (!ctx.user) {
              throw new Error('Authentication required');
            }

            // Получаем роли пользователя (предполагаем что они уже загружены в ctx.user)
            const userRoles = ctx.user.roles || [];
            
            // Проверяем роли
            if (!hasRole(userRoles, requiredRoles)) {
              throw new Error(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
            }

            return next({ ctx });
          });
        }

        // Добавляем валидацию входных данных
        if (inputMetadata) {
          procedure = procedure.input(inputMetadata.schema);
        }

        // Добавляем валидацию выходных данных
        if (outputMetadata) {
          procedure = procedure.output(outputMetadata.schema);
        }

        // Добавляем обработчик в зависимости от типа процедуры
        const handler = prototype[methodName].bind(this);
        
        if (metadata.type === ProcedureType.QUERY) {
          router[metadata.path || methodName] = procedure.query(handler);
        } else if (metadata.type === ProcedureType.MUTATION) {
          router[metadata.path || methodName] = procedure.mutation(handler);
        }
      }
    }

    return this.trpc.router(router);
  }
} 