import { appRouter } from '../../../src/server/routers/_app';
import { createContext } from '../../../src/server/context';
import { createNextApiHandler } from '@trpc/server/adapters/next';

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error }) {
    console.error('TRPC Error:', error);
  },
});
