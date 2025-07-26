import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { generateInsight } from '../services/gemini';
import type { DailyCheckin, Insight } from '../types/database';

interface RecentCheckin {
  sleep_quality: number;
  soreness: number;
  motivation: number;
  confidence: number;
  focus: number;
  emocional: number;
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

interface TrainingSession {
  id: number;
  user_id: string;
  training_date: string;
  training_type: string;
  status: string;
  perceived_effort?: number;
  satisfaction?: number;
  notes?: string;
  avg_heart_rate?: number;
  elevation_gain_meters?: number;
  distance_km?: number;
  duration_minutes?: number;
  created_at?: string;
  // Propriedades dinâmicas para métricas planejadas
  planned_perceived_effort?: number;
  planned_distance_km?: number;
  planned_duration_minutes?: number;
  planned_elevation_gain_meters?: number;
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
  submitCheckin: (checkinData: Omit<DailyCheckin, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  calculateAnalytics: () => {
    trainingLoad: { id: string | number; date: string; duration: number; perceivedEffort: number; load: number }[];
    acuteLoad: { date: string; value: number }[];
    chronicLoad: { date: string; value: number }[];
    runningEfficiency: { pace: number; pse: number; date: string }[];
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
    sleep_hours: number;
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

  loadTodayCheckin: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      // Buscar o check-in mais recente do dia
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
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
      console.error('Error loading today checkin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar check-in de hoje.';
      set({ isLoading: false, error: errorMessage });
    }
  },

  loadRecentCheckins: async (days = 90) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { return; }
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('sleep_quality, soreness, motivation, confidence, focus, emocional, notes, date')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });
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
      
      // Gerar e salvar insight automaticamente
      try {
        await get().generateAndSaveInsight({
          ...checkinData,
          user_id: user.id,
          date: today,
          context_type: 'solo', // ou buscar do perfil do usuário
        });
      } catch (insightError) {
        console.error('Erro ao gerar insight com IA:', insightError);
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
      if (!user) throw new Error('Usuário não autenticado');
      const upsertData = {
        user_id: user.id,
        ...trainingData,
      };
      const { data, error } = await supabase
        .from('training_sessions')
        .upsert([upsertData], { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      set({ isLoading: false, error: null });
      return data;
    } catch (error: unknown) {
      console.error('Erro ao salvar treino (upsert):', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar treino.';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },
  deleteTrainingSession: async (sessionId: number | string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', sessionId);
      if (error) throw error;
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
      if (!user) { throw new Error('Usuário não autenticado'); }
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
        .eq('user_id', user.id)
        .gte('training_date', _startDate)
        .lte('training_date', _endDate)
        .order('training_date', { ascending: true });
      if (error) throw error;
      set({ trainingSessions: data || [], isLoading: false, error: null });
    } catch (error: unknown) {
      console.error('Erro ao buscar treinos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar treinos.';
      set({ trainingSessions: [], isLoading: false, error: errorMessage });
    }
  },

  calculateAnalytics: () => {
    const { trainingSessions } = get();
    if (!trainingSessions || trainingSessions.length === 0) return null;

    // 1. Carga de Treino (trainingLoad)
    const trainingLoad = trainingSessions.map((t: TrainingSession) => ({
      id: t.id,
      date: t.training_date,
      duration: t.duration_minutes || 0,
      perceivedEffort: t.perceived_effort || 0,
      load: (t.duration_minutes || 0) * (t.perceived_effort || 0),
    }));

    // 2. Carga Aguda (acuteLoad) - média dos últimos 7 dias para cada dia
    const acuteLoad: { date: string; value: number }[] = [];
    const allDates = trainingSessions.map((t: TrainingSession) => t.training_date).sort();
    allDates.forEach((date: string) => {
      const dateObj = new Date(date);
      const past7 = trainingLoad.filter((tl) => {
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
      const past28 = trainingLoad.filter((tl) => {
        const d = new Date(tl.date);
        return d <= dateObj && d >= new Date(dateObj.getTime() - 27 * 24 * 60 * 60 * 1000);
      });
      const avg = past28.length ? past28.reduce((a, b) => a + b.load, 0) / past28.length : 0;
      chronicLoad.push({ date, value: avg });
    });

    // 4. Eficiência de Corrida (runningEfficiency): para treinos do tipo 'Rodagem'
    const runningEfficiency = trainingSessions
      .filter((t: TrainingSession) => t.training_type && t.training_type.toLowerCase().includes('rodagem'))
      .map((t: TrainingSession) => ({
        pace: t.duration_minutes && t.distance_km ? t.duration_minutes / t.distance_km : 0,
        pse: t.perceived_effort || 0,
        date: t.training_date,
      }));

    return {
      trainingLoad,
      acuteLoad,
      chronicLoad,
      runningEfficiency,
    };
  },

  calculateReadinessScore: (checkin: DailyCheckin) => {
    const sleep = Number(checkin.sleep_quality_score) || 0;
    const fatigue = Number(checkin.fatigue_score) || 0;
    const stress = Number(checkin.stress_score) || 0;
    const soreness = Number(checkin.soreness_score) || 0;
    return sleep + fatigue + stress + soreness;
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
      if (!user) throw new Error('Usuário não autenticado');
      const updateData = {
        ...completedData,
        status: 'completed',
      };
      const { data, error } = await supabase
        .from('training_sessions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      // Atualiza o store local
      set(state => ({
        trainingSessions: state.trainingSessions.map(t => t.id === id ? { ...t, ...updateData } : t)
      }));
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
  },
  saveDailyCheckin: async (checkinData: {
    sleep_hours: number;
    soreness: number;
    motivation: number;
    focus: number;
    confidence: number;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    const insertData = {
      user_id: user.id,
      sleep_quality: checkinData.sleep_hours,
      soreness: checkinData.soreness,
      emocional: checkinData.motivation,
      motivation: checkinData.motivation,
      focus: checkinData.focus,
      confidence: checkinData.confidence,
      notes: '', // Assuming notes is not part of the new checkinData object
      date: new Date().toISOString().split('T')[0],
    };
    const { data, error } = await supabase
      .from('daily_checkins')
      .insert([insertData])
      .select()
      .single();
    if (error) throw error;
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
      if (!user) { return; }
      const { data, error } = await supabase
        .from('weekly_reflections')
        .select('enjoyment, progress, confidence, week_start, created_at')
        .eq('user_id', user.id)
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
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { return; }
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ savedInsights: (data as Insight[]) || [], isLoading: false, error: null });
    } catch (error: unknown) {
      console.error('Error loading saved insights:', error);
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
      const insightText = await generateInsight(checkinData);
      await get().saveInsight({
        insight_type: 'ai_analysis',
        insight_text: insightText,
        confidence_score: 0.8,
        source_data: checkinData,
        generated_by: 'ai',
      });
      set(state => ({ insights: [...state.insights, insightText] }));
      set({ isSubmitting: false, error: null });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar e salvar insight.';
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
}));