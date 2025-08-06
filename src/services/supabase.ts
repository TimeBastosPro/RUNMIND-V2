import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Configuração temporária para teste
const supabaseUrl = 'https://dxzqfbslxtkxfayhydug.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4enFmYnNseHRreGZheWh5ZHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTYzMDgsImV4cCI6MjA2NzQ5MjMwOH0.CVNLjXJyRuNEOf_1P8YnF7zVlMUrsCvBUlMVxxn1tc4';

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