import { useUser } from "@auth0/nextjs-auth0";
import ChatClient from "../src/components/ChatClient";
import "bootstrap/dist/css/bootstrap.min.css";

function HomeContent() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container d-flex flex-column justify-content-center align-items-center vh-100">
        <h1 className="mb-4">ChatGPT Clone</h1>
        <a href="/api/auth/login" className="btn btn-primary btn-lg">
          Login with Auth0
        </a>
      </div>
    );
  }
  return <ChatClient />;
}

export default function Home() {
  return <HomeContent />;
}
