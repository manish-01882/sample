import React, { useState, useEffect } from 'react';
import { useAuth0Supabase } from '../contexts/Auth0SupabaseContext';
import { supabase } from '../lib/supabase';

interface Note {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
}

export function Auth0SupabaseDemo() {
  const { user, loading, error } = useAuth0Supabase();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load notes when user is authenticated
  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  async function fetchNotes() {
    if (!user) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      // Using admin API route to access data securely
      const response = await fetch('/api/notes');
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setApiError('Failed to load notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    
    if (!newNote.title.trim()) {
      setApiError('Please enter a title for your note');
      return;
    }
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      // Using admin API route to add data securely
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newNote.title,
          content: newNote.content,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add note');
      }
      
      setNewNote({ title: '', content: '' });
      await fetchNotes();
    } catch (err) {
      console.error('Error adding note:', err);
      setApiError('Failed to add note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteNote(id: number) {
    if (!user) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      // Using admin API route to delete data securely
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      
      await fetchNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
      setApiError('Failed to delete note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (loading || isLoading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="alert alert-info">
        Please log in to access your notes.
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Add New Note</h5>
            </div>
            <div className="card-body">
              {apiError && (
                <div className="alert alert-danger">
                  {apiError}
                </div>
              )}
              
              <form onSubmit={handleAddNote}>
                <div className="mb-3">
                  <label htmlFor="noteTitle" className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    id="noteTitle"
                    value={newNote.title}
                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="noteContent" className="form-label">Content</label>
                  <textarea
                    className="form-control"
                    id="noteContent"
                    rows={5}
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Note'}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Your Notes</h5>
            </div>
            <div className="card-body">
              {notes.length === 0 ? (
                <p className="text-muted">No notes yet. Create your first note!</p>
              ) : (
                <div className="row">
                  {notes.map((note) => (
                    <div key={note.id} className="col-md-6 mb-3">
                      <div className="card h-100">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">{note.title}</h6>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                        <div className="card-body">
                          <p className="card-text">{note.content}</p>
                        </div>
                        <div className="card-footer text-muted small">
                          {new Date(note.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="alert alert-primary mt-4">
        <p className="mb-0">
          <strong>How it works:</strong> This demo uses Auth0 for authentication, but accesses Supabase data through secure API routes.
          The API routes use the Auth0 session to identify the user and then use Supabase admin credentials to perform database operations.
        </p>
      </div>
    </div>
  );
}