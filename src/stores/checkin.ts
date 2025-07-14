import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { generateInsight } from '../services/gemini';
import type { DailyCheckin, UserAnalytics } from '../types/database';

interface RecentCheckin {
  mood_score: number;
  energy_score: number;
  sleep_hours: number;
  sleep_quality: number;
  date: string;
}

interface CheckinState {
  todayCheckin: DailyCheckin | null;
  recentCheckins: RecentCheckin[];
  hasCheckedInToday: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  insights: string[];
  trainingSessions: any[];
  todayReadinessScore: number | null;
  // Actions
  loadTodayCheckin: () => Promise<void>;
  loadRecentCheckins: (days?: number) => Promise<void>;
  submitCheckin: (checkinData: Omit<DailyCheckin, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  calculateAnalytics: () => UserAnalytics | null;
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
  submitTrainingSession: (trainingData: {
    training_date: string;
    title: string;
    training_type: string;
    distance_km: number | null;
    duration_minutes: number | null;
    elevation_gain_meters: number | null;
    avg_heart_rate: number | null;
    perceived_effort: number;
    notes: string;
    source?: string;
  }) => Promise<any>;
  fetchTrainingSessions: (startDate?: string, endDate?: string) => Promise<void>;
  saveTrainingSession: (trainingData: any) => Promise<any>;
  deleteTrainingSession: (sessionId: number | string) => Promise<boolean>;
  markTrainingAsCompleted: (id: number, completedData: {
    perceived_effort?: number;
    satisfaction?: number;
    notes?: string;
    avg_heart_rate?: number;
    elevation_gain_meters?: number;
    distance_km?: number;
    duration_minutes?: number;
  }) => Promise<any>;
  calculateReadinessScore: (checkin: any) => number;
  submitWeeklyReflection: (reflection: {
    enjoyment: number;
    progress: string;
    confidence: string;
    week_start: string;
  }) => Promise<void>;
}

export const useCheckinStore = create<CheckinState>((set, get) => ({
  todayCheckin: null,
  recentCheckins: [],
  hasCheckedInToday: false,
  isLoading: false,
  isSubmitting: false,
  insights: [],
  trainingSessions: [], // Initialize trainingSessions
  todayReadinessScore: null,

  loadTodayCheckin: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('checkin_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
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
        todayReadinessScore: readiness
      });
    } catch (error) {
      console.error('Error loading today checkin:', error);
      set({ isLoading: false });
    }
  },

  loadRecentCheckins: async (days = 7) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('checkin_sessions')
        .select('mood_score, energy_score, sleep_hours, sleep_quality, date')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      set({ recentCheckins: data || [] });
    } catch (error) {
      console.error('Error loading recent checkins:', error);
    }
  },

  submitCheckin: async (checkinData) => {
    set({ isSubmitting: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const today = new Date().toISOString().split('T')[0];
      const upsertData = {
        ...checkinData,
        user_id: user.id,
        date: today,
      };
      const { data, error } = await supabase
        .from('checkin_sessions')
        .upsert([upsertData], { onConflict: 'user_id,date' })
        .select()
        .single();
      if (error) throw error;
      // Calcular readiness score após submit
      const readiness = get().calculateReadinessScore(data);
      set({ 
        todayCheckin: data,
        hasCheckedInToday: true,
        isSubmitting: false,
        todayReadinessScore: readiness
      });
      await get().loadRecentCheckins();
      try {
        const insightText = await generateInsight(checkinData);
        set(state => ({ insights: [...state.insights, insightText] }));
        console.log('✨ Insight gerado pela IA:', insightText);
      } catch (error) {
        console.error('Erro ao gerar insight com IA:', error);
      }
    } catch (error) {
      set({ isSubmitting: false });
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

  submitTrainingSession: async (trainingData: {
    training_date: string;
    title: string;
    training_type: string;
    distance_km: number | null;
    duration_minutes: number | null;
    elevation_gain_meters: number | null;
    avg_heart_rate: number | null;
    perceived_effort: number;
    notes: string;
    source?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const upsertData = {
        user_id: user.id,
        ...trainingData,
      };
      console.log('--- DADOS DO TREINO PARA DEBUG ---', trainingData);
      console.log('OBJETO ENVIADO PARA O SUPABASE:', upsertData);
      const { data, error } = await supabase
        .from('training_sessions')
        .upsert(upsertData, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      throw error;
    }
  },

  saveTrainingSession: async (trainingData: any) => {
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
      return data;
    } catch (error) {
      console.error('Erro ao salvar treino (upsert):', error);
      throw error;
    }
  },
  deleteTrainingSession: async (sessionId: number | string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', sessionId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao deletar treino:', error);
      throw error;
    }
  },

  fetchTrainingSessions: async (startDate?: string, endDate?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
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
      set({ trainingSessions: data || [] });
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      set({ trainingSessions: [] });
    }
  },

  calculateAnalytics: (): UserAnalytics | null => {
    const { recentCheckins } = get();
    
    if (recentCheckins.length < 3) {
      return null; // Need at least 3 checkins for analytics
    }

    // Calculate averages
    const avgMood = recentCheckins.reduce((sum, c) => sum + c.mood_score, 0) / recentCheckins.length;
    const avgEnergy = recentCheckins.reduce((sum, c) => sum + c.energy_score, 0) / recentCheckins.length;
    const avgSleep = recentCheckins.reduce((sum, c) => sum + c.sleep_hours, 0) / recentCheckins.length;
    const avgSleepQuality = recentCheckins.reduce((sum, c) => sum + c.sleep_quality, 0) / recentCheckins.length;

    // Calculate trends (simple: compare first half vs second half)
    const mid = Math.floor(recentCheckins.length / 2);
    const firstHalf = recentCheckins.slice(mid);
    const secondHalf = recentCheckins.slice(0, mid);
    
    const firstMood = firstHalf.reduce((sum, c) => sum + c.mood_score, 0) / firstHalf.length;
    const secondMood = secondHalf.reduce((sum, c) => sum + c.mood_score, 0) / secondHalf.length;
    
    const moodTrend = secondMood > firstMood + 0.5 ? 'increasing' : 
                     secondMood < firstMood - 0.5 ? 'decreasing' : 'stable';

    const firstEnergy = firstHalf.reduce((sum, c) => sum + c.energy_score, 0) / firstHalf.length;
    const secondEnergy = secondHalf.reduce((sum, c) => sum + c.energy_score, 0) / secondHalf.length;
    
    const energyTrend = secondEnergy > firstEnergy + 0.5 ? 'increasing' : 
                       secondEnergy < firstEnergy - 0.5 ? 'decreasing' : 'stable';

    // Calculate correlations (simplified)
    const sleepEnergyCorr = calculateCorrelation(
      recentCheckins.map(c => c.sleep_hours),
      recentCheckins.map(c => c.energy_score)
    );

    const sleepMoodCorr = calculateCorrelation(
      recentCheckins.map(c => c.sleep_hours),
      recentCheckins.map(c => c.mood_score)
    );

    // Find best day of week
    const dayScores: { [key: string]: number[] } = {};
    recentCheckins.forEach(checkin => {
      const day = new Date(checkin.date).toLocaleDateString('pt-BR', { weekday: 'long' });
      if (!dayScores[day]) dayScores[day] = [];
      dayScores[day].push(checkin.mood_score);
    });

    let bestWeekday = 'Segunda-feira';
    let bestScore = 0;
    Object.entries(dayScores).forEach(([day, scores]) => {
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avg > bestScore) {
        bestScore = avg;
        bestWeekday = day;
      }
    });

    return {
      avgMood,
      avgEnergy,
      avgSleep,
      avgSleepQuality,
      moodTrend,
      energyTrend,
      sleepEnergyCorr,
      sleepMoodCorr,
      bestWeekday,
    };
  },

  calculateReadinessScore: (checkin: any) => {
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
      return data;
    } catch (error) {
      console.error('Erro ao marcar treino como realizado:', error);
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
}));

// Helper function to calculate correlation
function calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;
  
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
  
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
    return denominator === 0 ? 0 : numerator / denominator;
  }