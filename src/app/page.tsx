import { auth0 } from "../lib/auth0";
import ChatClient from "./ChatClient";
import Link from "next/link";

export default async function Home() {
  const session = await auth0.getSession();
  if (!session) {
    return (
      <div className="container d-flex flex-column justify-content-center align-items-center vh-100">
        <h1 className="mb-4">ChatGPT Clone</h1>
        <a
          href="/auth/login"
          className="btn btn-primary btn-lg"
        >
          Login with Auth0
        </a>
      </div>
    );
  }
  return <ChatClient user={session.user} />;
}
