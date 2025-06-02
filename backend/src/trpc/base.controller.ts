import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TrpcService } from './trpc.service';
import {
  TRPC_PROCEDURE_METADATA,
  TRPC_INPUT_METADATA,
  TRPC_OUTPUT_METADATA,
  ProcedureMetadata,
  InputMetadata,
  OutputMetadata,
  ProcedureType,
} from './decorators';

@Injectable()
export abstract class BaseTrpcController {
  protected reflector = new Reflector();

  constructor(protected readonly trpc: TrpcService) {}

  /**
   * Автоматически создает TRPC роутер из методов контроллера с декораторами
   */
  protected createRouter() {
    const router: Record<string, any> = {};
    const prototype = Object.getPrototypeOf(this);
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) => name !== 'constructor' && typeof prototype[name] === 'function'
    );

    for (const methodName of methodNames) {
      const procedureMetadata = this.reflector.get<ProcedureMetadata>(
        TRPC_PROCEDURE_METADATA,
        prototype[methodName]
      );

      if (procedureMetadata) {
        const inputMetadata = this.reflector.get<InputMetadata>(
          TRPC_INPUT_METADATA,
          prototype[methodName]
        );
        const outputMetadata = this.reflector.get<OutputMetadata>(
          TRPC_OUTPUT_METADATA,
          prototype[methodName]
        );

        // Создаем процедуру
        let procedure = this.trpc.procedure;

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
        
        if (procedureMetadata.type === ProcedureType.QUERY) {
          router[procedureMetadata.path || methodName] = procedure.query(handler);
        } else if (procedureMetadata.type === ProcedureType.MUTATION) {
          router[procedureMetadata.path || methodName] = procedure.mutation(handler);
        }
      }
    }

    return this.trpc.router(router);
  }
} 