import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useUser } from '@auth0/nextjs-auth0';
import Login from '../components/Login';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Dynamically import ChatClient with no SSR
const ChatClient = dynamic(() => import('../components/ChatClient'), {
  ssr: false
});

const Home: NextPage = () => {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If user is not logged in and not loading, ensure we're on the login page
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // If no user, show login
  if (!user) {
    return <Login />;
  }

  // If user exists, show chat
  return <ChatClient />;
};

export default Home; 