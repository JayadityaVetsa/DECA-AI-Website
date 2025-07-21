// Gemini 1.5 Flash API utility
// Uses environment variable for API key security

export async function askGemini(question: string, context?: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Gemini API key not found in environment variables');
    throw new Error("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
  const prompt = context ? `${context}\n\n${question}` : question;
  
  const body = {
    contents: [
      { role: "user", parts: [{ text: prompt }] }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  };

  // Retry logic with exponential backoff
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Gemini API call attempt ${attempt}/${maxRetries}`);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Gemini API HTTP error ${res.status}:`, errorText);
        
        // Handle specific error cases
        if (res.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (res.status === 401) {
          throw new Error('Invalid API key. Please check your Gemini API configuration.');
        } else if (res.status >= 500) {
          throw new Error('Gemini API server error. Please try again.');
        } else {
          throw new Error(`Gemini API error: ${res.status} - ${errorText}`);
        }
      }

      const data = await res.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const response = data.candidates[0].content.parts[0].text;
        console.log(`✅ Gemini API success on attempt ${attempt}`);
        return response;
      }
      
      // Handle blocked content or other issues
      if (data.candidates && data.candidates[0]?.finishReason === 'SAFETY') {
        throw new Error('Response was blocked due to safety filters. Please rephrase your question.');
      }
      
      console.error('Unexpected Gemini API response format:', data);
      throw new Error("Received an unexpected response format from Gemini API.");
      
    } catch (err: any) {
      console.error(`Gemini API attempt ${attempt} failed:`, err);
      
      // Don't retry for certain errors
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please try again with a shorter question.');
      }
      
      if (err.message.includes('API key') || err.message.includes('safety filters')) {
        throw err; // Don't retry these errors
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw new Error(`Failed to connect to Gemini API after ${maxRetries} attempts: ${err.message}`);
      }
      
      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error('Unexpected error in Gemini API call');
} 