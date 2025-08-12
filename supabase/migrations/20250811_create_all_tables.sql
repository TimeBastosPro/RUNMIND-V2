-- Criar tabela profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  main_goal TEXT CHECK (main_goal IN ('health', 'performance', 'weight_loss', 'fun')),
  context_type TEXT CHECK (context_type IN ('solo', 'coached', 'hybrid')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_of_birth TEXT,
  weight_kg DECIMAL(5,2),
  height_cm INTEGER,
  max_heart_rate INTEGER,
  resting_heart_rate INTEGER,
  best_5k_time_seconds INTEGER,
  best_10k_time_seconds INTEGER,
  best_21k_time_seconds INTEGER,
  best_42k_time_seconds INTEGER,
  parq_answers JSONB,
  training_days TEXT[],
  preferred_training_period TEXT,
  terrain_preference TEXT,
  work_stress_level INTEGER,
  sleep_consistency TEXT,
  wakeup_feeling TEXT,
  hydration_habit TEXT,
  recovery_habit TEXT,
  stress_management TEXT[],
  gender TEXT
);

-- Criar tabela insights
CREATE TABLE IF NOT EXISTS insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('correlation', 'trend', 'ai_analysis', 'alert')),
  insight_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  source_data JSONB,
  generated_by TEXT NOT NULL CHECK (generated_by IN ('system', 'ai')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela daily_checkins
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  energy_score INTEGER CHECK (energy_score >= 1 AND energy_score <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 7),
  sleep_quality_score INTEGER CHECK (sleep_quality_score >= 1 AND sleep_quality_score <= 7),
  motivation INTEGER CHECK (motivation >= 1 AND motivation <= 5),
  focus INTEGER CHECK (focus >= 1 AND focus <= 5),
  confidence INTEGER CHECK (confidence >= 1 AND confidence <= 5),
  soreness INTEGER CHECK (soreness >= 1 AND soreness <= 7),
  fatigue_score INTEGER CHECK (fatigue_score >= 1 AND fatigue_score <= 7),
  stress_score INTEGER CHECK (stress_score >= 1 AND stress_score <= 7),
  soreness_score INTEGER CHECK (soreness_score >= 1 AND soreness_score <= 7),
  focus_score INTEGER CHECK (focus_score >= 1 AND focus_score <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Criar tabela training_sessions
CREATE TABLE IF NOT EXISTS training_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  training_date DATE NOT NULL,
  title TEXT NOT NULL,
  training_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('planned', 'completed')),
  modalidade TEXT,
  treino_tipo TEXT,
  terreno TEXT,
  percurso TEXT,
  esforco TEXT,
  intensidade TEXT,
  distance_km DECIMAL(8,2),
  distance_m TEXT,
  duracao_horas TEXT,
  duracao_minutos TEXT,
  observacoes TEXT,
  elevation_gain_meters INTEGER,
  elevation_loss_meters INTEGER,
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  perceived_effort INTEGER CHECK (perceived_effort >= 1 AND perceived_effort <= 10),
  session_satisfaction INTEGER CHECK (session_satisfaction >= 1 AND session_satisfaction <= 5),
  sensacoes JSONB,
  clima JSONB,
  notes TEXT,
  effort_level INTEGER,
  duracao_tipo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date ON training_sessions(user_id, training_date);

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Criar tabela athlete_coach_relationships para políticas RLS
CREATE TABLE IF NOT EXISTS athlete_coach_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID,
  modality TEXT,
      status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'inactive', 'removed')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(athlete_id, coach_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_athlete_id ON athlete_coach_relationships(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_coach_id ON athlete_coach_relationships(coach_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_status ON athlete_coach_relationships(status);

-- Habilitar RLS
ALTER TABLE athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para athlete_coach_relationships
CREATE POLICY "Users can view own relationships as athlete" ON athlete_coach_relationships
  FOR SELECT USING (auth.uid() = athlete_id);

CREATE POLICY "Users can view own relationships as coach" ON athlete_coach_relationships
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can insert relationships" ON athlete_coach_relationships
  FOR INSERT WITH CHECK (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Users can update own relationships" ON athlete_coach_relationships
  FOR UPDATE USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Users can delete own relationships" ON athlete_coach_relationships
  FOR DELETE USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

-- Corrigir a constraint de status para incluir 'removed'
-- Primeiro, remover a constraint existente
ALTER TABLE athlete_coach_relationships 
DROP CONSTRAINT IF EXISTS athlete_coach_relationships_status_check;

-- Recriar a constraint com o status 'removed' incluído
ALTER TABLE athlete_coach_relationships 
ADD CONSTRAINT athlete_coach_relationships_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'inactive', 'removed'));

-- Políticas RLS para insights (permitindo treinadores verem insights dos atletas)
CREATE POLICY "Users can view own insights or athlete insights if coach" ON insights
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships 
      WHERE athlete_id = insights.user_id 
      AND coach_id = auth.uid() 
      AND status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can insert own insights" ON insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights" ON insights
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para daily_checkins
CREATE POLICY "Users can view own checkins" ON daily_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON daily_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON daily_checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON daily_checkins
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para training_sessions
CREATE POLICY "Users can view own training sessions" ON training_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training sessions" ON training_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training sessions" ON training_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training sessions" ON training_sessions
  FOR DELETE USING (auth.uid() = user_id); 