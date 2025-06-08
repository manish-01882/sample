import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { SupabaseProvider } from '../contexts/SupabaseContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </SupabaseProvider>
  );
} 