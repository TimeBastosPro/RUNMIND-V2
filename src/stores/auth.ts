import { create } from 'zustand';
import { supabase, checkAndRepairSession, clearCorruptedSession } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { Profile, FitnessTest, Race } from '../types/database';
import { validatePassword, validateEmail, validateFullName, sanitizeInput } from '../utils/validation';
import { logLoginAttempt, logPasswordReset, logProfileUpdate, logAccountCreation, logLogout, logEmailVerification } from '../services/securityLogger';
import { loginRateLimiter, signupRateLimiter } from '../services/rateLimiter';
// Temporariamente desabilitado para resolver erro do React
// import { 
//   generateSignupConfirmation, 
//   generateFirstAccessMessage,
//   generateWelcomeMessage 
// } from '../utils/notifications';
// import { useNotificationsStore } from './notifications';

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
  signUp: (email: string, password: string, fullName: string, options?: { isCoach?: boolean; cref?: string }) => Promise<void>;
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
  
  // ✅ NOVO: Funções para correção de dados locais
  clearAllLocalData: () => Promise<void>;
  checkAndRepairSession: () => Promise<boolean>;
  loadProfileSafely: () => Promise<void>;
  // ✅ NOVO: Função para forçar limpeza completa e recarregamento
  forceCleanReload: () => Promise<void>;
  // ✅ NOVO: Função para verificar se a sessão ainda é válida
  validateSession: () => Promise<boolean>;
  // ✅ NOVO: Função para verificar sessão periodicamente
  startSessionValidation: () => () => void;
  // ✅ NOVO: Função para validar usuário antes do login
  validateUserBeforeLogin: (email: string) => Promise<any>;
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
      // ✅ MELHORADO: Validação de entrada
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.errors[0]);
      }
      
      const sanitizedEmail = email.toLowerCase().trim();
      
      // ✅ MELHORADO: Rate limiting para login
      const rateLimitResult = await loginRateLimiter.checkRateLimit(sanitizedEmail);
      if (!rateLimitResult.allowed) {
        const remainingTime = Math.ceil((rateLimitResult.blockedUntil! - Date.now()) / (1000 * 60));
        throw new Error(`Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`);
      }
      
      // ✅ MELHORADO: Log de tentativa de login
      try {
        await logLoginAttempt(sanitizedEmail, false, { stage: 'validation' });
      } catch (logError) {
        console.warn('⚠️ Erro ao logar tentativa de login:', logError);
      }
      
      // ✅ NOVO: VALIDAÇÃO PRÉ-LOGIN - Verificar se o usuário existe ANTES de fazer login
      console.log('🔍 VALIDAÇÃO PRÉ-LOGIN: Verificando usuário antes do login...');
      try {
        await get().validateUserBeforeLogin(sanitizedEmail);
        console.log('✅ VALIDAÇÃO PRÉ-LOGIN: Usuário validado com sucesso');
      } catch (preLoginError) {
        console.error('❌ ERRO PRÉ-LOGIN:', preLoginError);
        
        // ✅ Log de erro de validação pré-login
        try {
          await logLoginAttempt(sanitizedEmail, false, { 
            error: preLoginError instanceof Error ? preLoginError.message : String(preLoginError),
            stage: 'pre_login_validation'
          });
          await loginRateLimiter.recordAttempt(sanitizedEmail, false);
        } catch (logError) {
          console.warn('⚠️ Erro ao logar falha pré-login:', logError);
        }
        
        throw preLoginError;
      }
      
      // ✅ MELHORADO: Limpeza AGESSIVA antes do login
      console.log('🧹 Limpeza AGESSIVA antes do login...');
      await get().clearAllLocalData();
      
      // ✅ NOVO: Verificar se a limpeza foi efetiva
      const remainingKeys = await AsyncStorage.getAllKeys();
      console.log('🔍 Chaves restantes após limpeza:', remainingKeys);
      
      if (remainingKeys.some(key => key.includes('supabase') || key.includes('auth'))) {
        console.warn('⚠️ Ainda há chaves do Supabase após limpeza - forçando limpeza completa');
        await AsyncStorage.clear();
      }
      
      console.log('🔍 Chamando supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });
      
      console.log('🔍 Resposta do Supabase:', { 
        success: !!data.user, 
        error: error?.message,
        userId: data.user?.id 
      });
      
      if (error) {
        console.error('🔍 Erro no login:', error);
        
        // ✅ MELHORADO: Log de tentativa falhada
        try {
          await logLoginAttempt(sanitizedEmail, false, { 
            error: error.message,
            stage: 'supabase_auth'
          });
          await loginRateLimiter.recordAttempt(sanitizedEmail, false);
        } catch (logError) {
          console.warn('⚠️ Erro ao logar tentativa falhada:', logError);
        }
        
        // ✅ MELHORADO: Tratamento específico de erros para mobile
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Confirme seu email antes de fazer login.');
        } else if (error.message.includes('User not found')) {
          throw new Error('Usuário não encontrado. Verifique o email ou crie uma conta.');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Muitas tentativas. Aguarde alguns minutos.');
        } else if (error.message.includes('Network error')) {
          throw new Error('Erro de conexão. Verifique sua internet.');
        } else {
          throw error;
        }
      }
      
      if (data.user) {
        // ✅ NOVO: VALIDAÇÃO CRÍTICA - Verificar se o usuário realmente existe no banco
        console.log('🔍 VALIDAÇÃO CRÍTICA: Verificando existência do usuário no banco...');
        
        try {
          // 1. Verificar se existe na tabela profiles
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name, user_type, onboarding_completed')
            .eq('id', data.user.id)
            .single();
          
          if (profileError) {
            console.error('🔍 ERRO CRÍTICO: Usuário não encontrado em profiles:', profileError);
            
            // ✅ NOVO: Log de tentativa de login com usuário inexistente
            try {
              await logLoginAttempt(sanitizedEmail, false, { 
                error: 'User not found in profiles table',
                userId: data.user.id,
                stage: 'profile_validation'
              });
            } catch (logError) {
              console.warn('⚠️ Erro ao logar tentativa inválida:', logError);
            }
            
            // ✅ NOVO: Fazer logout imediatamente
            await supabase.auth.signOut({ scope: 'global' });
            await get().clearAllLocalData();
            
            throw new Error('Usuário não encontrado no sistema. Entre em contato com o suporte.');
          }
          
          // 2. Verificar se o email corresponde
          if (profileData.email !== sanitizedEmail) {
            console.error('🔍 ERRO CRÍTICO: Email não corresponde:', {
              profileEmail: profileData.email,
              loginEmail: sanitizedEmail
            });
            
            await supabase.auth.signOut({ scope: 'global' });
            await get().clearAllLocalData();
            
            throw new Error('Dados de usuário inconsistentes. Entre em contato com o suporte.');
          }
          
          // 3. Verificar se user_type está definido
          if (!profileData.user_type) {
            console.error('🔍 ERRO CRÍTICO: user_type não definido para usuário:', data.user.id);
            
            await supabase.auth.signOut({ scope: 'global' });
            await get().clearAllLocalData();
            
            throw new Error('Tipo de usuário não definido. Entre em contato com o suporte.');
          }
          
          // 4. Se for coach, verificar se existe na tabela coaches
          if (profileData.user_type === 'coach') {
            const { data: coachData, error: coachError } = await supabase
              .from('coaches')
              .select('id, user_id, full_name, email, cref')
              .eq('user_id', data.user.id)
              .single();
            
            if (coachError) {
              console.error('🔍 ERRO CRÍTICO: Coach não encontrado em coaches:', coachError);
              
              await supabase.auth.signOut({ scope: 'global' });
              await get().clearAllLocalData();
              
              throw new Error('Dados de treinador não encontrados. Entre em contato com o suporte.');
            }
          }
          
          console.log('✅ VALIDAÇÃO CRÍTICA: Usuário validado com sucesso');
          
        } catch (validationError) {
          console.error('🔍 ERRO NA VALIDAÇÃO CRÍTICA:', validationError);
          
          // ✅ NOVO: Limpeza de emergência
          await supabase.auth.signOut({ scope: 'global' });
          await get().clearAllLocalData();
          
          throw validationError;
        }
        
                 // ✅ MELHORADO: Log de login bem-sucedido
         try {
           await logLoginAttempt(sanitizedEmail, true, { 
             userId: data.user.id,
             userType: 'validated',
             stage: 'success'
           });
           await loginRateLimiter.recordAttempt(sanitizedEmail, true);
         } catch (logError) {
           console.warn('⚠️ Erro ao logar login bem-sucedido:', logError);
         }
        
        // ✅ MELHORADO: Garantir registro de domínio se necessário
        try {
          const userMetadata = (data.user as any)?.user_metadata;
          if (userMetadata?.user_type) {
            console.log('ℹ️ user_type presente nos metadados:', userMetadata.user_type);
          } else {
            console.log('ℹ️ user_type ausente. Não criar registros por padrão.');
          }
        } catch (ensureError) {
          console.log('⚠️ Erro ao garantir registro de domínio:', ensureError);
        }

        // ✅ MELHORADO: Carregar dados com correção automática de perfis duplicados
        await Promise.allSettled([get().loadProfileSafely()]);
        
        // Se for usuário do tipo coach, garantir navegação/coerência de stack
        try {
          if ((data.user as any)?.user_metadata?.user_type === 'coach') {
            useAuthStore.setState({ isAuthenticated: true });
          }
        } catch {}

        console.log('🔍 signIn concluído com sucesso');
      }
    } catch (error) {
      console.error('🔍 Erro no signIn:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, fullName: string, options?: { isCoach?: boolean; cref?: string }) => {
    console.log('🔍 signUp iniciado para email:', email);
    set({ isLoading: true });
    try {
      // ✅ MELHORADO: Validação robusta de entrada
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.errors[0]);
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors[0]);
      }
      
      const nameValidation = validateFullName(fullName);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.errors[0]);
      }
      
      // ✅ MELHORADO: Sanitizar dados
      const sanitizedEmail = email.toLowerCase().trim();
      const sanitizedName = sanitizeInput(fullName);
      
      // ✅ MELHORADO: Rate limiting para cadastro
      const rateLimitResult = await signupRateLimiter.checkRateLimit(sanitizedEmail);
      if (!rateLimitResult.allowed) {
        const remainingTime = Math.ceil((rateLimitResult.blockedUntil! - Date.now()) / (1000 * 60));
        throw new Error(`Muitas tentativas de cadastro. Tente novamente em ${remainingTime} minutos.`);
      }
      
      // ✅ NOVO: Limpar sessão corrompida antes do cadastro
      await clearCorruptedSession();
      
      console.log('🔍 Chamando supabase.auth.signUp...');
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          // Metadados para distinguir o tipo de conta já no Auth
          data: { full_name: sanitizedName, user_type: options?.isCoach ? 'coach' : 'athlete' }
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
          throw new Error('A senha deve atender aos requisitos de segurança.');
        } else if (error.message.includes('Invalid email')) {
          throw new Error('Email inválido. Verifique o formato.');
        } else if (error.message.includes('Network error')) {
          throw new Error('Erro de conexão. Verifique sua internet.');
        } else {
          throw error;
        }
      }
      
      if (data.user) {
        // ✅ MELHORADO: Log de criação de conta
        try {
          await logAccountCreation(sanitizedEmail, true, { 
            userType: options?.isCoach ? 'coach' : 'athlete',
            userId: data.user.id 
          });
          await signupRateLimiter.recordAttempt(sanitizedEmail, true);
        } catch (logError) {
          console.warn('⚠️ Erro ao logar criação de conta:', logError);
        }
        
        if (options?.isCoach) {
          console.log('🔍 Cadastro como TREINADOR. Criando perfil de treinador...');
          
          // ✅ CORRIGIDO: Para treinador, criar perfil básico em profiles E registro em coaches
          try {
            // 1. Criar perfil básico em profiles (necessário para navegação)
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: sanitizedEmail,
                full_name: sanitizedName,
                experience_level: 'beginner',
                main_goal: 'health',
                context_type: 'solo',
                onboarding_completed: false,
                user_type: 'coach', // ✅ NOVO: Marcar como treinador
              });
            
            if (profileError) {
              console.error('🔍 Erro ao criar perfil de treinador:', profileError);
              throw new Error('Erro ao criar perfil de treinador. Tente novamente.');
            }
            
            // 2. Criar registro em coaches com CREF
            const { error: coachInsertError } = await supabase
              .from('coaches')
              .insert([{ 
                user_id: data.user.id, 
                full_name: sanitizedName || sanitizedEmail, 
                email: sanitizedEmail,
                cref: options.cref // ✅ NOVO: Incluir CREF
              }]);
              
            if (coachInsertError) {
              console.error('🔍 Erro ao criar registro de coach:', coachInsertError);
              throw new Error('Erro ao criar registro de treinador. Tente novamente.');
            }
            
            console.log('🔍 Perfil de treinador criado com sucesso');
          } catch (error) {
            console.error('🔍 Erro na criação do perfil de treinador:', error);
            throw error;
          }
        } else {
          console.log('🔍 Cadastro como ATLETA. Criando profile...');
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: sanitizedEmail,
              full_name: sanitizedName,
              experience_level: 'beginner',
              main_goal: 'health',
              context_type: 'solo',
              onboarding_completed: false,
              user_type: 'athlete', // ✅ NOVO: Marcar como atleta
            });
            
          if (profileError) {
            console.error('🔍 Erro ao criar perfil:', profileError);
            throw new Error('Erro ao criar perfil. Tente novamente.');
          }
          console.log('🔍 Perfil (atleta) criado com sucesso');
        }
      }
      
      // Temporariamente desabilitado para resolver erro do React
      // ✅ NOVO: Mostrar notificação de confirmação de cadastro
      // const userType = options?.isCoach ? 'coach' : 'athlete';
      // const confirmationNotification = generateSignupConfirmation(sanitizedEmail, userType);
      // useNotificationsStore.getState().showNotification(confirmationNotification);
      
      // ✅ NOVO: Mostrar mensagem de boas-vindas após 2 segundos
      // setTimeout(() => {
      //   const welcomeNotification = generateFirstAccessMessage(sanitizedName, userType);
      //   useNotificationsStore.getState().showNotification(welcomeNotification);
      // }, 2000);
      
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
    set({ isLoading: true });
    
    try {
      // ✅ MELHORADO: Log de logout
      const currentUser = get().user;
      if (currentUser) {
        try {
          await logLogout(currentUser.id, { method: 'manual' });
        } catch (logError) {
          console.warn('⚠️ Erro ao logar logout:', logError);
        }
      }
      
      // 1. Fazer logout do Supabase com timeout
      console.log('🔍 Iniciando logout do Supabase...');
      const signOutWithTimeout = Promise.race([
        (async () => {
          try {
            const { error } = await supabase.auth.signOut({ scope: 'global' } as any);
            if (error) {
              console.log('⚠️ Logout do Supabase retornou erro:', error.message);
            } else {
              console.log('✅ Logout do Supabase realizado com sucesso');
            }
          } catch (e) {
            console.log('⚠️ Exceção no logout do Supabase:', (e as Error)?.message);
          }
        })(),
        new Promise<void>((resolve) => setTimeout(() => {
          console.log('⏰ Timeout do logout do Supabase');
          resolve();
        }, 3000)),
      ]);

      await signOutWithTimeout;
      
      // 2. Limpar dados locais
      console.log('🔍 Limpando dados locais...');
      try { 
        await clearCorruptedSession(); 
        console.log('✅ Sessão corrompida limpa');
      } catch (e) {
        console.log('⚠️ Erro ao limpar sessão corrompida:', e);
      }
      
      try { 
        await AsyncStorage.clear(); 
        console.log('✅ AsyncStorage limpo');
      } catch (e) {
        console.log('⚠️ Erro ao limpar AsyncStorage:', e);
      }
      
      // 3. Resetar estado
      console.log('🔍 Resetando estado da aplicação...');
      set({ 
        user: null, 
        profile: null, 
        isAuthenticated: false,
        isLoading: false,
        isInitializing: false,
        fitnessTests: [],
        races: [],
      });
      
      console.log('✅ Logout finalizado com sucesso');
      
      // 4. Redirecionar se estiver no web
      try { 
        if (typeof window !== 'undefined') {
          console.log('🔍 Redirecionando no web...');
          window.location.replace('/');
        }
      } catch (e) {
        console.log('⚠️ Erro no redirecionamento web:', e);
      }
      
    } catch (error) {
      console.error('❌ Erro crítico no logout:', error);
      
      // Mesmo com erro, limpar estado
      try {
        await AsyncStorage.clear();
        set({ 
          user: null, 
          profile: null, 
          isAuthenticated: false,
          isLoading: false,
          isInitializing: false,
          fitnessTests: [],
          races: [],
        });
        console.log('✅ Estado limpo mesmo com erro');
      } catch (cleanupError) {
        console.error('❌ Erro na limpeza de emergência:', cleanupError);
      }
      
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // ✅ NOVO: Função para reset de senha
  resetPassword: async (email: string) => {
    console.log('🔍 Reset de senha iniciado para:', email);
    set({ isLoading: true });
    try {
      // ✅ NOVO: Validação de email
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.errors[0]);
      }
      
      const sanitizedEmail = email.toLowerCase().trim();
      
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: 'runmind://reset-password',
      });
      
      if (error) {
        console.error('🔍 Erro no reset de senha:', error);
        throw new Error('Erro ao enviar email de reset. Tente novamente.');
      }
      
      // ✅ NOVO: Log de reset de senha
      try {
        await logPasswordReset(sanitizedEmail, true);
      } catch (logError) {
        console.warn('⚠️ Erro ao logar reset de senha:', logError);
      }
      
      console.log('🔍 Email de reset enviado com sucesso');
      set({ isLoading: false });
    } catch (error) {
      console.error('🔍 Erro no reset de senha:', error);
      
      // ✅ NOVO: Log de falha de reset de senha
      try {
        await logPasswordReset(email, false, { error: error instanceof Error ? error.message : 'Erro desconhecido' });
      } catch (logError) {
        console.warn('⚠️ Erro ao logar falha de reset de senha:', logError);
      }
      
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

  // ✅ NOVO: Função para validar usuário ANTES do login
  validateUserBeforeLogin: async (email: string) => {
    console.log('🔍 VALIDAÇÃO PRÉ-LOGIN: Verificando usuário antes do login...');
    
    const sanitizedEmail = email.trim().toLowerCase();
    
    try {
      // 1. Verificar se existe na tabela profiles pelo email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_type, onboarding_completed')
        .eq('email', sanitizedEmail)
        .single();
      
      if (profileError) {
        console.error('🔍 ERRO PRÉ-LOGIN: Usuário não encontrado em profiles:', profileError);
        throw new Error('Usuário não cadastrado no sistema. Crie uma conta primeiro.');
      }
      
      // 2. Verificar se user_type está definido
      if (!profileData.user_type) {
        console.error('🔍 ERRO PRÉ-LOGIN: user_type não definido para usuário:', profileData.id);
        throw new Error('Tipo de usuário não definido. Entre em contato com o suporte.');
      }
      
      // 3. Se for coach, verificar se existe na tabela coaches
      if (profileData.user_type === 'coach') {
        const { data: coachData, error: coachError } = await supabase
          .from('coaches')
          .select('id, user_id, full_name, email, cref')
          .eq('user_id', profileData.id)
          .single();
        
        if (coachError) {
          console.error('🔍 ERRO PRÉ-LOGIN: Coach não encontrado em coaches:', coachError);
          throw new Error('Dados de treinador não encontrados. Entre em contato com o suporte.');
        }
      }
      
      console.log('✅ VALIDAÇÃO PRÉ-LOGIN: Usuário validado com sucesso');
      return profileData;
      
    } catch (validationError) {
      console.error('🔍 ERRO NA VALIDAÇÃO PRÉ-LOGIN:', validationError);
      throw validationError;
    }
  },

  // ✅ MELHORADO: Função para limpar todos os dados locais de forma mais agressiva
  clearAllLocalData: async () => {
    console.log('🧹 Iniciando limpeza AGESSIVA de dados locais...');
    try {
      // ✅ NOVO: Limpeza mais específica do AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('🔍 Chaves encontradas no AsyncStorage:', allKeys);
      
      // Remover todas as chaves relacionadas ao Supabase
      const supabaseKeys = allKeys.filter(key => 
        key.includes('supabase') || 
        key.includes('sb-') || 
        key.includes('auth') ||
        key.includes('session') ||
        key.includes('token')
      );
      
      if (supabaseKeys.length > 0) {
        console.log('🧹 Removendo chaves do Supabase:', supabaseKeys);
        await AsyncStorage.multiRemove(supabaseKeys);
      }
      
      // ✅ NOVO: Limpar também chaves do Zustand se existirem
      const zustandKeys = allKeys.filter(key => 
        key.includes('zustand') || 
        key.includes('runmind') ||
        key.includes('auth')
      );
      
      if (zustandKeys.length > 0) {
        console.log('🧹 Removendo chaves do Zustand:', zustandKeys);
        await AsyncStorage.multiRemove(zustandKeys);
      }
      
      // ✅ NOVO: Limpeza completa como fallback
      await AsyncStorage.clear();
      
      // Limpar estado do Zustand
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        isInitializing: false,
        fitnessTests: [],
        races: [],
      });
      
      console.log('✅ Limpeza AGESSIVA concluída com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar dados locais:', error);
      // ✅ NOVO: Fallback para limpeza completa
      try {
        await AsyncStorage.clear();
        console.log('✅ Fallback: AsyncStorage limpo completamente');
      } catch (fallbackError) {
        console.error('❌ Erro no fallback:', fallbackError);
      }
    }
  },

  // ✅ MELHORADO: Função para verificar e reparar sessão corrompida
  checkAndRepairSession: async () => {
    console.log('🔍 Verificando integridade da sessão...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Verificar se o usuário no estado local corresponde ao da sessão
        const localUser = get().user;
        
        if (localUser && localUser.id !== session.user.id) {
          console.warn('⚠️ Sessão corrompida detectada - limpando dados locais');
          await get().clearAllLocalData();
          return false;
        }
        
        // ✅ NOVO: Verificar se há inconsistência entre email da sessão e perfil local
        if (localUser && localUser.email !== session.user.email) {
          console.warn('⚠️ Email inconsistente detectado - limpando dados locais');
          await get().clearAllLocalData();
          return false;
        }
        
        // ✅ NOVO: Verificar se o perfil local está correto
        const localProfile = get().profile;
        if (localProfile && localProfile.id !== session.user.id) {
          console.warn('⚠️ Perfil inconsistente detectado - limpando dados locais');
          await get().clearAllLocalData();
          return false;
        }
        
        // ✅ MELHORADO: Verificação específica para aline@gmail.com
        if (session.user.email === 'aline@gmail.com') {
          const currentProfile = get().profile;
          if (currentProfile && currentProfile.full_name === 'aline@gmail.com') {
            console.warn('⚠️ Perfil incorreto da Aline detectado - recarregando perfil correto');
            await get().loadProfileSafely();
          }
        }
        
        // ✅ NOVO: Verificação adicional - se o perfil não corresponde ao email da sessão
        if (localProfile && localProfile.email !== session.user.email) {
          console.warn('⚠️ Perfil com email incorreto detectado - limpando dados locais');
          await get().clearAllLocalData();
          return false;
        }
      }
      
      console.log('✅ Sessão válida');
      return true;
    } catch (error) {
      console.error('❌ Erro ao verificar sessão:', error);
      return false;
    }
  },

  // ✅ MELHORADO: Função para carregar perfil de forma segura com correção automática
  loadProfileSafely: async () => {
    console.log('🔍 Carregando perfil de forma segura...');
    try {
      // Limpar estado atual primeiro
      set({ profile: null });
      
      const { user } = get();
      if (!user) {
        console.log('🔍 Usuário não encontrado');
        return;
      }
      
      // ✅ NOVO: Verificação de segurança - garantir que o usuário atual é válido
      console.log('🔍 Verificando usuário atual:', {
        id: user.id,
        email: user.email,
        emailVerified: user.email_confirmed_at
      });
      
      // ✅ NOVO: Se o email não estiver verificado, pode ser um problema
      if (!user.email_confirmed_at) {
        console.warn('⚠️ Email não verificado - pode causar problemas de perfil');
      }
      
      // ✅ MELHORADO: Correção específica para aline@gmail.com com verificação mais robusta
      if (user.email === 'aline@gmail.com') {
        console.log('🔍 Aplicando correção específica para aline@gmail.com');
        
        // Buscar todos os perfis da Aline
        const { data: alineProfiles, error: alineError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', 'aline@gmail.com')
          .order('created_at', { ascending: false });
        
        if (alineError) {
          console.error('❌ Erro ao buscar perfis da Aline:', alineError);
          return;
        }
        
        if (alineProfiles && alineProfiles.length > 0) {
          console.log('🔍 Perfis encontrados para Aline:', alineProfiles.length);
          
          // ✅ MELHORADO: Priorizar perfil que corresponde ao usuário atual
          const matchingProfile = alineProfiles.find(p => p.id === user.id);
          if (matchingProfile) {
            set({ profile: matchingProfile });
            console.log('✅ Perfil da Aline carregado (correspondente):', matchingProfile.full_name);
            return;
          }
          
          // ✅ MELHORADO: Se não encontrar correspondente, usar o mais recente com dados completos
          const profilesWithData = alineProfiles.filter(p => p.full_name && p.full_name !== 'aline@gmail.com');
          if (profilesWithData.length > 0) {
            const bestProfile = profilesWithData[0];
            set({ profile: bestProfile });
            console.log('✅ Perfil da Aline carregado (melhor opção):', bestProfile.full_name);
            return;
          }
          
          // Última opção: usar o mais recente
          const latestProfile = alineProfiles[0];
          set({ profile: latestProfile });
          console.log('✅ Perfil da Aline carregado (mais recente):', latestProfile.full_name);
          return;
        }
      }
      
      // ✅ MELHORADO: Verificar se há múltiplos perfis para o mesmo email
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email);
      
      if (profilesError) {
        console.error('❌ Erro ao verificar perfis:', profilesError);
        return;
      }
      
      // Se há múltiplos perfis, usar o mais recente
      if (allProfiles && allProfiles.length > 1) {
        console.warn('⚠️ Múltiplos perfis detectados, usando o mais recente');
        const sortedProfiles = allProfiles.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const latestProfile = sortedProfiles[0];
        
        // Verificar se o perfil mais recente corresponde ao usuário atual
        if (latestProfile.id === user.id) {
          set({ profile: latestProfile });
          console.log('✅ Perfil mais recente carregado:', latestProfile.full_name);
        } else {
          console.warn('⚠️ Perfil mais recente não corresponde ao usuário atual');
          // Limpar dados locais e recarregar
          await get().clearAllLocalData();
          return;
        }
        return;
      }
      
      // Verificar se é treinador primeiro
      const { data: coachData } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (coachData) {
        console.log('🔍 Usuário é treinador - não carregando perfil de atleta');
        return;
      }
      
      // Carregar perfil de atleta
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.log('🔍 Perfil não encontrado');
        return;
      }
      
      set({ profile: profileData });
      console.log('✅ Perfil carregado com sucesso:', profileData.full_name);
      
    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error);
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
      // ✅ MELHORADO: Verificar se o usuário é treinador primeiro
      const { data: coachData } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (coachData) {
        console.log('🔍 Usuário é treinador, não carregando perfil de atleta');
        set({ profile: null });
        return;
      }
      
      // ✅ MELHORADO: Carregar perfil apenas se não for treinador
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

  // ✅ NOVO: Função para forçar limpeza completa e recarregamento
  forceCleanReload: async () => {
    console.log('🧹 FORÇANDO limpeza completa e recarregamento...');
    try {
      // 1. Limpar todos os dados locais
      await get().clearAllLocalData();
      
      // 2. Fazer logout do Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // 3. Limpar AsyncStorage novamente
      await AsyncStorage.clear();
      
      // 4. Resetar estado
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        isInitializing: false,
        fitnessTests: [],
        races: [],
      });
      
      console.log('✅ Limpeza completa forçada com sucesso');
    } catch (error) {
      console.error('❌ Erro na limpeza forçada:', error);
    }
  },

  // ✅ NOVO: Função para verificar se a sessão ainda é válida
  validateSession: async () => {
    console.log('🔍 VALIDANDO SESSÃO ATUAL...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('❌ Nenhuma sessão ativa encontrada');
        await get().clearAllLocalData();
        return false;
      }
      
      // ✅ VALIDAÇÃO CRÍTICA: Verificar se o usuário ainda existe no banco
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_type, onboarding_completed')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        console.error('🔍 ERRO CRÍTICO: Usuário não encontrado em profiles durante validação:', profileError);
        
        // ✅ NOVO: Log de sessão inválida
        try {
          await logLoginAttempt(session.user.email || 'unknown', false, { 
            error: 'User not found in profiles during session validation',
            userId: session.user.id,
            stage: 'session_validation'
          });
        } catch (logError) {
          console.warn('⚠️ Erro ao logar sessão inválida:', logError);
        }
        
        // ✅ NOVO: Limpeza de emergência
        await supabase.auth.signOut({ scope: 'global' });
        await get().clearAllLocalData();
        
        return false;
      }
      
      // ✅ Verificar se o email ainda corresponde
      if (profileData.email !== session.user.email) {
        console.error('🔍 ERRO CRÍTICO: Email não corresponde durante validação:', {
          profileEmail: profileData.email,
          sessionEmail: session.user.email
        });
        
        await supabase.auth.signOut({ scope: 'global' });
        await get().clearAllLocalData();
        
        return false;
      }
      
      // ✅ Se for coach, verificar se ainda existe na tabela coaches
      if (profileData.user_type === 'coach') {
        const { data: coachData, error: coachError } = await supabase
          .from('coaches')
          .select('id, user_id, full_name, email, cref')
          .eq('user_id', session.user.id)
          .single();
        
        if (coachError) {
          console.error('🔍 ERRO CRÍTICO: Coach não encontrado em coaches durante validação:', coachError);
          
          await supabase.auth.signOut({ scope: 'global' });
          await get().clearAllLocalData();
          
          return false;
        }
      }
      
      console.log('✅ Sessão validada com sucesso');
      return true;
      
    } catch (error) {
      console.error('🔍 Erro na validação de sessão:', error);
      
      // ✅ NOVO: Limpeza de emergência em caso de erro
      await supabase.auth.signOut({ scope: 'global' });
      await get().clearAllLocalData();
      
      return false;
    }
  },

  // ✅ NOVO: Função para verificar sessão periodicamente
  startSessionValidation: () => {
    console.log('🔍 Iniciando validação periódica de sessão...');
    
    // ✅ Validar a cada 5 minutos
    const validationInterval = setInterval(async () => {
      const isValid = await get().validateSession();
      
      if (!isValid) {
        console.log('❌ Sessão inválida detectada - limpando dados');
        clearInterval(validationInterval);
      }
    }, 5 * 60 * 1000); // 5 minutos
    
    // ✅ Retornar função para parar a validação
    return () => {
      console.log('🔍 Parando validação periódica de sessão...');
      clearInterval(validationInterval);
    };
  },
}));