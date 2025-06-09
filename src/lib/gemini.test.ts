import { generateResponse, generateConversationTitle } from './gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the GoogleGenerativeAI module
jest.mock('@google/generative-ai', () => {
  // Create mock functions
  const mockGenerateContent = jest.fn();
  const mockGetGenerativeModel = jest.fn(() => ({
    generateContent: mockGenerateContent,
  }));
  
  // Create the mock class
  const MockGoogleGenerativeAI = jest.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  }));
  
  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI,
  };
});

describe('Gemini API Functions', () => {
  let mockGenerateContent: jest.Mock;
  let mockGetGenerativeModel: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get references to the mocked functions
    const mockGenAI = new GoogleGenerativeAI('fake-key');
    mockGetGenerativeModel = mockGenAI.getGenerativeModel as jest.Mock;
    mockGenerateContent = mockGetGenerativeModel().generateContent as jest.Mock;
  });
  
  // Test generateResponse function
  describe('generateResponse', () => {
    it('should generate a response successfully', async () => {
      const mockPrompt = 'Hello, how are you?';
      const mockResponseText = 'I am doing well, thank you for asking!';
      
      // Setup the mock response
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockResponseText,
        },
      });
      
      const result = await generateResponse(mockPrompt);
      
      // Verify the function was called with the correct parameters
      expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-2.0-flash' });
      expect(mockGenerateContent).toHaveBeenCalledWith({
        contents: [{ role: 'user', parts: [{ text: mockPrompt }] }],
      });
      
      // Verify the result
      expect(result).toBe(mockResponseText);
    });
  });
  
  // Test generateConversationTitle function
  describe('generateConversationTitle', () => {
    it('should generate a conversation title based on messages', async () => {
      const mockMessages = [
        { content: 'Hello, how can you help me with JavaScript?', from: 'user' as const },
        { content: 'I can help you with JavaScript questions. What would you like to know?', from: 'ai' as const },
        { content: 'How do I use async/await?', from: 'user' as const },
      ];
      
      const mockTitle = 'JavaScript Async/Await Help';
      
      // Setup the mock response
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockTitle,
        },
      });
      
      const result = await generateConversationTitle(mockMessages);
      
      // Verify the function was called with the correct model
      expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-2.0-flash' });
      
      // Verify generateContent was called with a prompt containing the conversation
      expect(mockGenerateContent).toHaveBeenCalled();
      const callArg = mockGenerateContent.mock.calls[0][0];
      expect(callArg.contents[0].role).toBe('user');
      expect(callArg.contents[0].parts[0].text).toContain('User: Hello, how can you help me with JavaScript?');
      expect(callArg.contents[0].parts[0].text).toContain('AI: I can help you with JavaScript questions');
      expect(callArg.contents[0].parts[0].text).toContain('User: How do I use async/await?');
      
      // Verify the result
      expect(result).toBe(mockTitle);
    });
    
    it('should return a default title if an error occurs', async () => {
      const mockMessages = [
        { content: 'Hello', from: 'user' as const },
      ];
      
      // Setup the mock to throw an error
      mockGenerateContent.mockRejectedValue(new Error('API error'));
      
      const result = await generateConversationTitle(mockMessages);
      
      // Verify the default title is returned
      expect(result).toBe('New Conversation');
    });
  });
});