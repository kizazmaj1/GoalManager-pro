import { GoogleGenAI } from "@google/genai";

// FIX: Aligned with Gemini API key handling guidelines by sourcing the API key directly from process.env and removing defensive checks.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

// FIX: Removed redundant API_KEY availability check, as per guidelines assuming the key is always available in the environment.
export const callGemini = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    const text = response.text;
    if (text) {
      return text;
    }
    return "Nije moguće generisati odgovor. Pokušajte sa drugačijim unosom.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Došlo je do greške pri komunikaciji sa AI asistentom.";
  }
};