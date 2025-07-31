export interface Profile {
    id: string;
    email: string;
    full_name: string;
    experience_level: 'beginner' | 'intermediate' | 'advanced';
    main_goal: 'health' | 'performance' | 'weight_loss' | 'fun';
    context_type: 'solo' | 'coached' | 'hybrid';
    onboarding_completed: boolean;
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
    sleep_hours: number;
    sleep_quality?: number; // 1-5 (opcional, não existe no banco)
    sleep_quality_score?: number; // 1-7 (Índice de Hooper)
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
    
    // Métricas planejadas
    planned_distance_km?: number | null;
    planned_distance_m?: string;
    planned_duration_hours?: string;
    planned_duration_minutes?: string;
    planned_elevation_gain_meters?: number | null;
    planned_elevation_loss_meters?: number | null;
    planned_perceived_effort?: number; // 1-10
    planned_avg_heart_rate?: number | null;
    
    // Observações do planejamento
    planned_notes?: string;
    
    // === DADOS REALIZADOS (quando status = 'completed') ===
    // Métricas realizadas
    distance_km?: number | null;
    distance_m?: string;
    duration_hours?: string;
    duration_minutes?: string;
    elevation_gain_meters?: number | null;
    elevation_loss_meters?: number | null;
    avg_heart_rate?: number | null;
    max_heart_rate?: number | null;
    perceived_effort?: number; // 1-10 (PSE)
    session_satisfaction?: number; // 1-5
    
    // Sensações e clima
    sensacoes?: string[]; // Array com as sensações selecionadas
    clima?: string[]; // Array com as condições climáticas
    
    // Observações do treino realizado
    observacoes?: string;
    
    // === CAMPOS LEGACY (mantidos para compatibilidade) ===
    notes?: string;
    duration_minutes?: number | null;
    duracao_horas?: string;
    duracao_minutos?: string;
    distancia_m?: string;
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
  