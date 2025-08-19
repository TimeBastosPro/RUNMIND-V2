import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { 
  Coach, 
  Team, 
  AthleteCoachRelationship, 
  ActiveAthleteCoachRelationship,
  CreateCoachData,
  UpdateCoachData,
  CreateTeamData,
  UpdateTeamData,
  CreateRelationshipData,
  UpdateRelationshipData,
  CoachFilters,
  TeamFilters,
  RelationshipFilters
} from '../types/database';

interface CoachState {
  // Estado
  currentCoach: Coach | null;
  teams: Team[];
  relationships: AthleteCoachRelationship[];
  activeRelationships: ActiveAthleteCoachRelationship[];
  isLoading: boolean;
  error: string | null;
  
  // Actions para Coaches
  createCoachProfile: (coachData: CreateCoachData) => Promise<Coach>;
  loadCoachProfile: () => Promise<void>;
  updateCoachProfile: (updates: UpdateCoachData) => Promise<Coach>;
  deleteCoachProfile: () => Promise<void>;
  
  // Actions para Teams
  createTeam: (teamData: CreateTeamData) => Promise<Team>;
  loadTeams: (filters?: TeamFilters) => Promise<void>;
  updateTeam: (teamId: string, updates: UpdateTeamData) => Promise<Team>;
  deleteTeam: (teamId: string) => Promise<void>;
  
  // Actions para Relationships
  requestCoachRelationship: (coachId: string, teamId?: string, notes?: string, modality?: string) => Promise<AthleteCoachRelationship>;
  loadAthleteRelationships: (filters?: RelationshipFilters) => Promise<void>;
  loadCoachRelationships: (filters?: RelationshipFilters) => Promise<void>;
  approveRelationship: (relationshipId: string, teamId?: string, notes?: string) => Promise<AthleteCoachRelationship>;
  rejectRelationship: (relationshipId: string, notes?: string) => Promise<AthleteCoachRelationship>;
  cancelRelationship: (relationshipId: string) => Promise<void>;
  deactivateRelationship: (relationshipId: string) => Promise<AthleteCoachRelationship>;
  athleteUnlinkRelationship: (relationshipId: string) => Promise<AthleteCoachRelationship>;
  requestCoachRelationshipsBulk: (coachId: string, modalities: string[], teamId?: string, notes?: string) => Promise<{ successes: number; failures: number }>;
  deleteRelationship: (relationshipId: string) => Promise<void>;
  approveAllPendingForAthlete: (athleteId: string, notes?: string) => Promise<number>;
  rejectAllPendingForAthlete: (athleteId: string, notes?: string) => Promise<number>;
  
  // Actions para busca
  searchCoaches: (filters?: CoachFilters) => Promise<Coach[]>;
  getCoachById: (coachId: string) => Promise<Coach | null>;
  getTeamById: (teamId: string) => Promise<Team | null>;
  
  // Utilitários
  clearError: () => void;
  resetState: () => void;
}

export const useCoachStore = create<CoachState>((set, get) => ({
  // Estado inicial
  currentCoach: null,
  teams: [],
  relationships: [],
  activeRelationships: [],
  isLoading: false,
  error: null,

  // === ACTIONS PARA COACHES ===
  
  createCoachProfile: async (coachData: CreateCoachData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🔍 createCoachProfile - Dados recebidos:', coachData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      console.log('🔍 createCoachProfile - Usuário autenticado:', user.id);

      const insertData = {
        ...coachData,
        user_id: user.id
      };
      
      console.log('🔍 createCoachProfile - Dados para inserção:', insertData);

      const { data, error } = await supabase
        .from('coaches')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ createCoachProfile - Sucesso:', data);
      set({ currentCoach: data, isLoading: false });
      return data;
    } catch (error: any) {
      console.error('❌ createCoachProfile - Erro capturado:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  loadCoachProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        // Coach ausente: se o user for do tipo coach, criar registro mínimo idempotente
        const userType = (user as any)?.user_metadata?.user_type;
        if (userType === 'coach') {
          const fullName = (user as any)?.user_metadata?.full_name || (user.email ?? 'Coach');
          const email = user.email ?? '';
          // upsert idempotente baseado em user_id
          const { data: inserted, error: insertError } = await supabase
            .from('coaches')
            .upsert({ user_id: user.id, full_name: fullName, email, is_active: true }, { onConflict: 'user_id' })
            .select('*')
            .single();
          if (!insertError && inserted) {
            set({ currentCoach: inserted, isLoading: false });
            return;
          }
        }
        set({ currentCoach: null, isLoading: false });
        return;
      }

      set({ currentCoach: data, isLoading: false });
    } catch (error: any) {
      // Não falhar a inicialização do app por erro aqui
      set({ currentCoach: null, error: error?.message ?? String(error), isLoading: false });
    }
  },

  updateCoachProfile: async (updates: UpdateCoachData) => {
    set({ isLoading: true, error: null });
    try {
      const { currentCoach } = get();
      if (!currentCoach) throw new Error('Perfil de treinador não encontrado');

      const { data, error } = await supabase
        .from('coaches')
        .update(updates)
        .eq('id', currentCoach.id)
        .select()
        .single();

      if (error) throw error;

      set({ currentCoach: data, isLoading: false });
      return data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteCoachProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const { currentCoach } = get();
      if (!currentCoach) throw new Error('Perfil de treinador não encontrado');

      const { error } = await supabase
        .from('coaches')
        .delete()
        .eq('id', currentCoach.id);

      if (error) throw error;

      set({ 
        currentCoach: null, 
        teams: [], 
        relationships: [], 
        activeRelationships: [],
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // === ACTIONS PARA TEAMS ===

  createTeam: async (teamData: CreateTeamData) => {
    set({ isLoading: true, error: null });
    try {
      const { currentCoach } = get();
      if (!currentCoach) throw new Error('Perfil de treinador não encontrado');

      const { data, error } = await supabase
        .from('teams')
        .insert([{
          ...teamData,
          coach_id: currentCoach.id
        }])
        .select()
        .single();

      if (error) throw error;

      const currentTeams = get().teams;
      set({ teams: [...currentTeams, data], isLoading: false });
      return data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  loadTeams: async (filters?: TeamFilters) => {
    set({ isLoading: true, error: null });
    try {
      const { currentCoach } = get();
      if (!currentCoach) throw new Error('Perfil de treinador não encontrado');

      let query = supabase
        .from('teams')
        .select('*')
        .eq('coach_id', currentCoach.id);

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      set({ teams: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateTeam: async (teamId: string, updates: UpdateTeamData) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;

      const currentTeams = get().teams;
      const updatedTeams = currentTeams.map(team =>
        team.id === teamId ? data : team
      );
      set({ teams: updatedTeams, isLoading: false });
      return data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteTeam: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      const currentTeams = get().teams;
      const updatedTeams = currentTeams.filter(team => team.id !== teamId);
      set({ teams: updatedTeams, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // === ACTIONS PARA RELATIONSHIPS ===

  requestCoachRelationship: async (coachId: string, teamId?: string, notes?: string, modality?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const normalizedModality = (modality || 'unspecified').trim();
      if (!normalizedModality) {
        throw new Error('Selecione uma modalidade para solicitar vínculo');
      }

      // ✅ MELHORADO: Verificar relacionamentos existentes de forma mais robusta
      
      // 1. Verificar se já possui um relacionamento ATIVO na mesma modalidade (qualquer treinador)
      const { data: activeRel, error: activeErr } = await supabase
        .from('athlete_coach_relationships')
        .select('id, coach_id, status, modality')
        .eq('athlete_id', user.id)
        .eq('status', 'active')
        .eq('modality', normalizedModality)
        .limit(1);
      if (activeErr) throw activeErr;
      if (activeRel && activeRel.length > 0) {
        throw new Error(`Você já possui um treinador ativo para ${normalizedModality}. Desvincule antes de solicitar outro.`);
      }

      // 2. Verificar se já existe um relacionamento PENDENTE com este treinador na mesma modalidade
      const { data: existingPendingRelationship, error: checkError } = await supabase
        .from('athlete_coach_relationships')
        .select('*')
        .eq('athlete_id', user.id)
        .eq('coach_id', coachId)
        .eq('modality', normalizedModality)
        .eq('status', 'pending')
        .maybeSingle();

      if (checkError) {
        console.error('❌ Erro ao verificar relacionamento existente:', checkError);
        throw checkError;
      }

      if (existingPendingRelationship) {
        console.log('⚠️ Relacionamento pendente já existe:', existingPendingRelationship);
        throw new Error(`Você já possui uma solicitação pendente para ${normalizedModality} com este treinador`);
      }

      // 3. Verificar se já existe um relacionamento ATIVO com este treinador na mesma modalidade
      const { data: existingActiveRelationship, error: activeCheckError } = await supabase
        .from('athlete_coach_relationships')
        .select('*')
        .eq('athlete_id', user.id)
        .eq('coach_id', coachId)
        .eq('modality', normalizedModality)
        .eq('status', 'active')
        .maybeSingle();

      if (activeCheckError) {
        console.error('❌ Erro ao verificar relacionamento ativo existente:', activeCheckError);
        throw activeCheckError;
      }

      if (existingActiveRelationship) {
        console.log('⚠️ Relacionamento ativo já existe:', existingActiveRelationship);
        throw new Error(`Você já possui um vínculo ativo para ${normalizedModality} com este treinador`);
      }

      const { data, error } = await supabase
        .from('athlete_coach_relationships')
        .insert([{
          athlete_id: user.id,
          coach_id: coachId,
          team_id: teamId,
          notes,
          modality: normalizedModality,
          status: 'pending'
        }])
        .select();

      if (error) throw error;

      await get().loadAthleteRelationships();
      set({ isLoading: false });
      return (data as any)?.[0] as any;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  loadAthleteRelationships: async (filters?: RelationshipFilters) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('athlete_coach_relationships')
        .select('*')
        .eq('athlete_id', user.id);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.coach_id) {
        query = query.eq('coach_id', filters.coach_id);
      }
      if (filters?.team_id) {
        query = query.eq('team_id', filters.team_id);
      }

      const { data: baseRelationships, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!baseRelationships || baseRelationships.length === 0) {
        set({ relationships: [], isLoading: false });
        return;
      }

      // Buscar dados dos treinadores
      const coachIds = Array.from(new Set(baseRelationships.map(r => r.coach_id).filter(Boolean)));
      const { data: coachesData, error: coachesError } = await supabase
        .from('coaches')
        .select('id, full_name, email')
        .in('id', coachIds);

      if (coachesError) throw coachesError;

      // Criar mapa de treinadores por ID
      const coachesById: Record<string, { id: string; full_name: string; email: string }> = {};
      for (const coach of (coachesData || [])) {
        coachesById[coach.id] = coach;
      }

      // Combinar dados dos relacionamentos com dados dos treinadores
      const relationships = baseRelationships.map(r => ({
        ...r,
        coach_name: coachesById[r.coach_id]?.full_name,
        coach_email: coachesById[r.coach_id]?.email,
      }));

      console.log('🔍 Relacionamentos carregados com dados dos treinadores:', {
        total: relationships.length,
        coaches: relationships.map(r => ({ 
          id: r.coach_id, 
          name: r.coach_name, 
          email: r.coach_email,
          status: r.status 
        }))
      });

      set({ relationships, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  loadCoachRelationships: async (filters?: RelationshipFilters) => {
    set({ isLoading: true, error: null });
    try {
      const { currentCoach } = get();
      if (!currentCoach) throw new Error('Perfil de treinador não encontrado');

      console.log('🔍 loadCoachRelationships - Treinador:', currentCoach.id, currentCoach.full_name);

      let baseQuery = supabase
        .from('athlete_coach_relationships')
        .select('*')
        .eq('coach_id', currentCoach.id)
        .not('status', 'in', '(rejected,removed)'); // Não carregar relacionamentos rejeitados ou removidos

      if (filters?.status) {
        baseQuery = baseQuery.eq('status', filters.status);
        console.log('🔍 Aplicando filtro de status:', filters.status);
      }
      if (filters?.athlete_id) {
        baseQuery = baseQuery.eq('athlete_id', filters.athlete_id);
        console.log('🔍 Aplicando filtro de atleta:', filters.athlete_id);
      }
      if (filters?.team_id) {
        baseQuery = baseQuery.eq('team_id', filters.team_id);
        console.log('🔍 Aplicando filtro de equipe:', filters.team_id);
      }

      const { data: baseRelationships, error: baseError } = await baseQuery.order('created_at', { ascending: false });
      if (baseError) throw baseError;

      if (!baseRelationships || baseRelationships.length === 0) {
        set({ relationships: [], activeRelationships: [], isLoading: false });
        return;
      }

      const athleteIds = Array.from(new Set(baseRelationships.map(r => r.athlete_id).filter(Boolean)));
      const teamIds = Array.from(new Set(baseRelationships.map(r => r.team_id).filter(Boolean)));

      const [profilesRes, teamsRes] = await Promise.all([
        athleteIds.length > 0
          ? supabase.from('profiles').select('id, full_name, email').in('id', athleteIds)
          : Promise.resolve({ data: [], error: null } as any),
        teamIds.length > 0
          ? supabase.from('teams').select('id, name').in('id', teamIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      const profilesById: Record<string, { id: string; full_name: string; email: string }> = {};
      for (const p of ((profilesRes as any).data || [])) profilesById[p.id] = p;
      const teamsById: Record<string, { id: string; name: string }> = {};
      for (const t of ((teamsRes as any).data || [])) teamsById[t.id] = t;

      const relationships = baseRelationships.map(r => ({
        ...r,
        athlete_name: profilesById[r.athlete_id]?.full_name,
        athlete_email: profilesById[r.athlete_id]?.email,
        team_name: r.team_id ? teamsById[r.team_id]?.name : undefined,
      }));

      console.log('🔍 Relacionamentos totais:', baseRelationships.length);

      const activeOnly = relationships.filter(r => r.status === 'active' || r.status === 'approved');
      set({ relationships, activeRelationships: activeOnly as any, isLoading: false });
    } catch (error: any) {
      console.error('🔍 Erro em loadCoachRelationships:', error);
      set({ error: error.message ?? String(error), isLoading: false });
      throw error;
    }
  },

  approveRelationship: async (relationshipId: string, teamId?: string, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Tenta via RPC primeiro
      const { data, error } = await supabase.rpc('approve_relationship', {
        p_id: relationshipId,
        p_team_id: teamId ?? null,
        p_notes: notes ?? null,
      });
      if (error) throw error;
      await get().loadCoachRelationships();
      set({ isLoading: false });
      return Array.isArray(data) ? data[0] : data;
    } catch (rpcError: any) {
      // Fallback quando RPC não existe
      if (rpcError?.code === 'PGRST202' || /function/i.test(rpcError?.message || '')) {
        try {
          const { currentCoach } = get();
          if (!currentCoach) throw new Error('Perfil de treinador não encontrado');

          const { data: existingRel, error: checkError } = await supabase
            .from('athlete_coach_relationships')
            .select('*')
            .eq('id', relationshipId)
            .maybeSingle();
          if (checkError) throw checkError;
          if (!existingRel) throw new Error('Solicitação não encontrada');
          if (existingRel.coach_id !== currentCoach.id) throw new Error('Solicitação não pertence a este treinador');
          if (existingRel.status !== 'pending') throw new Error('Solicitação já processada');

          const updateData: any = {
            status: 'active',
            approved_at: new Date().toISOString(),
            approved_by: currentCoach.id,
          };
          if (notes && notes.trim()) updateData.notes = notes.trim();
          if (teamId) updateData.team_id = teamId;

          const { data: updatedRows, error: updateError } = await supabase
            .from('athlete_coach_relationships')
            .update(updateData)
            .eq('id', relationshipId)
            .select('*');
          if (updateError) throw updateError;
          if (!updatedRows || updatedRows.length === 0) throw new Error('Nenhum registro atualizado.');
          await get().loadCoachRelationships();
          set({ isLoading: false });
          return updatedRows[0];
        } catch (fbErr: any) {
          set({ error: fbErr.message, isLoading: false });
          throw fbErr;
        }
      }
      set({ error: rpcError.message, isLoading: false });
      throw rpcError;
    }
  },

  rejectRelationship: async (relationshipId: string, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('reject_relationship', {
        p_id: relationshipId,
        p_notes: notes ?? null,
      });
      if (error) throw error;
      // Otimista: remover imediatamente da lista
      const current = get().relationships || [] as any[];
      set({ relationships: current.filter((r: any) => r.id !== relationshipId) });
      await get().loadCoachRelationships();
      set({ isLoading: false });
      return Array.isArray(data) ? data[0] : data;
    } catch (rpcError: any) {
      if (rpcError?.code === 'PGRST202' || /function/i.test(rpcError?.message || '')) {
        try {
          const { currentCoach } = get();
          if (!currentCoach) throw new Error('Perfil de treinador não encontrado');

          const { data: existingRel, error: checkError } = await supabase
            .from('athlete_coach_relationships')
            .select('id, coach_id, status')
            .eq('id', relationshipId)
            .maybeSingle();
          if (checkError) throw checkError;
          if (!existingRel) throw new Error('Solicitação não encontrada');
          if (existingRel.coach_id !== currentCoach.id) throw new Error('Solicitação não pertence a este treinador');

          const updateData: any = { status: 'rejected', updated_at: new Date().toISOString() };
          if (notes && notes.trim()) updateData.notes = notes.trim();

          const { data: updatedRows, error: updateError } = await supabase
            .from('athlete_coach_relationships')
            .update(updateData)
            .eq('id', relationshipId)
            .select('*');
          if (updateError) throw updateError;

          if (!updatedRows || updatedRows.length === 0) {
            const { error: deleteError } = await supabase
              .from('athlete_coach_relationships')
              .delete()
              .eq('id', relationshipId)
              .neq('status', 'active');
            if (deleteError) throw deleteError;
          }

          // Otimista: remover imediatamente da lista
          const current = get().relationships || [] as any[];
          set({ relationships: current.filter((r: any) => r.id !== relationshipId) });

          await get().loadCoachRelationships();
          set({ isLoading: false });
          return updatedRows?.[0] ?? { id: relationshipId, status: 'rejected' } as any;
        } catch (fbErr: any) {
          set({ error: fbErr.message, isLoading: false });
          throw fbErr;
        }
      }
      set({ error: rpcError.message, isLoading: false });
      throw rpcError;
    }
  },

  deleteRelationship: async (relationshipId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { currentCoach } = get();
      if (!currentCoach) throw new Error('Perfil de treinador não encontrado');

      console.log('🗑️ Tentando remover relacionamento da visualização:', relationshipId);

      // Verificar o status do relacionamento antes de tentar remover
      const { data: existingRel, error: checkError } = await supabase
        .from('athlete_coach_relationships')
        .select('id, status, coach_id, notes')
        .eq('id', relationshipId)
        .maybeSingle();

      if (checkError) throw checkError;
      if (!existingRel) throw new Error('Relacionamento não encontrado');
      if (existingRel.coach_id !== currentCoach.id) throw new Error('Relacionamento não pertence a este treinador');
      if (existingRel.status === 'active') throw new Error('Não é possível remover relacionamentos ativos');

      console.log('🔍 Status do relacionamento:', existingRel.status);

      // Marcar como rejeitado (soft delete) - não excluir do banco
      const { data, error } = await supabase
        .from('athlete_coach_relationships')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString(),
          notes: existingRel.notes ? `${existingRel.notes} [Removido pelo treinador em ${new Date().toLocaleDateString('pt-BR')}]` : `Removido pelo treinador em ${new Date().toLocaleDateString('pt-BR')}`
        })
        .eq('id', relationshipId)
        .eq('coach_id', currentCoach.id)
        .select();

      if (error) {
        console.error('❌ Erro ao remover relacionamento:', error);
        throw error;
      }

      console.log('✅ Relacionamento removido da visualização:', data);

      // Remover da lista local imediatamente
      const currentRelationships = get().relationships;
      const updatedRelationships = currentRelationships.filter(rel => rel.id !== relationshipId);
      set({ relationships: updatedRelationships, isLoading: false });

      // Recarregar para garantir sincronização
      await get().loadCoachRelationships();
    } catch (error: any) {
      console.error('❌ Erro na remoção:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  cancelRelationship: async (relationshipId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('athlete_coach_relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;

      const currentRelationships = get().relationships;
      const updatedRelationships = currentRelationships.filter(rel => rel.id !== relationshipId);
      set({ relationships: updatedRelationships, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deactivateRelationship: async (relationshipId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('deactivate_relationship', {
        p_id: relationshipId,
        p_notes: null,
      });
      if (error) throw error;
      await get().loadCoachRelationships();
      set({ isLoading: false });
      return Array.isArray(data) ? data[0] : data;
    } catch (rpcError: any) {
      if (rpcError?.code === 'PGRST202' || /function/i.test(rpcError?.message || '')) {
        try {
          const { currentCoach } = get();
          if (!currentCoach) throw new Error('Perfil de treinador não encontrado');

          const { data: existingRel, error: checkError } = await supabase
            .from('athlete_coach_relationships')
            .select('id, coach_id, status')
            .eq('id', relationshipId)
            .maybeSingle();
          if (checkError) throw checkError;
          if (!existingRel) throw new Error('Atleta não encontrado');
          if (existingRel.coach_id !== currentCoach.id) throw new Error('Atleta não pertence a este treinador');
          if (!['active', 'approved'].includes(existingRel.status)) throw new Error('Apenas vínculos ativos podem ser desativados');

          const { data: updatedRows, error: updateError } = await supabase
            .from('athlete_coach_relationships')
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
            .eq('id', relationshipId)
            .eq('coach_id', currentCoach.id)
            .select('*');
          if (updateError) throw updateError;
          if (!updatedRows || updatedRows.length === 0) throw new Error('Nenhum registro atualizado.');

          await get().loadCoachRelationships();
          set({ isLoading: false });
          return updatedRows[0];
        } catch (fbErr: any) {
          set({ error: fbErr.message, isLoading: false });
          throw fbErr;
        }
      }
      set({ error: rpcError.message, isLoading: false });
      throw rpcError;
    }
  },

  athleteUnlinkRelationship: async (relationshipId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('athlete_coach_relationships')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', relationshipId)
        .eq('athlete_id', user.id)
        .select('*');

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Nenhum registro atualizado');

      await get().loadAthleteRelationships();
      set({ isLoading: false });
      return data[0];
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  requestCoachRelationshipsBulk: async (coachId: string, modalities: string[], teamId?: string, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (!modalities || modalities.length === 0) {
        throw new Error('Selecione ao menos uma modalidade');
      }

      console.log('🔍 Iniciando vinculação em lote:', { coachId, modalities, teamId });

      const results = await Promise.allSettled(
        modalities.map((m) => get().requestCoachRelationship(coachId, teamId, notes, m))
      );

      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      console.log('🔍 Resultados da vinculação:', {
        total: results.length,
        successes: successes.length,
        failures: failures.length,
        failureDetails: failures.map((f: any) => f.reason?.message || 'Erro desconhecido')
      });

      // Recarregar relacionamentos ao final
      await get().loadAthleteRelationships();
      set({ isLoading: false });

      if (successes.length === 0 && failures.length > 0) {
        const firstError: any = (failures[0] as PromiseRejectedResult).reason;
        throw new Error(firstError?.message || 'Não foi possível enviar as solicitações');
      }

      // ✅ MELHORADO: Retornar informações mais detalhadas
      const result = { 
        successes: successes.length, 
        failures: failures.length,
        total: results.length
      };

      if (failures.length > 0) {
        console.warn('⚠️ Algumas vinculações falharam:', failures.map((f: any) => f.reason?.message));
      }

      return result;
    } catch (error: any) {
      console.error('❌ Erro na vinculação em lote:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  approveAllPendingForAthlete: async (athleteId: string, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { currentCoach } = get();
      if (!currentCoach) throw new Error('Perfil de treinador não encontrado');

      const updateData: any = {
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: currentCoach.id,
      };
      if (notes && notes.trim()) updateData.notes = notes.trim();

      const { data, error } = await supabase
        .from('athlete_coach_relationships')
        .update(updateData)
        .eq('coach_id', currentCoach.id)
        .eq('athlete_id', athleteId)
        .eq('status', 'pending')
        .select('id');

      if (error) throw error;

      // Otimista: remover pendentes desse atleta da lista local
      const current = get().relationships || [] as any[];
      set({ relationships: current.filter((r: any) => !(r.athlete_id === athleteId && r.status === 'pending')) });

      await get().loadCoachRelationships();
      set({ isLoading: false });
      return data?.length || 0;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  rejectAllPendingForAthlete: async (athleteId: string, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { currentCoach } = get();
      if (!currentCoach) throw new Error('Perfil de treinador não encontrado');

      const updateData: any = { status: 'rejected', updated_at: new Date().toISOString() };
      if (notes && notes.trim()) updateData.notes = notes.trim();

      const { data: updated, error: updErr } = await supabase
        .from('athlete_coach_relationships')
        .update(updateData)
        .eq('coach_id', currentCoach.id)
        .eq('athlete_id', athleteId)
        .eq('status', 'pending')
        .select('id');
      if (updErr) throw updErr;

      if (!updated || updated.length === 0) {
        const { error: delErr } = await supabase
          .from('athlete_coach_relationships')
          .delete()
          .eq('coach_id', currentCoach.id)
          .eq('athlete_id', athleteId)
          .eq('status', 'pending');
        if (delErr) throw delErr;
      }

      // Otimista: remover pendentes desse atleta da lista local
      const current = get().relationships || [] as any[];
      set({ relationships: current.filter((r: any) => !(r.athlete_id === athleteId && r.status === 'pending')) });

      await get().loadCoachRelationships();
      set({ isLoading: false });
      return updated?.length || 0;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // === ACTIONS PARA BUSCA ===

  searchCoaches: async (filters?: CoachFilters) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🔍 Iniciando busca de treinadores com filtros:', filters);
      
      let query = supabase
        .from('coaches')
        .select('*');

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
        console.log('🔍 Aplicando filtro is_active:', filters.is_active);
      }
      if (filters?.experience_years_min) {
        query = query.gte('experience_years', filters.experience_years_min);
        console.log('🔍 Aplicando filtro experience_years_min:', filters.experience_years_min);
      }
      if (filters?.specialties && filters.specialties.length > 0) {
        query = query.overlaps('specialties', filters.specialties);
        console.log('🔍 Aplicando filtro specialties:', filters.specialties);
      }
      
      // Busca por texto (nome)
      if (filters?.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        query = query.ilike('full_name', `%${searchTerm}%`);
        console.log('🔍 Aplicando busca por texto:', searchTerm);
      }

      // Filtro por nome de equipe (consultar teams primeiro e usar coach_id)
      if (filters?.team_name && filters.team_name.trim()) {
        const teamNameTerm = filters.team_name.trim();
        console.log('🔍 Buscando coach_ids por team_name:', teamNameTerm);
        const { data: teamsByName, error: teamsError } = await supabase
          .from('teams')
          .select('coach_id')
          .ilike('name', `%${teamNameTerm}%`);
        if (teamsError) throw teamsError;
        const coachIds = Array.from(new Set((teamsByName || []).map(t => t.coach_id).filter(Boolean)));
        if (coachIds.length === 0) {
          set({ isLoading: false });
          return [];
        }
        query = query.in('id', coachIds as any);
      }

      console.log('🔍 Executando query...');
      const { data, error } = await query.order('full_name');

      if (error) {
        console.error('🔍 Erro na busca:', error);
        throw error;
      }

      console.log('🔍 Treinadores encontrados:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('🔍 Primeiros treinadores:', data.slice(0, 3).map(c => ({ id: c.id, name: c.full_name, email: c.email })));
      }

      set({ isLoading: false });
      return data || [];
    } catch (error: any) {
      console.error('🔍 Erro na busca de treinadores:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getCoachById: async (coachId: string) => {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', coachId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  getTeamById: async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // === UTILITÁRIOS ===

  clearError: () => set({ error: null }),

  resetState: () => set({
    currentCoach: null,
    teams: [],
    relationships: [],
    activeRelationships: [],
    isLoading: false,
    error: null
  })
})); 