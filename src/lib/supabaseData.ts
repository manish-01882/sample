import { supabase } from './supabase';

// Example function to create a new item in Supabase
export async function createItem(data: any) {
  const { data: item, error } = await supabase
    .from('items')
    .insert(data)
    .select()
    .single();
    
  if (error) throw error;
  return item;
}

// Example function to get all items from Supabase
export async function getItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*');
    
  if (error) throw error;
  return data;
}

// Example function to get items for a specific user
export async function getUserItems(userId: string) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
}

// Example function to update an item
export async function updateItem(id: number, data: any) {
  const { data: updatedItem, error } = await supabase
    .from('items')
    .update(data)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return updatedItem;
}

// Example function to delete an item
export async function deleteItem(id: number) {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
}