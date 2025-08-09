import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Configuração segura usando variáveis de ambiente (SEM fallback para evitar apontar para projeto incorreto)
const supabaseUrl = (Constants.expoConfig as any)?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
                   process.env.EXPO_PUBLIC_SUPABASE_URL ||
                   '';

const supabaseAnonKey = (Constants.expoConfig as any)?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                       process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                       '';

// Validação de segurança
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO: Variáveis de ambiente do Supabase não configuradas!');
  console.error('Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY em app.json (extra) ou variáveis de ambiente.');
  throw new Error('Configuração do Supabase inválida');
}

console.log('🔧 Supabase Config - URL:', supabaseUrl);
console.log('🔧 Supabase Config - Key: [oculta]');

// ✅ MELHORADO: Configuração específica para React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // ✅ NOVO: Configurações específicas para mobile
    flowType: 'pkce',
    debug: __DEV__, // Logs apenas em desenvolvimento
  },
  // ✅ NOVO: Configurações de rede para mobile
  global: {
    headers: {
      'X-Client-Info': 'runmind-mobile',
    },
  },
  // ✅ NOVO: Configurações de retry para mobile
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ✅ NOVO: Função para limpar dados de sessão corrompidos
export const clearCorruptedSession = async () => {
  try {
    console.log('🧹 Limpando sessão corrompida...');
    // Remove chaves conhecidas
    await AsyncStorage.removeItem('supabase.auth.token');
    await AsyncStorage.removeItem('supabase.auth.refreshToken');
    // Remove todas as chaves do Supabase (formato sb-<ref>-auth-token)
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter(k => k.startsWith('sb-') || k.includes('supabase'));
    if (toRemove.length) {
      await AsyncStorage.multiRemove(toRemove);
    }
    console.log('✅ Sessão limpa com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar sessão:', error);
  }
};

// ✅ NOVO: Função para verificar e reparar sessão
export const checkAndRepairSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('🔍 Erro ao verificar sessão:', error.message);
      if (error.message.includes('Refresh Token Not Found')) {
        console.log('🔧 Reparando sessão corrompida...');
        await clearCorruptedSession();
        return false;
      }
    }
    
    return !!session;
  } catch (error) {
    console.error('❌ Erro ao verificar sessão:', error);
    return false;
  }
};