// Gemini 1.5 Flash API utility
// Place your API key in an environment variable for security (e.g., import.meta.env.VITE_GEMINI_API_KEY)

export async function askGemini(question: string, context?: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyAxcqpUDFu44ETDHILvt_PHBvCrJnx2Ajo";
  if (!apiKey) {
    return "Gemini API key is not set. Please add VITE_GEMINI_API_KEY to your .env file.";
  }
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + apiKey;
  const prompt = context ? `${context}\n\n${question}` : question;
  const body = {
    contents: [
      { role: "user", parts: [{ text: prompt }] }
    ]
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return "Sorry, I couldn't get a response from Gemini.";
  } catch (err) {
    return "Error contacting Gemini API.";
  }
} 