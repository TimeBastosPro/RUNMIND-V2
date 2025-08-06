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
  requestCoachRelationship: (coachId: string, teamId?: string, notes?: string) => Promise<AthleteCoachRelationship>;
  loadAthleteRelationships: (filters?: RelationshipFilters) => Promise<void>;
  loadCoachRelationships: (filters?: RelationshipFilters) => Promise<void>;
  approveRelationship: (relationshipId: string, teamId?: string, notes?: string) => Promise<AthleteCoachRelationship>;
  rejectRelationship: (relationshipId: string, notes?: string) => Promise<AthleteCoachRelationship>;
  cancelRelationship: (relationshipId: string) => Promise<void>;
  deactivateRelationship: (relationshipId: string) => Promise<AthleteCoachRelationship>;
  
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

      if (error) {
        if (error.code === 'PGRST116') {
          // Coach não encontrado
          set({ currentCoach: null, isLoading: false });
          return;
        }
        throw error;
      }

      set({ currentCoach: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
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

  requestCoachRelationship: async (coachId: string, teamId?: string, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('athlete_coach_relationships')
        .insert([{
          athlete_id: user.id,
          coach_id: coachId,
          team_id: teamId,
          notes,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      const currentRelationships = get().relationships;
      set({ relationships: [...currentRelationships, data], isLoading: false });
      return data;
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

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      set({ relationships: data || [], isLoading: false });
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

      let query = supabase
        .from('athlete_coach_relationships')
        .select('*')
        .eq('coach_id', currentCoach.id);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.athlete_id) {
        query = query.eq('athlete_id', filters.athlete_id);
      }
      if (filters?.team_id) {
        query = query.eq('team_id', filters.team_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      set({ relationships: data || [], isLoading: false });

      // Carregar também relacionamentos ativos
      const { data: activeData, error: activeError } = await supabase
        .from('active_athlete_coach_relationships')
        .select('*')
        .eq('coach_id', currentCoach.id);

      if (!activeError) {
        set({ activeRelationships: activeData || [] });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  approveRelationship: async (relationshipId: string, teamId?: string, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { currentCoach } = get();
      if (!currentCoach) throw new Error('Perfil de treinador não encontrado');

      const { data, error } = await supabase
        .from('athlete_coach_relationships')
        .update({
          status: 'active',
          approved_at: new Date().toISOString(),
          approved_by: currentCoach.id,
          team_id: teamId,
          notes
        })
        .eq('id', relationshipId)
        .select()
        .single();

      if (error) throw error;

      const currentRelationships = get().relationships;
      const updatedRelationships = currentRelationships.map(rel =>
        rel.id === relationshipId ? data : rel
      );
      set({ relationships: updatedRelationships, isLoading: false });
      return data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  rejectRelationship: async (relationshipId: string, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('athlete_coach_relationships')
        .update({
          status: 'rejected',
          notes
        })
        .eq('id', relationshipId)
        .select()
        .single();

      if (error) throw error;

      const currentRelationships = get().relationships;
      const updatedRelationships = currentRelationships.map(rel =>
        rel.id === relationshipId ? data : rel
      );
      set({ relationships: updatedRelationships, isLoading: false });
      return data;
    } catch (error: any) {
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
      const { data, error } = await supabase
        .from('athlete_coach_relationships')
        .update({
          status: 'inactive'
        })
        .eq('id', relationshipId)
        .select()
        .single();

      if (error) throw error;

      const currentRelationships = get().relationships;
      const updatedRelationships = currentRelationships.map(rel =>
        rel.id === relationshipId ? data : rel
      );
      set({ relationships: updatedRelationships, isLoading: false });
      return data;
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
      
      // Busca por texto (nome ou especialidades)
      if (filters?.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        // Busca por nome (case insensitive)
        query = query.ilike('full_name', `%${searchTerm}%`);
        console.log('🔍 Aplicando busca por texto:', searchTerm);
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