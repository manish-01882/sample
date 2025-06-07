import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function generateResponse(prompt: string) {
  try {
    // Note: gemini-2.0-flash is not a valid model name
    // Using gemini-pro instead as it's the current stable model
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