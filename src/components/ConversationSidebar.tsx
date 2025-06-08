'use client';

import React from 'react';
import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  showSidebar: boolean;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  showSidebar
}) => {
  const { user } = useUser();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleRename = (id: string) => {
    setEditingId(id);
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setEditTitle(conversation.title);
    }
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`conversation-sidebar ${showSidebar ? 'show' : ''}`}>
      <div className="sidebar-header">
        <button 
          className="sidebar-close d-md-none"
          onClick={() => onSelectConversation(activeConversationId || '')}
          aria-label="Close sidebar"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <h2>Conversations</h2>
      </div>
      <div className="conversation-list">
        <button className="new-chat-button" onClick={onNewConversation}>
          New Chat
        </button>
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`conversation-item ${conversation.id === activeConversationId ? 'active' : ''}`}
            onClick={() => onSelectConversation(conversation.id)}
          >
            {editingId === conversation.id ? (
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveRename(conversation.id);
                    } else if (e.key === 'Escape') {
                      setEditingId(null);
                    }
                  }}
                  aria-label="Conversation title"
                  placeholder="Enter conversation title"
                />
                <button
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveRename(conversation.id);
                  }}
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="title">{conversation.title}</div>
                  <div className="dropdown">
                    <button
                      className="btn btn-sm btn-link text-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                        dropdown?.classList.toggle('show');
                      }}
                    >
                      ⋮
                    </button>
                    <div className="dropdown-menu">
                      <button
                        className="dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(conversation.id);
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="dropdown-item text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-muted small text-truncate">{conversation.lastMessage}</div>
                <div className="timestamp">{formatTime(conversation.timestamp)}</div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="logout-button" onClick={() => window.location.href = '/api/auth/signout'}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ConversationSidebar; 