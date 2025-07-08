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

export async function generateInsight(userData: any): Promise<string> {
  try {
    const prompt = `Analise os dados e gere insight personalizado em português:
    
    Dados: ${JSON.stringify(userData)}
    
    Máximo 80 palavras, tom científico mas acessível.`;
    
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Erro Gemini:', error);
    return 'Não foi possível gerar insight no momento. Tente novamente.';
  }
}