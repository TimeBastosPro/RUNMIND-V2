// src/stores/checkin.ts

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { DailyCheckin, TrainingSession, Insight } from '../types/database';
import { useAuthStore } from './auth';
import { calculateWorkloadMetrics } from '../utils/sportsCalculations'; // IMPORTANTE
import { useViewStore } from './view';

// Compat: propriedades que podem existir em esquemas diferentes
type ExtTrainingSession = TrainingSession & {
  duration_minutes?: number;
  duration_hours?: string;
  duracao_horas?: string;
  duracao_minutos?: string;
  planned_distance_km?: number;
  planned_duration_hours?: string;
  planned_duration_minutes?: string;
  planned_perceived_effort?: number;
  perceived_effort?: number;
  session_satisfaction?: number;
  distance_km?: number | null;
  elevation_gain_meters?: number | null;
  modalidade?: string;
  training_date?: string;
};

interface WeeklyReflection {
  enjoyment: number;
  progress: string;
  confidence: string;
  week_start: string;
  created_at?: string;
}

function getDurationMinutesFrom(ts: ExtTrainingSession): number {
  if (typeof ts.duration_minutes === 'number') return ts.duration_minutes;
  // Suporte a campos em string
  const hours = ts.duration_hours && ts.duration_hours !== '' ? (isNaN(parseInt(ts.duration_hours)) ? 0 : parseInt(ts.duration_hours)) : 0;
  const minutes = ts.duracao_minutos && ts.duracao_minutos !== '' ? (isNaN(parseInt(ts.duracao_minutos)) ? 0 : parseInt(ts.duracao_minutos)) :
                   ts.planned_duration_minutes && ts.planned_duration_minutes !== '' ? (isNaN(parseInt(ts.planned_duration_minutes)) ? 0 : parseInt(ts.planned_duration_minutes)) :
                   (ts as any).duration_minutes || 0;
  return hours * 60 + minutes;
}

interface RecentCheckin {
  sleep_quality?: number;
  soreness?: number;
  motivation?: number;
  confidence?: number;
  focus?: number;
  emocional?: number;
  notes?: string;
  date: string;
}

interface CheckinState {
  todayCheckin: DailyCheckin | null;
  recentCheckins: RecentCheckin[];
  hasCheckedInToday: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  insights: string[];
  savedInsights: Insight[];
  trainingSessions: TrainingSession[];
  todayReadinessScore: number | null;
  weeklyReflections: WeeklyReflection[];
  // Actions
  loadTodayCheckin: () => Promise<void>;
  loadRecentCheckins: (days?: number) => Promise<void>;
  submitCheckin: (checkinData: Omit<DailyCheckin, 'id' | 'user_id' | 'created_at'>) => Promise<DailyCheckin>;
  calculateAnalytics: () => {
    trainingLoad: { id: number | undefined; date: string; duration: number; perceivedEffort: number; load: number; distance: number; elevation: number }[];
    acuteLoad: { date: string; value: number }[];
    chronicLoad: { date: string; value: number }[];
    runningEfficiency: { pace: number; pse: number; date: string; distance: number; duration: number }[];
    plannedVsCompleted: { date: string; plannedDistance: number; actualDistance: number; plannedDuration: number; actualDuration: number; plannedEffort: number; actualEffort: number; completionRate: number }[];
    metricsByModality: Record<string, { count: number; totalDistance: number; totalDuration: number; avgEffort: number; avgSatisfaction: number }>;
    summary: { totalPlanned: number; totalCompleted: number; completionRate: number };
  } | null;
  submitParqAnswers: (answers: {
    q1: boolean;
    q2: boolean;
    q3: boolean;
    q4: boolean;
    q5: boolean;
    q6: boolean;
    q7: boolean;
    details?: string;
  }) => Promise<void>;
  fetchTrainingSessions: (startDate?: string, endDate?: string) => Promise<void>;
  saveTrainingSession: (trainingData: Partial<TrainingSession>) => Promise<TrainingSession>;
  deleteTrainingSession: (sessionId: number | string) => Promise<boolean>;
  markTrainingAsCompleted: (id: number, completedData: {
    perceived_effort?: number;
    session_satisfaction?: number;
    notes?: string;
    avg_heart_rate?: number;
    elevation_gain_meters?: number;
    distance_km?: number;
    duration_minutes?: number;
  }) => Promise<TrainingSession>;
  calculateReadinessScore: (checkin: DailyCheckin) => number;
  submitWeeklyReflection: (reflection: {
    enjoyment: number;
    progress: string;
    confidence: string;
    week_start: string;
  }) => Promise<WeeklyReflection>;
  saveDailyCheckin: (checkinData: {
    sleep_quality: number;
    soreness: number;
    motivation: number;
    focus: number;
    confidence: number;
  }) => Promise<DailyCheckin>;
  updateCheckinWithInsight: (checkinId: string, insightText: string) => Promise<void>;
  loadWeeklyReflections: () => Promise<void>;
  calculateWeeklyAverages: (data: Array<{ date: string; value: number }>) => Array<{ label: string; value: number; weekStart: string }>;
  // Novas funções para insights
  loadSavedInsights: () => Promise<void>;
  saveInsight: (insightData: Omit<Insight, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  deleteInsight: (insightId: string) => Promise<void>;
  // NOVAS FUNÇÕES DE GATILHO AUTOMÁTICO
  triggerDailyInsight: (newCheckin: DailyCheckin) => Promise<void>;
  triggerAssimilationInsight: (completedTraining: TrainingSession) => Promise<void>;
  triggerWeeklyInsight: (reflection: WeeklyReflection) => Promise<void>;
}

export const useCheckinStore = create<CheckinState>((set, get) => ({
  todayCheckin: null,
  recentCheckins: [],
  hasCheckedInToday: false,
  isLoading: false,
  isSubmitting: false,
  error: null,
  insights: [],
  savedInsights: [],
  trainingSessions: [],
  todayReadinessScore: null,
  weeklyReflections: [],

  loadTodayCheckin: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let safeUserId: string | null = (user && (user as any).id) ? (user as any).id : null;
      
      // ✅ NOVO: Verificar se está no modo coach
      const { isCoachView, viewAsAthleteId } = useViewStore.getState();
      if (isCoachView && viewAsAthleteId) {
        console.log('🔍 Modo Coach - Buscando check-in do atleta:', viewAsAthleteId);
        safeUserId = viewAsAthleteId;
      } else {
        console.log('🔍 Modo Atleta - Buscando próprio check-in:', safeUserId);
      }
      
      if (!safeUserId) { set({ isLoading: false }); return; }

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', safeUserId)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      let readiness = null;
      if (data) {
        readiness = get().calculateReadinessScore(data);
      }
      
      set({ 
        todayCheckin: data,
        hasCheckedInToday: !!data,
        isLoading: false,
        todayReadinessScore: readiness,
        error: null
      });
    } catch (error: unknown) {
      console.error('❌ Error loading today checkin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar check-in de hoje.';
      set({ isLoading: false, error: errorMessage });
    }
  },

  loadRecentCheckins: async (days = 30) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let targetUserId: string | null = (user && (user as any).id) ? (user as any).id : null;
      
      // ✅ NOVO: Verificar se está no modo coach
      const { isCoachView, viewAsAthleteId } = useViewStore.getState();
      if (isCoachView && viewAsAthleteId) {
        console.log('🔍 Modo Coach - Buscando check-ins do atleta:', viewAsAthleteId);
        targetUserId = viewAsAthleteId;
      } else {
        console.log('🔍 Modo Atleta - Buscando próprios check-ins:', targetUserId);
      }
      
      if (!targetUserId) { return; }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('sleep_quality, soreness, motivation, confidence, focus, emocional, notes, date')
        .eq('user_id', targetUserId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(100);
      if (error) throw error;
      
      set({ recentCheckins: (data as RecentCheckin[]) || [], isLoading: false, error: null });
    } catch (error: unknown) {
      console.error('Error loading recent checkins:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar check-ins recentes.';
      set({ isLoading: false, error: errorMessage });
    }
  },

  // FUNÇÕES DE GATILHO AUTOMÁTICO (REATIVADAS)
  triggerDailyInsight: async (newCheckin) => {
    console.log('🔍 ===== TRIGGER DAILY INSIGHT INICIADO =====');
    console.log('🔍 triggerDailyInsight iniciado para check-in:', newCheckin.id);
    
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        console.error('❌ Usuário não encontrado no trigger');
        return;
      }
      
      console.log('🔍 Usuário encontrado:', user.id);

      // ✅ CORRIGIDO: Coletar dados completos para a Edge Function
      const [profileResult, sessionsResult, plannedWorkoutResult] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('training_sessions').select('*').eq('user_id', user.id).eq('status', 'completed').gte('training_date', new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('training_sessions').select('*').eq('user_id', user.id).eq('training_date', new Date().toISOString().split('T')[0]).eq('status', 'planned').maybeSingle()
      ]);

      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
      const sessions = sessionsResult.status === 'fulfilled' ? sessionsResult.value.data : [];
      const plannedWorkout = plannedWorkoutResult.status === 'fulfilled' ? plannedWorkoutResult.value.data : null;

      console.log('✅ Dados coletados:', {
        hasProfile: !!profile,
        sessionsCount: sessions?.length || 0,
        hasPlannedWorkout: !!plannedWorkout
      });

      // ✅ CORRIGIDO: Calcular métricas de carga
      let workloadMetrics = null;
      try {
        workloadMetrics = sessions && sessions.length > 0 ? calculateWorkloadMetrics(sessions) : null;
        console.log('✅ Métricas calculadas:', workloadMetrics);
      } catch (metricsError) {
        console.error('⚠️ Erro ao calcular métricas:', metricsError);
      }

      const athleteData = {
        todayCheckin: newCheckin,
        profile,
        sessions: sessions || [],
        plannedWorkout,
        workloadMetrics
      };

      console.log('🔍 Gerando insight localmente...');

      // ✅ CORRIGIDO: Gerar insight localmente (sem Edge Function)
      try {
        const sleepQuality = newCheckin.sleep_quality || newCheckin.sleep_quality_score || 4;
        const soreness = newCheckin.soreness || newCheckin.soreness_score || 4;
        const motivation = newCheckin.motivation || (newCheckin as any).emocional || 3;
        
        const fitnessCtl = workloadMetrics?.fitness_ctl || 0;
        const fatigueAtl = workloadMetrics?.fatigue_atl || 0;
        const formTsb = workloadMetrics?.form_tsb || 0;
        
        const plannedWorkoutText = plannedWorkout?.title || plannedWorkout?.description || 'Dia de descanso.';

        // ✅ NOVO: Gerar insight baseado nos dados
        let insightText = '';
        if (sleepQuality >= 6 && motivation >= 4) {
          insightText = `🎯 Excelente estado hoje! Seu sono de ${sleepQuality}/7 e motivação de ${motivation}/5 indicam que você está pronto para um treino produtivo. Sua Forma (TSB) está em ${formTsb.toFixed(0)}, mostrando que você está bem equilibrado. Aproveite essa energia positiva e mantenha o foco nos seus objetivos!`;
        } else if (soreness >= 5) {
          insightText = `⚠️ Atenção às dores! Com nível de ${soreness}/7, sugiro um treino mais leve hoje, focando na recuperação. Sua Forma (TSB) está em ${formTsb.toFixed(0)}, indicando que seu corpo precisa de descanso. Priorize alongamentos e atividades de baixo impacto para permitir que seu corpo se recupere adequadamente.`;
        } else if (motivation <= 3) {
          insightText = `💪 Motivação baixa detectada (${motivation}/5), mas isso é normal! Sua Forma (TSB) está em ${formTsb.toFixed(0)}, indicando que seu corpo está absorvendo treinos pesados. Sugiro começar com uma atividade que você gosta, mesmo que seja apenas uma caminhada leve. O importante é manter a consistência, não a intensidade.`;
        } else {
          insightText = `📊 Estado equilibrado hoje! Sono: ${sleepQuality}/7, Dores: ${soreness}/7, Motivação: ${motivation}/5. Sua Forma (TSB) está em ${formTsb.toFixed(0)}, mostrando um bom equilíbrio entre treino e recuperação. Continue monitorando esses indicadores para otimizar seus treinos.`;
        }

        console.log('🔍 Insight gerado:', insightText.substring(0, 100) + '...');

        const { error: insertError } = await supabase.from('insights').insert({
          user_id: user.id,
          insight_text: insightText,
          insight_type: 'ai_analysis',
          context_type: 'daily_checkin',
          confidence_score: 0.95,
          generated_by: 'ai'
        });
        
        if (insertError) {
          console.error('❌ Erro ao inserir insight:', insertError);
          throw insertError;
        } else {
          console.log('✅ Insight gerado com sucesso localmente');
        }
      } catch (insightError) {
        console.error('❌ Erro ao gerar insight:', insightError);
        
        // ✅ FALLBACK: Insight básico
        try {
          const sleepQuality = newCheckin.sleep_quality || newCheckin.sleep_quality_score || 4;
          const soreness = newCheckin.soreness || newCheckin.soreness_score || 4;
          const motivation = newCheckin.motivation || (newCheckin as any).emocional || 3;
          
          const fallbackInsight = `Seu check-in de hoje foi registrado com sucesso! Sono: ${sleepQuality}/7, Dores: ${soreness}/7, Motivação: ${motivation}/5. Continue monitorando seu bem-estar diariamente para receber insights personalizados sobre sua performance.`;
          
          const { error: insertError } = await supabase.from('insights').insert({
            user_id: user.id,
            insight_text: fallbackInsight,
            insight_type: 'ai_analysis',
            context_type: 'daily_checkin',
            confidence_score: 0.8,
            generated_by: 'system'
          });
          
          if (insertError) {
            console.error('❌ Erro ao inserir insight de fallback:', insertError);
          } else {
            console.log('✅ Insight de fallback criado com sucesso');
          }
        } catch (fallbackError) {
          console.error('❌ Erro ao criar insight de fallback:', fallbackError);
        }
      }

      // ✅ MELHORADO: Recarregar insights de forma mais eficiente
      try {
        await get().loadSavedInsights();
        console.log('✅ Insights recarregados');
      } catch (reloadError) {
        console.error('⚠️ Erro ao recarregar insights:', reloadError);
      }
      
      console.log('🔍 ===== TRIGGER DAILY INSIGHT FINALIZADO =====');
    } catch (error) {
      console.error("❌ Erro no trigger diário:", error);
      console.log('🔍 ===== TRIGGER DAILY INSIGHT COM ERRO =====');
    }
  },

  triggerAssimilationInsight: async (completedTraining) => {
    console.log('🔍 triggerAssimilationInsight iniciado para treino:', completedTraining.id);
    console.log('🔍 Dados do treino completado:', completedTraining);
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        console.error('❌ Usuário não encontrado no trigger de assimilação');
        return;
      }
      console.log('✅ Usuário encontrado:', user.id);

      // ✅ MELHORADO: Coletar dados de forma mais eficiente
      const [profileResult, sessionsResult] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('training_sessions').select('*').eq('user_id', user.id).eq('status', 'completed').gte('training_date', new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
      const sessions = sessionsResult.status === 'fulfilled' ? sessionsResult.value.data : [];

      const athleteData = {
        completedTraining,
        profile,
        sessions: sessions || []
      };

      console.log('🔍 Chamando Edge Function de assimilação...');
      console.log('🔍 Dados enviados para Edge Function:', {
        completedTraining: athleteData.completedTraining?.id,
        profile: !!athleteData.profile,
        sessionsCount: athleteData.sessions?.length
      });

      try {
        const { data: functionResult, error } = await supabase.functions.invoke('generate-training-assimilation-insight-v2', {
          body: { athleteData }
        });

        console.log('🔍 Resposta da Edge Function:', { functionResult, error });

        if (error) {
          console.error("❌ Erro na função de insight de assimilação:", error);
          throw error;
        } else {
          console.log("✅ Insight de assimilação gerado com sucesso");
          console.log("✅ Resultado:", functionResult);
        }
      } catch (functionError) {
        console.error('❌ Erro na função, criando fallback...');
        
        // ✅ MELHORADO: Fallback para assimilação
        try {
          const fallbackInsight = `Seu treino foi registrado com sucesso! Continue monitorando sua recuperação para receber insights sobre assimilação de treinos.`;
          
          const { error: insertError } = await supabase.from('insights').insert({
            user_id: user.id,
            insight_text: fallbackInsight,
            insight_type: 'ai_analysis',
            context_type: 'training_assimilation',
            confidence_score: 0.8,
            generated_by: 'system'
          });
          
          if (insertError) {
            console.error('❌ Erro ao inserir insight de fallback:', insertError);
          } else {
            console.log('✅ Insight de fallback criado com sucesso');
          }
        } catch (fallbackError) {
          console.error('❌ Erro ao criar insight de fallback:', fallbackError);
        }
      }
    } catch (error) {
      console.error("❌ Erro no trigger de assimilação:", error);
    }
  },

  triggerWeeklyInsight: async (reflection) => {
    console.log('🔍 triggerWeeklyInsight iniciado para reflexão da semana:', reflection.week_start);
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        console.error('❌ Usuário não encontrado no trigger semanal');
        return;
      }

      // ✅ MELHORADO: Coletar dados de forma mais eficiente
      const weekEnd = new Date(new Date(reflection.week_start).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const [profileResult, sessionsResult, checkinsResult] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('training_sessions').select('*').eq('user_id', user.id).eq('status', 'completed').gte('training_date', new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).gte('date', reflection.week_start).lte('date', weekEnd)
      ]);

      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
      const sessions = sessionsResult.status === 'fulfilled' ? sessionsResult.value.data : [];
      const checkins = checkinsResult.status === 'fulfilled' ? checkinsResult.value.data : [];

      const athleteData = {
        weeklyReflection: reflection,
        profile,
        sessions: sessions || [],
        checkins: checkins || []
      };

      console.log('🔍 Chamando Edge Function semanal...');

      try {
        const { data: functionResult, error } = await supabase.functions.invoke('generate-weekly-summary-insight-v2', {
          body: { athleteData }
        });

        if (error) {
          console.error("❌ Erro na função de insight semanal:", error);
          throw error;
        } else {
          console.log("✅ Insight semanal gerado com sucesso");
          console.log("✅ Resultado:", functionResult);
        }
      } catch (functionError) {
        console.error('❌ Erro na função, criando fallback...');
        
        // ✅ MELHORADO: Fallback para resumo semanal
        try {
          const fallbackInsight = `Sua reflexão semanal foi registrada com sucesso! Continue monitorando seu progresso para receber insights semanais personalizados.`;
          
          const { error: insertError } = await supabase.from('insights').insert({
            user_id: user.id,
            insight_text: fallbackInsight,
            insight_type: 'ai_analysis',
            context_type: 'weekly_summary',
            confidence_score: 0.8,
            generated_by: 'system'
          });
          
          if (insertError) {
            console.error('❌ Erro ao inserir insight de fallback:', insertError);
          } else {
            console.log('✅ Insight de fallback criado com sucesso');
          }
        } catch (fallbackError) {
          console.error('❌ Erro ao criar insight de fallback:', fallbackError);
        }
      }
    } catch (error) {
      console.error("❌ Erro no trigger semanal:", error);
    }
  },

  // FUNÇÕES PRINCIPAIS MODIFICADAS
  submitCheckin: async (checkinData) => {
    set({ isSubmitting: true, error: null });
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from('daily_checkins')
        .insert({ ...checkinData, user_id: user.id })
        .select()
        .single();
        
      if (error) throw error;
      
      // DISPARA O GATILHO AUTOMÁTICO
      try {
        await get().triggerDailyInsight(data);
      } catch (error) {
        console.error("❌ Erro ao disparar insight diário:", error);
      }
      
      await get().loadRecentCheckins(); // Recarrega os dados
      return data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  markTrainingAsCompleted: async (id, completedData) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .update({ ...completedData, status: 'completed' })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;

      // DISPARA O GATILHO AUTOMÁTICO
      try {
        await get().triggerAssimilationInsight(data);
      } catch (error) {
        console.error("❌ Erro ao disparar insight de assimilação:", error);
      }
      
      await get().fetchTrainingSessions(); // Recarrega os dados
      return data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  submitWeeklyReflection: async (reflection) => {
    set({ isSubmitting: true, error: null });
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from('weekly_reflections')
        .insert({ ...reflection, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      // DISPARA O GATILHO AUTOMÁTICO
      try {
        await get().triggerWeeklyInsight(data);
      } catch (error) {
        console.error("❌ Erro ao disparar insight semanal:", error);
      }
      
      return data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  submitParqAnswers: async (answers) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const upsertData = {
        user_id: user.id,
        ...answers,
      };
      const { error } = await supabase
        .from('parq_answers')
        .upsert(upsertData, { onConflict: 'user_id' });
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar respostas do PAR-Q+:', error);
      throw error;
    }
  },

  saveTrainingSession: async (trainingData) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId: string | null = (user && (user as any).id) ? (user as any).id : null;
      if (!targetUserId) throw new Error('Usuário não autenticado');
      
      const allowedKeys = new Set([
        'user_id', 'training_date', 'title', 'training_type', 'status',
        'modalidade', 'treino_tipo', 'terreno', 'percurso', 'esforco', 'intensidade',
        'distance_km', 'duracao_horas', 'duracao_minutos', 'observacoes',
        'elevation_gain_meters', 'elevation_loss_meters', 'avg_heart_rate',
        'max_heart_rate', 'perceived_effort', 'session_satisfaction',
        'sensacoes', 'clima', 'notes', 'effort_level', 'duracao_tipo',
      ]);

      const rawPayload: any = {
        user_id: targetUserId,
        ...trainingData,
      };

      if (rawPayload.sensacoes && typeof rawPayload.sensacoes === 'string') {
        rawPayload.sensacoes = [rawPayload.sensacoes];
      }
      if (rawPayload.clima && typeof rawPayload.clima === 'string') {
        rawPayload.clima = [rawPayload.clima];
      }

      const upsertData: any = {};
      Object.entries(rawPayload).forEach(([key, value]) => {
        if (allowedKeys.has(key) && value !== undefined) {
          upsertData[key] = value;
        }
      });
      
      const { data, error } = await supabase
        .from('training_sessions')
        .upsert([upsertData], { onConflict: 'id' })
        .select()
        .single();
        
      if (error) throw error;
      
      // ✅ NOVO: Se o treino foi salvo como 'completed', disparar insight
      if (data.status === 'completed') {
        console.log('🔍 Treino salvo como completed, disparando insight de assimilação...');
        try {
          await get().triggerAssimilationInsight(data);
          console.log('✅ Insight de assimilação disparado com sucesso');
        } catch (insightError) {
          console.error('❌ Erro ao disparar insight de assimilação:', insightError);
        }
      }
      
      set(state => {
        const exists = state.trainingSessions.some(t => t.id === data.id);
        const trainingSessions = exists
          ? state.trainingSessions.map(t => (t.id === data.id ? (data as any) : t))
          : [...state.trainingSessions, (data as any)];
        return { trainingSessions } as any;
      });
      
      try { await get().fetchTrainingSessions(); } catch {}
      set({ isLoading: false, error: null });
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar treino.';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  deleteTrainingSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId: string | null = (user && (user as any).id) ? (user as any).id : null;
      if (!targetUserId) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', targetUserId)
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Treino não encontrado ou já foi excluído');
      }
      
      set({ isLoading: false, error: null });
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar treino.';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  fetchTrainingSessions: async (startDate?: string, endDate?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let targetUserId: string | null = (user && (user as any).id) ? (user as any).id : null;
      
      // ✅ NOVO: Verificar se está no modo coach
      const { isCoachView, viewAsAthleteId } = useViewStore.getState();
      if (isCoachView && viewAsAthleteId) {
        console.log('🔍 Modo Coach - Buscando treinos do atleta:', viewAsAthleteId);
        targetUserId = viewAsAthleteId;
      } else {
        console.log('🔍 Modo Atleta - Buscando próprios treinos:', targetUserId);
      }
      
      if (!targetUserId) { throw new Error('Usuário não autenticado'); }
      
      let _startDate = startDate;
      let _endDate = endDate;
      if (!startDate || !endDate) {
        const today = new Date();
        const start = new Date(today);
        start.setMonth(today.getMonth() - 3);
        const end = new Date(today);
        end.setMonth(today.getMonth() + 3);
        _startDate = start.toISOString().split('T')[0];
        _endDate = end.toISOString().split('T')[0];
      }
      
      console.log('🔍 Buscando treinos para usuário:', targetUserId, 'período:', _startDate, 'a', _endDate);
      
      // ✅ CORREÇÃO: Buscar TODOS os treinos do usuário, não apenas do período
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', targetUserId)
        .order('training_date', { ascending: true });
        
      if (error) throw error;
      
      console.log('✅ Treinos encontrados:', data?.length || 0);
      
      // Debug: verificar dados brutos do banco
      console.log('🔍 DEBUG - Dados brutos do Supabase:', data?.map(s => ({
        id: s.id,
        date: s.training_date,
        status: s.status,
        distance_km: s.distance_km,
        duracao_horas: s.duracao_horas,
        duracao_minutos: s.duracao_minutos,
        perceived_effort: s.perceived_effort,
        session_satisfaction: s.session_satisfaction,
        avg_heart_rate: s.avg_heart_rate
      })));
      
      // Debug: verificar especificamente dados da semana 25/08-31/08
      const weekData = data?.filter(s => {
        const date = new Date(s.training_date);
        const weekStart = new Date('2025-08-25');
        const weekEnd = new Date('2025-08-31');
        return date >= weekStart && date <= weekEnd;
      });
      
      console.log('🔍 DEBUG - Dados da semana 25/08-31/08:', weekData?.map(s => ({
        id: s.id,
        date: s.training_date,
        status: s.status,
        distance_km: s.distance_km,
        duracao_horas: s.duracao_horas,
        duracao_minutos: s.duracao_minutos
      })));
      
      const processedData = (data || []).map(session => ({
        ...session,
        sensacoes: session.sensacoes ? JSON.parse(session.sensacoes) : [],
        clima: session.clima ? JSON.parse(session.clima) : [],
      }));
      
      set({ trainingSessions: processedData, isLoading: false, error: null });
    } catch (error: unknown) {
      console.error('Erro ao buscar treinos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar treinos.';
      set({ trainingSessions: [], isLoading: false, error: errorMessage });
    }
  },

  calculateAnalytics: () => {
    const { trainingSessions } = get();
    if (!trainingSessions || trainingSessions.length === 0) return null;

    const plannedSessions = trainingSessions.filter(t => t.status === 'planned');
    const completedSessions = trainingSessions.filter(t => t.status === 'completed');

    const completedExt: ExtTrainingSession[] = (completedSessions as any[]).map((s: any) => {
      const coerced: ExtTrainingSession = {
        ...s,
        distance_km: s.distance_km ?? undefined,
      };
      return coerced;
    });

    const trainingLoad = completedExt.map((t) => {
      const duration = getDurationMinutesFrom(t);
      
      return {
        id: t.id,
        date: (t as any).training_date,
        duration: duration,
        perceivedEffort: (t.perceived_effort as any) || 0,
        load: duration * ((t.perceived_effort as any) || 0),
        distance: (t.distance_km as any) || 0,
        elevation: (t.elevation_gain_meters as any) || 0,
      };
    });

    const acuteLoad: { date: string; value: number }[] = [];
    const allDates = ((completedSessions as any as ExtTrainingSession[]).map((t) => (t as any).training_date) as string[]).sort();
    allDates.forEach((date: string) => {
      const dateObj = new Date(date);
      const past7 = trainingLoad.filter((tl: any) => {
        const d = new Date(tl.date);
        return d <= dateObj && d >= new Date(dateObj.getTime() - 6 * 24 * 60 * 60 * 1000);
      });
      const avg = past7.length ? past7.reduce((a, b) => a + b.load, 0) / past7.length : 0;
      acuteLoad.push({ date, value: avg });
    });

    const chronicLoad: { date: string; value: number }[] = [];
    allDates.forEach((date: string) => {
      const dateObj = new Date(date);
      const past28 = trainingLoad.filter((tl: any) => {
        const d = new Date(tl.date);
        return d <= dateObj && d >= new Date(dateObj.getTime() - 27 * 24 * 60 * 60 * 1000);
      });
      const avg = past28.length ? past28.reduce((a, b) => a + b.load, 0) / past28.length : 0;
      chronicLoad.push({ date, value: avg });
    });

    const runningEfficiency = (completedExt as any as ExtTrainingSession[])
      .filter((t) => (t.modalidade === 'corrida') && (t.distance_km as any) && (t.distance_km as any) > 0)
      .map((t) => {
        const duration = getDurationMinutesFrom(t);
        return {
          pace: duration && (t.distance_km as any) ? duration / (t.distance_km as any) : 0,
          pse: (t.perceived_effort as any) || 0,
          date: (t as any).training_date,
          distance: (t.distance_km as any) || 0,
          duration: duration,
        };
      });

    const plannedVsCompleted = (completedExt as any[])
      .filter(t => {
        const planned = ((plannedSessions as any[]).map(ps => (ps as any as ExtTrainingSession))).find(p => (p as any).training_date === (t as any).training_date);
        return planned && (t.distance_km as any) && (planned.planned_distance_km as any);
      })
      .map(t => {
        const plannedList: ExtTrainingSession[] = (plannedSessions as any[]).map(ps => ps as any as ExtTrainingSession);
        const planned = plannedList.find(p => (p as any).training_date === (t as any).training_date)!;
        const pHours = planned.planned_duration_hours && planned.planned_duration_hours !== '' ? (isNaN(parseInt(planned.planned_duration_hours)) ? 0 : parseInt(planned.planned_duration_hours)) : 0;
        const pMinutes = planned.planned_duration_minutes && planned.planned_duration_minutes !== '' ? (isNaN(parseInt(planned.planned_duration_minutes)) ? 0 : parseInt(planned.planned_duration_minutes)) : 0;
        const plannedDuration = pHours * 60 + pMinutes;
        const actualDuration = getDurationMinutesFrom(t);
        
        return {
          date: (t as any).training_date,
          plannedDistance: (planned.planned_distance_km as any) || 0,
          actualDistance: (t.distance_km as any) || 0,
          plannedDuration: plannedDuration,
          actualDuration: actualDuration,
          plannedEffort: (planned.planned_perceived_effort as any) || 0,
          actualEffort: (t.perceived_effort as any) || 0,
          completionRate: (planned.planned_distance_km as any) && (t.distance_km as any) ? 
            ((t.distance_km as any) / (planned.planned_distance_km as any)) * 100 : 0,
        };
      });

    const metricsByModality = completedSessions.reduce((acc, t) => {
      const modality = t.modalidade || 'outro';
      if (!acc[modality]) {
        acc[modality] = {
          count: 0,
          totalDistance: 0,
          totalDuration: 0,
          avgEffort: 0,
          avgSatisfaction: 0,
        };
      }
      
      const duration = getDurationMinutesFrom(t);
      
      acc[modality].count++;
      acc[modality].totalDistance += t.distance_km || 0;
      acc[modality].totalDuration += duration;
      acc[modality].avgEffort += t.perceived_effort || 0;
      acc[modality].avgSatisfaction += t.session_satisfaction || 0;
      
      return acc;
    }, {} as Record<string, any>);

    Object.keys(metricsByModality).forEach(modality => {
      const data = metricsByModality[modality];
      data.avgEffort = data.count > 0 ? data.avgEffort / data.count : 0;
      data.avgSatisfaction = data.count > 0 ? data.avgSatisfaction / data.count : 0;
    });

    return {
      trainingLoad,
      acuteLoad,
      chronicLoad,
      runningEfficiency,
      plannedVsCompleted,
      metricsByModality,
      summary: {
        totalPlanned: plannedSessions.length,
        totalCompleted: completedSessions.length,
        completionRate: plannedSessions.length > 0 ? 
          (completedSessions.length / plannedSessions.length) * 100 : 0,
      }
    };
  },

  calculateReadinessScore: (checkin: DailyCheckin) => {
    const sleep = Number(checkin.sleep_quality_score) || 0;
    const fatigue = Number(checkin.fatigue_score) || 0;
    const stress = Number(checkin.stress_score) || 0;
    const soreness = Number(checkin.soreness_score) || 0;
    return sleep + fatigue + stress + soreness;
  },

  saveDailyCheckin: async (checkinData) => {
    console.log('🔍 saveDailyCheckin iniciado com dados:', checkinData);
    
    try {
      console.log('🔍 Obtendo usuário autenticado...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      console.log('✅ Usuário autenticado:', user.id);
      
      const safeSleep = Number(checkinData.sleep_quality ?? 4) || 4;
      const safeSoreness = Number(checkinData.soreness ?? 4) || 4;
      const safeMotivation = Number(checkinData.motivation ?? 3) || 3;
      const safeConfidence = Number(checkinData.confidence ?? 3) || 3;
      const safeFocus = Number(checkinData.focus ?? 3) || 3;
      
      const insertData = {
        user_id: user.id,
        sleep_quality: safeSleep,
        sleep_quality_score: safeSleep,
        soreness: safeSoreness,
        motivation: safeMotivation,
        emocional: safeMotivation,
        confidence: safeConfidence,
        focus: safeFocus,
        mood_score: Math.min(10, Math.max(1, safeMotivation * 2)),
        energy_score: Math.min(10, Math.max(1, safeMotivation * 2)),
        confidence_score: Math.min(10, Math.max(1, safeConfidence * 2)),
        focus_score: Math.min(10, Math.max(1, safeFocus * 2)),
        soreness_score: safeSoreness,
        notes: '',
        date: new Date().toISOString().split('T')[0],
      };
      
      console.log('🔍 Dados formatados para inserção:', insertData);
      console.log('🔍 Salvando check-in no banco...');
      
      const { data, error } = await supabase
        .from('daily_checkins')
        .insert([insertData])
        .select()
        .single();
        
      if (error) {
        console.error('❌ Erro do Supabase ao salvar check-in:', error);
        console.error('❌ Código do erro:', error.code);
        console.error('❌ Mensagem do erro:', error.message);
        console.error('❌ Detalhes do erro:', error.details);
        console.error('❌ Hint do erro:', error.hint);
        const message = [error.message, error.details, error.hint].filter(Boolean).join(' | ');
        throw new Error(message || 'Falha ao salvar check-in');
      }
      
      console.log('✅ Check-in salvo com sucesso:', data.id);
      console.log('✅ Dados salvos:', data);
      
      // ✅ NOVO: Tentar gerar insight automaticamente
      console.log('🔍 Tentando gerar insight automaticamente...');
      try {
        await get().triggerDailyInsight(data);
        console.log('✅ Insight gerado automaticamente');
      } catch (insightError) {
        console.warn('⚠️ Erro ao gerar insight:', insightError);
      }
      
      // ✅ NOVO: ATUALIZAR ESTADO LOCAL
      try {
        await get().loadTodayCheckin();
        await get().loadRecentCheckins();
        console.log('✅ Estado local atualizado');
      } catch (stateError) {
        console.error('⚠️ Erro ao atualizar estado local:', stateError);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erro geral em saveDailyCheckin:', error);
      throw error;
    }
  },

  updateCheckinWithInsight: async (checkinId: string, insightText: string) => {
    const { error } = await supabase
      .from('daily_checkins')
      .update({ readiness_insight_text: insightText })
      .eq('id', checkinId);
    if (error) throw error;
  },

  loadWeeklyReflections: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId: string | null = (user && (user as any).id) ? (user as any).id : null;
      if (!targetUserId) { return; }
      
      const { data, error } = await supabase
        .from('weekly_reflections')
        .select('enjoyment, progress, confidence, week_start, created_at')
        .eq('user_id', targetUserId)
        .order('week_start', { ascending: false });
      if (error) throw error;
      set({ weeklyReflections: (data as WeeklyReflection[]) || [], isLoading: false, error: null });
    } catch (error: unknown) {
      console.error('Error loading weekly reflections:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar reflexões semanais.';
      set({ isLoading: false, error: errorMessage });
    }
  },

  calculateWeeklyAverages: (data) => {
    if (!data || data.length === 0) return [];
    const weekMap: Record<string, number[]> = {};
    data.forEach((item) => {
      const d = new Date(item.date);
      const weekStart = new Date(d);
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      weekStart.setDate(d.getDate() + diff);
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weekMap[weekKey]) weekMap[weekKey] = [];
      weekMap[weekKey].push(item.value);
    });
    
    return Object.entries(weekMap).map(([week, values], i) => ({
      label: `Semana ${i + 1}`,
      value: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      weekStart: week,
    }));
  },

  loadSavedInsights: async () => {
    console.log('🔍 loadSavedInsights iniciado');
    set({ isLoading: true, error: null });
    
    try {
      // ✅ NOVO: Timeout de segurança para evitar travamento
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: loadSavedInsights demorou mais de 10 segundos')), 10000)
      );
      
      const loadPromise = (async () => {
        // ✅ NOVO: Verificar se estamos no modo coach view
        const { isCoachView, viewAsAthleteId } = require('../stores/view').useViewStore.getState();
        
        let targetUserId: string | null = null;
        
        if (isCoachView && viewAsAthleteId) {
          // ✅ NOVO: Modo coach - usar ID do atleta sendo visualizado
          targetUserId = viewAsAthleteId;
          console.log('🔍 Modo Coach - Visualizando atleta:', targetUserId);
        } else {
          // ✅ NOVO: Modo atleta - usar ID do usuário logado
          const { data: { user } } = await supabase.auth.getUser();
          targetUserId = (user && (user as any).id) ? (user as any).id : null;
          console.log('🔍 Modo Atleta - Usuário logado:', targetUserId);
        }
        
        console.log('🔍 User ID final:', targetUserId);
        
        if (!targetUserId) { 
          console.log('⚠️ Usuário não encontrado');
          set({ savedInsights: [], isLoading: false, error: null });
          return; 
        }
        
        console.log('🔍 Buscando insights para usuário:', targetUserId);
        const { data, error } = await supabase
          .from('insights')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (error) {
          console.error('❌ Erro ao buscar insights:', error);
          throw error;
        }
        
        console.log('✅ Insights encontrados:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('🔍 Primeiro insight:', {
            id: data[0].id,
            text: data[0].insight_text?.substring(0, 50) + '...',
            created_at: data[0].created_at,
            type: data[0].insight_type
          });
        }
        
        set({ savedInsights: (data as Insight[]) || [], isLoading: false, error: null });
      })();
      
      await Promise.race([loadPromise, timeoutPromise]);
    } catch (error: unknown) {
      console.error('❌ Error loading saved insights:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar insights salvos.';
      set({ isLoading: false, error: errorMessage });
    }
  },

  saveInsight: async (insightData) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const insertData = {
        user_id: user.id,
        ...insightData,
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('insights')
        .insert([insertData]);
      if (error) throw error;
      set({ isSubmitting: false, error: null });
      await get().loadSavedInsights();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar insight.';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  deleteInsight: async (insightId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('insights')
        .delete()
        .eq('id', insightId)
        .eq('user_id', user.id);
      if (error) throw error;
      set({ isLoading: false, error: null });
      await get().loadSavedInsights();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar insight.';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },
}));