import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { 
  Macrociclo, 
  Mesociclo, 
  Microciclo, 
  CycleTrainingSession,
  CreateMacrocicloData,
  CreateMesocicloData,
  CreateMicrocicloData,
  CreateCycleTrainingSessionData
} from '../types/database';

interface CyclesState {
  // Estado
  macrociclos: Macrociclo[];
  mesociclos: Mesociclo[];
  microciclos: Microciclo[];
  cycleTrainingSessions: CycleTrainingSession[];
  isLoading: boolean;
  
  // Ações para Macrociclos
  fetchMacrociclos: () => Promise<void>;
  createMacrociclo: (data: CreateMacrocicloData) => Promise<Macrociclo>;
  updateMacrociclo: (id: string, data: Partial<CreateMacrocicloData>) => Promise<Macrociclo>;
  deleteMacrociclo: (id: string) => Promise<void>;
  
  // Ações para Mesociclos
  fetchMesociclos: (macrocicloId?: string) => Promise<void>;
  createMesociclo: (data: CreateMesocicloData) => Promise<Mesociclo>;
  updateMesociclo: (id: string, data: Partial<CreateMesocicloData>) => Promise<Mesociclo>;
  deleteMesociclo: (id: string) => Promise<void>;
  
  // Ações para Microciclos
  fetchMicrociclos: (mesocicloId?: string) => Promise<void>;
  createMicrociclo: (data: CreateMicrocicloData) => Promise<Microciclo>;
  updateMicrociclo: (id: string, data: Partial<CreateMicrocicloData>) => Promise<Microciclo>;
  deleteMicrociclo: (id: string) => Promise<void>;
  
  // Ações para Sessões de Treino em Ciclos
  fetchCycleTrainingSessions: (microcicloId?: string) => Promise<void>;
  createCycleTrainingSession: (data: CreateCycleTrainingSessionData) => Promise<CycleTrainingSession>;
  updateCycleTrainingSession: (id: string, data: Partial<CreateCycleTrainingSessionData>) => Promise<CycleTrainingSession>;
  deleteCycleTrainingSession: (id: string) => Promise<void>;
  
  // Utilitários
  getCurrentCycle: (date?: string) => { macrociclo?: Macrociclo; mesociclo?: Mesociclo; microciclo?: Microciclo };
  generateMicrociclos: (mesocicloId: string, startDate: string, endDate: string, weeksCount: number) => Promise<void>;
}

export const useCyclesStore = create<CyclesState>((set, get) => ({
  // Estado inicial
  macrociclos: [],
  mesociclos: [],
  microciclos: [],
  cycleTrainingSessions: [],
  isLoading: false,

  // === MACROCICLOS ===
  fetchMacrociclos: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('macrociclos')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      set({ macrociclos: data || [] });
    } catch (error) {
      console.error('Erro ao buscar macrociclos:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createMacrociclo: async (data: CreateMacrocicloData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: newMacrociclo, error } = await supabase
        .from('macrociclos')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista
      const currentMacrociclos = get().macrociclos;
      set({ macrociclos: [...currentMacrociclos, newMacrociclo] });

      return newMacrociclo;
    } catch (error) {
      console.error('Erro ao criar macrociclo:', error);
      throw error;
    }
  },

  updateMacrociclo: async (id: string, data: Partial<CreateMacrocicloData>) => {
    try {
      const { data: updatedMacrociclo, error } = await supabase
        .from('macrociclos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista
      const currentMacrociclos = get().macrociclos;
      const updatedMacrociclos = currentMacrociclos.map(m => 
        m.id === id ? updatedMacrociclo : m
      );
      set({ macrociclos: updatedMacrociclos });

      return updatedMacrociclo;
    } catch (error) {
      console.error('Erro ao atualizar macrociclo:', error);
      throw error;
    }
  },

  deleteMacrociclo: async (id: string) => {
    try {
      const { error } = await supabase
        .from('macrociclos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualizar lista
      const currentMacrociclos = get().macrociclos;
      const updatedMacrociclos = currentMacrociclos.filter(m => m.id !== id);
      set({ macrociclos: updatedMacrociclos });
    } catch (error) {
      console.error('Erro ao deletar macrociclo:', error);
      throw error;
    }
  },

  // === MESOCICLOS ===
  fetchMesociclos: async (macrocicloId?: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('mesociclos')
        .select('*')
        .eq('user_id', user.id);

      if (macrocicloId) {
        query = query.eq('macrociclo_id', macrocicloId);
      }

      const { data, error } = await query.order('start_date', { ascending: true });

      if (error) throw error;
      set({ mesociclos: data || [] });
    } catch (error) {
      console.error('Erro ao buscar mesociclos:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createMesociclo: async (data: CreateMesocicloData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: newMesociclo, error } = await supabase
        .from('mesociclos')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista
      const currentMesociclos = get().mesociclos;
      set({ mesociclos: [...currentMesociclos, newMesociclo] });

      return newMesociclo;
    } catch (error) {
      console.error('Erro ao criar mesociclo:', error);
      throw error;
    }
  },

  updateMesociclo: async (id: string, data: Partial<CreateMesocicloData>) => {
    try {
      const { data: updatedMesociclo, error } = await supabase
        .from('mesociclos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista
      const currentMesociclos = get().mesociclos;
      const updatedMesociclos = currentMesociclos.map(m => 
        m.id === id ? updatedMesociclo : m
      );
      set({ mesociclos: updatedMesociclos });

      return updatedMesociclo;
    } catch (error) {
      console.error('Erro ao atualizar mesociclo:', error);
      throw error;
    }
  },

  deleteMesociclo: async (id: string) => {
    try {
      const { error } = await supabase
        .from('mesociclos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualizar lista
      const currentMesociclos = get().mesociclos;
      const updatedMesociclos = currentMesociclos.filter(m => m.id !== id);
      set({ mesociclos: updatedMesociclos });
    } catch (error) {
      console.error('Erro ao deletar mesociclo:', error);
      throw error;
    }
  },

  // === MICROCICLOS ===
  fetchMicrociclos: async (mesocicloId?: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('microciclos')
        .select('*')
        .eq('user_id', user.id);

      if (mesocicloId) {
        query = query.eq('mesociclo_id', mesocicloId);
      }

      const { data, error } = await query.order('start_date', { ascending: true });

      if (error) throw error;
      set({ microciclos: data || [] });
    } catch (error) {
      console.error('Erro ao buscar microciclos:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createMicrociclo: async (data: CreateMicrocicloData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: newMicrociclo, error } = await supabase
        .from('microciclos')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista
      const currentMicrociclos = get().microciclos;
      set({ microciclos: [...currentMicrociclos, newMicrociclo] });

      return newMicrociclo;
    } catch (error) {
      console.error('Erro ao criar microciclo:', error);
      throw error;
    }
  },

  updateMicrociclo: async (id: string, data: Partial<CreateMicrocicloData>) => {
    try {
      const { data: updatedMicrociclo, error } = await supabase
        .from('microciclos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista
      const currentMicrociclos = get().microciclos;
      const updatedMicrociclos = currentMicrociclos.map(m => 
        m.id === id ? updatedMicrociclo : m
      );
      set({ microciclos: updatedMicrociclos });

      return updatedMicrociclo;
    } catch (error) {
      console.error('Erro ao atualizar microciclo:', error);
      throw error;
    }
  },

  deleteMicrociclo: async (id: string) => {
    try {
      const { error } = await supabase
        .from('microciclos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualizar lista
      const currentMicrociclos = get().microciclos;
      const updatedMicrociclos = currentMicrociclos.filter(m => m.id !== id);
      set({ microciclos: updatedMicrociclos });
    } catch (error) {
      console.error('Erro ao deletar microciclo:', error);
      throw error;
    }
  },

  // === SESSÕES DE TREINO EM CICLOS ===
  fetchCycleTrainingSessions: async (microcicloId?: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('cycle_training_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (microcicloId) {
        query = query.eq('microciclo_id', microcicloId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      set({ cycleTrainingSessions: data || [] });
    } catch (error) {
      console.error('Erro ao buscar sessões de treino em ciclos:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createCycleTrainingSession: async (data: CreateCycleTrainingSessionData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: newSession, error } = await supabase
        .from('cycle_training_sessions')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista
      const currentSessions = get().cycleTrainingSessions;
      set({ cycleTrainingSessions: [...currentSessions, newSession] });

      return newSession;
    } catch (error) {
      console.error('Erro ao criar sessão de treino em ciclo:', error);
      throw error;
    }
  },

  updateCycleTrainingSession: async (id: string, data: Partial<CreateCycleTrainingSessionData>) => {
    try {
      const { data: updatedSession, error } = await supabase
        .from('cycle_training_sessions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista
      const currentSessions = get().cycleTrainingSessions;
      const updatedSessions = currentSessions.map(s => 
        s.id === id ? updatedSession : s
      );
      set({ cycleTrainingSessions: updatedSessions });

      return updatedSession;
    } catch (error) {
      console.error('Erro ao atualizar sessão de treino em ciclo:', error);
      throw error;
    }
  },

  deleteCycleTrainingSession: async (id: string) => {
    try {
      const { error } = await supabase
        .from('cycle_training_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualizar lista
      const currentSessions = get().cycleTrainingSessions;
      const updatedSessions = currentSessions.filter(s => s.id !== id);
      set({ cycleTrainingSessions: updatedSessions });
    } catch (error) {
      console.error('Erro ao deletar sessão de treino em ciclo:', error);
      throw error;
    }
  },

  // === UTILITÁRIOS ===
  getCurrentCycle: (date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const { macrociclos, mesociclos, microciclos } = get();

    const currentMacrociclo = macrociclos.find(m => 
      targetDate >= m.start_date && targetDate <= m.end_date
    );

    const currentMesociclo = mesociclos.find(m => 
      targetDate >= m.start_date && targetDate <= m.end_date
    );

    const currentMicrociclo = microciclos.find(m => 
      targetDate >= m.start_date && targetDate <= m.end_date
    );

    return {
      macrociclo: currentMacrociclo,
      mesociclo: currentMesociclo,
      microciclo: currentMicrociclo
    };
  },

  generateMicrociclos: async (mesocicloId: string, startDate: string, endDate: string, weeksCount: number) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const weekDuration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));

      for (let i = 0; i < weeksCount; i++) {
        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() + (i * 7));
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        await get().createMicrociclo({
          mesociclo_id: mesocicloId,
          name: `Semana ${i + 1}`,
          description: `Microciclo ${i + 1} do mesociclo`,
          start_date: weekStart.toISOString().split('T')[0],
          end_date: weekEnd.toISOString().split('T')[0],
          week_number: i + 1,
          focus: 'Base',
          intensity_level: 'moderada',
          volume_level: 'moderado'
        });
      }
    } catch (error) {
      console.error('Erro ao gerar microciclos:', error);
      throw error;
    }
  }
})); 