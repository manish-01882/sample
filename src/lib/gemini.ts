import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function generateResponse(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Gemini API error:', error);
    if (error.message?.includes('API key')) {
      throw new Error('Invalid or missing Google API key. Please check your .env.local file.');
    }
    if (error.message?.includes('model')) {
      throw new Error('Invalid model name. Please check the model configuration.');
    }
    throw new Error('Failed to generate response from Gemini: ' + (error.message || 'Unknown error'));
  }
}

export async function generateConversationTitle(messages: { content: string; from: 'user' | 'ai' }[]) {
  try {
    console.log('Generating title for messages:', messages);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Create a prompt that asks for a concise title based on the conversation
    const conversationText = messages
      .map(msg => `${msg.from === 'user' ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n');
    
    const prompt = `Based on this conversation, generate a short, descriptive title (max 5 words) that captures the main topic or theme. Only respond with the title, nothing else.\n\nConversation:\n${conversationText}`;
    
    console.log('Title generation prompt:', prompt);
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    const response = await result.response;
    const title = response.text().trim();
    console.log('Generated title:', title);
    return title;
  } catch (error: any) {
    console.error('Error generating conversation title:', error);
    return 'New Conversation';
  }
} 