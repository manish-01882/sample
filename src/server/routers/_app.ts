import { t } from '../context';
import { chatRouter } from './chat';
import { imageRouter } from './image';

export const appRouter = t.router({
  chat: chatRouter,
  image: imageRouter,
});

export type AppRouter = typeof appRouter;
