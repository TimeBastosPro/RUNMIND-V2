import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 150,
  }
});

export async function generateInsight(prompt: string): Promise<string> {
  // const result = await geminiModel.generateContent(prompt);
  return Promise.resolve("Modo de desenvolvimento: O insight da IA seria gerado aqui.");
}

export async function generateChatResponse(userQuestion: string): Promise<string> {
  // const result = await geminiModel.generateContent(fullPrompt);
  return Promise.resolve("Modo de desenvolvimento: O chat com IA está desativado para economizar custos.");
}