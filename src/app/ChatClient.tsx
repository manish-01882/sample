"use client";
import { useState } from "react";
import { trpc } from "../utils/trpc";
import Image from "next/image";

type Message =
  | { type: "text"; content: string }
  | { type: "image"; content: { url: string; text: string } };

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendText = trpc.chat.sendMessage.useMutation();
  const generateImage = trpc.image.generate.useMutation();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setMessages((msgs) => [...msgs, { type: "text", content: input }]);
    try {
      const res = await sendText.mutateAsync({ message: input });
      setMessages((msgs) => [...msgs, { type: "text", content: res.reply }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { type: "text", content: "Error: Could not get reply." }]);
    }
    setInput("");
    setLoading(false);
  };

  const handleImage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setMessages((msgs) => [...msgs, { type: "text", content: input }]);
    try {
      const res = await generateImage.mutateAsync({ prompt: input });
      setMessages((msgs) => [
        ...msgs,
        { type: "image", content: { url: res.url, text: res.text } },
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { type: "text", content: "Error: Could not generate image." },
      ]);
    }
    setInput("");
    setLoading(false);
  };

  return (
    <div className="container py-3" style={{ maxWidth: 800 }}>
      <div
        className="mb-3"
        style={{
          height: "calc(100vh - 200px)",
          minHeight: 400,
          overflowY: "auto",
          background: "var(--background)",
          borderRadius: 12,
          padding: "1rem",
          boxShadow: "0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -2px rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {messages.map((msg, i) =>
          msg.type === "image" ? (
            <div 
              key={i} 
              className="mb-4"
              style={{
                display: "flex",
                justifyContent: "flex-start",
                flexDirection: "column",
                alignItems: "flex-start"
              }}
            >
              <Image
                src={msg.content.url}
                alt="Generated"
                width={256}
                height={256}
                style={{ 
                  borderRadius: 12,
                  boxShadow: "0 4px 6px -1px rgba(255, 255, 255, 0.1)",
                }}
              />
              {msg.content.text && (
                <div 
                  className="mt-2"
                  style={{
                    maxWidth: "80%",
                    padding: "0.75rem 1rem",
                    borderRadius: "1rem",
                    background: "#1f2937",
                    color: "#e5e7eb",
                    boxShadow: "0 1px 2px 0 rgba(255, 255, 255, 0.05)",
                  }}
                >
                  {msg.content.text}
                </div>
              )}
            </div>
          ) : (
            <div 
              key={i} 
              className="mb-3"
              style={{
                display: "flex",
                justifyContent: i % 2 === 0 ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "0.75rem 1rem",
                  borderRadius: "1rem",
                  background: i % 2 === 0 ? "#2563eb" : "#1f2937",
                  color: i % 2 === 0 ? "white" : "#e5e7eb",
                  boxShadow: "0 1px 2px 0 rgba(255, 255, 255, 0.05)",
                }}
              >
                {msg.content}
              </div>
            </div>
          )
        )}
        {loading && (
          <div className="mb-3" style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "1rem",
                background: "#1f2937",
                color: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>
      <form 
        className="d-flex gap-2" 
        onSubmit={handleSend}
        style={{
          position: "sticky",
          bottom: 0,
          background: "var(--background)",
          padding: "1rem 0",
        }}
      >
        <input
          className="form-control"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message or image prompt..."
          disabled={loading}
          style={{
            borderRadius: "1rem",
            padding: "0.75rem 1rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "#1f2937",
            color: "#e5e7eb",
          }}
        />
        <button 
          className="btn btn-primary" 
          type="submit" 
          disabled={loading}
          style={{
            borderRadius: "1rem",
            padding: "0.75rem 1.5rem",
            background: "#2563eb",
            border: "none",
            color: "white",
            fontWeight: 500,
            transition: "all 0.2s",
          }}
        >
          Send
        </button>
        <button
          className="btn btn-warning"
          type="button"
          onClick={handleImage}
          disabled={loading}
          style={{
            borderRadius: "1rem",
            padding: "0.75rem 1.5rem",
            background: "#d97706",
            border: "none",
            color: "white",
            fontWeight: 500,
            transition: "all 0.2s",
          }}
        >
          🎨
        </button>
      </form>
    </div>
  );
}
