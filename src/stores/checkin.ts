import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { generateInsight } from '../services/gemini';
import type { DailyCheckin, Insight, Race, TrainingSession } from '../types/database';

interface RecentCheckin {
  sleep_quality_score: number;
  soreness_score: number;
  mood_score: number;
  confidence_score: number;
  focus_score: number;
  energy_score: number;
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
  fetchRaces: () => Promise<void>;
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
    console.log('🔄 loadTodayCheckin chamada');
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ Usuário não autenticado');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      console.log('📅 Buscando check-in para a data:', today);
      console.log('👤 User ID:', user.id);
      
      // Buscar o check-in mais recente do dia
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('🔍 Resultado da busca:', { data, error });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Calcular readiness score se houver checkin
      let readiness = null;
      if (data) {
        readiness = get().calculateReadinessScore(data);
        console.log('📊 Readiness score calculado:', readiness);
      }
      
      const newState = { 
        todayCheckin: data,
        hasCheckedInToday: !!data,
        isLoading: false,
        todayReadinessScore: readiness,
        error: null
      };
      
      console.log('✅ Estado atualizado:', newState);
      set(newState);
    } catch (error: unknown) {
      console.error('❌ Error loading today checkin:', error);
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
        .select('sleep_quality_score, soreness_score, mood_score, confidence_score, focus_score, energy_score, notes, date')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });
      if (error) throw error;
      
      console.log('🔍 DEBUG - Checkins carregados:', {
        total: data?.length || 0,
        startDate: startDate.toISOString().split('T')[0],
        days: days,
        sampleData: data?.slice(0, 3)?.map(c => ({
          date: c.date,
          sleep_quality_score: c.sleep_quality_score,
          mood_score: c.mood_score,
          energy_score: c.energy_score
        }))
      });
      
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
      
      // Preparar dados para salvamento
      const upsertData = {
        user_id: user.id,
        ...trainingData,
        // Garantir que campos de array sejam salvos como JSON
        sensacoes: trainingData.sensacoes ? JSON.stringify(trainingData.sensacoes) : null,
        clima: trainingData.clima ? JSON.stringify(trainingData.clima) : null,
      };
      
      console.log('🔍 DEBUG - saveTrainingSession - Dados sendo enviados para o banco:', {
        ...upsertData,
        'planned_distance_km': upsertData.planned_distance_km,
        'planned_duration_hours': upsertData.planned_duration_hours,
        'planned_duration_minutes': upsertData.planned_duration_minutes,
        'trainingData original': trainingData
      });
      
      const { data, error } = await supabase
        .from('training_sessions')
        .upsert([upsertData], { onConflict: 'id' })
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('🔍 DEBUG - saveTrainingSession - Dados retornados do banco:', {
        id: data.id,
        title: data.title,
        status: data.status,
        'planned_distance_km': data.planned_distance_km,
        'planned_duration_hours': data.planned_duration_hours,
        'planned_duration_minutes': data.planned_duration_minutes,
        'distance_km': data.distance_km,
        'duracao_horas': data.duracao_horas,
        'duracao_minutos': data.duracao_minutos
      });
      
      // Atualizar o store local
      set(state => ({
        trainingSessions: state.trainingSessions.map(t => 
          t.id === data.id ? data : t
        ).concat(data.id ? [] : [data])
      }));
      
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
    console.log('deleteTrainingSession chamada com sessionId:', sessionId);
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      console.log('Usuário autenticado:', user.id);
      console.log('Tentando excluir treino com ID:', sessionId);
      
      const { data, error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', sessionId)
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
      
      console.log('🔍 DEBUG - Treinos carregados do banco:', data?.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        date: t.training_date,
        'planned_distance_km': t.planned_distance_km,
        'planned_duration_hours': t.planned_duration_hours,
        'planned_duration_minutes': t.planned_duration_minutes,
        'distance_km': t.distance_km,
        'duracao_horas': t.duracao_horas,
        'duracao_minutos': t.duracao_minutos
      })));
      
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
    const trainingLoad = completedSessions.map((t: TrainingSession) => {
      let duration = 0;
      if (typeof t.duration_minutes === 'number') {
        duration = t.duration_minutes;
      } else if (t.duration_hours || t.duration_minutes) {
        const hours = t.duration_hours && t.duration_hours !== '' ? 
          (isNaN(parseInt(t.duration_hours)) ? 0 : parseInt(t.duration_hours)) : 0;
        const minutes = t.duration_minutes && t.duration_minutes !== '' ? 
          (isNaN(parseInt(t.duration_minutes)) ? 0 : parseInt(t.duration_minutes)) : 0;
        duration = hours * 60 + minutes;
      }
      
      return {
        id: t.id,
        date: t.training_date,
        duration: duration,
        perceivedEffort: t.perceived_effort || 0,
        load: duration * (t.perceived_effort || 0),
        distance: t.distance_km || 0,
        elevation: t.elevation_gain_meters || 0,
      };
    });

    // 2. Carga Aguda (acuteLoad) - média dos últimos 7 dias para cada dia
    const acuteLoad: { date: string; value: number }[] = [];
    const allDates = completedSessions.map((t: TrainingSession) => t.training_date).sort();
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

    // 4. Eficiência de Corrida (runningEfficiency): para treinos de corrida realizados
    const runningEfficiency = completedSessions
      .filter((t: TrainingSession) => t.modalidade === 'corrida' && t.distance_km && t.distance_km > 0)
      .map((t: TrainingSession) => {
        let duration = 0;
        if (typeof t.duration_minutes === 'number') {
          duration = t.duration_minutes;
        } else if (t.duration_hours || t.duration_minutes) {
          const hours = t.duration_hours && t.duration_hours !== '' ? 
            (isNaN(parseInt(t.duration_hours)) ? 0 : parseInt(t.duration_hours)) : 0;
          const minutes = t.duration_minutes && t.duration_minutes !== '' ? 
            (isNaN(parseInt(t.duration_minutes)) ? 0 : parseInt(t.duration_minutes)) : 0;
          duration = hours * 60 + minutes;
        }
        
        return {
          pace: duration && t.distance_km ? duration / t.distance_km : 0,
          pse: t.perceived_effort || 0,
          date: t.training_date,
          distance: t.distance_km || 0,
          duration: duration,
        };
      });

    // 5. Comparação Planejado vs Realizado
    const plannedVsCompleted = completedSessions
      .filter(t => {
        // Buscar treino planejado correspondente
        const planned = plannedSessions.find(p => p.training_date === t.training_date);
        return planned && t.distance_km && planned.planned_distance_km;
      })
      .map(t => {
        const planned = plannedSessions.find(p => p.training_date === t.training_date)!;
        const plannedDuration = (planned.planned_duration_hours && planned.planned_duration_hours !== '' ? 
          (isNaN(parseInt(planned.planned_duration_hours)) ? 0 : parseInt(planned.planned_duration_hours)) * 60 : 0) + 
          (planned.planned_duration_minutes && planned.planned_duration_minutes !== '' ? 
          (isNaN(parseInt(planned.planned_duration_minutes)) ? 0 : parseInt(planned.planned_duration_minutes)) : 0);
        let actualDuration = 0;
        if (typeof t.duration_minutes === 'number') {
          actualDuration = t.duration_minutes;
        } else if (t.duration_hours || t.duration_minutes) {
          const hours = t.duration_hours && t.duration_hours !== '' ? 
            (isNaN(parseInt(t.duration_hours)) ? 0 : parseInt(t.duration_hours)) : 0;
          const minutes = t.duration_minutes && t.duration_minutes !== '' ? 
            (isNaN(parseInt(t.duration_minutes)) ? 0 : parseInt(t.duration_minutes)) : 0;
          actualDuration = hours * 60 + minutes;
        }
        
        return {
          date: t.training_date,
          plannedDistance: planned.planned_distance_km || 0,
          actualDistance: t.distance_km || 0,
          plannedDuration: plannedDuration,
          actualDuration: actualDuration,
          plannedEffort: planned.planned_perceived_effort || 0,
          actualEffort: t.perceived_effort || 0,
          completionRate: planned.planned_distance_km && t.distance_km ? 
            (t.distance_km / planned.planned_distance_km) * 100 : 0,
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
      
      let duration = 0;
      if (typeof t.duration_minutes === 'number') {
        duration = t.duration_minutes;
      } else if (t.duration_hours || t.duration_minutes) {
        const hours = t.duration_hours && t.duration_hours !== '' ? 
          (isNaN(parseInt(t.duration_hours)) ? 0 : parseInt(t.duration_hours)) : 0;
        const minutes = t.duration_minutes && t.duration_minutes !== '' ? 
          (isNaN(parseInt(t.duration_minutes)) ? 0 : parseInt(t.duration_minutes)) : 0;
        duration = hours * 60 + minutes;
      }
      
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
        trainingSessions: state.trainingSessions.map(t => t.id === id ? { ...t, ...updateData } as TrainingSession : t)
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

  fetchRaces: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('races')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      set({ races: data || [] });
    } catch (error) {
      console.error('Erro ao buscar provas:', error);
    }
  },
}));