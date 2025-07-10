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
  
  // Actions
  loadTodayCheckin: () => Promise<void>;
  loadRecentCheckins: (days?: number) => Promise<void>;
  submitCheckin: (checkinData: Omit<DailyCheckin, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  calculateAnalytics: () => UserAnalytics | null;
}

export const useCheckinStore = create<CheckinState>((set, get) => ({
  todayCheckin: null,
  recentCheckins: [],
  hasCheckedInToday: false,
  isLoading: false,
  isSubmitting: false,
  insights: [],

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

      set({ 
        todayCheckin: data,
        hasCheckedInToday: !!data,
        isLoading: false 
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

      // Check if already checked in today
      const { data: existing } = await supabase
        .from('checkin_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (existing) {
        throw new Error('Você já fez o check-in hoje!');
      }

      // Insert new checkin
      const { data, error } = await supabase
        .from('checkin_sessions')
        .insert({
          ...checkinData,
          user_id: user.id,
          date: today,
        })
        .select()
        .single();

      if (error) throw error;

      set({ 
        todayCheckin: data,
        hasCheckedInToday: true,
        isSubmitting: false 
      });

      // Reload recent checkins and generate insight
      await get().loadRecentCheckins();
      
      // Generate AI insight em background
      const analytics = get().calculateAnalytics();
      // if (analytics) {
      try {
        const insightText = await generateInsight(checkinData);
        set(state => ({ insights: [...state.insights, insightText] }));
        console.log('✨ Insight gerado pela IA:', insightText);
      } catch (error) {
        console.error('Erro ao gerar insight com IA:', error);
      }
      // }

    } catch (error) {
      set({ isSubmitting: false });
      throw error;
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