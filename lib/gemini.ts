import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize the Google AI SDK with the API key
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error('GOOGLE_API_KEY is not defined in the environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Text model configuration (using gemini-pro for reliable responses)
const textModel = genAI.getGenerativeModel({
  model: 'gemini-pro',
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

// Text-to-image model (using gemini-pro)
// Note: Gemini Pro doesn't have native image generation capability,
// so we're using the same model for image descriptions that will later
// use placeholder images
const imageModel = genAI.getGenerativeModel({
  model: 'gemini-pro',
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

// Generate a text response
export async function generateTextResponse(prompt: string): Promise<string> {
  try {
    const result = await textModel.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating text response:', error);
    return 'Sorry, I encountered an error processing your request. Please try again.';
  }
}

// Interface for image generation result
interface ImageGenerationResult {
  imageUrl: string;
  description: string;
}

// Generate an image description and placeholder image
export async function generateImage(prompt: string): Promise<string> {
  try {
    // Generate a creative description for the image
    const descriptionPrompt = `
      Create a detailed visual description of an image based on this request: "${prompt}".
      Make your description vivid, detailed, and creative.
      Keep it concise, under 100 words.
    `;
    
    // Get a description from Gemini
    const result = await imageModel.generateContent(descriptionPrompt);
    const description = result.response.text();
    
    // Generate a deterministic but random-looking seed based on the prompt
    // to make the same prompt always generate the same image
    let seed = 0;
    for (let i = 0; i < prompt.length; i++) {
      seed = ((seed << 5) - seed) + prompt.charCodeAt(i);
      seed = seed & seed; // Convert to 32bit integer
    }
    seed = Math.abs(seed % 1000);
    
    // Use various placeholder image services for different looks
    const placeholderServices = [
      `https://picsum.photos/seed/${seed}/512/512`, // Lorem Picsum
      `https://source.unsplash.com/random/512x512/?${encodeURIComponent(prompt)}`, // Unsplash
      `https://placeimg.com/512/512/${getCategory(prompt)}`, // PlaceImg
      `https://loremflickr.com/512/512/${encodeURIComponent(prompt.split(' ')[0])}` // LoremFlickr
    ];
    
    // Select a service based on the seed
    const serviceIndex = seed % placeholderServices.length;
    const imageUrl = placeholderServices[serviceIndex];
    
    console.log(`Generated description for "${prompt}": ${description.substring(0, 100)}...`);
    
    return imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    // Return a fallback placeholder image if there's an error
    return `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/512/512`;
  }
}

// Helper function to get a category for placeimg.com
function getCategory(prompt: string): string {
  const prompt_lower = prompt.toLowerCase();
  if (prompt_lower.includes('person') || prompt_lower.includes('people') || prompt_lower.includes('face')) {
    return 'people';
  } else if (prompt_lower.includes('animal') || prompt_lower.includes('cat') || prompt_lower.includes('dog')) {
    return 'animals';
  } else if (prompt_lower.includes('architecture') || prompt_lower.includes('building') || prompt_lower.includes('house')) {
    return 'arch';
  } else if (prompt_lower.includes('nature') || prompt_lower.includes('landscape') || prompt_lower.includes('mountain')) {
    return 'nature';
  } else {
    return 'tech';
  }
}