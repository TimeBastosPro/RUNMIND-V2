import { GoogleGenerativeAI } from '@google/generative-ai';
import { Platform } from 'react-native';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 150,
  }
});

export async function generateInsight(athleteData: any): Promise<string> {
  // Em produção, use a Edge Function Supabase para proteger a chave
  if (process.env.NODE_ENV === 'production') {
    let url = '/functions/v1/get-gemini-insight';
    if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
      url = 'http://localhost:54321/functions/v1/get-gemini-insight';
    }
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteData })
      }
    );
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Resposta da função Gemini não é JSON. Verifique a URL e o ambiente.');
    }
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao gerar insight com Gemini');
    }
    return data.result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  // Em desenvolvimento/local, use a API Gemini diretamente
  const prompt = buildPromptFromAthleteData(athleteData);
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}

function buildPromptFromAthleteData(athleteData: any): string {
  // Construa o prompt conforme sua lógica de negócio
  // Exemplo simples:
  const { context_type, last_checkin, planned_training } = athleteData;
  if (context_type === 'coached') {
    let prompt = `Este atleta, que tem um treinador, dormiu ${last_checkin?.sleep_hours ?? 'N/A'} horas, tem dor muscular nível ${last_checkin?.soreness ?? 'N/A'}/5 e hoje seu plano é ${planned_training?.description ?? 'descanso'}`;
    if (planned_training?.distance_km) prompt += ` de ${planned_training.distance_km}km`;
    if (planned_training?.duration_minutes) prompt += ` (${planned_training.duration_minutes} minutos)`;
    prompt += `. Com base nisso, gere um insight de duas frases sobre sua prontidão para o treino.`;
    return prompt;
  } else {
    let prompt = `Este atleta, que treina por conta própria, dormiu ${last_checkin?.sleep_hours ?? 'N/A'} horas, está se sentindo ${last_checkin?.mood ?? 'N/A'} e com dor muscular nível ${last_checkin?.soreness ?? 'N/A'}/5. `;
    if (planned_training?.description) {
      prompt += `Hoje o plano é: ${planned_training.description}`;
      if (planned_training?.distance_km) prompt += ` de ${planned_training.distance_km}km`;
      if (planned_training?.duration_minutes) prompt += ` (${planned_training.duration_minutes} minutos)`;
      prompt += '. ';
    }
    prompt += 'Gere um insight de duas frases sugerindo como ele pode aproveitar bem seu treino hoje.';
    return prompt;
  }
}

export async function generateChatResponse(userQuestion: string): Promise<string> {
  // const result = await geminiModel.generateContent(fullPrompt);
  return Promise.resolve("Modo de desenvolvimento: O chat com IA está desativado para economizar custos.");
}