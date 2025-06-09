'use client';

import { useEffect, useRef, useState } from "react";
import { trpc } from "../../src/utils/trpc";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import EmojiPicker from "./EmojiPicker";
import ConversationSidebar from "./ConversationSidebar";

// Message type definition
type Message =
  | { type: "text"; content: string; from: "user" | "ai"; error?: boolean; timestamp: number }
  | { type: "image"; content: { url: string; text: string }; from: "ai"; timestamp: number };

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messages: Message[];
}

const CHAT_STORAGE_KEY = "chat_history_v1";

export default function ChatClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed);
      // Always set activeConversationId to the first conversation if not present or invalid
      if (parsed.length > 0) {
        setActiveConversationId((prev) => {
          if (!prev || !parsed.some((c: Conversation) => c.id === prev)) {
            return parsed[0].id;
          }
          return prev;
        });
      } else {
        setActiveConversationId(null);
      }
    } else {
      // Create first conversation
      const newConversation: Conversation = {
        id: crypto.randomUUID(),
        title: "New Conversation",
        lastMessage: "👋 Hi! I'm your AI assistant. Ask me anything or try generating an image!",
        timestamp: Date.now(),
        messages: [
          {
            type: "text",
            content: "👋 Hi! I'm your AI assistant. Ask me anything or try generating an image!",
            from: "ai",
            timestamp: Date.now(),
          },
        ],
      };
      setConversations([newConversation]);
      setActiveConversationId(newConversation.id);
    }
  }, []);

  // Persist chat history
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversations));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setShowSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sendText = trpc.chat.sendMessage.useMutation();
  const generateImage = trpc.image.generate.useMutation();

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // If no active conversation, create one automatically
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      const newConversation: Conversation = {
        id: crypto.randomUUID(),
        title: "New Conversation",
        lastMessage: "",
        timestamp: Date.now(),
        messages: [],
      };
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
      currentConversationId = newConversation.id;
    }
    setLoading(true);
    setIsTyping(true);
    const userMsg: Message = { type: "text", content: input, from: "user", timestamp: Date.now() };
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, userMsg],
          lastMessage: input,
          timestamp: Date.now(),
        };
      }
      return conv;
    }));
    try {
      const res = await sendText.mutateAsync({ message: input });
      const aiMsg: Message = { type: "text", content: res.reply, from: "ai", timestamp: Date.now() };
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, aiMsg],
            lastMessage: res.reply,
            timestamp: Date.now(),
          };
        }
        return conv;
      }));
    } catch (err) {
      const errorMsg: Message = {
        type: "text",
        content: "Error: Could not get reply.",
        from: "ai",
        error: true,
        timestamp: Date.now(),
      };
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, errorMsg],
            lastMessage: "Error: Could not get reply.",
            timestamp: Date.now(),
          };
        }
        return conv;
      }));
    }
    setInput("");
    setLoading(false);
    setIsTyping(false);
  };

  const handleImage = async () => {
    if (!input.trim() || !activeConversationId) return;
    setLoading(true);
    setIsTyping(true);
    
    const userMsg: Message = { type: "text", content: input, from: "user", timestamp: Date.now() };
    
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, userMsg],
          lastMessage: input,
          timestamp: Date.now(),
        };
      }
      return conv;
    }));

    try {
      const res = await generateImage.mutateAsync({ prompt: input });
      const aiMsg: Message = {
        type: "image",
        content: { url: res.url, text: res.text },
        from: "ai",
        timestamp: Date.now(),
      };
      
      setConversations(prev => prev.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, aiMsg],
            lastMessage: "Generated an image",
            timestamp: Date.now(),
          };
        }
        return conv;
      }));
    } catch (err) {
      const errorMsg: Message = {
        type: "text",
        content: "Error: Could not generate image.",
        from: "ai",
        error: true,
        timestamp: Date.now(),
      };
      
      setConversations(prev => prev.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, errorMsg],
            lastMessage: "Error: Could not generate image.",
            timestamp: Date.now(),
          };
        }
        return conv;
      }));
    }
    
    setInput("");
    setLoading(false);
    setIsTyping(false);
  };

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: "New Conversation",
      lastMessage: "👋 Hi! I'm your AI assistant. Ask me anything or try generating an image!",
      timestamp: Date.now(),
      messages: [
        {
          type: "text",
          content: "👋 Hi! I'm your AI assistant. Ask me anything or try generating an image!",
          from: "ai",
          timestamp: Date.now(),
        },
      ],
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(conversations[0]?.id || null);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, title: newTitle } : conv
    ));
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
    <div className="chat-container">
      <div ref={sidebarRef}>
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          showSidebar={showSidebar}
        />
      </div>
      
      {/* Mobile sidebar toggle */}
      <button
        className="btn btn-primary d-md-none position-fixed"
        style={{ top: '1rem', left: '1rem', zIndex: 1001 }}
        onClick={() => setShowSidebar(!showSidebar)}
        aria-label="Toggle sidebar"
      >
        <i className="bi bi-list"></i>
      </button>

      <div className="chat-area">
        {/* Header */}
        <div className="chat-header">
          <div className="d-flex align-items-center">
            <h2 className="mb-0 text-truncate">{activeConversation?.title || "Chat"}</h2>
          </div>
          <Link href="/api/auth/logout" className="btn btn-outline-danger btn-sm">Logout</Link>
        </div>

        {/* Chat area */}
        <div className="chat-area">
          {!activeConversation?.messages?.length && (
            <div className="text-muted text-center">Start the conversation!</div>
          )}
          {activeConversation?.messages?.map((msg, i) =>
            msg.type === "text" ? (
              <div key={i} className={`message-wrapper d-flex ${msg.from === "user" ? "justify-content-end" : "justify-content-start"}`}>
                {msg.from === "ai" && (
                  <span className="me-2">
                    <Image src="/vercel.svg" alt="AI" width={32} height={32} className="chat-avatar" />
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
                    <Image src="/window.svg" alt="You" width={32} height={32} className="chat-avatar" />
                  </span>
                )}
              </div>
            ) : (
              <div key={i} className="message-wrapper d-flex justify-content-start align-items-center">
                <span className="me-2">
                  <Image src="/vercel.svg" alt="AI" width={32} height={32} className="chat-avatar" />
                </span>
                <span className="chat-bubble chat-bubble-ai">
                  <Image src={msg.content.url} alt="Generated" width={128} height={128} className="mb-1" />
                  <div className="small text-muted">{msg.content.text}</div>
                  <span className="d-block text-end small text-muted mt-1">{formatTime(msg.timestamp)}</span>
                </span>
              </div>
            )
          )}
          {isTyping && (
            <div className="d-flex align-items-center typing-indicator">
              <span className="me-2">
                <Image src="/vercel.svg" alt="AI" width={32} height={32} className="chat-avatar" />
              </span>
              <div className="typing-bubble">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="input-area">
          <form className="d-flex gap-2" onSubmit={handleSend}>
            <div className="input-group">
              <input
                className="form-control"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type a message or image prompt..."
                disabled={loading}
                aria-label="Message input"
              />
              <button
                className="btn btn-link text-dark p-2"
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={loading}
              >
                😊
              </button>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : "Send"}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleImage}
              disabled={loading || !input.trim()}
            >
              {loading ? <span className="spinner-border spinner-border-sm" /> : "Image"}
            </button>
          </form>
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={(emoji) => {
                setInput(prev => prev + emoji);
                setShowEmojiPicker(false);
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
