'use client';

import { useEffect, useRef, useState } from "react";
import { trpc } from "../../src/utils/trpc";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import EmojiPicker from "./EmojiPicker";
import ConversationSidebar from "./ConversationSidebar";
import { generateConversationTitle } from "../../src/lib/gemini";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPaperPlane, faImage, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import { useUser } from '@auth0/nextjs-auth0';

interface TextMessage {
  type: 'text';
  content: string;
  from: 'user' | 'ai';
  timestamp: number;
  error?: boolean;
}

interface ImageMessage {
  type: 'image';
  content: { url: string; text: string };
  from: 'ai';
  timestamp: number;
}

type Message = TextMessage | ImageMessage;

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastMessage: string;
  timestamp: number;
}

interface Auth0User {
  name?: string;
  email?: string;
  picture?: string;
}

const CHAT_STORAGE_KEY = "chat_history_v1";

const ImageGenerationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.656 17.344c-1.016-1.015-1.15-2.75-.313-4.925.325-.825.73-1.617 1.205-2.365L3.582 10l-.033-.054c-.5-.799-.91-1.596-1.206-2.365-.836-2.175-.703-3.91.313-4.926.56-.56 1.364-.86 2.335-.86 1.425 0 3.168.636 4.957 1.756l.053.034.053-.034c1.79-1.12 3.532-1.757 4.957-1.757.972 0 1.776.3 2.335.86 1.014 1.015 1.148 2.752.312 4.926a13.892 13.892 0 0 1-1.206 2.365l-.034.054.034.053c.5.8.91 1.596 1.205 2.365.837 2.175.704 3.911-.311 4.926-.56.56-1.364.861-2.335.861-1.425 0-3.168-.637-4.957-1.757L10 16.415l-.053.033c-1.79 1.12-3.532 1.757-4.957 1.757-.972 0-1.776-.3-2.335-.86z" fill="currentColor" stroke="currentColor" strokeWidth=".1"/>
    <path d="M10.706 11.704A1.843 1.843 0 0 1 8.155 10a1.845 1.845 0 1 1 2.551 1.704z" fill="currentColor" stroke="currentColor" strokeWidth=".2"/>
  </svg>
);

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
  const [isImageGenerationMode, setIsImageGenerationMode] = useState(false);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { user: auth0User } = useUser() as { user: Auth0User | undefined };

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
        messages: [
        {
          type: "text",
          content: "👋 Hi! I'm your AI assistant. Ask me anything or try generating an image!",
          from: "ai",
          timestamp: Date.now(),
        },
        ],
        lastMessage: "👋 Hi! I'm your AI assistant. Ask me anything or try generating an image!",
        timestamp: Date.now(),
      };
      setConversations([newConversation]);
      setActiveConversationId(newConversation.id);
    }
  }, []);

  // Persist chat history
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversations));
    }
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
  const generateTitle = trpc.chat.generateTitle.useMutation();

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: TextMessage = {
      type: 'text',
      content: input,
      from: 'user',
      timestamp: Date.now()
    };

    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: "New Conversation",
        messages: [userMessage],
        lastMessage: input,
        timestamp: Date.now()
      };
      setConversations(prev => [...prev, newConversation]);
      setActiveConversationId(newConversation.id);
      currentConversationId = newConversation.id;
    } else {
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, userMessage],
            lastMessage: input,
            timestamp: Date.now()
          };
        }
        return conv;
      }));
    }

    setLoading(true);
    setIsTyping(true);

    try {
      if (isImageGenerationMode) {
        const res = await generateImage.mutateAsync({ prompt: input });
        const aiMsg: ImageMessage = {
          type: "image",
          content: { url: res.url, text: res.text },
          from: "ai",
          timestamp: Date.now()
        };
        
        setConversations(prev => prev.map(conv => {
          if (conv.id === currentConversationId) {
            const updatedMessages = [...conv.messages, aiMsg];
            
            if (updatedMessages.length === 3 && conv.title === "New Conversation") {
              const messagesForTitle = updatedMessages.map(msg => ({
                content: msg.type === 'text' ? msg.content : msg.content.text,
                from: msg.from
              }));
              
              generateTitle.mutate({ messages: messagesForTitle }, {
                onSuccess: (result) => {
                  if (!result.error) {
                    setConversations(prev => {
                      const updated = prev.map(c => {
                        if (c.id === currentConversationId) {
                          return { ...c, title: result.title };
                        }
                        return c;
                      });
                      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
                      return updated;
                    });
                  }
                }
              });
            }
            
            return {
              ...conv,
              messages: updatedMessages,
              lastMessage: "Generated an image",
              timestamp: Date.now()
            };
          }
          return conv;
        }));
      } else {
      const res = await sendText.mutateAsync({ message: input });
        const aiMsg: TextMessage = {
          type: "text",
          content: res.reply,
          from: "ai",
          timestamp: Date.now()
        };
        
        setConversations(prev => prev.map(conv => {
          if (conv.id === currentConversationId) {
            const updatedMessages = [...conv.messages, aiMsg];
            
            if (updatedMessages.length === 3 && conv.title === "New Conversation") {
              const messagesForTitle = updatedMessages.map(msg => ({
                content: msg.type === 'text' ? msg.content : msg.content.text,
                from: msg.from
              }));
              
              generateTitle.mutate({ messages: messagesForTitle }, {
                onSuccess: (result) => {
                  if (!result.error) {
                    setConversations(prev => {
                      const updated = prev.map(c => {
                        if (c.id === currentConversationId) {
                          return { ...c, title: result.title };
                        }
                        return c;
                      });
                      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
                      return updated;
                    });
                  }
                }
              });
            }
            
            return {
              ...conv,
              messages: updatedMessages,
              lastMessage: res.reply,
              timestamp: Date.now()
            };
          }
          return conv;
        }));
      }
    } catch (err) {
      const errorMsg: TextMessage = {
        type: "text",
        content: "Sorry, something went wrong. Please try again.",
        from: "ai",
        error: true,
        timestamp: Date.now()
      };
      
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, errorMsg],
            lastMessage: "Error occurred",
            timestamp: Date.now()
          };
    }
        return conv;
      }));
    } finally {
    setInput("");
    setLoading(false);
      setIsTyping(false);
    }
  };

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: "New Conversation",
      messages: [
        {
          type: "text",
          content: "👋 Hi! I'm your AI assistant. Ask me anything or try generating an image!",
          from: "ai",
          timestamp: Date.now(),
        },
      ],
      lastMessage: "👋 Hi! I'm your AI assistant. Ask me anything or try generating an image!",
      timestamp: Date.now(),
    };
    setConversations(prev => [...prev, newConversation]);
    setActiveConversationId(newConversation.id);
  };

  const handleDeleteChat = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
    setShowMenuId(null);
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

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const handleLogout = async () => {
    try {
      // Clear all state first
      setConversations([]);
      setActiveConversationId(null);
      
      // Clear all localStorage data
      localStorage.clear();
      
      // Redirect to Auth0 logout endpoint
      window.location.href = '/api/auth/logout';
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if there's an error, try to force logout
      window.location.href = '/api/auth/logout';
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button 
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <div className="header-title">
          <span className="model-name">ChatGPT</span>
          <span className="model-version">1.0</span>
        </div>
      </div>

      {/* Sidebar backdrop */}
      <div 
        className={`sidebar-backdrop ${showSidebar ? 'show' : ''}`}
        onClick={() => setShowSidebar(false)}
      />
      
      {/* Sidebar */}
      <div className={`sidebar ${showSidebar ? 'show' : ''}`} ref={sidebarRef}>
        <div className="sidebar-header">
          <div className="flex items-center justify-between w-full px-4">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-md">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-lg font-semibold">ChatGPT</span>
            </div>
            <button 
              onClick={toggleSidebar}
              className="menu-button"
              aria-label="Toggle sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-md">
                <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="sidebar-content">
          <button 
            className="new-chat-button"
            onClick={handleNewConversation}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-md">
              <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>New chat</span>
          </button>
          <div className="chat-history">
            {conversations.map((conversation) => (
              <a
                key={conversation.id}
                tabIndex={0}
                data-active={conversation.id === activeConversationId ? "" : undefined}
                data-fill=""
                className={`group menu-item justify-between gap-6 data-fill:gap-2 ${conversation.id === activeConversationId ? 'active' : ''}`}
                draggable="true"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveConversationId(conversation.id);
                }}
                data-discover="true"
              >
                <div className="flex min-w-0 grow items-center gap-2">
                  <div className="truncate">
                    <span className="" dir="auto">{conversation.title}</span>
                  </div>
                </div>
                <div className="text-token-text-tertiary flex items-center self-stretch">
                  <div className="trailing highlight">
                    <button
                      tabIndex={0}
                      data-trailing-button=""
                      className="menu-item-trailing-btn"
                      data-testid={`history-item-${conversation.id}-options`}
                      aria-label="Open conversation options"
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={showMenuId === conversation.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMenuId(showMenuId === conversation.id ? null : conversation.id);
                      }}
                    >
                      <div>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-md" aria-hidden="true">
                          <path fillRule="evenodd" clipRule="evenodd" d="M3 12C3 10.8954 3.89543 10 5 10C6.10457 10 7 10.8954 7 12C7 13.1046 6.10457 14 5 14C3.89543 14 3 13.1046 3 12ZM10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12ZM17 12C17 10.8954 17.8954 10 19 10C20.1046 10 21 10.8954 21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12Z" fill="currentColor" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
                {showMenuId === conversation.id && (
                  <div className="menu-dropdown">
                    <button
                      className="menu-item delete"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteChat(conversation.id);
                      }}
                    >
                      Delete chat
                    </button>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {auth0User?.picture ? (
                <img src={auth0User.picture} alt={auth0User.name || 'User'} className="avatar-image" />
              ) : (
                <svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div className="user-details">
              <div className="user-name">{auth0User?.name || 'Guest User'}</div>
              <div className="user-email">{auth0User?.email?.split('@')[0] || 'Not signed in'}</div>
            </div>
          </div>
          <button 
            className="logout-button"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <svg width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="chat-area">
        {/* Messages */}
        <div className="chat-messages">
          {activeConversation?.messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.from === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              {message.type === 'image' ? (
                <div className="ai-bubble">
                  <div className="message-content">
                    {/* Image container */}
                    <div className="image-message">
                      <div className="image-container">
                        <img 
                          src={message.content.url} 
                          alt={message.content.text} 
                          className="generated-image"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    {/* Text content */}
                    <div className="text-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {message.content.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={message.from === 'user' ? 'user-bubble' : 'ai-bubble'}>
                  <div className="message-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="message assistant-message">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
        )}
      </div>

      {/* Input area */}
        <div className="input-area">
          <form onSubmit={handleSend}>
            <div className="input-group">
        <textarea
                ref={textareaRef}
          value={input}
                onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
                placeholder={isImageGenerationMode ? "Describe the image you want to generate..." : "Message Gemini..."}
                rows={1}
                className="form-control"
                style={{ height: '24px' }}
          disabled={loading}
        />
              <div className="input-actions">
                <div 
                  role="button" 
                  className={`image-toggle-button ${isImageGenerationMode ? 'active' : ''}`}
                  onClick={() => setIsImageGenerationMode(!isImageGenerationMode)}
                  tabIndex={0}
                  aria-label="Toggle image generation"
                >
                  <div className="button-icon">
                    <span style={{ transform: isImageGenerationMode ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <div className="icon">
                        <ImageGenerationIcon />
                      </div>
                    </span>
                  </div>
                  <span className="button-text">Image Gen</span>
                </div>
        <button
                  type="submit"
                  className="send-button"
          disabled={loading || !input.trim()}
                  aria-label="Send message"
        >
                  <FontAwesomeIcon icon={faPaperPlane} />
        </button>
              </div>
            </div>
      </form>
        </div>
      </div>
    </div>
  );
}
