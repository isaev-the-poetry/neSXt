import { createTRPCNext } from '@trpc/next';
import { httpBatchLink } from '@trpc/client';
import Cookies from 'js-cookie';
import type { AppRouter } from '../../../backend/src/trpc/main.controller';

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: 'http://localhost:4000/trpc',
          headers() {
            // Get token from cookies and add it to headers
            const token = Cookies.get('auth-token');
            console.log('[TRPC Client] Token from cookies:', token ? '***' + token.slice(-10) : 'none');
            
            const headers = {
              ...(token && { Authorization: `Bearer ${token}` }),
            };
            
            console.log('[TRPC Client] Headers:', Object.keys(headers));
            return headers;
          },
        }),
      ],
    };
  },
  ssr: false,
}); 