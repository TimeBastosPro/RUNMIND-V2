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
  }
  
  export interface DailyCheckin {
    id: string;
    user_id: string;
    date: string;
    mood_score: number; // 1-10
    energy_score: number; // 1-10
    sleep_hours: number;
    sleep_quality: number; // 1-5
    sleep_quality_score?: number; // 1-7 (Índice de Hooper)
    fatigue_score?: number; // 1-7
    stress_score?: number; // 1-7
    soreness_score?: number; // 1-7
    notes?: string;
    created_at: string;
  }

  export interface TrainingSession {
    id?: number;
    user_id: string;
    training_date: string;
    title: string;
    training_type: string;
    distance_km?: number | null;
    duration_minutes?: number | null;
    elevation_gain_meters?: number | null;
    avg_heart_rate?: number | null;
    perceived_effort?: number;
    session_satisfaction?: number;
    notes?: string;
    status: 'planned' | 'completed';
    created_at?: string;
    // Campos extras customizados
    modalidade?: string;
    effort_level?: number;
    percurso?: string;
    terreno?: string;
    treino_tipo?: string;
    duracao_tipo?: string;
    duracao_horas?: string;
    duracao_minutos?: string;
    distancia_m?: string;
    intensidade?: string | number;
    esforco?: string;
    observacoes?: string;
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
  