import { supabase } from './supabase';
import { Database } from '../types/database';

type Checkin = Database['public']['Tables']['checkins']['Row'];

/**
 * Busca todos os registros de check-in para um usuário específico.
 * @param userId O UUID do usuário.
 * @returns Uma promessa que resolve para um array de check-ins ou null em caso de erro.
 */
export const getCheckins = async (userId: string): Promise<Checkin[] | null> => {
  if (!userId) {
    console.error('getCheckins foi chamado sem um userId.');
    return null;
  }

  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false }); // Ordena do mais novo para o mais antigo

  if (error) {
    console.error('Erro ao buscar check-ins do Supabase:', error.message);
    return null;
  }

  return data;
}; 