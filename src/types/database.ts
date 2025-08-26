export interface Profile {
    id: string;
    email: string;
    full_name: string;
    experience_level: 'beginner' | 'intermediate' | 'advanced';
    main_goal: 'health' | 'performance' | 'weight_loss' | 'fun';
    context_type: 'solo' | 'coached' | 'hybrid';
    onboarding_completed: boolean;
    user_type: 'athlete' | 'coach'; // ✅ NOVO: Tipo de usuário
    created_at: string;
    updated_at: string;
    date_of_birth?: string;
    weight_kg?: number;
    height_cm?: number;
    max_heart_rate?: number;
    resting_heart_rate?: number;
    best_5k_time_seconds?: number;
    best_10k_time_seconds?: number;
    best_21k_time_seconds?: number;
    best_42k_time_seconds?: number;
    // Campos adicionais do perfil
    parq_answers?: {
      q1: boolean;
      q2: boolean;
      q3: boolean;
      q4: boolean;
      q5: boolean;
      q6: boolean;
      q7: boolean;
      details?: string;
    };
    training_days?: string[];
    preferred_training_period?: string;
    terrain_preference?: string;
    work_stress_level?: number;
    sleep_consistency?: string;
    wakeup_feeling?: string;
    hydration_habit?: string;
    recovery_habit?: string;
    stress_management?: string[];
    gender?: string;
  }
  
  export interface DailyCheckin {
    id: string;
    user_id: string;
    date: string;
    mood_score: number; // 1-10
    energy_score: number; // 1-10
    sleep_quality: number; // 1-7 (obrigatório no banco)
    sleep_quality_score?: number; // 1-7 (Índice de Hooper)
    // Campos atuais usados no app
    motivation?: number; // 1-5
    focus?: number; // 1-5
    confidence?: number; // 1-5
    soreness?: number; // 1-7
    fatigue_score?: number; // 1-7
    stress_score?: number; // 1-7
    soreness_score?: number; // 1-7
    focus_score?: number; // 1-5
    confidence_score?: number; // 1-5
    notes?: string;
    created_at: string;
  }

  export interface TrainingSession {
    id?: number;
    user_id: string;
    training_date: string;
    title: string;
    training_type: string;
    status: 'planned' | 'completed';
    created_at?: string;
    
    // === DADOS PLANEJADOS (quando status = 'planned') ===
    // Informações básicas do planejamento
    modalidade?: string; // corrida, forca, educativo, flexibilidade, bike
    treino_tipo?: string; // continuo, intervalado, longo, fartlek, tiro, ritmo, regenerativo
    terreno?: string; // asfalto, esteira, trilha/montanha, pista, outro
    percurso?: string; // plano, ligeira inclinação, moderada, forte, muita inclinação
    esforco?: string; // 1-5 (muito leve a muito forte)
    intensidade?: string | number; // Z1, Z2, Z3, Z4, Z5 ou 1-10
    
    // Métricas planejadas (usando os campos que existem no banco)
    distance_km?: number | null; // Usado tanto para planejado quanto realizado
    distance_m?: string;
    duracao_horas?: string; // Usado tanto para planejado quanto realizado
    duracao_minutos?: string; // Usado tanto para planejado quanto realizado
    duration_minutes?: number; // Campo para compatibilidade
    perceived_exertion?: number; // Campo para compatibilidade
    
    // Observações do planejamento
    observacoes?: string;
    
    // === DADOS REALIZADOS (quando status = 'completed') ===
    // Métricas realizadas
    elevation_gain_meters?: number | null;
    elevation_loss_meters?: number | null;
    avg_heart_rate?: number | null;
    max_heart_rate?: number | null;
    perceived_effort?: number; // 1-10 (PSE)
    session_satisfaction?: number; // 1-5
    
    // Sensações e clima
    sensacoes?: string[]; // Array com as sensações selecionadas
    clima?: string[]; // Array com as condições climáticas
    
    // === CAMPOS LEGACY (mantidos para compatibilidade) ===
    notes?: string;
    effort_level?: number;
    duracao_tipo?: string;
  }
  
  export interface Insight {
    id: string;
    user_id: string;
    insight_type: 'correlation' | 'trend' | 'ai_analysis' | 'alert';
    insight_text: string;
    confidence_score: number;
    source_data: any;
    generated_by: 'system' | 'ai';
    created_at: string;
  }
  
  export interface UserAnalytics {
    avgMood: number;
    avgEnergy: number;
    avgSleep: number;
    avgSleepQuality: number;
    moodTrend: 'increasing' | 'decreasing' | 'stable';
    energyTrend: 'increasing' | 'decreasing' | 'stable';
    sleepEnergyCorr: number;
    sleepMoodCorr: number;
    bestWeekday: string;
  }

  export interface FitnessTest {
    id: string;
    user_id: string;
    protocol_name: string;
    test_date: string;
    distance_meters?: number;
    time_seconds?: number;
    final_heart_rate?: number;
    calculated_vo2max: number;
    calculated_vam: number;
    created_at: string;
    updated_at?: string;
  }

  export interface Race {
    id: string;
    user_id: string;
    event_name: string;
    city: string;
    start_date: string;
    start_time: string;
    distance_km: number;
    created_at: string;
    updated_at?: string;
  }

  // === SISTEMA DE TREINADOR ===
  
  export interface Coach {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone?: string;
    bio?: string;
    experience_years?: number;
    cref: string; // CREF obrigatório para treinadores
    certifications?: string[];
    specialties?: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface Team {
    id: string;
    coach_id: string;
    name: string;
    description?: string;
    logo_url?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface AthleteCoachRelationship {
    id: string;
    athlete_id: string;
    coach_id: string;
    team_id?: string;
    modality?: string;
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
    requested_at: string;
    approved_at?: string;
    approved_by?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    // Campos processados pelo store
    athlete_name?: string;
    athlete_email?: string;
    coach_name?: string;
    coach_email?: string;
    team_name?: string;
  }

  export interface ActiveAthleteCoachRelationship {
    id: string;
    athlete_id: string;
    coach_id: string;
    team_id?: string;
    status: string;
    requested_at: string;
    approved_at?: string;
    modality?: string;
    athlete_name: string;
    athlete_email: string;
    coach_name: string;
    coach_email: string;
    team_name?: string;
  }

  // Tipos para criação/atualização
  export type CreateCoachData = Omit<Coach, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  export type UpdateCoachData = Partial<CreateCoachData>;
  
  export type CreateTeamData = Omit<Team, 'id' | 'created_at' | 'updated_at'> & {
    coach_id: string;
    is_active: boolean;
  };
  export type UpdateTeamData = Partial<CreateTeamData>;
  
  export type CreateRelationshipData = Omit<AthleteCoachRelationship, 'id' | 'created_at' | 'updated_at'>;
  export type UpdateRelationshipData = Partial<CreateRelationshipData>;

  // Tipos para filtros e consultas
  export interface CoachFilters {
    is_active?: boolean;
    specialties?: string[];
    experience_years_min?: number;
    search?: string; // Adicionado para busca por texto
    team_name?: string; // Nome da equipe para filtrar treinadores por equipes cadastradas
  }

  export interface TeamFilters {
    coach_id?: string;
    is_active?: boolean;
  }

  export interface RelationshipFilters {
    athlete_id?: string;
    coach_id?: string;
    team_id?: string;
    status?: AthleteCoachRelationship['status'];
  }

  // === SISTEMA DE CICLOS DE TREINAMENTO ===

  export interface Macrociclo {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    goal?: string;
    created_at: string;
    updated_at: string;
    user?: {
      id: string;
      email: string;
      profiles: Profile[];
    };
  }

  export interface Mesociclo {
    id: string;
    user_id: string;
    macrociclo_id: string;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    focus?: string;
    intensity_level?: 'baixa' | 'moderada' | 'alta' | 'muito_alta';
    volume_level?: 'baixo' | 'moderado' | 'alto' | 'muito_alto';
    notes?: string;           // ✅ NOVO: Campo de anotações
    mesociclo_type?: string;  // ✅ NOVO: Tipo do mesociclo
    created_at: string;
    updated_at: string;
    user?: {
      id: string;
      email: string;
      profiles: Profile[];
    };
  }

  export interface Microciclo {
    id: string;
    user_id: string;
    mesociclo_id: string;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    week_number?: number;
    focus?: string;
    intensity_level: 'baixa' | 'moderada' | 'alta' | 'muito_alta';
    volume_level: 'baixo' | 'moderado' | 'alto' | 'muito_alto';
    notes?: string;
    created_at: string;
    updated_at: string;
    user?: {
      id: string;
      email: string;
      profiles: Profile[];
    };
  }

  export interface CycleTrainingSession {
    id: string;
    user_id: string;
    microciclo_id: string;
    name: string;
    description?: string;
    scheduled_date: string;
    duration_minutes?: number;
    intensity_level: 'baixa' | 'moderada' | 'alta' | 'muito_alta';
    volume_level: 'baixo' | 'moderado' | 'alto' | 'muito_alto';
    focus?: string;
    notes?: string;
    is_completed: boolean;
    completed_at?: string;
    created_at: string;
    updated_at: string;
  }

  // Tipos para criação
  export interface CreateMacrocicloData {
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    goal?: string;
  }

  export interface CreateMesocicloData {
    macrociclo_id: string;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    focus?: string;
    intensity_level?: 'baixa' | 'moderada' | 'alta' | 'muito_alta';
    volume_level?: 'baixo' | 'moderado' | 'alto' | 'muito_alto';
    notes?: string;           // ✅ NOVO: Campo de anotações
    mesociclo_type?: string;  // ✅ NOVO: Tipo do mesociclo
  }

  export interface CreateMicrocicloData {
    mesociclo_id: string;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    week_number?: number;
    focus?: string;
    intensity_level: 'baixa' | 'moderada' | 'alta' | 'muito_alta';
    volume_level: 'baixo' | 'moderado' | 'alto' | 'muito_alto';
    notes?: string;
  }

  export interface CreateCycleTrainingSessionData {
    microciclo_id: string;
    name: string;
    description?: string;
    scheduled_date: string;
    duration_minutes?: number;
    intensity_level: 'baixa' | 'moderada' | 'alta' | 'muito_alta';
    volume_level: 'baixo' | 'moderado' | 'alto' | 'muito_alto';
    focus?: string;
    notes?: string;
  }

  export interface Anamnesis {
    id: string;
    user_id: string;
    date_of_birth?: string;
    weight_kg?: number;
    height_cm?: number;
    blood_type?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    medical_conditions?: string[];
    medications?: string[];
    allergies?: string[];
    previous_injuries?: string[];
    family_medical_history?: string;
    smoking_status?: string;
    alcohol_consumption?: string;
    sleep_hours_per_night?: number;
    stress_level?: number;
    created_at: string;
    updated_at: string;
  }

  export interface TrainingPreferences {
    id: string;
    user_id: string;
    training_days: string[];
    preferred_training_period?: 'morning' | 'afternoon' | 'evening' | 'night';
    terrain_preference?: 'road' | 'trail' | 'track' | 'treadmill' | 'mixed';
    work_stress_level?: number;
    sleep_consistency?: 'excellent' | 'good' | 'fair' | 'poor';
    wakeup_feeling?: 'refreshed' | 'tired' | 'energetic' | 'groggy';
    hydration_habit?: 'excellent' | 'good' | 'fair' | 'poor';
    recovery_habit?: string;
    stress_management?: string[];
    preferred_workout_duration?: number;
    preferred_workout_intensity?: 'low' | 'moderate' | 'high' | 'varied';
    music_preference?: boolean;
    group_training_preference?: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface ParqResponses {
    id: string;
    user_id: string;
    question_1_heart_condition: boolean;
    question_2_chest_pain: boolean;
    question_3_dizziness: boolean;
    question_4_bone_joint_problem: boolean;
    question_5_blood_pressure: boolean;
    question_6_physical_limitation: boolean;
    question_7_doctor_recommendation: boolean;
    additional_notes?: string;
    is_safe_to_exercise: boolean;
    created_at: string;
    updated_at: string;
  }
  