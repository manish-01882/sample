import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers/_app';
import superjson from 'superjson';

export const trpc = createTRPCReact<AppRouter>();

export function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export const trpcClientOptions = {
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, {
          ...(options as RequestInit),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      },
    }),
  ],
};
