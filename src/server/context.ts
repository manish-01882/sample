import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { getSession } from '@auth0/nextjs-auth0';

export const createContext = async ({ req, res }: any) => {
  // Use getSession(req, res) for API routes (Pages Router)
  const session = await getSession(req, res);
  return { session };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
});
