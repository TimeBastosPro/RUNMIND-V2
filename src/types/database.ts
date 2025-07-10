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
  }
  
  export interface DailyCheckin {
    id: string;
    user_id: string;
    date: string;
    mood_score: number; // 1-10
    energy_score: number; // 1-10
    sleep_hours: number;
    sleep_quality: number; // 1-5
    fatigue_score?: number; // 1-7
    stress_score?: number; // 1-7
    soreness_score?: number; // 1-7
    notes?: string;
    created_at: string;
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
  