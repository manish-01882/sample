import { useEffect, useRef, useState } from "react";
import { trpc } from "../../src/utils/trpc";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

// Message type definition
 type Message =
  | { type: "text"; content: string; from: "user" | "ai"; error?: boolean; timestamp: number }
  | { type: "image"; content: { url: string; text: string }; from: "ai"; timestamp: number };

const CHAT_STORAGE_KEY = "chat_history_v1";

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      // Add welcome message on first load
      setMessages([
        {
          type: "text",
          content: "👋 Hi! I'm your AI assistant. Ask me anything or try generating an image!",
          from: "ai",
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  // Persist chat history
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendText = trpc.chat.sendMessage.useMutation();
  const generateImage = trpc.image.generate.useMutation();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    const userMsg: Message = { type: "text", content: input, from: "user", timestamp: Date.now() };
    setMessages((msgs) => [...msgs, userMsg]);
    try {
      const res = await sendText.mutateAsync({ message: input });
      setMessages((msgs) => [
        ...msgs,
        { type: "text", content: res.reply, from: "ai", timestamp: Date.now() },
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { type: "text", content: "Error: Could not get reply.", from: "ai", error: true, timestamp: Date.now() },
      ]);
    }
    setInput("");
    setLoading(false);
  };

  const handleImage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const userMsg: Message = { type: "text", content: input, from: "user", timestamp: Date.now() };
    setMessages((msgs) => [...msgs, userMsg]);
    try {
      const res = await generateImage.mutateAsync({ prompt: input });
      setMessages((msgs) => [
        ...msgs,
        { type: "image", content: { url: res.url, text: res.text }, from: "ai", timestamp: Date.now() },
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { type: "text", content: "Error: Could not generate image.", from: "ai", error: true, timestamp: Date.now() },
      ]);
    }
    setInput("");
    setLoading(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      handleSend(e as any);
    }
  };

  // Format timestamp as HH:mm
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="container py-4 chat-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <h2 className="mb-0">ChatGPT Clone</h2>
        <Link href="/api/auth/logout" className="btn btn-outline-danger btn-sm">Logout</Link>
      </div>
      {/* Chat area */}
      <div className={`mb-3 chat-area${messages.length > 8 ? " expanded" : ""}`}>
        {messages.length === 0 && (
          <div className="text-muted text-center">Start the conversation!</div>
        )}
        {messages.map((msg, i) =>
          msg.type === "text" ? (
            <div key={i} className={`d-flex mb-2 ${msg.from === "user" ? "justify-content-end" : "justify-content-start"}`}>
              {msg.from === "ai" && (
                <span className="me-2">
                  <Image src="/vercel.svg" alt="AI" width={28} height={28} className="chat-avatar" />
                </span>
              )}
              <span
                className={`chat-bubble ${msg.from === "user" ? "chat-bubble-user" : msg.error ? "chat-bubble-error" : "chat-bubble-ai"}`}
              >
                {msg.from === "ai" && !msg.error ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
                <span className="d-block text-end small text-muted mt-1">{formatTime(msg.timestamp)}</span>
              </span>
              {msg.from === "user" && (
                <span className="ms-2">
                  <Image src="/window.svg" alt="You" width={28} height={28} className="chat-avatar" />
                </span>
              )}
            </div>
          ) : (
            <div key={i} className="d-flex mb-2 justify-content-start align-items-center">
              <span className="me-2">
                <Image src="/vercel.svg" alt="AI" width={28} height={28} className="chat-avatar" />
              </span>
              <span className="chat-bubble chat-bubble-ai">
                <Image src={msg.content.url} alt="Generated" width={128} height={128} className="mb-1" />
                <div className="small text-muted">{msg.content.text}</div>
                <span className="d-block text-end small text-muted mt-1">{formatTime(msg.timestamp)}</span>
              </span>
            </div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input area */}
      <form className="d-flex gap-2" onSubmit={handleSend}>
        <input
          className="form-control"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Type a message or image prompt..."
          disabled={loading}
        />
        <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>
          {loading ? <span className="spinner-border spinner-border-sm" /> : "Send"}
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={handleImage}
          disabled={loading || !input.trim()}
        >
          {loading ? <span className="spinner-border spinner-border-sm" /> : "Generate Image"}
        </button>
      </form>
    </div>
  );
}
