import React from 'react';

export default function Login() {
  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Welcome to ChatGPT</h2>
        <p className="text-center mb-4">Please sign in to continue</p>
        <a href="/api/auth/login" className="login-button">
          Sign in with Auth0
        </a>
      </div>
    </div>
  );
} 