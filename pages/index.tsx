import { useUser } from "@auth0/nextjs-auth0";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  
  // Automatically redirect to chat when logged in
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/chat');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container d-flex flex-column justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Initializing...</p>
      </div>
    );
  }

  return (
    <div className="container d-flex flex-column justify-content-center align-items-center vh-100">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold mb-3">AI Chat Assistant</h1>
        <p className="lead mb-4">Your intelligent conversation partner powered by AI</p>
      </div>
      
      <div className="card shadow-lg border-0 rounded-lg" style={{ maxWidth: "500px", width: "100%" }}>
        <div className="card-body p-5">
          <h2 className="text-center mb-4">Welcome</h2>
          
          <p className="text-center text-muted mb-4">
            Log in to start chatting with our AI assistant. Your conversations will be securely stored for future reference.
          </p>
          
          <div className="d-grid gap-2">
            <a href="/api/auth/login" className="btn btn-primary btn-lg">
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Login to Continue
            </a>
          </div>
          
          <div className="text-center mt-4">
            <small className="text-muted">
              Secured by Auth0 with data storage by Supabase
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
