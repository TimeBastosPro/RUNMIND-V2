import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';
import { Profile, FitnessTest } from '../types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  fitnessTests: FitnessTest[];
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  setInitializing: (value: boolean) => void;
  submitPreferences: (prefs: {
    trainingDays: string[];
    trainingPeriod: string;
    terrainType: string;
    workIntensity: number;
    sleepQuality: string;
    wakeFeeling: string;
    hydration: string;
    recoveryTechniques: string;
    stressManagement: string[];
  }) => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchFitnessTests: () => Promise<void>;
  saveFitnessTest: (testData: Omit<FitnessTest, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<FitnessTest>;
  updateFitnessTest: (testId: string, testData: Partial<Omit<FitnessTest, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<FitnessTest>;
  deleteFitnessTest: (testId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  isAuthenticated: false,
  isInitializing: true,
  fitnessTests: [],

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ 
        user: data.user, 
        isAuthenticated: true,
        isLoading: false 
      });
      
      await get().loadProfile();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            experience_level: 'beginner',
            main_goal: 'health',
            context_type: 'solo',
            onboarding_completed: false,
          });
          
        if (profileError) throw profileError;
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ 
      user: null, 
      profile: null, 
      isAuthenticated: false 
    });
  },

  loadProfile: async () => {
    console.log('Carregando perfil para o usuário:', get().user?.id);
    const { user } = get();
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      set({ profile: data });
      console.log('Perfil carregado com sucesso:', data);
    } catch (error) {
      console.log('ERRO ao carregar perfil:', error);
      console.error('Error loading profile:', error);
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    console.log('DEBUG - updateProfile chamado com:', updates);
    const { user, profile } = get();
    console.log('DEBUG - user:', user?.id, 'profile:', profile?.id);
    
    if (!user || !profile) {
      console.log('DEBUG - Usuário ou perfil não encontrado');
      return;
    }
    
    try {
      console.log('DEBUG - Enviando update para Supabase...');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      console.log('DEBUG - Resposta do Supabase:', { data, error });
        
      if (error) throw error;
      
      set({ profile: data });
      console.log('DEBUG - Perfil atualizado com sucesso:', data);
    } catch (error) {
      console.error('DEBUG - Erro ao atualizar perfil:', error);
      throw error;
    }
  },

  submitPreferences: async (prefs: {
    trainingDays: string[];
    trainingPeriod: string;
    terrainType: string;
    workIntensity: number;
    sleepQuality: string;
    wakeFeeling: string;
    hydration: string;
    recoveryTechniques: string;
    stressManagement: string[];
  }) => {
    const { user } = get();
    if (!user) throw new Error('Usuário não autenticado');
    try {
      const upsertData = {
        user_id: user.id,
        ...prefs,
      };
      const { error } = await supabase
        .from('profile_preferences')
        .upsert(upsertData, { onConflict: 'user_id' });
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      throw error;
    }
  },

  setInitializing: (value: boolean) => set({ isInitializing: value }),
  fetchProfile: async function() { return await get().loadProfile(); },

  fetchFitnessTests: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('fitness_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('test_date', { ascending: false });

      if (error) throw error;
      set({ fitnessTests: data || [] });
    } catch (error) {
      console.error('Erro ao buscar testes de fitness:', error);
    }
  },

  saveFitnessTest: async (testData: Omit<FitnessTest, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('fitness_tests')
        .insert([{
          ...testData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar a lista de testes
      const currentTests = get().fitnessTests;
      set({ fitnessTests: [data, ...currentTests] });

      return data;
    } catch (error) {
      console.error('Erro ao salvar teste de fitness:', error);
      throw error;
    }
  },

  updateFitnessTest: async (testId: string, testData: Partial<Omit<FitnessTest, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('fitness_tests')
        .update(testData)
        .eq('id', testId)
        .select()
        .single();

      if (error) throw error;

      // Atualizar a lista de testes
      const currentTests = get().fitnessTests;
      const updatedTests = currentTests.map(test =>
        test.id === testId ? data : test
      );
      set({ fitnessTests: updatedTests });

      return data;
    } catch (error) {
      console.error('Erro ao atualizar teste de fitness:', error);
      throw error;
    }
  },

  deleteFitnessTest: async (testId: string) => {
    console.log('DEBUG - deleteFitnessTest chamado com testId:', testId);
    console.log('DEBUG - Tipo do testId:', typeof testId);
    
    try {
      console.log('DEBUG - Enviando delete para Supabase...');
      const { error } = await supabase
        .from('fitness_tests')
        .delete()
        .eq('id', testId);

      console.log('DEBUG - Resposta do Supabase:', { error });

      if (error) {
        console.log('DEBUG - Erro retornado pelo Supabase:', error);
        throw error;
      }

      console.log('DEBUG - Delete executado com sucesso no Supabase');

      // Atualizar a lista de testes
      const currentTests = get().fitnessTests;
      console.log('DEBUG - Testes atuais:', currentTests.length);
      
      const updatedTests = currentTests.filter(test => test.id !== testId);
      console.log('DEBUG - Testes filtrados:', updatedTests.length);
      
      set({ fitnessTests: updatedTests });
      console.log('DEBUG - Estado atualizado com sucesso');
    } catch (error) {
      console.error('DEBUG - Erro ao deletar teste de fitness:', error);
      throw error;
    }
  },
}));