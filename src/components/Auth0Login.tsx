import React from 'react';
import { useAuth0Supabase } from '../contexts/Auth0SupabaseContext';

export function Auth0Login() {
  const { user, loading, error, login, logout } = useAuth0Supabase();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="auth-container">
      {user ? (
        <div className="user-info">
          <div className="user-profile">
            {user.picture && (
              <img 
                src={user.picture} 
                alt={user.name || 'User'} 
                className="user-avatar"
              />
            )}
            <div className="user-details">
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => logout()} 
            className="btn btn-danger"
          >
            Log Out
          </button>
        </div>
      ) : (
        <div className="login-container">
          <h2>Welcome</h2>
          <p>Please log in to continue</p>
          <button 
            onClick={() => login()} 
            className="btn btn-primary"
          >
            Log In with Auth0
          </button>
        </div>
      )}
    </div>
  );
}