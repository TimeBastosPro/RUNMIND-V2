import { create } from 'zustand';
import { supabase, checkAndRepairSession, clearCorruptedSession } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { Profile, FitnessTest, Race } from '../types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  fitnessTests: FitnessTest[];
  races: Race[];
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, options?: { isCoach?: boolean }) => Promise<void>;
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
  fetchRaces: () => Promise<void>;
  saveRace: (raceData: Omit<Race, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Race>;
  updateRace: (raceId: string, raceData: Partial<Omit<Race, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<Race>;
  deleteRace: (raceId: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  isAuthenticated: false,
  isInitializing: true,
  fitnessTests: [],
  races: [],

  signIn: async (email: string, password: string) => {
    console.log('🔍 signIn iniciado para email:', email);
    set({ isLoading: true });
    try {
      // ✅ NOVO: Verificar e reparar sessão antes do login
      await checkAndRepairSession();
      
      console.log('🔍 Chamando supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('🔍 Resposta do Supabase:', { 
        success: !!data.user, 
        error: error?.message,
        userId: data.user?.id 
      });
      
      if (error) {
        console.error('🔍 Erro do Supabase:', error);
        
        // ✅ MELHORADO: Tratamento específico de erros para mobile
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Confirme seu email antes de fazer login.');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Muitas tentativas de login. Aguarde alguns minutos.');
        } else if (error.message.includes('Network error')) {
          throw new Error('Erro de conexão. Verifique sua internet.');
        } else {
          throw error;
        }
      }
      
      console.log('🔍 Login bem-sucedido, atualizando estado...');
      set({ user: data.user, isAuthenticated: true, isLoading: false });

      // ✅ Garantir imediatamente o registro de domínio conforme o tipo
      const userId = data.user.id;
      const emailFromAuth = (data.user.email || '').toLowerCase();
      const fullNameFromMeta = (data.user.user_metadata?.full_name || data.user.user_metadata?.name || '').toString();
      const userType = (data.user.user_metadata?.user_type || '').toString();

      try {
        const [profileResEnsure, coachResEnsure] = await Promise.all([
          supabase.from('profiles').select('id').eq('id', userId).maybeSingle(),
          supabase.from('coaches').select('id').eq('user_id', userId).maybeSingle(),
        ]);
        const hasProfile = !!profileResEnsure.data;
        const hasCoach = !!coachResEnsure.data;

        if (userType === 'coach') {
          if (!hasCoach) {
            console.log('🛠️ Criando registro mínimo de coach...');
            const { error: coachInsertError } = await supabase
              .from('coaches')
              .insert([{ user_id: userId, full_name: fullNameFromMeta || emailFromAuth, email: emailFromAuth }]);
            if (coachInsertError) {
              console.log('⚠️ Falha ao criar coach minimal:', coachInsertError.message);
            }
          }
        } else if (userType === 'athlete') {
          // Atleta
          if (!hasProfile) {
            console.log('🛠️ Criando profile mínimo de atleta...');
            const { error: profileInsertError } = await supabase
              .from('profiles')
              .insert([{ id: userId, email: emailFromAuth, full_name: fullNameFromMeta || emailFromAuth, experience_level: 'beginner', main_goal: 'health', context_type: 'solo', onboarding_completed: false }]);
            if (profileInsertError) {
              console.log('⚠️ Falha ao criar profile minimal:', profileInsertError.message);
            }
          }
        } else {
          console.log('ℹ️ user_type ausente. Não criar registros por padrão.');
        }
      } catch (ensureError) {
        console.log('⚠️ Erro ao garantir registro de domínio:', ensureError);
      }

      // Carregar dados após garantir registro
      await Promise.allSettled([get().loadProfile()]);
      // Se for usuário do tipo coach, garantir navegação/coerência de stack
      try {
        if ((data.user as any)?.user_metadata?.user_type === 'coach') {
          useAuthStore.setState({ isAuthenticated: true });
        }
      } catch {}

      console.log('🔍 signIn concluído com sucesso');
    } catch (error) {
      console.error('🔍 Erro no signIn:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, fullName: string, options?: { isCoach?: boolean }) => {
    console.log('🔍 signUp iniciado para email:', email);
    set({ isLoading: true });
    try {
      // ✅ NOVO: Limpar sessão corrompida antes do cadastro
      await clearCorruptedSession();
      
      console.log('🔍 Chamando supabase.auth.signUp...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Metadados para distinguir o tipo de conta já no Auth
          data: { full_name: fullName, user_type: options?.isCoach ? 'coach' : 'athlete' }
        }
      });
      
      console.log('🔍 Resposta do Supabase:', { 
        success: !!data.user, 
        error: error?.message,
        userId: data.user?.id 
      });
      
      if (error) {
        console.error('🔍 Erro no cadastro:', error);
        
        // ✅ MELHORADO: Tratamento específico de erros para mobile
        if (error.message.includes('User already registered')) {
          throw new Error('Este email já está cadastrado. Tente fazer login.');
        } else if (error.message.includes('Password should be at least')) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        } else if (error.message.includes('Invalid email')) {
          throw new Error('Email inválido. Verifique o formato.');
        } else if (error.message.includes('Network error')) {
          throw new Error('Erro de conexão. Verifique sua internet.');
        } else {
          throw error;
        }
      }
      
      if (data.user) {
        if (options?.isCoach) {
          console.log('🔍 Cadastro como TREINADOR. Não criar profile de atleta.');
          // Para treinador, não criamos row em profiles. O perfil profissional será criado na tela de setup do coach.
          // Criaremos um registro mínimo em coaches para garantir navegação correta após login.
          try {
            const { error: coachInsertError } = await supabase
              .from('coaches')
              .insert([{ user_id: data.user.id, full_name: fullName || email, email }]);
            if (coachInsertError) {
              console.log('⚠️ Falha ao criar coach minimal no signUp:', coachInsertError.message);
            }
          } catch {}
        } else {
          console.log('🔍 Cadastro como ATLETA. Criando profile...');
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
          
        if (profileError) {
          console.error('🔍 Erro ao criar perfil:', profileError);
          throw new Error('Erro ao criar perfil. Tente novamente.');
        }
          console.log('🔍 Perfil (atleta) criado com sucesso');
        }
      }
      
      set({ isLoading: false });
      console.log('🔍 signUp concluído com sucesso');
    } catch (error) {
      console.error('🔍 Erro no signUp:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    console.log('🔍 Fazendo logout...');
    try {
      // Executa o signOut com timeout para evitar travar a UI em caso de rede ruim
      const signOutWithTimeout = Promise.race([
        // Em alguns ambientes o escopo 'global' pode falhar; usar padrão se necessário
        (async () => {
          try {
      const { error } = await supabase.auth.signOut({ scope: 'global' } as any);
      if (error) {
              console.log('🔍 Logout retornou erro, seguirá com limpeza:', error.message);
            }
          } catch (e) {
            console.log('🔍 Exceção no signOut, seguirá com limpeza:', (e as Error)?.message);
          }
        })(),
        new Promise<void>((resolve) => setTimeout(() => resolve(), 2000)),
      ]);

      await signOutWithTimeout;
    } finally {
      // Sempre limpar sessão e estado, mesmo que signOut falhe ou demore
      try { await clearCorruptedSession(); } catch {}
      try { await AsyncStorage.clear(); } catch {}
      
      set({ 
        user: null, 
        profile: null, 
        isAuthenticated: false,
        isLoading: false,
        isInitializing: false,
      });
      
      console.log('🔍 Logout finalizado (com ou sem erro)');
      try { if (typeof window !== 'undefined') window.location.replace('/'); } catch {}
    }
  },

  // ✅ NOVO: Função para reset de senha
  resetPassword: async (email: string) => {
    console.log('🔍 Reset de senha iniciado para:', email);
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'runmind://reset-password',
      });
      
      if (error) {
        console.error('🔍 Erro no reset de senha:', error);
        throw new Error('Erro ao enviar email de reset. Tente novamente.');
      }
      
      console.log('🔍 Email de reset enviado com sucesso');
      set({ isLoading: false });
    } catch (error) {
      console.error('🔍 Erro no reset de senha:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // ✅ NOVO: Função para verificar se email existe
  checkEmailExists: async (email: string) => {
    console.log('🔍 Verificando se email existe:', email);
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('🔍 Erro ao verificar email:', error);
        return false;
      }
      
      const userExists = data.users.some(user => user.email === email);
      console.log('🔍 Email existe:', userExists);
      return userExists;
    } catch (error) {
      console.error('🔍 Erro ao verificar email:', error);
      return false;
    }
  },

  loadProfile: async () => {
    console.log('🔍 Carregando perfil para o usuário:', get().user?.id);
    const { user } = get();
    if (!user) {
      console.log('🔍 Usuário não encontrado, pulando carregamento do perfil');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        if ((error as any).code === 'PGRST116') {
          // Perfil não encontrado: não criar automaticamente (treinador pode não ser atleta)
          console.log('🔍 Perfil não encontrado. Mantendo profile = null.');
          set({ profile: null });
          return;
        }
        throw error;
      } else {
        set({ profile: data });
        console.log('🔍 Perfil carregado com sucesso:', data);
      }
    } catch (error) {
      console.error('🔍 ERRO ao carregar perfil:', error);
      // Não rethrow para não quebrar o app
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

  saveRace: async (raceData: Omit<Race, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('races')
        .insert([{
          ...raceData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar a lista de provas
      const currentRaces = get().races;
      set({ races: [...currentRaces, data].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) });

      return data;
    } catch (error) {
      console.error('Erro ao salvar prova:', error);
      throw error;
    }
  },

  updateRace: async (raceId: string, raceData: Partial<Omit<Race, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('races')
        .update(raceData)
        .eq('id', raceId)
        .select()
        .single();

      if (error) throw error;

      // Atualizar a lista de provas
      const currentRaces = get().races;
      const updatedRaces = currentRaces.map(race =>
        race.id === raceId ? data : race
      );
      set({ races: updatedRaces.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) });

      return data;
    } catch (error) {
      console.error('Erro ao atualizar prova:', error);
      throw error;
    }
  },

  deleteRace: async (raceId: string) => {
    try {
      const { error } = await supabase
        .from('races')
        .delete()
        .eq('id', raceId);

      if (error) throw error;

      // Atualizar a lista de provas
      const currentRaces = get().races;
      const updatedRaces = currentRaces.filter(race => race.id !== raceId);
      set({ races: updatedRaces });
    } catch (error) {
      console.error('Erro ao deletar prova:', error);
      throw error;
    }
  },
}));