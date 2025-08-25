import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Verifica se há uma sessão válida
 */
export const checkAndRepairSession = async (): Promise<boolean> => {
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

/**
 * Limpa sessão corrompida
 */
export const clearCorruptedSession = async (): Promise<void> => {
  try {
    console.log('🧹 Limpando sessão corrompida...');
    
    // Limpar AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const supabaseKeys = keys.filter(key => 
      key.includes('supabase') || 
      key.includes('sb-') || 
      key.includes('auth')
    );
    
    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
      console.log('✅ Chaves do Supabase removidas');
    }
    
    // Fazer logout do Supabase
    await supabase.auth.signOut();
    console.log('✅ Logout do Supabase realizado');
    
  } catch (error) {
    console.error('❌ Erro ao limpar sessão corrompida:', error);
  }
};