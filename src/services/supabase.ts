import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Configuração segura usando variáveis de ambiente
const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 
                   process.env.EXPO_PUBLIC_SUPABASE_URL ||
                   'https://dxzqfbslxtkxfayhydug.supabase.co';

const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                       process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4enFmYnNseHRreGZheWh5ZHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTYzMDgsImV4cCI6MjA2NzQ5MjMwOH0.CVNLjXJyRuNEOf_1P8YnF7zVlMUrsCvBUlMVxxn1tc4';

// Validação de segurança
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO: Variáveis de ambiente do Supabase não configuradas!');
  console.error('Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env');
  throw new Error('Configuração do Supabase inválida');
}

console.log('🔧 Supabase Config - URL:', supabaseUrl ? 'Configurado' : 'Não configurado');
console.log('🔧 Supabase Config - Key:', supabaseAnonKey ? 'Configurado' : 'Não configurado');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});