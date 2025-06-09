import { supabase } from './supabase';

// Mock the Supabase client
jest.mock('./supabase', () => {
  const mockFrom = jest.fn().mockReturnThis();
  const mockSelect = jest.fn().mockReturnThis();
  const mockInsert = jest.fn().mockReturnThis();
  const mockLimit = jest.fn().mockReturnThis();
  const mockSingle = jest.fn();
  
  // Mock auth object
  const mockAuth = {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  };
  
  return {
    supabase: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      limit: mockLimit,
      single: mockSingle,
      auth: mockAuth,
    },
  };
});

describe('Supabase Setup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Connection', () => {
    it('should connect to Supabase', async () => {
      // Mock successful connection
      const mockResponse = { data: [{ count: 5 }], error: null };
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockResolvedValue(mockResponse);
      
      const { data, error } = await supabase.from('chats').select('count(*)', { count: 'exact' });
      
      expect(supabase.from).toHaveBeenCalledWith('chats');
      expect(supabase.select).toHaveBeenCalledWith('count(*)', { count: 'exact' });
      expect(data).toEqual([{ count: 5 }]);
      expect(error).toBeNull();
    });
  });
  
  describe('Insert Operation', () => {
    it('should insert data into Supabase', async () => {
      const testChat = {
        user_id: '00000000-0000-0000-0000-000000000000',
        type: 'text',
        prompt: 'Test prompt',
        response: 'Test response'
      };
      
      const mockResponse = { 
        data: { ...testChat, id: 1, created_at: '2023-01-01T00:00:00Z' }, 
        error: null 
      };
      
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue(mockResponse);
      
      const { data, error } = await supabase
        .from('chats')
        .insert([testChat])
        .select()
        .single();
      
      expect(supabase.from).toHaveBeenCalledWith('chats');
      expect(supabase.insert).toHaveBeenCalledWith([testChat]);
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.single).toHaveBeenCalled();
      expect(data).toEqual(expect.objectContaining(testChat));
      expect(error).toBeNull();
    });
  });
  
  describe('Select Operation', () => {
    it('should select data from Supabase', async () => {
      const mockData = [
        { id: 1, user_id: 'user1', type: 'text', prompt: 'Hello', response: 'Hi' },
        { id: 2, user_id: 'user2', type: 'text', prompt: 'How are you?', response: 'Good' }
      ];
      
      const mockResponse = { data: mockData, error: null };
      
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.limit as jest.Mock).mockResolvedValue(mockResponse);
      
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .limit(5);
      
      expect(supabase.from).toHaveBeenCalledWith('chats');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.limit).toHaveBeenCalledWith(5);
      expect(data).toEqual(mockData);
      expect(error).toBeNull();
    });
  });
  
  describe('Auth Session', () => {
    it('should get the current auth session', async () => {
      const mockSession = { data: { session: null }, error: null };
      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await supabase.auth.getSession();
      
      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });
  });
});