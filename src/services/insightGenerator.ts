import { generateInsight } from './gemini';
import { supabase } from './supabase';
import { useViewStore } from '../stores/view';

// Tipos para diferentes contextos de insights
export type InsightContext = 
  | 'daily_checkin'      // Após check-in diário
  | 'training_feedback'  // Após feedback de treino realizado
  | 'weekly_summary'     // Ao fechar semana de treino
  | 'motivational'       // Insight motivacional geral
  | 'alert'             // Alertas e recomendações

// Interface para dados específicos de cada contexto
interface InsightData {
  context: InsightContext;
  user_id: string;
  last_checkin?: Record<string, unknown>;
  recent_checkins?: Record<string, unknown>[];
  recent_trainings?: Record<string, unknown>[];
  completed_training?: Record<string, unknown>;
  weekly_summary?: {
    total_trainings: number;
    completed_trainings: number;
    total_distance: number;
    avg_effort: number;
    avg_satisfaction: number;
    consistency_score: number;
  };
  user_profile?: Record<string, unknown>;
  planned_training?: Record<string, unknown>;
}

// Função principal para gerar insights contextuais
export async function generateContextualInsight(data: InsightData): Promise<string> {
  try {
    const { context, user_id } = data;
    
    // Verificar se há dados suficientes
    if (!hasMinimumData(data)) {
      throw new Error('Dados insuficientes para gerar insight relevante.');
    }

    // Gerar prompt específico para cada contexto
    const prompt = buildContextualPrompt(data);
    
    // Chamar a IA com o prompt específico
    const insightText = await generateInsight({
      ...data,
      custom_prompt: prompt
    });

    // Salvar o insight no banco
    await saveInsightToDatabase({
      user_id,
      context,
      insight_text: insightText,
      source_data: data
    });

    return insightText;
  } catch (error) {
    console.error('❌ Erro ao gerar insight contextual:', error);
    throw error;
  }
}

// Verificar se há dados mínimos para gerar insight
function hasMinimumData(data: InsightData): boolean {
  const { context, last_checkin, recent_checkins, recent_trainings } = data;
  
  switch (context) {
    case 'daily_checkin':
      return !!last_checkin && !!recent_checkins && recent_checkins.length >= 2;
    
    case 'training_feedback':
      return !!data.completed_training && !!recent_trainings && recent_trainings.length >= 1;
    
    case 'weekly_summary':
      return !!data.weekly_summary && !!recent_trainings && recent_trainings.length >= 2;
    
    case 'motivational':
      return !!recent_checkins && recent_checkins.length >= 1;
    
    case 'alert':
      return !!last_checkin || !!recent_trainings;
    
    default:
      return false;
  }
}

// Construir prompt específico para cada contexto
function buildContextualPrompt(data: InsightData): string {
  const { context, last_checkin, recent_checkins, recent_trainings, completed_training, weekly_summary, user_profile } = data;
  
  const profile = user_profile as Record<string, unknown> || {};
  const experienceLevel = profile.experience_level || 'beginner';
  const mainGoal = profile.main_goal || 'health';

  switch (context) {
    case 'daily_checkin':
      return buildDailyCheckinPrompt(data);
    
    case 'training_feedback':
      return buildTrainingFeedbackPrompt(data);
    
    case 'weekly_summary':
      return buildWeeklySummaryPrompt(data);
    
    case 'motivational':
      return buildMotivationalPrompt(data);
    
    case 'alert':
      return buildAlertPrompt(data);
    
    default:
      return buildDefaultPrompt(data);
  }
}

// Prompt para check-in diário - REFINADO com ciência moderna
function buildDailyCheckinPrompt(data: InsightData): string {
  const { last_checkin, recent_checkins, planned_training, user_profile } = data;
  
  const checkin = last_checkin as Record<string, unknown> || {};
  const training = planned_training as Record<string, unknown> || {};
  const profile = user_profile as Record<string, unknown> || {};
  
  const sleepQuality = Number(checkin.sleep_quality) || 0;
  const soreness = Number(checkin.soreness) || 0;
  const motivation = Number(checkin.motivation) || 0;
  const confidence = Number(checkin.confidence) || 0;
  const focus = Number(checkin.focus) || 0;
  
  const trainingType = training.training_type || training.description || 'treino';
  const distance = training.distance_km || training.planned_distance_km || 'N/A';
  const duration = training.duration_minutes || training.planned_duration_minutes || 'N/A';
  
  // Análise de tendências para detecção de burnout
  let trendAnalysis = '';
  if (recent_checkins && Array.isArray(recent_checkins) && recent_checkins.length >= 3) {
    const last3Checkins = recent_checkins.slice(0, 3);
    const avgMotivation = last3Checkins.reduce((sum: number, c: Record<string, unknown>) => 
      sum + (Number(c.motivation) || 0), 0) / last3Checkins.length;
    const avgSleep = last3Checkins.reduce((sum: number, c: Record<string, unknown>) => 
      sum + (Number(c.sleep_quality) || 0), 0) / last3Checkins.length;
    
    if (avgMotivation < 3) trendAnalysis += 'Sua motivação tem estado consistentemente baixa. ';
    if (avgSleep < 4) trendAnalysis += 'Seu sono tem estado abaixo do ideal. ';
  }
  
  return `Você é um treinador de corrida especializado em psicologia esportiva e prevenção de lesões. Analise o check-in diário do atleta e gere um insight baseado em ciência moderna de 2-3 frases em português brasileiro.

DADOS ATUAIS:
- Sono: ${sleepQuality}/7
- Dores: ${soreness}/7  
- Motivação: ${motivation}/5
- Confiança: ${confidence}/5
- Foco: ${focus}/5

TREINO PLANEJADO: ${trainingType} (${distance}km, ${duration}min)
TENDÊNCIAS: ${trendAnalysis}

PERFIL: ${getExperienceLevelText(String(profile.experience_level || 'beginner'))} - Objetivo: ${getGoalText(String(profile.main_goal || 'health'))}

INSTRUÇÕES BASEADAS EM CIÊNCIA MODERNA:

PSICOLOGIA ESPORTIVA:
1. Use princípios da Teoria da Autodeterminação - foque em autonomia, competência e conexão
2. Aplique Teoria da Autoeficácia - construa confiança através de pequenas conquistas
3. Promova Mindset de Crescimento - enfatize aprendizado e progresso, não apenas resultados
4. Use Psicologia Positiva - reconheça forças e conquistas, não apenas problemas

PREVENÇÃO DE LESÕES (Modelo Stress-Strain):
1. Se sono < 4 OU dores > 5: Sugira recuperação ativa ou descanso
2. Se sono 4-5 OU dores 4-5: Sugira treino mais leve ou modificado
3. Se sono > 5 E dores < 4: Confirme treino planejado
4. Considere carga acumulada dos últimos dias

PREVENÇÃO DE BURNOUT:
1. Se motivação < 3 por 3+ dias: Sugira pausa mental ou mudança de foco
2. Se confiança < 3: Ofereça perspectiva de progresso a longo prazo
3. Se foco < 3: Sugira técnicas de mindfulness ou treino mais simples
4. Evite pressão excessiva - foque no processo, não apenas resultados

LINGUAGEM MOTIVACIONAL:
1. Use "você pode" em vez de "você deve"
2. Reconheça esforço, não apenas resultados
3. Ofereça escolhas, não ordens
4. Mantenha tom empático e construtivo

Responda apenas com o texto do insight, sem introduções.`;
}

// Prompt para feedback de treino realizado - REFINADO com ciência moderna
function buildTrainingFeedbackPrompt(data: InsightData): string {
  const { completed_training, recent_trainings, user_profile } = data;
  
  const training = completed_training as Record<string, unknown> || {};
  const profile = user_profile as Record<string, unknown> || {};
  
  const trainingType = training.training_type || 'treino';
  const distance = Number(training.distance_km) || 0;
  const duration = Number(training.duration_minutes) || 0;
  const effort = Number(training.perceived_effort) || 0;
  const satisfaction = Number(training.session_satisfaction) || 0;
  const avgHeartRate = Number(training.avg_heart_rate) || 0;
  const elevation = Number(training.elevation_gain_meters) || 0;
  
  // Análise de carga de treino e tendências
  let loadAnalysis = '';
  if (recent_trainings && Array.isArray(recent_trainings) && recent_trainings.length >= 3) {
    const last3Trainings = recent_trainings.slice(0, 3);
    const avgEffort = last3Trainings.reduce((sum: number, t: Record<string, unknown>) => 
      sum + (Number(t.perceived_effort) || 0), 0) / last3Trainings.length;
    const avgSatisfaction = last3Trainings.reduce((sum: number, t: Record<string, unknown>) => 
      sum + (Number(t.session_satisfaction) || 0), 0) / last3Trainings.length;
    
    if (avgEffort > 7) loadAnalysis += 'Seus treinos têm sido intensos. ';
    if (avgSatisfaction < 6) loadAnalysis += 'Sua satisfação tem estado baixa. ';
  }
  
  return `Você é um treinador de corrida especializado em psicologia esportiva e fisiologia do exercício. Analise o feedback do treino realizado e gere um insight baseado em ciência moderna de 2-3 frases em português brasileiro.

TREINO REALIZADO:
- Tipo: ${trainingType}
- Distância: ${distance}km
- Duração: ${duration}min
- Esforço percebido: ${effort}/10
- Satisfação: ${satisfaction}/10
- FC média: ${avgHeartRate}bpm
- Altimetria: +${elevation}m

TENDÊNCIAS: ${loadAnalysis}

PERFIL: ${getExperienceLevelText(String(profile.experience_level || 'beginner'))}

INSTRUÇÕES BASEADAS EM CIÊNCIA MODERNA:

PSICOLOGIA ESPORTIVA (Teoria da Autodeterminação):
1. Reconheça AUTONOMIA - "você escolheu treinar"
2. Fortaleça COMPETÊNCIA - "você está melhorando"
3. Promova CONEXÃO - "você faz parte de uma comunidade"

TEORIA DA AUTOEFICÁCIA (Bandura):
1. Se satisfação > 7: Reforce crença na capacidade
2. Se satisfação < 5: Ofereça experiências de sucesso
3. Se esforço > 8: Reconheça coragem e determinação
4. Se esforço < 4: Sugira desafios progressivos

PREVENÇÃO DE LESÕES (Modelo de Carga de Treino):
1. Se esforço > 8: Sugira recuperação ativa ou descanso
2. Se esforço 6-8: Confirme intensidade adequada
3. Se esforço < 5: Sugira progressão gradual
4. Considere carga acumulada da semana

PREVENÇÃO DE BURNOUT (Modelo de Raedeke):
1. Se satisfação < 5 por 3+ treinos: Sugira mudança de foco
2. Se esforço alto + satisfação baixa: Alerte sobre overtraining
3. Se satisfação alta + esforço moderado: Confirme equilíbrio
4. Promova recuperação mental e física

MINDSET DE CRESCIMENTO (Dweck):
1. Enfatize aprendizado sobre performance
2. Reconheça esforço, não apenas resultados
3. Sugira desafios como oportunidades
4. Evite comparações absolutas

LINGUAGEM MOTIVACIONAL:
1. Use "você demonstrou" em vez de "você conseguiu"
2. Reconheça processo, não apenas resultado
3. Ofereça perspectiva de longo prazo
4. Mantenha tom empático e construtivo

Responda apenas com o texto do insight, sem introduções.`;
}

// Prompt para resumo semanal
function buildWeeklySummaryPrompt(data: InsightData): string {
  const { weekly_summary, recent_trainings, user_profile } = data;
  
  const summary = weekly_summary || {};
  const profile = user_profile as Record<string, unknown> || {};
  
  const totalTrainings = summary.total_trainings || 0;
  const completedTrainings = summary.completed_trainings || 0;
  const totalDistance = summary.total_distance || 0;
  const avgEffort = summary.avg_effort || 0;
  const avgSatisfaction = summary.avg_satisfaction || 0;
  const consistencyScore = summary.consistency_score || 0;
  
  const completionRate = totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0;
  
  return `Você é um treinador de corrida experiente. Analise o resumo semanal do atleta e gere um insight motivacional de 3-4 frases em português brasileiro.

RESUMO DA SEMANA:
- Treinos planejados: ${totalTrainings}
- Treinos realizados: ${completedTrainings}
- Taxa de conclusão: ${completionRate.toFixed(0)}%
- Distância total: ${totalDistance}km
- Esforço médio: ${avgEffort}/10
- Satisfação média: ${avgSatisfaction}/10
- Consistência: ${consistencyScore}/100

PERFIL: ${getExperienceLevelText(String(profile.experience_level || 'beginner'))}

INSTRUÇÕES ESPECÍFICAS PARA RESUMO SEMANAL:
1. Reconheça conquistas e progressos da semana
2. Se a consistência for alta (> 80%), parabenize e motive para continuar
3. Se a consistência for baixa (< 60%), ofereça perspectiva positiva e sugestões
4. Analise a relação entre esforço e satisfação
5. Forneça orientação para a próxima semana
6. Seja encorajador e construtivo

Responda apenas com o texto do insight, sem introduções.`;
}

// Prompt para insights motivacionais
function buildMotivationalPrompt(data: InsightData): string {
  const { recent_checkins, recent_trainings, user_profile } = data;
  
  const profile = user_profile as Record<string, unknown> || {};
  
  return `Você é um treinador de corrida experiente. Gere um insight motivacional inspirador de 2-3 frases em português brasileiro.

PERFIL: ${getExperienceLevelText(String(profile.experience_level || 'beginner'))} - Objetivo: ${getGoalText(String(profile.main_goal || 'health'))}

INSTRUÇÕES ESPECÍFICAS PARA INSIGHT MOTIVACIONAL:
1. Use linguagem inspiradora e positiva
2. Foque no progresso e no processo
3. Reconheça a dedicação do atleta
4. Ofereça perspectiva de longo prazo
5. Seja específico sobre benefícios do treinamento
6. Use analogias ou metáforas motivacionais

Responda apenas com o texto do insight, sem introduções.`;
}

// Prompt para alertas - REFINADO com ciência moderna
function buildAlertPrompt(data: InsightData): string {
  const { last_checkin, recent_trainings, recent_checkins, user_profile } = data;
  
  const checkin = last_checkin as Record<string, unknown> || {};
  const profile = user_profile as Record<string, unknown> || {};
  
  const sleepQuality = Number(checkin.sleep_quality) || 0;
  const soreness = Number(checkin.soreness) || 0;
  const motivation = Number(checkin.motivation) || 0;
  const confidence = Number(checkin.confidence) || 0;
  const focus = Number(checkin.focus) || 0;
  
  // Análise de tendências para detecção precoce
  let trendAnalysis = '';
  let riskLevel = 'baixo';
  
  if (recent_checkins && Array.isArray(recent_checkins) && recent_checkins.length >= 5) {
    const last5Checkins = recent_checkins.slice(0, 5);
    const avgMotivation = last5Checkins.reduce((sum: number, c: Record<string, unknown>) => 
      sum + (Number(c.motivation) || 0), 0) / last5Checkins.length;
    const avgSleep = last5Checkins.reduce((sum: number, c: Record<string, unknown>) => 
      sum + (Number(c.sleep_quality) || 0), 0) / last5Checkins.length;
    const avgSoreness = last5Checkins.reduce((sum: number, c: Record<string, unknown>) => 
      sum + (Number(c.soreness) || 0), 0) / last5Checkins.length;
    
    // Detecção de burnout (Raedeke & Smith)
    if (avgMotivation < 3 && avgSleep < 4) {
      riskLevel = 'alto';
      trendAnalysis += 'Sinais de burnout detectados. ';
    } else if (avgMotivation < 3 || avgSleep < 4) {
      riskLevel = 'médio';
      trendAnalysis += 'Sinais de fadiga mental detectados. ';
    }
    
    // Detecção de overtraining (Hooper & Mackinnon)
    if (avgSoreness > 5 && avgSleep < 4) {
      riskLevel = 'alto';
      trendAnalysis += 'Sinais de overtraining detectados. ';
    }
  }
  
  return `Você é um treinador de corrida especializado em psicologia esportiva e medicina esportiva. Analise os dados do atleta e gere um alerta baseado em ciência moderna de 2-3 frases em português brasileiro.

DADOS ATUAIS:
- Sono: ${sleepQuality}/7
- Dores: ${soreness}/7
- Motivação: ${motivation}/5
- Confiança: ${confidence}/5
- Foco: ${focus}/5

NÍVEL DE RISCO: ${riskLevel.toUpperCase()}
TENDÊNCIAS: ${trendAnalysis}

PERFIL: ${getExperienceLevelText(String(profile.experience_level || 'beginner'))}

INSTRUÇÕES BASEADAS EM CIÊNCIA MODERNA:

DETECÇÃO DE BURNOUT (Modelo de Raedeke & Smith):
1. EXAUSTÃO EMOCIONAL: Se motivação < 3 por 5+ dias
2. DESPERSONALIZAÇÃO: Se confiança < 3 por 5+ dias  
3. REDUÇÃO DA REALIZAÇÃO: Se foco < 3 por 5+ dias
4. SINTOMAS FÍSICOS: Se sono < 4 + dores > 5

DETECÇÃO DE OVERTRAINING (Modelo de Hooper & Mackinnon):
1. FADIGA PERSISTENTE: Sono < 4 por 3+ dias
2. DORES MUSCULARES: Soreness > 5 por 3+ dias
3. ALTERAÇÕES DE HUMOR: Motivação < 3 + confiança < 3
4. QUEDA DE PERFORMANCE: Tendência negativa em satisfação

PREVENÇÃO DE LESÕES (Modelo Stress-Strain):
1. RISCO ALTO: Sono < 3 OU dores > 6
2. RISCO MÉDIO: Sono 3-4 OU dores 5-6
3. RISCO BAIXO: Sono > 4 E dores < 5

INTERVENÇÕES BASEADAS EM EVIDÊNCIA:

PARA BURNOUT:
1. Sugira pausa mental de 2-3 dias
2. Ofereça mudança de foco (treino recreativo)
3. Promova atividades de recuperação mental
4. Evite pressão sobre performance

PARA OVERTRAINING:
1. Sugira recuperação ativa (alongamento, yoga)
2. Ofereça redução de intensidade por 1 semana
3. Promova sono de qualidade
4. Considere avaliação médica se persistir

PARA RISCO DE LESÃO:
1. Sugira treino modificado ou descanso
2. Ofereça técnicas de recuperação
3. Promova hidratação e nutrição adequada
4. Considere avaliação fisioterapêutica

LINGUAGEM DE ALERTA:
1. Seja empático, não alarmista
2. Ofereça soluções práticas
3. Mantenha tom de cuidado, não crítica
4. Enfatize recuperação, não fracasso

Responda apenas com o texto do insight, sem introduções.`;
}

// Prompt padrão
function buildDefaultPrompt(data: InsightData): string {
  return `Você é um treinador de corrida experiente. Gere um insight motivacional e prático de 2-3 frases em português brasileiro.

INSTRUÇÕES:
1. Fale como um treinador experiente
2. Use linguagem motivacional e direta
3. Forneça orientações práticas
4. Seja específico e acionável

Responda apenas com o texto do insight, sem introduções.`;
}

// Funções auxiliares
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
    case 'health': return 'Saúde e bem-estar';
    case 'performance': return 'Performance';
    case 'weight_loss': return 'Perda de peso';
    case 'endurance': return 'Resistência';
    case 'speed': return 'Velocidade';
    default: return 'Não informado';
  }
}

// ✅ NOVO: Calcular score de confiança dinâmico para insights contextuais
function calculateInsightConfidenceScore(data: InsightData): number {
  let score = 0.6; // Base score mais alto para insights contextuais
  
  // Verificar qualidade dos dados específicos do contexto
  switch (data.context) {
    case 'daily_checkin':
      if (data.last_checkin) score += 0.15;
      if (data.recent_checkins && data.recent_checkins.length >= 3) score += 0.1;
      if (data.planned_training) score += 0.1;
      if (data.user_profile) score += 0.05;
      break;
      
    case 'training_feedback':
      if (data.completed_training) score += 0.2;
      if (data.recent_trainings && data.recent_trainings.length >= 2) score += 0.1;
      if (data.user_profile) score += 0.05;
      break;
      
    case 'weekly_summary':
      if (data.weekly_summary) score += 0.2;
      if (data.recent_trainings && data.recent_trainings.length >= 3) score += 0.1;
      if (data.user_profile) score += 0.05;
      break;
      
    case 'alert':
      if (data.last_checkin) score += 0.1;
      if (data.recent_checkins && data.recent_checkins.length >= 5) score += 0.15;
      if (data.recent_trainings && data.recent_trainings.length >= 2) score += 0.1;
      break;
      
    default:
      if (data.recent_checkins && data.recent_checkins.length >= 1) score += 0.1;
      if (data.user_profile) score += 0.05;
  }
  
  // Limitar entre 0.6 e 0.95
  return Math.min(0.95, Math.max(0.6, score));
}

// Salvar insight no banco de dados
async function saveInsightToDatabase({
  user_id,
  context,
  insight_text,
  source_data
}: {
  user_id: string;
  context: InsightContext;
  insight_text: string;
  source_data: InsightData;
}): Promise<void> {
  try {
    // ✅ CORRIGIDO: Calcular score de confiança dinâmico baseado na qualidade dos dados
    const confidenceScore = calculateInsightConfidenceScore(source_data);
    
    const { error } = await supabase
      .from('insights')
      .insert([{
        user_id,
        insight_type: context === 'alert' ? 'alert' : 'ai_analysis',
        insight_text,
        confidence_score: confidenceScore,
        source_data,
        generated_by: 'ai',
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
    console.log('✅ Insight salvo no banco:', context);
  } catch (error) {
    console.error('❌ Erro ao salvar insight:', error);
    throw error;
  }
}

// Funções específicas para cada contexto
export async function generateDailyCheckinInsight(userId: string): Promise<string> {
  const data = await prepareDailyCheckinData(userId);
  return generateContextualInsight({
    context: 'daily_checkin',
    user_id: userId,
    ...data
  });
}

export async function generateTrainingFeedbackInsight(userId: string, completedTraining: Record<string, unknown>): Promise<string> {
  const data = await prepareTrainingFeedbackData(userId, completedTraining);
  return generateContextualInsight({
    context: 'training_feedback',
    user_id: userId,
    completed_training: completedTraining,
    ...data
  });
}

export async function generateWeeklySummaryInsight(userId: string): Promise<string> {
  const data = await prepareWeeklySummaryData(userId);
  return generateContextualInsight({
    context: 'weekly_summary',
    user_id: userId,
    ...data
  });
}

// Funções para preparar dados específicos
async function prepareDailyCheckinData(userId: string) {
  try {
    // Buscar último check-in
    const { data: lastCheckin, error: checkinError } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (checkinError && checkinError.code !== 'PGRST116') throw checkinError;
    
    // Buscar check-ins recentes (últimos 7 dias)
    const { data: recentCheckins, error: recentError } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(7);
    
    if (recentError) throw recentError;
    
    // Buscar próximo treino planejado
    const { data: plannedTraining, error: plannedError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'planned')
      .gte('training_date', new Date().toISOString().split('T')[0])
      .order('training_date', { ascending: true })
      .limit(1)
      .single();
    
    if (plannedError && plannedError.code !== 'PGRST116') throw plannedError;
    
    // Buscar perfil do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;
    
    return {
      last_checkin: lastCheckin || null,
      recent_checkins: recentCheckins || [],
      planned_training: plannedTraining || null,
      user_profile: userProfile || null
    };
  } catch (error) {
    console.error('❌ Erro ao preparar dados para check-in diário:', error);
    throw error;
  }
}

async function prepareTrainingFeedbackData(userId: string, completedTraining: Record<string, unknown>) {
  try {
    // Buscar treinos recentes (últimos 5 treinos)
    const { data: recentTrainings, error: trainingsError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (trainingsError) throw trainingsError;
    
    // Buscar perfil do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;
    
    return {
      recent_trainings: recentTrainings || [],
      user_profile: userProfile || null
    };
  } catch (error) {
    console.error('❌ Erro ao preparar dados para feedback de treino:', error);
    throw error;
  }
}

async function prepareWeeklySummaryData(userId: string) {
  try {
    // Calcular resumo da semana atual
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Domingo
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Sábado
    weekEnd.setHours(23, 59, 59, 999);
    
    // Buscar treinos da semana
    const { data: weeklyTrainings, error: trainingsError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString());
    
    if (trainingsError) throw trainingsError;
    
    // Calcular métricas da semana
    const completedTrainings = weeklyTrainings?.filter(t => t.status === 'completed') || [];
    const totalTrainings = weeklyTrainings?.length || 0;
    const totalDistance = completedTrainings.reduce((sum, t) => sum + (Number(t.distance_km) || 0), 0);
    const avgEffort = completedTrainings.length > 0 
      ? completedTrainings.reduce((sum, t) => sum + (Number(t.perceived_effort) || 0), 0) / completedTrainings.length 
      : 0;
    const avgSatisfaction = completedTrainings.length > 0 
      ? completedTrainings.reduce((sum, t) => sum + (Number(t.session_satisfaction) || 0), 0) / completedTrainings.length 
      : 0;
    const consistencyScore = totalTrainings > 0 ? (completedTrainings.length / totalTrainings) * 100 : 0;
    
    // Buscar perfil do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;
    
    return {
      weekly_summary: {
        total_trainings: totalTrainings,
        completed_trainings: completedTrainings.length,
        total_distance: totalDistance,
        avg_effort: avgEffort,
        avg_satisfaction: avgSatisfaction,
        consistency_score: consistencyScore
      },
      recent_trainings: completedTrainings,
      user_profile: userProfile || null
    };
  } catch (error) {
    console.error('❌ Erro ao preparar dados para resumo semanal:', error);
    throw error;
  }
}
