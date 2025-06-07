import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { auth0 } from '../lib/auth0';

export const createContext = async ({ req }: any) => {
  // Use auth0.getSession(req) for API routes (Pages Router)
  const session = await auth0.getSession(req);
  return { session };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
});
