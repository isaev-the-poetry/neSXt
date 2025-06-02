import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';

export interface TRPCContext {
  user?: any;
  token?: any;
  ipAddress?: string;
  userAgent?: string;
}

const t = initTRPC.context<TRPCContext>().create();

@Injectable()
export class TrpcService {
  trpc = t;
  procedure = t.procedure;
  router = t.router;
  mergeRouters = t.mergeRouters;
}

// Export procedures для использования в контроллерах
export const TRPCRouter = (routes: any) => {
  return t.router(routes);
};

export const publicProcedure = t.procedure;

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      token: ctx.token,
    },
  });
}); 