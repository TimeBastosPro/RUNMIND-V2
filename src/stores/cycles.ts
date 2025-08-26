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
  fetchMacrociclos: (athleteId?: string) => Promise<void>;
  createMacrociclo: (data: CreateMacrocicloData, athleteId?: string) => Promise<Macrociclo>;
  updateMacrociclo: (id: string, data: Partial<CreateMacrocicloData>) => Promise<Macrociclo>;
  deleteMacrociclo: (id: string) => Promise<void>;
  
  // Mesociclos
  fetchMesociclos: (macrocicloId?: string, athleteId?: string) => Promise<void>;
  createMesociclo: (data: CreateMesocicloData, athleteId?: string) => Promise<Mesociclo>;
  updateMesociclo: (id: string, data: Partial<CreateMesocicloData>) => Promise<Mesociclo>;
  deleteMesociclo: (id: string) => Promise<void>;
  
  // Microciclos
  fetchMicrociclos: (mesocicloId?: string, athleteId?: string) => Promise<void>;
  createMicrociclo: (data: CreateMicrocicloData, athleteId?: string) => Promise<Microciclo>;
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
  fetchMacrociclos: async (athleteId?: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Determinar o user_id correto para buscar
      let targetUserId = user.id;
      
      if (athleteId) {
        // Se athleteId foi fornecido, buscar os ciclos do atleta
        console.log('🔄 Store: Treinador buscando macrociclos do atleta:', athleteId);
        targetUserId = athleteId;
      } else {
        console.log('🔄 Store: Atleta buscando próprios macrociclos:', user.id);
      }

      console.log('🔄 Store: Buscando macrociclos para usuário:', targetUserId);

      const { data: macrociclos, error } = await supabase
        .from('macrociclos')
        .select('*')
        .eq('user_id', targetUserId)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('❌ Store: Erro ao buscar macrociclos:', error);
        throw error;
      }

      console.log('✅ Store: Macrociclos carregados:', macrociclos?.length || 0, 'registros');
      set({ macrociclos: macrociclos || [] });
    } catch (error) {
      console.error('❌ Store: Erro ao buscar macrociclos:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createMacrociclo: async (data: CreateMacrocicloData, athleteId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Determinar o user_id correto
      let targetUserId = user.id;
      
      if (athleteId) {
        // Se athleteId foi fornecido, usar o ID do atleta
        console.log('🔄 Store: Treinador criando macrociclo para atleta:', athleteId);
        targetUserId = athleteId;
      } else {
        console.log('🔄 Store: Atleta criando macrociclo próprio:', user.id);
      }

      const { data: newMacrociclo, error } = await supabase
        .from('macrociclos')
        .insert([{ ...data, user_id: targetUserId }])
        .select()
        .maybeSingle();

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
        .maybeSingle();

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
  fetchMesociclos: async (macrocicloId?: string, athleteId?: string) => {
    set({ isLoading: true });
    try {
      console.log('🔍 DEBUG - Store: Buscando mesociclos, macrocicloId:', macrocicloId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ DEBUG - Store: Usuário não autenticado');
        return;
      }

      // Determinar o user_id correto para buscar
      let targetUserId = user.id;
      
      if (athleteId) {
        // Se athleteId foi fornecido, buscar os mesociclos do atleta
        console.log('🔄 Store: Treinador buscando mesociclos do atleta:', athleteId);
        targetUserId = athleteId;
      } else {
        console.log('🔄 Store: Atleta buscando próprios mesociclos:', user.id);
      }

      console.log('🔄 Store: Buscando mesociclos para usuário:', targetUserId);

      let query = supabase
        .from('mesociclos')
        .select('*')
        .eq('user_id', targetUserId);

      if (macrocicloId) {
        query = query.eq('macrociclo_id', macrocicloId);
      }

      const { data: mesociclos, error } = await query.order('start_date', { ascending: true });

      if (error) {
        console.error('❌ Store: Erro ao buscar mesociclos:', error);
        throw error;
      }

      console.log('✅ Store: Mesociclos carregados:', mesociclos?.length || 0, 'registros');
      set({ mesociclos: mesociclos || [] });
    } catch (error) {
      console.error('❌ Erro ao buscar mesociclos:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createMesociclo: async (data: CreateMesocicloData, athleteId?: string) => {
    try {
      console.log('🔄 Store: Iniciando criação do mesociclo:', data);
      console.log('🔄 Store: Dados recebidos:', JSON.stringify(data, null, 2));
      
      console.log('🔄 Store: Verificando autenticação...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Store: Erro de autenticação:', authError);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }
      
      if (!user) {
        console.error('❌ Store: Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      console.log('✅ Store: Usuário autenticado:', user.id);

      // Determinar o user_id correto
      let targetUserId = user.id;
      
      if (athleteId) {
        // Se athleteId foi fornecido, usar o ID do atleta
        console.log('🔄 Store: Treinador criando mesociclo para atleta:', athleteId);
        targetUserId = athleteId;
      } else {
        console.log('🔄 Store: Atleta criando mesociclo próprio:', user.id);
      }

      console.log('🔄 Store: Usuário autenticado:', user.id);
      console.log('🔄 Store: Dados para inserção:', { ...data, user_id: targetUserId });

      // Verificar se todos os campos obrigatórios estão presentes
      const requiredFields = ['macrociclo_id', 'name', 'start_date', 'end_date'];
      for (const field of requiredFields) {
        if (!data[field as keyof CreateMesocicloData]) {
          console.error(`❌ Store: Campo obrigatório ausente: ${field}`);
          throw new Error(`Campo obrigatório ausente: ${field}`);
        }
      }

      console.log('🔄 Store: Todos os campos obrigatórios presentes, fazendo inserção...');

      const { data: newMesociclo, error } = await supabase
        .from('mesociclos')
        .insert([{ ...data, user_id: targetUserId }])
        .select()
        .maybeSingle();

      if (error) {
        console.error('❌ Store: Erro do Supabase:', error);
        console.error('❌ Store: Detalhes do erro:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
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
      console.error('❌ Store: Stack trace:', error instanceof Error ? error.stack : 'N/A');
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
        .maybeSingle();

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
  fetchMicrociclos: async (mesocicloId?: string, athleteId?: string) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Determinar o user_id correto para buscar
      let targetUserId = user.id;
      
      if (athleteId) {
        // Se athleteId foi fornecido, buscar os microciclos do atleta
        console.log('🔄 Store: Treinador buscando microciclos do atleta:', athleteId);
        targetUserId = athleteId;
      } else {
        console.log('🔄 Store: Atleta buscando próprios microciclos:', user.id);
      }

      console.log('🔄 Store: Buscando microciclos para usuário:', targetUserId);

      let query = supabase
        .from('microciclos')
        .select('*')
        .eq('user_id', targetUserId);

      if (mesocicloId) {
        query = query.eq('mesociclo_id', mesocicloId);
      }

      const { data: microciclos, error } = await query.order('start_date', { ascending: true });

      if (error) {
        console.error('❌ Store: Erro ao buscar microciclos:', error);
        throw error;
      }

      console.log('✅ Store: Microciclos carregados:', microciclos?.length || 0, 'registros');
      set({ microciclos: microciclos || [] });
    } catch (error) {
      console.error('❌ Store: Erro ao buscar microciclos:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createMicrociclo: async (data: CreateMicrocicloData, athleteId?: string) => {
    try {
      console.log('🔄 Store: Iniciando criação do microciclo:', data);
      console.log('🔄 Store: Dados recebidos:', JSON.stringify(data, null, 2));
      
      console.log('🔄 Store: Verificando autenticação...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Store: Erro de autenticação:', authError);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }
      
      if (!user) {
        console.error('❌ Store: Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      console.log('✅ Store: Usuário autenticado:', user.id);

      // Determinar o user_id correto
      let targetUserId = user.id;
      
      if (athleteId) {
        // Se athleteId foi fornecido, usar o ID do atleta
        console.log('🔄 Store: Treinador criando microciclo para atleta:', athleteId);
        targetUserId = athleteId;
      } else {
        console.log('🔄 Store: Atleta criando microciclo próprio:', user.id);
      }

      console.log('🔄 Store: Usuário autenticado:', user.id);
      console.log('🔄 Store: Dados para inserção:', { ...data, user_id: targetUserId });

      // Verificar se todos os campos obrigatórios estão presentes
      const requiredFields = ['mesociclo_id', 'name', 'start_date', 'end_date'];
      for (const field of requiredFields) {
        if (!data[field as keyof CreateMicrocicloData]) {
          console.error(`❌ Store: Campo obrigatório ausente: ${field}`);
          throw new Error(`Campo obrigatório ausente: ${field}`);
        }
      }

      console.log('🔄 Store: Todos os campos obrigatórios presentes, fazendo inserção...');
      console.log('🔄 Store: Dados para inserção:', JSON.stringify({ ...data, user_id: targetUserId }, null, 2));

      console.log('🔄 Store: Chamando Supabase...');
      const { data: newMicrociclo, error } = await supabase
        .from('microciclos')
        .insert([{ ...data, user_id: targetUserId }])
        .select()
        .maybeSingle();

      if (error) {
        console.error('❌ Store: Erro do Supabase:', error);
        console.error('❌ Store: Código do erro:', error.code);
        console.error('❌ Store: Mensagem do erro:', error.message);
        console.error('❌ Store: Detalhes do erro:', error.details);
        console.error('❌ Store: Hint do erro:', error.hint);
        console.error('❌ Store: Stack trace:', error.stack);
        throw error;
      }

      console.log('✅ Store: Microciclo criado no banco:', newMicrociclo);

      // Atualizar lista
      const currentMicrociclos = get().microciclos;
      set({ microciclos: [...currentMicrociclos, newMicrociclo] });

      console.log('✅ Store: Estado atualizado, total de microciclos:', get().microciclos.length);
      return newMicrociclo;
    } catch (error) {
      console.error('❌ Store: Erro ao criar microciclo:', error);
      console.error('❌ Store: Stack trace:', error instanceof Error ? error.stack : 'N/A');
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
        .maybeSingle();

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
        .maybeSingle();

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
        .maybeSingle();

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