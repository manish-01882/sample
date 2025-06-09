import { createItem, getItems, getUserItems, updateItem, deleteItem } from './supabaseData';
import { supabase } from './supabase';

// Mock the Supabase client
jest.mock('./supabase', () => {
  const mockFrom = jest.fn().mockReturnThis();
  const mockSelect = jest.fn().mockReturnThis();
  const mockInsert = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnThis();
  const mockDelete = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockSingle = jest.fn().mockReturnThis();
  
  return {
    supabase: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
    },
  };
});

describe('Supabase Data Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test createItem function
  describe('createItem', () => {
    it('should create an item successfully', async () => {
      const mockItem = { id: 1, name: 'Test Item', user_id: 'user123' };
      const mockResponse = { data: mockItem, error: null };
      
      // Setup the mock to return our expected data
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await createItem(mockItem);
      
      expect(supabase.from).toHaveBeenCalledWith('items');
      expect(supabase.insert).toHaveBeenCalledWith(mockItem);
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockItem);
    });

    it('should throw an error if the insert fails', async () => {
      const mockError = new Error('Insert failed');
      const mockResponse = { data: null, error: mockError };
      
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue(mockResponse);
      
      await expect(createItem({ name: 'Test' })).rejects.toThrow('Insert failed');
    });
  });

  // Test getItems function
  describe('getItems', () => {
    it('should retrieve all items successfully', async () => {
      const mockItems = [
        { id: 1, name: 'Item 1', user_id: 'user123' },
        { id: 2, name: 'Item 2', user_id: 'user456' }
      ];
      const mockResponse = { data: mockItems, error: null };
      
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await getItems();
      
      expect(supabase.from).toHaveBeenCalledWith('items');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockItems);
    });

    it('should throw an error if the select fails', async () => {
      const mockError = new Error('Select failed');
      const mockResponse = { data: null, error: mockError };
      
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockResolvedValue(mockResponse);
      
      await expect(getItems()).rejects.toThrow('Select failed');
    });
  });

  // Test getUserItems function
  describe('getUserItems', () => {
    it('should retrieve items for a specific user', async () => {
      const userId = 'user123';
      const mockItems = [
        { id: 1, name: 'Item 1', user_id: userId },
        { id: 2, name: 'Item 2', user_id: userId }
      ];
      const mockResponse = { data: mockItems, error: null };
      
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await getUserItems(userId);
      
      expect(supabase.from).toHaveBeenCalledWith('items');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('user_id', userId);
      expect(result).toEqual(mockItems);
    });

    it('should throw an error if the select fails', async () => {
      const mockError = new Error('Select failed');
      const mockResponse = { data: null, error: mockError };
      
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockResolvedValue(mockResponse);
      
      await expect(getUserItems('user123')).rejects.toThrow('Select failed');
    });
  });

  // Test updateItem function
  describe('updateItem', () => {
    it('should update an item successfully', async () => {
      const itemId = 1;
      const updateData = { name: 'Updated Item' };
      const mockUpdatedItem = { id: itemId, name: 'Updated Item', user_id: 'user123' };
      const mockResponse = { data: mockUpdatedItem, error: null };
      
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.update as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await updateItem(itemId, updateData);
      
      expect(supabase.from).toHaveBeenCalledWith('items');
      expect(supabase.update).toHaveBeenCalledWith(updateData);
      expect(supabase.eq).toHaveBeenCalledWith('id', itemId);
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should throw an error if the update fails', async () => {
      const mockError = new Error('Update failed');
      const mockResponse = { data: null, error: mockError };
      
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.update as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue(mockResponse);
      
      await expect(updateItem(1, { name: 'Test' })).rejects.toThrow('Update failed');
    });
  });

  // Test deleteItem function
  describe('deleteItem', () => {
    it('should delete an item successfully', async () => {
      const itemId = 1;
      const mockResponse = { error: null };
      
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.delete as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await deleteItem(itemId);
      
      expect(supabase.from).toHaveBeenCalledWith('items');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', itemId);
      expect(result).toBe(true);
    });

    it('should throw an error if the delete fails', async () => {
      const mockError = new Error('Delete failed');
      const mockResponse = { error: mockError };
      
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.delete as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockResolvedValue(mockResponse);
      
      await expect(deleteItem(1)).rejects.toThrow('Delete failed');
    });
  });
});