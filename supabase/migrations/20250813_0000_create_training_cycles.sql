-- Criar tabelas para ciclos de treinamento
-- Macrociclos, Mesociclos e Microciclos

-- Tabela de Macrociclos (períodos longos - meses/anos)
CREATE TABLE IF NOT EXISTS macrociclos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goal TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Mesociclos (períodos médios - semanas/meses)
CREATE TABLE IF NOT EXISTS mesociclos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  macrociclo_id UUID REFERENCES macrociclos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  focus TEXT, -- foco do mesociclo (base, força, velocidade, etc.)
  intensity_level TEXT CHECK (intensity_level IN ('baixa', 'moderada', 'alta', 'muito_alta')),
  volume_level TEXT CHECK (volume_level IN ('baixo', 'moderado', 'alto', 'muito_alto')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Microciclos (períodos curtos - semanas)
CREATE TABLE IF NOT EXISTS microciclos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mesociclo_id UUID REFERENCES mesociclos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  week_number INTEGER, -- número da semana no mesociclo
  focus TEXT, -- foco específico da semana
  intensity_level TEXT CHECK (intensity_level IN ('baixa', 'moderada', 'alta', 'muito_alta')),
  volume_level TEXT CHECK (volume_level IN ('baixo', 'moderado', 'alto', 'muito_alto')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões de treino vinculadas aos ciclos
CREATE TABLE IF NOT EXISTS cycle_training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  training_session_id INTEGER REFERENCES training_sessions(id) ON DELETE CASCADE,
  microciclo_id UUID REFERENCES microciclos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = domingo, 6 = sábado
  week_number INTEGER, -- semana no microciclo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE macrociclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesociclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE microciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_training_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para macrociclos
CREATE POLICY "Users can view own macrociclos or athlete macrociclos if coach" ON macrociclos
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships 
      WHERE athlete_id = macrociclos.user_id 
      AND coach_id = auth.uid() 
      AND status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can insert own macrociclos" ON macrociclos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own macrociclos" ON macrociclos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own macrociclos" ON macrociclos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para mesociclos
CREATE POLICY "Users can view own mesociclos or athlete mesociclos if coach" ON mesociclos
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships 
      WHERE athlete_id = mesociclos.user_id 
      AND coach_id = auth.uid() 
      AND status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can insert own mesociclos" ON mesociclos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mesociclos" ON mesociclos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mesociclos" ON mesociclos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para microciclos
CREATE POLICY "Users can view own microciclos or athlete microciclos if coach" ON microciclos
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships 
      WHERE athlete_id = microciclos.user_id 
      AND coach_id = auth.uid() 
      AND status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can insert own microciclos" ON microciclos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own microciclos" ON microciclos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own microciclos" ON microciclos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para cycle_training_sessions
CREATE POLICY "Users can view own cycle training sessions or athlete sessions if coach" ON cycle_training_sessions
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships 
      WHERE athlete_id = cycle_training_sessions.user_id 
      AND coach_id = auth.uid() 
      AND status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can insert own cycle training sessions" ON cycle_training_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycle training sessions" ON cycle_training_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycle training sessions" ON cycle_training_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_macrociclos_user_id ON macrociclos(user_id);
CREATE INDEX IF NOT EXISTS idx_macrociclos_dates ON macrociclos(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_mesociclos_macrociclo_id ON mesociclos(macrociclo_id);
CREATE INDEX IF NOT EXISTS idx_mesociclos_user_id ON mesociclos(user_id);
CREATE INDEX IF NOT EXISTS idx_mesociclos_dates ON mesociclos(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_microciclos_mesociclo_id ON microciclos(mesociclo_id);
CREATE INDEX IF NOT EXISTS idx_microciclos_user_id ON microciclos(user_id);
CREATE INDEX IF NOT EXISTS idx_microciclos_dates ON microciclos(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_cycle_training_sessions_training_id ON cycle_training_sessions(training_session_id);
CREATE INDEX IF NOT EXISTS idx_cycle_training_sessions_microciclo_id ON cycle_training_sessions(microciclo_id); 