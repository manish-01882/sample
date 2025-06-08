import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClientOptions } from './trpc';
import { ReactNode, useState } from 'react';

export function TRPCReactProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  }));
  const [trpcClient] = useState(() => trpc.createClient(trpcClientOptions));
  
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
