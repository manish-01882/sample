import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../src/styles/globals.css';
import { UserProvider } from '@auth0/nextjs-auth0';
import { Auth0SupabaseProvider } from '../src/contexts/Auth0SupabaseContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>AI Chat Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <UserProvider>
        <Auth0SupabaseProvider>
          <Component {...pageProps} />
        </Auth0SupabaseProvider>
      </UserProvider>
    </>
  );
}
