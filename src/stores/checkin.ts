import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { generateInsight } from '../services/gemini';
import { generateContextualInsight, generateDailyCheckinInsight, generateTrainingFeedbackInsight, generateWeeklySummaryInsight } from '../services/insightGenerator';
import type { DailyCheckin, Insight, Race, TrainingSession } from '../types/database';
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

interface WeeklyReflection {
  enjoyment: number;
  progress: string;
  confidence: string;
  week_start: string;
  created_at?: string;
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
  races: Race[];
  // Actions
  loadTodayCheckin: () => Promise<void>;
  loadRecentCheckins: (days?: number) => Promise<void>;
  submitCheckin: (checkinData: Omit<DailyCheckin, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
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
    satisfaction?: number;
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
  }) => Promise<void>;
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
  generateAndSaveInsight: (checkinData: Record<string, unknown>) => Promise<void>;
  deleteInsight: (insightId: string) => Promise<void>;
  fetchRaces: () => Promise<void>;
  // ✅ NOVAS: Funções para insights contextuais
  generateWeeklyInsight: () => Promise<void>;
  checkAndGenerateWeeklyInsight: () => Promise<void>;
  // ✅ NOVO: Calcular score de confiança dinâmico
  calculateInsightConfidence: (data: Record<string, unknown>) => number;
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
  trainingSessions: [], // Initialize trainingSessions
  todayReadinessScore: null,
  weeklyReflections: [],
  races: [],

  loadTodayCheckin: async () => {
    // ✅ OTIMIZADO: Reduzir logs e melhorar performance
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const safeUserId: string | null = (user && (user as any).id) ? (user as any).id : null;
      if (!safeUserId && !useViewStore.getState().viewAsAthleteId) { set({ isLoading: false }); return; }
      const viewAsAthleteId = useViewStore.getState().viewAsAthleteId;
      const targetUserId = viewAsAthleteId ?? safeUserId;
      if (!targetUserId) {
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      // ✅ OTIMIZADO: Query mais eficiente
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Calcular readiness score se houver checkin
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
    // ✅ OTIMIZADO: Reduzir período padrão e melhorar performance
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { viewAsAthleteId, isCoachView } = useViewStore.getState();
      const targetUserId: string | null = viewAsAthleteId ?? (user && (user as any).id ? (user as any).id : null);
      if (isCoachView && user?.id && targetUserId === user.id) {
        throw new Error('Modo treinador ativo, mas nenhum atleta selecionado. Selecione um atleta antes de salvar.');
      }
      if (!targetUserId) { 
        return; 
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // ✅ OTIMIZADO: Query única e mais eficiente
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('sleep_quality, soreness, motivation, confidence, focus, emocional, notes, date')
        .eq('user_id', targetUserId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(100); // Limitar para melhor performance
      if (error) throw error;
      
      set({ recentCheckins: (data as RecentCheckin[]) || [], isLoading: false, error: null });
    } catch (error: unknown) {
      console.error('Error loading recent checkins:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar check-ins recentes.';
      set({ isLoading: false, error: errorMessage });
    }
  },

  submitCheckin: async (checkinData) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const today = new Date().toISOString().split('T')[0];
      const insertData = {
        ...checkinData,
        user_id: user.id,
        date: today,
      };
      // Inserir novo check-in SEM onConflict
      const { data, error } = await supabase
        .from('daily_checkins')
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;
      // Calcular readiness score após submit
      const readiness = get().calculateReadinessScore(data);
      set({ 
        todayCheckin: data,
        hasCheckedInToday: true,
        isSubmitting: false,
        todayReadinessScore: readiness,
        error: null
      });
      await get().loadRecentCheckins();
      
      // ✅ MELHORADO: Gerar insight contextual após check-in
      try {
        console.log('🔍 Gerando insight após check-in diário...');
        await generateDailyCheckinInsight(user.id);
        console.log('✅ Insight de check-in gerado com sucesso');
      } catch (insightError) {
        console.error('❌ Erro ao gerar insight de check-in:', insightError);
        // Não falhar o check-in se o insight falhar
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar check-in.';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  submitParqAnswers: async (answers: {
    q1: boolean;
    q2: boolean;
    q3: boolean;
    q4: boolean;
    q5: boolean;
    q6: boolean;
    q7: boolean;
    details?: string;
  }) => {
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

  saveTrainingSession: async (trainingData: Partial<TrainingSession>) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const viewAsAthleteId = useViewStore.getState().viewAsAthleteId;
      const targetUserId: string | null = viewAsAthleteId ?? (user && (user as any).id ? (user as any).id : null);
      if (!targetUserId) throw new Error('Usuário não autenticado');
      
      // Preparar dados para salvamento (somente colunas existentes na tabela)
      const allowedKeys = new Set([
        'user_id',
        'training_date',
        'title',
        'training_type',
        'status',
        // planejado
        'modalidade',
        'treino_tipo',
        'terreno',
        'percurso',
        'esforco',
        'intensidade',
        'distance_km',
        'duracao_horas',
        'duracao_minutos',
        'observacoes',
        // realizado
        'elevation_gain_meters',
        'elevation_loss_meters',
        'avg_heart_rate',
        'max_heart_rate',
        'perceived_effort',
        'session_satisfaction',
        // arrays
        'sensacoes',
        'clima',
        // legado opcionais
        'notes',
        'effort_level',
        'duracao_tipo',
      ]);

      const rawPayload: any = {
        user_id: targetUserId,
        ...trainingData,
      };

      // Normalizar arrays
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
      
      // Atualizar o store local: adiciona se novo, ou atualiza se já existir
      set(state => {
        const exists = state.trainingSessions.some(t => t.id === data.id);
        const trainingSessions = exists
          ? state.trainingSessions.map(t => (t.id === data.id ? (data as any) : t))
          : [...state.trainingSessions, (data as any)];
        return { trainingSessions } as any;
      });
      
      // Recarregar lista do período atual para garantir sincronização visual (modo treinador ou atleta)
      try { await get().fetchTrainingSessions(); } catch {}
      set({ isLoading: false, error: null });
      return data;
      } catch (error: unknown) {
        try {
          const e: any = error;
          console.error('Erro ao salvar treino (upsert):', {
            message: e?.message,
            code: e?.code,
            details: e?.details,
            hint: e?.hint,
          });
        } catch {}
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar treino.';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },
  deleteTrainingSession: async (sessionId: number | string) => {
    console.log('deleteTrainingSession chamada com sessionId:', sessionId);
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const viewAsAthleteId = useViewStore.getState().viewAsAthleteId;
      const targetUserId = viewAsAthleteId ?? (user ? user.id : null);
      if (!targetUserId) throw new Error('Usuário não autenticado');
      
      console.log('Usuário autenticado:', user?.id);
      console.log('Tentando excluir treino com ID:', sessionId);
      
      const { data, error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', targetUserId)
        .select(); // Adicionar select para ver o que foi excluído
      
      console.log('Resultado da exclusão:', { data, error });
      
      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.warn('Nenhum registro foi excluído. Verifique se o ID existe.');
        throw new Error('Treino não encontrado ou já foi excluído');
      }
      
      console.log('Treino excluído com sucesso:', data);
      set({ isLoading: false, error: null });
      return true;
    } catch (error: unknown) {
      console.error('Erro ao deletar treino:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar treino.';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  fetchTrainingSessions: async (startDate?: string, endDate?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { viewAsAthleteId, isCoachView } = useViewStore.getState();
      const targetUserId = viewAsAthleteId ?? (user ? user.id : null);
      // Guarda-fio: no modo treinador, não sobrepor lista se não houver atleta selecionado
      if (isCoachView && !viewAsAthleteId) {
        // Evitar piscar dados do usuário anterior
        set({ trainingSessions: [], isLoading: false, error: null });
        return;
      }
      if (!targetUserId) { throw new Error('Usuário não autenticado'); }
      
      // Calcular intervalo amplo se não fornecido
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
      
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('training_date', _startDate)
        .lte('training_date', _endDate)
        .order('training_date', { ascending: true });
        
      if (error) throw error;
      
      // Processar campos JSON
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

    // Separar treinos planejados e realizados
    const plannedSessions = trainingSessions.filter(t => t.status === 'planned');
    const completedSessions = trainingSessions.filter(t => t.status === 'completed');

    // 1. Carga de Treino (trainingLoad) - apenas treinos realizados
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

    // 2. Carga Aguda (acuteLoad) - média dos últimos 7 dias para cada dia
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

    // 3. Carga Crônica (chronicLoad) - média dos últimos 28 dias para cada dia
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

    // 4. Eficiência de Corrida (runningEfficiency): para treinos de corrida realizados
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

    // 5. Comparação Planejado vs Realizado
    const plannedVsCompleted = (completedExt as any[])
      .filter(t => {
        // Buscar treino planejado correspondente
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

    // 6. Métricas por Modalidade
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

    // Calcular médias
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

  // ✅ NOVO: Calcular score de confiança dinâmico para insights
  calculateInsightConfidence: (data: Record<string, unknown>) => {
    let score = 0.5; // Base score
    
    // Verificar qualidade dos dados de check-in
    if (data.last_checkin) {
      const checkin = data.last_checkin as Record<string, unknown>;
      const hasSleep = checkin.sleep_quality !== undefined && checkin.sleep_quality !== null;
      const hasMotivation = checkin.motivation !== undefined && checkin.motivation !== null;
      const hasSoreness = checkin.soreness !== undefined && checkin.soreness !== null;
      
      if (hasSleep && hasMotivation && hasSoreness) score += 0.2;
      else if (hasSleep || hasMotivation || hasSoreness) score += 0.1;
    }
    
    // Verificar dados históricos
    if (data.recent_checkins && Array.isArray(data.recent_checkins)) {
      if (data.recent_checkins.length >= 5) score += 0.15;
      else if (data.recent_checkins.length >= 3) score += 0.1;
      else if (data.recent_checkins.length >= 1) score += 0.05;
    }
    
    if (data.recent_trainings && Array.isArray(data.recent_trainings)) {
      if (data.recent_trainings.length >= 3) score += 0.15;
      else if (data.recent_trainings.length >= 1) score += 0.1;
    }
    
    // Verificar perfil do usuário
    if (data.user_profile) score += 0.1;
    
    // Limitar entre 0.5 e 0.95
    return Math.min(0.95, Math.max(0.5, score));
  },

  markTrainingAsCompleted: async (id: number, completedData: {
    perceived_effort?: number;
    satisfaction?: number;
    notes?: string;
    avg_heart_rate?: number;
    elevation_gain_meters?: number;
    distance_km?: number;
    duration_minutes?: number;
  }) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const viewAsAthleteId = useViewStore.getState().viewAsAthleteId;
      const targetUserId = viewAsAthleteId ?? (user ? user.id : null);
      if (!targetUserId) throw new Error('Usuário não autenticado');
      const updateData = {
        ...completedData,
        status: 'completed',
      };
      const { data, error } = await supabase
        .from('training_sessions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', targetUserId)
        .select()
        .single();
      if (error) throw error;
      // Atualiza o store local
      set(state => ({
        trainingSessions: state.trainingSessions.map(t => t.id === id ? { ...t, ...updateData } as TrainingSession : t)
      }));
      
      // ✅ MELHORADO: Gerar insight contextual após feedback de treino
      try {
        console.log('🔍 Gerando insight após feedback de treino...');
        console.log('🔍 User ID:', targetUserId);
        console.log('🔍 Treino completado:', data);
        await generateTrainingFeedbackInsight(targetUserId, data);
        console.log('✅ Insight de feedback de treino gerado com sucesso');
      } catch (insightError) {
        console.error('❌ Erro ao gerar insight de feedback de treino:', insightError);
        console.error('❌ Detalhes do erro:', insightError instanceof Error ? insightError.message : insightError);
        // Não falhar o processo se o insight falhar
      }
      
      set({ isLoading: false, error: null });
      return data;
    } catch (error: unknown) {
      console.error('Erro ao marcar treino como realizado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao marcar treino como realizado.';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  submitWeeklyReflection: async (reflection) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    const upsertData = {
      user_id: user.id,
      week_start: reflection.week_start,
      enjoyment: reflection.enjoyment,
      progress: reflection.progress,
      confidence: reflection.confidence,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('weekly_reflections')
      .upsert(upsertData, { onConflict: 'user_id,week_start' });
    if (error) throw error;
    
    // ✅ MELHORADO: Gerar insight contextual após reflexão semanal
    try {
      console.log('🔍 Gerando insight após reflexão semanal...');
      console.log('🔍 User ID:', user.id);
      console.log('🔍 Reflexão salva:', reflection);
      await generateWeeklySummaryInsight(user.id);
      console.log('✅ Insight semanal gerado com sucesso');
    } catch (insightError) {
      console.error('❌ Erro ao gerar insight semanal:', insightError);
      console.error('❌ Detalhes do erro:', insightError instanceof Error ? insightError.message : insightError);
      // Não falhar a reflexão se o insight falhar
    }
  },
  saveDailyCheckin: async (checkinData: {
    sleep_quality: number;
    soreness: number;
    motivation: number;
    focus: number;
    confidence: number;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    // Sanitização e logs para depuração
    const safeSleep = Number(checkinData.sleep_quality ?? 4) || 4;
    const safeSoreness = Number(checkinData.soreness ?? 4) || 4;
    const safeMotivation = Number(checkinData.motivation ?? 3) || 3;
    const safeConfidence = Number(checkinData.confidence ?? 3) || 3;
    const safeFocus = Number(checkinData.focus ?? 3) || 3;
    const insertData = {
      user_id: user.id,
      sleep_quality: safeSleep,
      sleep_quality_score: safeSleep,
      // Usar nomes de colunas reais da tabela
      soreness: safeSoreness,
      motivation: safeMotivation,
      emocional: safeMotivation,
      confidence: safeConfidence,
      focus: safeFocus,
      // Campos obrigatórios herdados (escala 1-10)
      mood_score: Math.min(10, Math.max(1, safeMotivation * 2)),
      energy_score: Math.min(10, Math.max(1, safeMotivation * 2)),
      confidence_score: Math.min(10, Math.max(1, safeConfidence * 2)),
      focus_score: Math.min(10, Math.max(1, safeFocus * 2)),
      soreness_score: safeSoreness,
      notes: '', // Assuming notes is not part of the new checkinData object
      date: new Date().toISOString().split('T')[0],
    };
    console.log('👀 insertData (daily_checkins):', insertData);
    const { data, error } = await supabase
      .from('daily_checkins')
      .insert([insertData])
      .select()
      .single();
    if (error) {
      console.error('❌ Supabase insert error (daily_checkins):', { error });
      const message = [error.message, error.details, error.hint].filter(Boolean).join(' | ');
      throw new Error(message || 'Falha ao salvar check-in');
    }
    
    // ✅ CORRIGIDO: Gerar insight contextual automaticamente após salvar check-in
    try {
      console.log('🔍 Gerando insight automático após saveDailyCheckin...');
      console.log('🔍 User ID:', user.id);
      console.log('🔍 Check-in salvo com sucesso, iniciando geração de insight...');
      await generateDailyCheckinInsight(user.id);
      console.log('✅ Insight automático gerado com sucesso');
    } catch (insightError) {
      console.error('❌ Erro ao gerar insight automático:', insightError);
      console.error('❌ Detalhes do erro:', insightError instanceof Error ? insightError.message : insightError);
      // Não falhar o check-in se o insight falhar
    }
    
    return data;
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
      const viewAsAthleteId = useViewStore.getState().viewAsAthleteId;
      const targetUserId = viewAsAthleteId ?? (user ? user.id : null);
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
    // Agrupar por semana (segunda a domingo)
    const weekMap: Record<string, number[]> = {};
    data.forEach((item) => {
      const d = new Date(item.date);
      // Ajustar para segunda-feira como início da semana
      const weekStart = new Date(d);
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1) - day; // segunda = 1, domingo = 0
      weekStart.setDate(d.getDate() + diff);
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weekMap[weekKey]) weekMap[weekKey] = [];
      weekMap[weekKey].push(item.value);
    });
    // Calcular média de cada semana
    return Object.entries(weekMap).map(([week, values], i) => ({
      label: `Semana ${i + 1}`,
      value: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
      weekStart: week,
    }));
  },
  // Novas funções para insights
  loadSavedInsights: async () => {
    // ✅ OTIMIZADO: Reduzir logs e melhorar performance
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { viewAsAthleteId, isCoachView } = useViewStore.getState();
      const targetUserId = viewAsAthleteId ?? (user ? user.id : null);
      
      if (!targetUserId) { 
        set({ savedInsights: [], isLoading: false, error: null });
        return; 
      }
      
      // ✅ OTIMIZADO: Limitar a 50 insights mais recentes para melhor performance
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      set({ savedInsights: (data as Insight[]) || [], isLoading: false, error: null });
    } catch (error: unknown) {
      console.error('❌ Error loading saved insights:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar insights salvos.';
      set({ isLoading: false, error: errorMessage });
    }
  },
  saveInsight: async (insightData: Omit<Insight, 'id' | 'user_id' | 'created_at'>) => {
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
      await get().loadSavedInsights(); // Refresh the list
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar insight.';
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },
  generateAndSaveInsight: async (checkinData: Record<string, unknown>) => {
    set({ isSubmitting: true, error: null });
    try {
      // ✅ MELHORADO: Validar se há dados suficientes para gerar insights
      const { last_checkin, recent_checkins, recent_trainings } = checkinData;
      
      // Verificar se há check-in atual
      if (!last_checkin) {
        throw new Error('É necessário ter um check-in atual para gerar insights.');
      }
      
      // Verificar se há dados históricos suficientes
      const hasRecentCheckins = recent_checkins && Array.isArray(recent_checkins) && recent_checkins.length >= 2;
      const hasRecentTrainings = recent_trainings && Array.isArray(recent_trainings) && recent_trainings.length >= 1;
      
      if (!hasRecentCheckins && !hasRecentTrainings) {
        throw new Error('É necessário ter pelo menos 2 check-ins recentes ou 1 treino para gerar insights relevantes.');
      }
      
      console.log('🔍 Gerando insight com dados validados:', {
        hasLastCheckin: !!last_checkin,
        recentCheckinsCount: hasRecentCheckins ? recent_checkins.length : 0,
        recentTrainingsCount: hasRecentTrainings ? recent_trainings.length : 0
      });
      
      const insightText = await generateInsight(checkinData);
      
      // ✅ MELHORADO: Validar se o insight foi gerado corretamente
      if (!insightText || insightText.trim().length < 10) {
        throw new Error('O insight gerado está muito curto ou vazio.');
      }
      
      // ✅ CORRIGIDO: Calcular score de confiança dinâmico baseado na qualidade dos dados
      const confidenceScore = get().calculateInsightConfidence(checkinData);
      
      await get().saveInsight({
        insight_type: 'ai_analysis',
        insight_text: insightText,
        confidence_score: confidenceScore,
        source_data: checkinData,
        generated_by: 'ai',
      });
      
      set(state => ({ insights: [...state.insights, insightText] }));
      set({ isSubmitting: false, error: null });
      
      console.log('✅ Insight gerado e salvo com sucesso:', insightText.substring(0, 100) + '...');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar e salvar insight.';
      console.error('❌ Erro ao gerar insight:', error);
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
      await get().loadSavedInsights(); // Refresh the list
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar insight.';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  fetchRaces: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const viewAsAthleteId = useViewStore.getState().viewAsAthleteId;
      const targetUserId = viewAsAthleteId ?? (user ? user.id : null);
      if (!targetUserId) return;

      const { data, error } = await supabase
        .from('races')
        .select('*')
        .eq('user_id', targetUserId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      set({ races: data || [] });
    } catch (error) {
      console.error('Erro ao buscar provas:', error);
    }
  },

  // ✅ NOVO: Gerar insight semanal
  generateWeeklyInsight: async () => {
    set({ isSubmitting: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const viewAsAthleteId = useViewStore.getState().viewAsAthleteId;
      const targetUserId = viewAsAthleteId ?? (user ? user.id : null);
      
      if (!targetUserId) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🔍 Gerando insight semanal para usuário:', targetUserId);
      
      // ✅ MELHORADO: Verificar se há dados suficientes antes de gerar
      const { data: weeklyTrainings } = await supabase
        .from('training_sessions')
        .select('id')
        .eq('user_id', targetUserId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);
      
      if (!weeklyTrainings || weeklyTrainings.length === 0) {
        throw new Error('É necessário ter pelo menos um treino na semana para gerar insights semanais.');
      }
      
      await generateWeeklySummaryInsight(targetUserId);
      console.log('✅ Insight semanal gerado com sucesso');
      
      // Recarregar insights para mostrar o novo
      await get().loadSavedInsights();
      
      set({ isSubmitting: false, error: null });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar insight semanal.';
      console.error('❌ Erro ao gerar insight semanal:', error);
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },

  // ✅ NOVO: Verificar se é fim de semana para gerar insight semanal automaticamente
  checkAndGenerateWeeklyInsight: async () => {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Domingo, 6 = Sábado
      
      // Gerar insight semanal aos domingos (dia 0)
      if (dayOfWeek === 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Verificar se já foi gerado um insight semanal hoje
        const todayStr = today.toISOString().split('T')[0];
        const { data: existingInsights } = await supabase
          .from('insights')
          .select('id')
          .eq('user_id', user.id)
          .eq('insight_type', 'ai_analysis')
          .gte('created_at', todayStr)
          .limit(1);
        
        // Se não há insights hoje, gerar um semanal
        if (!existingInsights || existingInsights.length === 0) {
          console.log('🔍 Gerando insight semanal automático...');
          await get().generateWeeklyInsight();
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar geração de insight semanal:', error);
      // Não falhar o processo se der erro
    }
  },
}));