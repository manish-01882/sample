import React, { useEffect, useState } from 'react';
import { useAuth0Supabase } from '../contexts/Auth0SupabaseContext';
import { getItems, createItem, deleteItem } from '../lib/supabaseData';

interface Item {
  id: number;
  name: string;
  description: string;
  user_id: string;
  created_at: string;
}

export function SupabaseDataExample() {
  const { user, supabaseUser, loading } = useAuth0Supabase();
  const [items, setItems] = useState<Item[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch items when the component mounts and when the user changes
  useEffect(() => {
    if (supabaseUser) {
      fetchItems();
    } else {
      setItems([]);
    }
  }, [supabaseUser]);

  // Function to fetch items from Supabase
  async function fetchItems() {
    if (!supabaseUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getItems();
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to fetch items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Function to add a new item
  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    
    if (!supabaseUser) {
      setError('Please log in to add items.');
      return;
    }
    
    if (!newItemName.trim()) {
      setError('Please enter an item name.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newItem = {
        name: newItemName,
        description: newItemDescription,
        user_id: supabaseUser.id,
      };
      
      await createItem(newItem);
      
      // Reset form and refresh items
      setNewItemName('');
      setNewItemDescription('');
      await fetchItems();
    } catch (err) {
      console.error('Error creating item:', err);
      setError('Failed to create item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Function to delete an item
  async function handleDeleteItem(id: number) {
    if (!supabaseUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteItem(id);
      await fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (loading || isLoading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Supabase Data Example</h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {!supabaseUser ? (
          <div className="alert alert-info">
            Please log in to manage your items.
          </div>
        ) : (
          <>
            {/* Form to add new item */}
            <form onSubmit={handleCreateItem} className="mb-4">
              <div className="mb-3">
                <label htmlFor="itemName" className="form-label">Item Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="itemName"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="itemDescription" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="itemDescription"
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  rows={3}
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Item'}
              </button>
            </form>

            {/* List of items */}
            <h6 className="mb-3">Your Items</h6>
            {items.length === 0 ? (
              <p className="text-muted">No items found. Add your first item above!</p>
            ) : (
              <div className="list-group">
                {items.map((item) => (
                  <div key={item.id} className="list-group-item list-group-item-action">
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">{item.name}</h6>
                      <small className="text-muted">
                        {new Date(item.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    <p className="mb-1">{item.description}</p>
                    <button
                      className="btn btn-sm btn-danger mt-2"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}