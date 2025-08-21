import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.1, // Reduzido ainda mais para respostas mais consistentes
    maxOutputTokens: 200, // Aumentado para respostas mais completas
    topP: 0.8, // Adicionado para mais consistência
    topK: 40, // Adicionado para mais consistência
  }
});

export async function generateInsight(athleteData: Record<string, unknown>): Promise<string> {
  try {
    // Verificar se há um prompt customizado
    const customPrompt = athleteData.custom_prompt as string;
    const prompt = customPrompt || buildPromptFromAthleteData(athleteData);
    
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
          body: JSON.stringify({ 
            athleteData,
            customPrompt: customPrompt 
          })
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
    const { last_checkin, planned_training, recent_checkins, recent_trainings, user_profile } = athleteData;
    
    // Dados do último check-in com campos corretos
    const checkin = last_checkin as Record<string, unknown> || {};
    const sleepQuality = checkin.sleep_quality || checkin.sleep_hours || 'N/A';
    const soreness = checkin.soreness || checkin.soreness_score || 'N/A';
    const motivation = checkin.motivation || checkin.motivation_score || 'N/A';
    const confidence = checkin.confidence || checkin.confidence_score || 'N/A';
    const focus = checkin.focus || checkin.focus_score || 'N/A';
    
    // Dados do treino planejado
    const training = planned_training as Record<string, unknown> || {};
    const trainingType = training.training_type || training.description || 'treino';
    const distance = training.distance_km || training.planned_distance_km || 'N/A';
    const duration = training.duration_minutes || training.planned_duration_minutes || 'N/A';
    
    // Dados do perfil do usuário (personalização)
    const profile = user_profile as Record<string, unknown> || {};
    const experienceLevel = profile.experience_level || 'beginner';
    const mainGoal = profile.main_goal || 'health';
    
    // Análise de tendências dos últimos check-ins
    let trendAnalysis = '';
    if (recent_checkins && Array.isArray(recent_checkins) && recent_checkins.length > 0) {
      const last3Checkins = recent_checkins.slice(0, 3);
      const avgMotivation = last3Checkins.reduce((sum: number, c: Record<string, unknown>) => 
        sum + (Number(c.motivation) || 0), 0) / last3Checkins.length;
      const avgSleep = last3Checkins.reduce((sum: number, c: Record<string, unknown>) => 
        sum + (Number(c.sleep_quality) || 0), 0) / last3Checkins.length;
      
      if (avgMotivation > 4) trendAnalysis += 'Sua motivação tem estado alta. ';
      else if (avgMotivation < 3) trendAnalysis += 'Sua motivação tem estado baixa. ';
      
      if (avgSleep < 4) trendAnalysis += 'Seu sono tem estado abaixo do ideal. ';
      else if (avgSleep > 5) trendAnalysis += 'Seu sono tem estado muito bom. ';
    }
    
    // Análise de treinos recentes
    let trainingAnalysis = '';
    if (recent_trainings && Array.isArray(recent_trainings) && recent_trainings.length > 0) {
      const completedTrainings = recent_trainings.filter((t: Record<string, unknown>) => t.status === 'completed');
      if (completedTrainings.length > 0) {
        const avgEffort = completedTrainings.reduce((sum: number, t: Record<string, unknown>) => 
          sum + (Number(t.perceived_effort) || 0), 0) / completedTrainings.length;
        
        if (avgEffort > 7) trainingAnalysis += 'Seus treinos têm sido intensos. ';
        else if (avgEffort < 5) trainingAnalysis += 'Seus treinos têm sido leves. ';
      }
    }
    
    // Construção do prompt simplificado e focado
    const prompt = `Você é um treinador de corrida experiente. Analise os dados do atleta e gere um insight motivacional e prático de 2-3 frases em português brasileiro.

DADOS ATUAIS:
- Sono: ${sleepQuality}/7
- Dores: ${soreness}/7  
- Motivação: ${motivation}/5
- Confiança: ${confidence}/5
- Foco: ${focus}/5

TREINO PLANEJADO: ${trainingType} (${distance}km, ${duration}min)

TENDÊNCIAS: ${trendAnalysis}

TREINOS RECENTES: ${trainingAnalysis}

PERFIL: ${getExperienceLevelText(String(experienceLevel))} - Objetivo: ${getGoalText(String(mainGoal))}

INSTRUÇÕES:
1. Fale como um treinador experiente
2. Use linguagem motivacional e direta
3. Considere o estado atual e tendências
4. Forneça orientações práticas
5. Se houver sinais de fadiga, sugira ajustes
6. Se a motivação estiver baixa, ofereça estímulo
7. Seja específico e acionável

Responda apenas com o texto do insight, sem introduções.`;

    return prompt;
  } catch (error) {
    console.error('Erro ao construir prompt:', error);
    return 'Você é um treinador de corrida experiente. Gere um insight motivacional e prático para um atleta que está treinando hoje, considerando seu estado atual e objetivos.';
  }
}

// Funções auxiliares simplificadas
function getExperienceLevelText(level: string): string {
  switch (level) {
    case 'beginner': return 'Iniciante';
    case 'intermediate': return 'Intermediário';
    case 'advanced': return 'Avançado';
    default: return 'Não informado';
  }
}

function getGoalText(goal: string): string {
  switch (goal) {
    case 'health': return 'Saúde';
    case 'performance': return 'Performance';
    case 'weight_loss': return 'Perda de peso';
    case 'fun': return 'Diversão';
    default: return 'Não informado';
  }
}

export async function generateChatResponse(message: string): Promise<string> {
  return Promise.resolve(`Modo de desenvolvimento: O chat com IA está desativado para economizar custos. Sua mensagem foi: "${message}"`);
}