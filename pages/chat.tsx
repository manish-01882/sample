import { useUser } from '@auth0/nextjs-auth0';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/markdown.css';

interface ChatMessage {
  id: number;
  message: string;
  response: string;
  response_type?: 'text' | 'image';
  image_url?: string;
  conversation_id: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface Conversation {
  id: string;
  created_at: string;
}

export default function ChatPage() {
  const { user, isLoading, error: authError } = useUser();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [imageMode, setImageMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Load conversations when user is authenticated
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (user && currentConversation) {
      loadMessages(currentConversation);
    }
  }, [user, currentConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    try {
      const response = await fetch('/api/chat/conversations');
      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }
      const data = await response.json();
      setConversations(data);
      
      // Set current conversation to the most recent one if it exists
      if (data.length > 0 && !currentConversation) {
        setCurrentConversation(data[0].id);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations. Please try again.');
    }
  }

  async function loadMessages(conversationId: string) {
    try {
      const response = await fetch(`/api/chat?conversationId=${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      const data = await response.json();
      
      // Process messages to extract image URLs from responses if needed
      const processedMessages = data.map((msg: ChatMessage) => {
        // If the message already has response_type, return it as is
        if (msg.response_type) return msg;
        
        // Check if this is an image response (contains IMAGE_URL:)
        if (msg.response && msg.response.includes('IMAGE_URL:')) {
          const parts = msg.response.split('IMAGE_URL:');
          if (parts.length > 1) {
            const imageUrl = parts[1].trim();
            const actualResponse = parts[0].trim();
            
            return {
              ...msg,
              response: actualResponse,
              response_type: 'image',
              image_url: imageUrl
            };
          }
        }
        
        // Otherwise, mark it as text response
        return {
          ...msg,
          response_type: 'text'
        };
      });
      
      // Sort messages by created_at in ascending order for display
      setMessages(processedMessages.sort((a: ChatMessage, b: ChatMessage) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages. Please try again.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // If in image mode, just use the input as the message (no prefix)
      const messageText = imageMode ? input : input;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          conversationId: currentConversation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage = await response.json();
      
      // If this is a new conversation, add it to the list and set it as current
      if (!currentConversation) {
        setCurrentConversation(newMessage.conversation_id);
        setConversations(prev => [{
          id: newMessage.conversation_id,
          created_at: newMessage.created_at
        }, ...prev]);
      }
      
      // Process the message before adding it to the list
      let processedMessage = { ...newMessage };
      
      // If this doesn't have response_type but has IMAGE_URL in the response, extract it
      if (!processedMessage.response_type && processedMessage.response && processedMessage.response.includes('IMAGE_URL:')) {
        const parts = processedMessage.response.split('IMAGE_URL:');
        if (parts.length > 1) {
          const imageUrl = parts[1].trim();
          const actualResponse = parts[0].trim();
          
          processedMessage = {
            ...processedMessage,
            response: actualResponse,
            response_type: 'image',
            image_url: imageUrl
          };
        }
      }
      
      // Add the processed message to the list
      setMessages(prev => [...prev, processedMessage]);
      setInput('');
      
      // Reset image mode after generating an image
      if (imageMode) {
        setImageMode(false);
      }
      
      // Reload conversations to ensure the list is up to date
      loadConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function startNewConversation() {
    setCurrentConversation(null);
    setMessages([]);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  function getConversationTitle(id: string) {
    const conversationMessages = messages.filter(m => m.conversation_id === id);
    if (conversationMessages.length > 0) {
      const firstMessage = conversationMessages[0].message;
      return firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
    }
    return "New Conversation";
  }

  function handleLogout() {
    window.location.href = '/api/auth/logout';
  }

  // For loading states
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // For authentication errors
  if (authError) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          Authentication error: {authError.message}
        </div>
        <Link href="/" className="btn btn-primary">
          Return to Home
        </Link>
      </div>
    );
  }

  // If not authenticated, we'll return null as the useEffect will redirect
  if (!user) {
    return null;
  }

  return (
    <div className="d-flex vh-100">
      {/* Sidebar */}
      <div 
        className={`sidebar bg-light border-end ${showSidebar ? 'd-block' : 'd-none'}`} 
        style={{ width: '300px', overflowY: 'auto' }}
      >
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0">AI Assistant</h5>
          <button 
            className="btn btn-sm btn-outline-secondary d-md-none" 
            onClick={() => setShowSidebar(false)}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div className="p-3 border-bottom">
          <button 
            className="btn btn-primary w-100" 
            onClick={startNewConversation}
          >
            <i className="bi bi-plus-lg me-2"></i>
            New Chat
          </button>
        </div>
        
        <div className="conversation-list">
          {conversations.length === 0 ? (
            <div className="p-3 text-center text-muted">
              <p>No conversations yet</p>
              <p>Start a new chat!</p>
            </div>
          ) : (
            conversations.map(convo => (
              <div 
                key={convo.id}
                className={`p-3 border-bottom conversation-item ${convo.id === currentConversation ? 'bg-light' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setCurrentConversation(convo.id)}
              >
                <div className="d-flex align-items-center">
                  <i className="bi bi-chat-left-text me-2"></i>
                  <div className="flex-grow-1 text-truncate">
                    {currentConversation === convo.id ? 
                      getConversationTitle(convo.id) : 
                      "Chat " + new Date(convo.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="small text-muted mt-1">
                  {formatDate(convo.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-auto p-3 border-top">
          {user && (
            <div className="d-flex align-items-center mb-3">
              {user.picture && (
                <img 
                  src={user.picture} 
                  alt={user.name || 'User'} 
                  className="rounded-circle me-2"
                  width="32"
                  height="32"
                />
              )}
              <div className="text-truncate">
                <div className="fw-bold">{user.name}</div>
                <small className="text-muted">{user.email?.split('@')[0] || 'Not signed in'}</small>
              </div>
            </div>
          )}
          <button 
            className="btn btn-outline-danger w-100" 
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Chat Header */}
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <button 
              className={`btn btn-sm btn-outline-secondary me-2 d-md-none ${showSidebar ? 'd-none' : 'd-block'}`} 
              onClick={() => setShowSidebar(true)}
            >
              <i className="bi bi-list"></i>
            </button>
            <h5 className="mb-0">
              {currentConversation ? getConversationTitle(currentConversation) : 'New Conversation'}
            </h5>
          </div>
          <div>
            <button 
              className="btn btn-sm btn-outline-secondary" 
              onClick={startNewConversation}
              title="New Conversation"
            >
              <i className="bi bi-plus-lg"></i>
            </button>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div 
          className="flex-grow-1 p-3" 
          style={{ overflowY: 'auto', backgroundColor: '#f8f9fa' }}
        >
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          {messages.length === 0 ? (
            <div className="d-flex flex-column justify-content-center align-items-center h-100 text-center text-muted">
              <div style={{ maxWidth: '500px' }}>
                <i className="bi bi-chat-dots" style={{ fontSize: '3rem' }}></i>
                <h3 className="mt-3">Start a New Conversation</h3>
                <p className="lead">
                  Ask questions, get information, or just chat with the AI assistant.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="mb-4">
                {/* User message */}
                <div className="d-flex justify-content-end mb-2">
                  <div 
                    className="message user-message p-3 rounded"
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      maxWidth: '75%',
                      width: 'fit-content',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                  </div>
                </div>
                
                {/* AI response: image and text as siblings, not in the same div */}
                {msg.response_type === 'image' && msg.image_url && (
                  <div className="d-flex justify-content-start mb-2">
                    <div 
                      className="message ai-message p-3 rounded"
                      style={{
                        backgroundColor: 'white',
                        color: '#212529',
                        maxWidth: '512px',
                        width: 'fit-content',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        border: '1px solid #e9ecef',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <img
                        src={msg.image_url}
                        alt="Generated image"
                        className="img-fluid rounded"
                        style={{ maxWidth: '100%', display: 'block' }}
                      />
                    </div>
                  </div>
                )}
                {msg.response && (
                  <div className="d-flex justify-content-start">
                    <div 
                      className="message ai-message p-3 rounded"
                      style={{
                        backgroundColor: 'white',
                        color: '#212529',
                        maxWidth: msg.response_type === 'image' ? '512px' : '75%',
                        width: 'fit-content',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        border: '1px solid #e9ecef'
                      }}
                    >
                      <div className="markdown-content">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            pre: ({ node, ...props }) => (
                              <pre className="bg-light p-2 rounded" {...props} />
                            ),
                            code: ({ node, inline, ...props }) => (
                              inline 
                                ? <code className="bg-light px-1 rounded" {...props} />
                                : <code className="d-block bg-light p-2 rounded" {...props} />
                            ),
                            table: ({ node, ...props }) => (
                              <table className="table table-bordered table-striped" {...props} />
                            ),
                            blockquote: ({ node, ...props }) => (
                              <blockquote className="blockquote border-start border-4 ps-3 text-muted" {...props} />
                            )
                          }}
                        >
                          {msg.response}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat Input */}
        <div className="p-3 border-top bg-white">
          <form onSubmit={handleSubmit}>
            <div className="d-flex align-items-center mb-2">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="imageToggle"
                  checked={imageMode}
                  onChange={() => setImageMode(!imageMode)}
                  disabled={isSubmitting}
                />
                <label className="form-check-label ms-2" htmlFor="imageToggle">
                  <i className="bi bi-image me-1"></i>
                  {imageMode ? "Image Generation Mode" : "Text Mode"}
                </label>
              </div>
              {imageMode && (
                <span className="badge bg-info ms-2">
                  <i className="bi bi-info-circle me-1"></i>
                  Describe the image you want to generate
                </span>
              )}
            </div>
            
            <div className="input-group">
              <textarea 
                className="form-control"
                placeholder={imageMode ? "Describe the image you want to create..." : "Type your message here..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isSubmitting}
                rows={1}
                style={{ resize: 'none' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim()) handleSubmit(e);
                  }
                }}
              />
              <button 
                type="submit" 
                className={`btn ${imageMode ? 'btn-success' : 'btn-primary'}`}
                disabled={isSubmitting || !input.trim()}
                title={imageMode ? "Generate Image" : "Send Message"}
              >
                {isSubmitting ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : imageMode ? (
                  <i className="bi bi-image"></i>
                ) : (
                  <i className="bi bi-send"></i>
                )}
              </button>
            </div>
            <small className="text-muted mt-1 d-flex justify-content-between">
              <span>Press Enter to send, Shift+Enter for new line</span>
              {imageMode && <span className="text-success"><i className="bi bi-palette"></i> Image generation enabled</span>}
            </small>
          </form>
        </div>
      </div>
    </div>
  );
}