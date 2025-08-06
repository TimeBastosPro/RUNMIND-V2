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
    const { context_type, last_checkin, planned_training, recent_checkins, recent_trainings, user_profile } = athleteData;
    
    // Dados do último check-in com campos corretos
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
    
    // Dados do perfil do usuário (personalização)
    const profile = user_profile as Record<string, unknown> || {};
    const userName = profile.full_name || 'Atleta';
    const experienceLevel = profile.experience_level || 'beginner';
    const mainGoal = profile.main_goal || 'health';
    const contextType = profile.context_type || context_type || 'solo';
    const age = profile.date_of_birth ? calculateAge(String(profile.date_of_birth)) : null;
    const weight = profile.weight_kg as number;
    const height = profile.height_cm as number;
    const bmi = weight && height ? calculateBMI(weight, height) : null;
    
    // Dados de performance (se disponíveis)
    const best5k = profile.best_5k_time_seconds as number;
    const best10k = profile.best_10k_time_seconds as number;
    const best21k = profile.best_21k_time_seconds as number;
    const best42k = profile.best_42k_time_seconds as number;
    
    // Preferências e hábitos
    const trainingDays = profile.training_days as string[] || [];
    const preferredPeriod = profile.preferred_training_period as string || '';
    const terrainPreference = profile.terrain_preference as string || '';
    const workStressLevel = profile.work_stress_level as number || 3;
    const sleepConsistency = profile.sleep_consistency as string || '';
    const wakeupFeeling = profile.wakeup_feeling as string || '';
    const hydrationHabit = profile.hydration_habit as string || '';
    const recoveryHabit = profile.recovery_habit as string || '';
    const stressManagement = profile.stress_management as string[] || [];
    
    // Análise de tendências dos últimos check-ins
    let trendAnalysis = '';
    let recentMotivation = [];
    let recentSleep = [];
    let recentSoreness = [];
    
    if (recent_checkins && Array.isArray(recent_checkins) && recent_checkins.length > 0) {
      // Últimos 7 check-ins para análise de tendência
      const last7Checkins = recent_checkins.slice(0, 7);
      
      recentMotivation = last7Checkins.map((c: Record<string, unknown>) => Number(c.motivation) || 0).filter(v => v > 0);
      recentSleep = last7Checkins.map((c: Record<string, unknown>) => Number(c.sleep_quality) || 0).filter(v => v > 0);
      recentSoreness = last7Checkins.map((c: Record<string, unknown>) => Number(c.soreness) || 0).filter(v => v > 0);
      
      if (recentMotivation.length > 0) {
        const avgMotivation = recentMotivation.reduce((sum: number, val: number) => sum + val, 0) / recentMotivation.length;
        if (avgMotivation > 4) {
          trendAnalysis += 'Sua motivação tem estado alta ultimamente. ';
        } else if (avgMotivation < 3) {
          trendAnalysis += 'Sua motivação tem estado baixa ultimamente. ';
        }
      }
      
      if (recentSleep.length > 0) {
        const avgSleep = recentSleep.reduce((sum: number, val: number) => sum + val, 0) / recentSleep.length;
        if (avgSleep < 4) {
          trendAnalysis += 'Seu sono tem estado abaixo do ideal. ';
        } else if (avgSleep > 5) {
          trendAnalysis += 'Seu sono tem estado muito bom. ';
        }
      }
      
      if (recentSoreness.length > 0) {
        const avgSoreness = recentSoreness.reduce((sum: number, val: number) => sum + val, 0) / recentSoreness.length;
        if (avgSoreness > 5) {
          trendAnalysis += 'Você tem apresentado dores musculares elevadas. ';
        }
      }
    }
    
    // Análise de treinos recentes
    let trainingAnalysis = '';
    if (recent_trainings && Array.isArray(recent_trainings) && recent_trainings.length > 0) {
      const completedTrainings = recent_trainings.filter((t: Record<string, unknown>) => t.status === 'completed');
      if (completedTrainings.length > 0) {
        const avgEffort = completedTrainings.reduce((sum: number, t: Record<string, unknown>) => sum + (Number(t.perceived_effort) || 0), 0) / completedTrainings.length;
        const avgSatisfaction = completedTrainings.reduce((sum: number, t: Record<string, unknown>) => sum + (Number(t.session_satisfaction) || 0), 0) / completedTrainings.length;
        
        if (avgEffort > 7) {
          trainingAnalysis += 'Seus treinos têm sido intensos. ';
        }
        if (avgSatisfaction > 4) {
          trainingAnalysis += 'Você tem se sentido satisfeito com seus treinos. ';
        } else if (avgSatisfaction < 3) {
          trainingAnalysis += 'Você tem se sentido insatisfeito com seus treinos. ';
        }
      }
    }
    
    // Critérios personalizados baseados no perfil
    const personalizedCriteria = getPersonalizedCriteria(String(experienceLevel), age, String(mainGoal));
    
    // Construção do prompt personalizado
    const prompt = `Você é um treinador de corrida experiente e especialista em psicologia esportiva. 
Analise os dados deste atleta e gere um insight personalizado, motivacional e prático de 2-3 frases em português brasileiro, 
como se estivesse falando diretamente com ele.

CONTEXTO DO ATLETA:
- Idade: ${age ? age + ' anos' : 'Não informada'}
- Nível de experiência: ${getExperienceLevelText(String(experienceLevel))}
- Objetivo principal: ${getGoalText(String(mainGoal))}
- Contexto de treino: ${getContextText(String(contextType))}
${weight && height ? `- Peso: ${weight}kg, Altura: ${height}cm, IMC: ${bmi?.toFixed(1)}` : ''}
${best5k ? `- Melhor 5K: ${formatTime(best5k)}` : ''}
${best10k ? `- Melhor 10K: ${formatTime(best10k)}` : ''}
${best21k ? `- Melhor 21K: ${formatTime(best21k)}` : ''}
${best42k ? `- Melhor 42K: ${formatTime(best42k)}` : ''}

PREFERÊNCIAS E HÁBITOS:
${trainingDays.length > 0 ? `- Dias de treino: ${trainingDays.join(', ')}` : ''}
${preferredPeriod ? `- Período preferido: ${preferredPeriod}` : ''}
${terrainPreference ? `- Terreno preferido: ${terrainPreference}` : ''}
${sleepConsistency ? `- Consistência do sono: ${sleepConsistency}` : ''}
${wakeupFeeling ? `- Sensação ao acordar: ${wakeupFeeling}` : ''}
${hydrationHabit ? `- Hábito de hidratação: ${hydrationHabit}` : ''}
${recoveryHabit ? `- Técnicas de recuperação: ${recoveryHabit}` : ''}
${stressManagement.length > 0 ? `- Gestão de estresse: ${stressManagement.join(', ')}` : ''}

DADOS ATUAIS (Check-in de hoje):
- Qualidade do sono: ${sleepQuality}/7
- Dores musculares: ${soreness}/7  
- Motivação: ${motivation}/5
- Confiança: ${confidence}/5
- Foco: ${focus}/5
- Estado emocional: ${emocional}/5

TREINO PLANEJADO PARA HOJE:
- Tipo: ${trainingType}
- Distância: ${distance}km
- Duração: ${duration}min

ANÁLISE DE TENDÊNCIAS:
${trendAnalysis}

ANÁLISE DE TREINOS RECENTES:
${trainingAnalysis}

CRITÉRIOS PERSONALIZADOS (baseados no perfil):
- Motivação mínima esperada: ${personalizedCriteria.motivationThreshold}/5
- Qualidade do sono mínima: ${personalizedCriteria.sleepThreshold}/7
- Intensidade de treino recomendada: ${personalizedCriteria.effortThreshold}/10
- Importância da recuperação: ${personalizedCriteria.recoveryImportance}

INSTRUÇÕES PARA O INSIGHT:
1. Fale como um treinador experiente falaria diretamente com o atleta
2. NÃO mencione o nome do atleta no insight
3. NÃO mencione explicitamente o nível de experiência
4. Use linguagem motivacional e direta, como "Você está..." ou "Seu treino..."
5. Considere o estado atual e as tendências dos últimos dias
6. Considere o treino planejado para hoje
7. Forneça orientações práticas e acionáveis
8. Se houver sinais de fadiga, sugira ajustes adequados
9. Se a motivação estiver baixa, ofereça estímulo baseado no objetivo
10. Se o sono estiver ruim, sugira estratégias considerando os hábitos
11. Considere as preferências de treino e recuperação
12. Seja específico e personalizado para este atleta

EXEMPLOS DE TOM:
- "Sua motivação está alta hoje, aproveite essa energia para o treino!"
- "Seu sono tem estado abaixo do ideal, considere ajustar a intensidade."
- "Você tem apresentado dores musculares elevadas, priorize a recuperação."
- "Seus treinos recentes têm sido intensos, hoje seria ideal um treino mais leve."

Responda apenas com o texto do insight, sem introduções ou formatações especiais.`;

    return prompt;
  } catch (error) {
    console.error('Erro ao construir prompt:', error);
    return 'Você é um treinador de corrida experiente. Gere um insight motivacional e prático para um atleta que está treinando hoje, considerando seu estado atual e objetivos.';
  }
}

// Funções auxiliares para personalização
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

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

function getContextText(context: string): string {
  switch (context) {
    case 'solo': return 'Treino individual';
    case 'coached': return 'Orientado por treinador';
    case 'hybrid': return 'Híbrido';
    default: return 'Não informado';
  }
}

function getPersonalizedCriteria(experienceLevel: string, age: number | null, mainGoal: string) {
  // Critérios baseados no nível de experiência
  let criteria = {
    motivationThreshold: 3,
    sleepThreshold: 4,
    effortThreshold: 6,
    recoveryImportance: 'moderada'
  };
  
  // Ajustar por nível de experiência
  switch (experienceLevel) {
    case 'beginner':
      criteria.motivationThreshold = 3;
      criteria.sleepThreshold = 3;
      criteria.effortThreshold = 5;
      criteria.recoveryImportance = 'alta';
      break;
    case 'intermediate':
      criteria.motivationThreshold = 4;
      criteria.sleepThreshold = 4;
      criteria.effortThreshold = 7;
      criteria.recoveryImportance = 'moderada';
      break;
    case 'advanced':
      criteria.motivationThreshold = 4;
      criteria.sleepThreshold = 5;
      criteria.effortThreshold = 8;
      criteria.recoveryImportance = 'crítica';
      break;
  }
  
  // Ajustar por idade
  if (age && age > 40) {
    criteria.sleepThreshold = Math.max(criteria.sleepThreshold, 5);
    criteria.recoveryImportance = 'muito alta';
  }
  
  // Ajustar por objetivo
  if (mainGoal === 'performance') {
    criteria.motivationThreshold = Math.max(criteria.motivationThreshold, 4);
    criteria.effortThreshold = Math.max(criteria.effortThreshold, 7);
  } else if (mainGoal === 'health') {
    criteria.effortThreshold = Math.min(criteria.effortThreshold, 6);
    criteria.recoveryImportance = 'alta';
  }
  
  return criteria;
}

export async function generateChatResponse(message: string): Promise<string> {
  return Promise.resolve(`Modo de desenvolvimento: O chat com IA está desativado para economizar custos. Sua mensagem foi: "${message}"`);
}