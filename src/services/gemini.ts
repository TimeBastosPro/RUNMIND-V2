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

export async function generateInsight(athleteData: Record<string, unknown>): Promise<string> {
  try {
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Insight gerado com sucesso.';
    }
    
    // Em desenvolvimento/local, use a API Gemini diretamente
    const prompt = buildPromptFromAthleteData(athleteData);
    console.log('Prompt enviado para Gemini:', prompt);
    
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    console.log('Resposta do Gemini:', response);
    
    return response || 'Insight gerado com sucesso.';
  } catch (error) {
    console.error('Erro ao gerar insight:', error);
    // Retorna um insight padrão em caso de erro
    return 'Com base nos seus dados, mantenha a consistência nos treinos e escute seu corpo. A recuperação adequada é fundamental para o progresso.';
  }
}

function buildPromptFromAthleteData(athleteData: Record<string, unknown>): string {
  try {
    const { last_checkin, planned_training, recent_checkins } = athleteData;
    
    // Dados do último check-in
    const checkin = last_checkin as Record<string, unknown> || {};
    const sleepQuality = checkin.sleep_quality || checkin.sleep_hours || 'N/A';
    const soreness = checkin.soreness || checkin.soreness_score || 'N/A';
    const motivation = checkin.motivation || checkin.motivation_score || 'N/A';
    const confidence = checkin.confidence || checkin.confidence_score || 'N/A';
    const focus = checkin.focus || checkin.focus_score || 'N/A';
    const emocional = checkin.emocional || 'N/A';
    
    // Dados do treino planejado
    const training = planned_training as Record<string, unknown> || {};
    const trainingType = training.training_type || training.description || 'treino';
    const distance = training.distance_km || training.planned_distance_km || 'N/A';
    const duration = training.duration_minutes || training.planned_duration_minutes || 'N/A';
    
    // Análise de tendências
    let trendAnalysis = '';
    if (recent_checkins && Array.isArray(recent_checkins) && recent_checkins.length > 0) {
      const avgMotivation = recent_checkins.reduce((sum: number, c: Record<string, unknown>) => sum + (Number(c.motivation) || 0), 0) / recent_checkins.length;
      if (avgMotivation > 4) {
        trendAnalysis = 'Sua motivação tem estado alta ultimamente. ';
      } else if (avgMotivation < 3) {
        trendAnalysis = 'Sua motivação tem estado baixa ultimamente. ';
      }
    }
    
    // Construção do prompt
    const prompt = `Como especialista em treinamento esportivo, analise os dados deste atleta e gere um insight personalizado de 2-3 frases em português brasileiro.

DADOS DO ATLETA:
- Qualidade do sono: ${sleepQuality}/7
- Dores musculares: ${soreness}/7  
- Motivação: ${motivation}/5
- Confiança: ${confidence}/5
- Foco: ${focus}/5
- Estado emocional: ${emocional}/5

TREINO PLANEJADO:
- Tipo: ${trainingType}
- Distância: ${distance}km
- Duração: ${duration}min

${trendAnalysis}

Gere um insight motivacional e prático que ajude o atleta a aproveitar melhor seu treino hoje, considerando seu estado atual e o treino planejado.`;

    return prompt;
  } catch (error) {
    console.error('Erro ao construir prompt:', error);
    return 'Gere um insight motivacional para um atleta que está treinando hoje.';
  }
}

export async function generateChatResponse(message: string): Promise<string> {
  return Promise.resolve(`Modo de desenvolvimento: O chat com IA está desativado para economizar custos. Sua mensagem foi: "${message}"`);
}