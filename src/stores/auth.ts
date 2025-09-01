import { create } from 'zustand';
import { supabase, checkAndRepairSession, clearCorruptedSession } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { Profile, FitnessTest, Race } from '../types/database';
import { validatePassword, validateEmail, validateFullName, sanitizeInput } from '../utils/validation';
import { logLoginAttempt, logPasswordReset, logProfileUpdate, logAccountCreation, logLogout, logEmailVerification } from '../services/securityLogger';
import { loginRateLimiter, signupRateLimiter } from '../services/rateLimiter';
import { useViewStore } from './view';
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
  }) => Promise<any>;
  submitAnamnesis: (anamnesisData: {
    dateOfBirth?: string;
    weightKg?: number;
    heightCm?: number;
    bloodType?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    medicalConditions?: string[];
    medications?: string[];
    allergies?: string[];
    previousInjuries?: string[];
    familyMedicalHistory?: string;
    smokingStatus?: string;
    alcoholConsumption?: string;
    sleepHoursPerNight?: number;
    stressLevel?: number;
  }) => Promise<any>;
  submitParq: (parqData: {
    question1HeartCondition: boolean;
    question2ChestPain: boolean;
    question3Dizziness: boolean;
    question4BoneJointProblem: boolean;
    question5BloodPressure: boolean;
    question6PhysicalLimitation: boolean;
    question7DoctorRecommendation: boolean;
    additionalNotes?: string;
  }) => Promise<any>;
  loadCompleteProfile: () => Promise<any>;
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
  // ✅ REMOVIDO: Função para validar usuário antes do login
  // validateUserBeforeLogin: (email: string) => Promise<any>;
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
      // ✅ CORRIGIDO: Validação de entrada simplificada
      const sanitizedEmail = email.toLowerCase().trim();
      
      // ✅ CORRIGIDO: Rate limiting simplificado
      const rateLimitResult = await loginRateLimiter.checkRateLimit(sanitizedEmail);
      if (!rateLimitResult.allowed) {
        const remainingTime = Math.ceil((rateLimitResult.blockedUntil! - Date.now()) / (1000 * 60));
        throw new Error(`Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`);
      }
      
      // ✅ CORRIGIDO: Limpeza mais eficiente
      console.log('🧹 Limpeza antes do login...');
      await get().clearAllLocalData();
      
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
        // ✅ CORRIGIDO: VALIDAÇÃO CRÍTICA - Verificar primeiro se é treinador
        console.log('🔍 VALIDAÇÃO CRÍTICA: Verificando existência do usuário no banco...');
        
        try {
          // ✅ CORRIGIDO: 1. Verificar primeiro se existe na tabela coaches (treinadores)
          const { data: coachData, error: coachError } = await supabase
            .from('coaches')
            .select('id, user_id, full_name, email, cref')
            .eq('user_id', data.user.id)
            .single();
          
          if (!coachError && coachData) {
            console.log('✅ VALIDAÇÃO CRÍTICA: Treinador encontrado em coaches');
            
            // ✅ Verificar se o email corresponde
            if (coachData.email !== sanitizedEmail) {
              console.error('🔍 ERRO CRÍTICO: Email não corresponde para treinador:', {
                coachEmail: coachData.email,
                loginEmail: sanitizedEmail
              });
              
              await supabase.auth.signOut({ scope: 'global' });
              await get().clearAllLocalData();
              
              throw new Error('Dados de treinador inconsistentes. Entre em contato com o suporte.');
            }
            
            console.log('✅ VALIDAÇÃO CRÍTICA: Treinador validado com sucesso');
          } else {
            // ✅ CORRIGIDO: 2. Se não for treinador, verificar na tabela profiles (atletas)
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, email, full_name, user_type, onboarding_completed')
              .eq('id', data.user.id)
              .single();
            
            if (profileError) {
              console.error('🔍 ERRO CRÍTICO: Usuário não encontrado em profiles nem coaches:', profileError);
              
              // ✅ NOVO: Log de tentativa de login com usuário inexistente
              try {
                await logLoginAttempt(sanitizedEmail, false, { 
                  error: 'User not found in profiles or coaches table',
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
            
            // ✅ Verificar se o email corresponde
            if (profileData.email !== sanitizedEmail) {
              console.error('🔍 ERRO CRÍTICO: Email não corresponde:', {
                profileEmail: profileData.email,
                loginEmail: sanitizedEmail
              });
              
              await supabase.auth.signOut({ scope: 'global' });
              await get().clearAllLocalData();
              
              throw new Error('Dados de usuário inconsistentes. Entre em contato com o suporte.');
            }
            
            // ✅ Verificar se user_type está definido
            if (!profileData.user_type) {
              console.error('🔍 ERRO CRÍTICO: user_type não definido para usuário:', data.user.id);
              
              await supabase.auth.signOut({ scope: 'global' });
              await get().clearAllLocalData();
              
              throw new Error('Tipo de usuário não definido. Entre em contato com o suporte.');
            }
            
            console.log('✅ VALIDAÇÃO CRÍTICA: Atleta validado com sucesso');
          }
          
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
        
        // ✅ CORREÇÃO: Definir estado de autenticação para todos os usuários
        set({ 
          user: data.user, 
          isAuthenticated: true, 
          isLoading: false, 
          isInitializing: false 
        });

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
          
          // ✅ CORRIGIDO: Para treinador, criar APENAS registro em coaches (não em profiles)
          try {
            // Criar registro em coaches com CREF
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
      
      // ✅ MELHORADO: 1. Fazer logout do Supabase com timeout mais curto
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
        }, 5000)), // ✅ REDUZIDO: Timeout de 3s para 5s
      ]);

      await signOutWithTimeout;
      
      // ✅ MELHORADO: 2. Limpar dados locais de forma mais robusta
      console.log('🔍 Limpando dados locais...');
      
      // Limpar sessão corrompida
      try { 
        await clearCorruptedSession(); 
        console.log('✅ Sessão corrompida limpa');
      } catch (e) {
        console.log('⚠️ Erro ao limpar sessão corrompida:', e);
      }
      
      // Limpar AsyncStorage
      try { 
        await AsyncStorage.clear(); 
      } catch (e) {
        console.log('⚠️ Erro ao limpar AsyncStorage:', e);
      }
      
      // ✅ MELHORADO: 3. Resetar estado de forma mais completa
      console.log('🔍 Resetando estado da aplicação...');
      set({ 
        user: null, 
        profile: null, 
        isAuthenticated: false,
        isLoading: false, // ✅ GARANTIDO: isLoading sempre resetado
        isInitializing: false,
        fitnessTests: [],
        races: [],
      });
      
      console.log('✅ Logout finalizado com sucesso');
      
      // ✅ MELHORADO: 4. Redirecionar se estiver no web
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
      
      // ✅ MELHORADO: Mesmo com erro, garantir limpeza completa
      try {
        await AsyncStorage.clear();
        set({ 
          user: null, 
          profile: null, 
          isAuthenticated: false,
          isLoading: false, // ✅ GARANTIDO: isLoading sempre resetado mesmo com erro
          isInitializing: false,
          fitnessTests: [],
          races: [],
        });
        
        console.log('✅ Estado limpo mesmo com erro no logout');
      } catch (cleanupError) {
        console.error('❌ Erro na limpeza de emergência:', cleanupError);
        // ✅ ÚLTIMO RECURSO: Forçar reset do isLoading
        set({ isLoading: false });
      }
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

  // ✅ REMOVIDO: Função validateUserBeforeLogin que estava causando problemas
  // A validação agora é feita após o login bem-sucedido

  // ✅ MELHORADO: Função para limpar todos os dados locais de forma mais agressiva
  clearAllLocalData: async () => {
    try {
      // ✅ NOVO: Limpeza mais específica do AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Remover todas as chaves relacionadas ao Supabase
      const supabaseKeys = allKeys.filter(key => 
        key.includes('supabase') || 
        key.includes('sb-') || 
        key.includes('auth') ||
        key.includes('session') ||
        key.includes('token')
      );
      
      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
      }
      
      // ✅ NOVO: Limpar também chaves do Zustand se existirem
      const zustandKeys = allKeys.filter(key => 
        key.includes('zustand') || 
        key.includes('runmind') ||
        key.includes('auth')
      );
      
      if (zustandKeys.length > 0) {
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
      
      console.log('🧹 Limpeza de dados concluída');
    } catch (error) {
      console.error('❌ Erro ao limpar dados locais:', error);
      // ✅ NOVO: Fallback para limpeza completa
      try {
        await AsyncStorage.clear();
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
    const { user, profile } = get();
    
    if (!user) {
      return;
    }
    
    try {
      // ✅ CORRIGIDO: Verificar se o usuário é treinador, mas permitir atualização
      const { data: coachData } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!profile) {
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      set({ profile: data });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
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
      // ✅ CORRIGIDO: Salvar preferências na tabela training_preferences
      const preferenceData = {
        user_id: user.id,
        training_days: prefs.trainingDays,
        preferred_training_period: prefs.trainingPeriod as 'morning' | 'afternoon' | 'evening' | 'night',
        terrain_preference: prefs.terrainType as 'road' | 'trail' | 'track' | 'treadmill' | 'mixed',
        work_stress_level: prefs.workIntensity,
        sleep_consistency: prefs.sleepQuality as 'excellent' | 'good' | 'fair' | 'poor',
        wakeup_feeling: prefs.wakeFeeling as 'refreshed' | 'tired' | 'energetic' | 'groggy',
        hydration_habit: prefs.hydration as 'excellent' | 'good' | 'fair' | 'poor',
        recovery_habit: prefs.recoveryTechniques,
        stress_management: prefs.stressManagement,
      };
      
      const { data, error } = await supabase
        .from('training_preferences')
        .upsert(preferenceData, { onConflict: 'user_id' })
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('✅ Preferências salvas com sucesso na tabela training_preferences');
      return data;
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      throw error;
    }
  },

  // ✅ NOVO: Função para salvar anamnese
  submitAnamnesis: async (anamnesisData: {
    dateOfBirth?: string;
    weightKg?: number;
    heightCm?: number;
    bloodType?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    medicalConditions?: string[];
    medications?: string[];
    allergies?: string[];
    previousInjuries?: string[];
    familyMedicalHistory?: string;
    smokingStatus?: string;
    alcoholConsumption?: string;
    sleepHoursPerNight?: number;
    stressLevel?: number;
  }) => {
    const { user } = get();
    if (!user) throw new Error('Usuário não autenticado');
    try {
      const data = {
        user_id: user.id,
        date_of_birth: anamnesisData.dateOfBirth,
        weight_kg: anamnesisData.weightKg,
        height_cm: anamnesisData.heightCm,
        blood_type: anamnesisData.bloodType,
        emergency_contact_name: anamnesisData.emergencyContactName,
        emergency_contact_phone: anamnesisData.emergencyContactPhone,
        medical_conditions: anamnesisData.medicalConditions,
        medications: anamnesisData.medications,
        allergies: anamnesisData.allergies,
        previous_injuries: anamnesisData.previousInjuries,
        family_medical_history: anamnesisData.familyMedicalHistory,
        smoking_status: anamnesisData.smokingStatus,
        alcohol_consumption: anamnesisData.alcoholConsumption,
        sleep_hours_per_night: anamnesisData.sleepHoursPerNight,
        stress_level: anamnesisData.stressLevel,
      };
      
      const { data: result, error } = await supabase
        .from('anamnesis')
        .upsert(data, { onConflict: 'user_id' })
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('✅ Anamnese salva com sucesso');
      return result;
    } catch (error) {
      console.error('Erro ao salvar anamnese:', error);
      throw error;
    }
  },

  // ✅ NOVO: Função para salvar PARQ
  submitParq: async (parqData: {
    question1HeartCondition: boolean;
    question2ChestPain: boolean;
    question3Dizziness: boolean;
    question4BoneJointProblem: boolean;
    question5BloodPressure: boolean;
    question6PhysicalLimitation: boolean;
    question7DoctorRecommendation: boolean;
    additionalNotes?: string;
  }) => {
    const { user } = get();
    if (!user) throw new Error('Usuário não autenticado');
    try {
      const data = {
        user_id: user.id,
        question_1_heart_condition: parqData.question1HeartCondition,
        question_2_chest_pain: parqData.question2ChestPain,
        question_3_dizziness: parqData.question3Dizziness,
        question_4_bone_joint_problem: parqData.question4BoneJointProblem,
        question_5_blood_pressure: parqData.question5BloodPressure,
        question_6_physical_limitation: parqData.question6PhysicalLimitation,
        question_7_doctor_recommendation: parqData.question7DoctorRecommendation,
        additional_notes: parqData.additionalNotes,
      };
      
      const { data: result, error } = await supabase
        .from('parq_responses')
        .upsert(data, { onConflict: 'user_id' })
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('✅ PARQ salvo com sucesso');
      return result;
    } catch (error) {
      console.error('Erro ao salvar PARQ:', error);
      throw error;
    }
  },

  // ✅ NOVO: Função para carregar dados completos do perfil
  loadCompleteProfile: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      // Carregar dados básicos do perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Carregar anamnese
      const { data: anamnesisData } = await supabase
        .from('anamnesis')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      // Carregar preferências
      const { data: preferencesData } = await supabase
        .from('training_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      // Carregar PARQ
      const { data: parqData } = await supabase
        .from('parq_responses')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      console.log('✅ Dados completos do perfil carregados:', {
        profile: profileData,
        anamnesis: anamnesisData,
        preferences: preferencesData,
        parq: parqData
      });
      
      return {
        profile: profileData,
        anamnesis: anamnesisData,
        preferences: preferencesData,
        parq: parqData
      };
    } catch (error) {
      console.error('Erro ao carregar dados completos do perfil:', error);
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
    try {
      const { error } = await supabase
        .from('fitness_tests')
        .delete()
        .eq('id', testId);

      if (error) {
        throw error;
      }

      // Atualizar a lista de testes
      const currentTests = get().fitnessTests;
      const updatedTests = currentTests.filter(test => test.id !== testId);
      set({ fitnessTests: updatedTests });
    } catch (error) {
      console.error('Erro ao deletar teste de fitness:', error);
      throw error;
    }
  },

  fetchRaces: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let targetUserId: string | null = (user && (user as any).id) ? (user as any).id : null;
      
      // ✅ NOVO: Verificar se está no modo coach
      const { isCoachView, viewAsAthleteId } = useViewStore.getState();
      if (isCoachView && viewAsAthleteId) {
        targetUserId = viewAsAthleteId;
      }
      
      if (!targetUserId) {
        return;
      }

      const { data, error } = await supabase
        .from('races')
        .select('*')
        .eq('user_id', targetUserId)
        .order('start_date', { ascending: true });

      if (error) {
        throw error;
      }
      
      set({ races: data || [] });
    } catch (error) {
      console.error('Erro ao buscar provas:', error);
    }
  },

  saveRace: async (raceData: Omit<Race, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Validar dados antes de salvar
      if (!raceData.event_name || !raceData.city || !raceData.start_date || !raceData.start_time || !raceData.distance_km) {
        throw new Error('Todos os campos são obrigatórios');
      }

      // Validar formato da data (deve ser YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(raceData.start_date)) {
        throw new Error('Formato de data inválido');
      }

      // Validar formato da hora (deve ser HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(raceData.start_time)) {
        throw new Error('Formato de hora inválido');
      }

      // Validar distância (deve ser um número positivo)
      const distance = Number(raceData.distance_km);
      if (isNaN(distance) || distance <= 0) {
        throw new Error('Distância deve ser um número positivo');
      }
      
      const { data, error } = await supabase
        .from('races')
        .insert([{
          ...raceData,
          user_id: user.id,
          distance_km: distance // Garantir que é um número
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Atualizar a lista de provas no estado
      const currentRaces = get().races;
      const updatedRaces = [...currentRaces, data].sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
      
      set({ races: updatedRaces });

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
      const sortedRaces = updatedRaces.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
      set({ races: sortedRaces });

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
      
      console.log('🧹 Limpeza completa forçada');
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
      
      // ✅ CORRIGIDO: VALIDAÇÃO CRÍTICA - Verificar primeiro se é treinador
      // 1. Verificar primeiro se existe na tabela coaches (treinadores)
      const { data: coachData, error: coachError } = await supabase
        .from('coaches')
        .select('id, user_id, full_name, email, cref')
        .eq('user_id', session.user.id)
        .single();
      
      if (!coachError && coachData) {
        console.log('✅ VALIDAÇÃO DE SESSÃO: Treinador encontrado em coaches');
        
        // ✅ Verificar se o email ainda corresponde
        if (coachData.email !== session.user.email) {
          console.error('🔍 ERRO CRÍTICO: Email não corresponde para treinador durante validação:', {
            coachEmail: coachData.email,
            sessionEmail: session.user.email
          });
          
          await supabase.auth.signOut({ scope: 'global' });
          await get().clearAllLocalData();
          
          return false;
        }
        
        console.log('✅ Sessão de treinador validada com sucesso');
        return true;
      } else {
        // ✅ CORRIGIDO: 2. Se não for treinador, verificar na tabela profiles (atletas)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, user_type, onboarding_completed')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('🔍 ERRO CRÍTICO: Usuário não encontrado em profiles nem coaches durante validação:', profileError);
          
          // ✅ NOVO: Log de sessão inválida
          try {
            await logLoginAttempt(session.user.email || 'unknown', false, { 
              error: 'User not found in profiles or coaches during session validation',
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
        
        console.log('✅ Sessão de atleta validada com sucesso');
        return true;
      }
      
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