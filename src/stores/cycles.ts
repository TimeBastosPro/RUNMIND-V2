import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { 
  Macrociclo, 
  Microciclo, 
  CycleTrainingSession,
  CreateMacrocicloData,
  CreateMesocicloData,
  CreateMicrocicloData,
  CreateCycleTrainingSessionData,
  Mesociclo
} from '../types/database';

interface CyclesState {
  macrociclos: Macrociclo[];
  mesociclos: Mesociclo[];
  microciclos: Microciclo[];
  cycleTrainingSessions: CycleTrainingSession[];
  isLoading: boolean;
  
  // Macrociclos
  fetchMacrociclos: () => Promise<void>;
  createMacrociclo: (data: CreateMacrocicloData) => Promise<Macrociclo>;
  updateMacrociclo: (id: string, data: Partial<CreateMacrocicloData>) => Promise<Macrociclo>;
  deleteMacrociclo: (id: string) => Promise<void>;
  
  // Mesociclos
  fetchMesociclos: (macrocicloId?: string) => Promise<void>;
  createMesociclo: (data: CreateMesocicloData) => Promise<Mesociclo>;
  updateMesociclo: (id: string, data: Partial<CreateMesocicloData>) => Promise<Mesociclo>;
  deleteMesociclo: (id: string) => Promise<void>;
  
  // Microciclos
  fetchMicrociclos: (mesocicloId?: string) => Promise<void>;
  createMicrociclo: (data: CreateMicrocicloData) => Promise<Microciclo>;
  updateMicrociclo: (id: string, data: Partial<CreateMicrocicloData>) => Promise<Microciclo>;
  deleteMicrociclo: (id: string) => Promise<void>;
  generateMicrociclos: (mesocicloId: string) => Promise<void>;
  
  // Sessões de treino
  fetchCycleTrainingSessions: (microcicloId?: string) => Promise<void>;
  createCycleTrainingSession: (data: CreateCycleTrainingSessionData) => Promise<CycleTrainingSession>;
  updateCycleTrainingSession: (id: string, data: Partial<CreateCycleTrainingSessionData>) => Promise<CycleTrainingSession>;
  deleteCycleTrainingSession: (id: string) => Promise<void>;
  
  // Utilitários
  getCurrentCycle: () => { macrociclo: Macrociclo | null; microciclo: Microciclo | null };
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
    console.log('🔄 Store: Iniciando exclusão do macrociclo:', id);
    try {
      // Primeiro, deletar todos os mesociclos relacionados
      console.log('🔄 Store: Deletando mesociclos relacionados...');
      const { error: mesociclosError } = await supabase
        .from('mesociclos')
        .delete()
        .eq('macrociclo_id', id);

      if (mesociclosError) {
        console.error('❌ Store: Erro ao deletar mesociclos relacionados:', mesociclosError);
        throw mesociclosError;
      }

      // Depois, deletar o macrociclo
      console.log('🔄 Store: Deletando macrociclo...');
      const { error } = await supabase
        .from('macrociclos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Store: Erro ao deletar macrociclo:', error);
        throw error;
      }

      // Atualizar listas
      console.log('🔄 Store: Atualizando estado local...');
      const currentMacrociclos = get().macrociclos;
      const updatedMacrociclos = currentMacrociclos.filter(m => m.id !== id);
      
      // Também limpar mesociclos relacionados do estado
      const currentMesociclos = get().mesociclos;
      const updatedMesociclos = currentMesociclos.filter(m => m.macrociclo_id !== id);
      
      set({ 
        macrociclos: updatedMacrociclos,
        mesociclos: updatedMesociclos
      });
      
      console.log('✅ Store: Macrociclo excluído com sucesso');
    } catch (error) {
      console.error('❌ Store: Erro ao deletar macrociclo:', error);
      throw error;
    }
  },

  // === MESOCICLOS ===
  fetchMesociclos: async (macrocicloId?: string) => {
    set({ isLoading: true });
    try {
      console.log('🔍 DEBUG - Store: Buscando mesociclos, macrocicloId:', macrocicloId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ DEBUG - Store: Usuário não autenticado');
        return;
      }

      let query = supabase
        .from('mesociclos')
        .select('*')
        .eq('user_id', user.id);

      if (macrocicloId) {
        query = query.eq('macrociclo_id', macrocicloId);
      }

      const { data, error } = await query.order('start_date', { ascending: true });

      if (error) {
        console.error('❌ Erro Supabase ao buscar mesociclos:', error);
        throw error;
      }

      console.log('✅ DEBUG - Store: Mesociclos carregados:', data?.length || 0, 'registros');
      if (data && data.length > 0) {
        console.log('🔍 DEBUG - Store: TODOS os mesociclos carregados:', data.map((m, index) => ({
          index: index + 1,
          id: m.id,
          name: m.name,
          type: m.mesociclo_type,
          start: m.start_date,
          end: m.end_date,
          macrociclo_id: m.macrociclo_id
        })));
      }

      set({ mesociclos: data || [] });
    } catch (error) {
      console.error('❌ Erro ao buscar mesociclos:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createMesociclo: async (data: CreateMesocicloData) => {
    try {
      console.log('🔄 Store: Iniciando criação do mesociclo:', data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log('🔄 Store: Usuário autenticado:', user.id);
      console.log('🔄 Store: Dados para inserção:', { ...data, user_id: user.id });

      const { data: newMesociclo, error } = await supabase
        .from('mesociclos')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('❌ Store: Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Store: Mesociclo criado no banco:', newMesociclo);

      // Atualizar lista local
      const currentMesociclos = get().mesociclos;
      const updatedMesociclos = [...currentMesociclos, newMesociclo];
      set({ mesociclos: updatedMesociclos });

      console.log('✅ Store: Estado atualizado, total de mesociclos:', get().mesociclos.length);
      return newMesociclo;
    } catch (error) {
      console.error('❌ Store: Erro ao criar mesociclo:', error);
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
    console.log('🔄 Store: Iniciando exclusão do mesociclo:', id);
    try {
      // Primeiro, deletar todos os microciclos relacionados
      console.log('🔄 Store: Deletando microciclos relacionados...');
      const { error: microciclosError } = await supabase
        .from('microciclos')
        .delete()
        .eq('mesociclo_id', id);

      if (microciclosError) {
        console.error('❌ Store: Erro ao deletar microciclos relacionados:', microciclosError);
        throw microciclosError;
      }

      // Depois, deletar o mesociclo
      const { error } = await supabase
        .from('mesociclos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Store: Erro ao deletar mesociclo:', error);
        throw error;
      }

      // Atualizar lista
      console.log('🔄 Store: Atualizando estado local do mesociclo...');
      const currentMesociclos = get().mesociclos;
      const updatedMesociclos = currentMesociclos.filter(m => m.id !== id);
      
      // Também limpar microciclos relacionados do estado
      const currentMicrociclos = get().microciclos;
      const updatedMicrociclos = currentMicrociclos.filter(m => m.mesociclo_id !== id);
      
      set({ 
        mesociclos: updatedMesociclos,
        microciclos: updatedMicrociclos
      });
      console.log('✅ Store: Mesociclo excluído com sucesso');
    } catch (error) {
      console.error('❌ Store: Erro ao deletar mesociclo:', error);
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
    console.log('🔄 Store: Iniciando exclusão do microciclo:', id);
    try {
      const { error } = await supabase
        .from('microciclos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Store: Erro ao deletar microciclo:', error);
        throw error;
      }

      // Atualizar lista
      console.log('🔄 Store: Atualizando estado local do microciclo...');
      const currentMicrociclos = get().microciclos;
      const updatedMicrociclos = currentMicrociclos.filter(m => m.id !== id);
      set({ microciclos: updatedMicrociclos });
      console.log('✅ Store: Microciclo excluído com sucesso');
    } catch (error) {
      console.error('❌ Store: Erro ao deletar microciclo:', error);
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

      const { data, error } = await query.order('scheduled_date', { ascending: true });

      if (error) throw error;
      set({ cycleTrainingSessions: data || [] });
    } catch (error) {
      console.error('Erro ao buscar sessões de treino:', error);
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
      console.error('Erro ao criar sessão de treino:', error);
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
      console.error('Erro ao atualizar sessão de treino:', error);
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
      console.error('Erro ao deletar sessão de treino:', error);
      throw error;
    }
  },

  // === UTILITÁRIOS ===
  getCurrentCycle: () => {
    const { macrociclos, microciclos } = get();
    
    const currentMacrociclo = macrociclos.find(m => 
      new Date() >= new Date(m.start_date) && new Date() <= new Date(m.end_date)
    ) || null;
    
    const currentMicrociclo = microciclos.find(m => 
      new Date() >= new Date(m.start_date) && new Date() <= new Date(m.end_date)
    ) || null;
    
    return {
      macrociclo: currentMacrociclo,
      microciclo: currentMicrociclo
    };
  },

  generateMicrociclos: async (mesocicloId: string) => {
    // Implementação para gerar microciclos automaticamente
    console.log('Gerando microciclos para mesociclo:', mesocicloId);
  }
})); 