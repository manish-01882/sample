import type { AppProps } from 'next/app';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../src/styles/globals.css';
import { TRPCReactProvider } from '../src/utils/TRPCReactProvider';
import { UserProvider } from '@auth0/nextjs-auth0';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <TRPCReactProvider>
        <Component {...pageProps} />
      </TRPCReactProvider>
    </UserProvider>
  );
}
