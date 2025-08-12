-- Corrigir acesso do treinador aos dados do atleta
-- Primeiro criar as tabelas que estão faltando

-- Criar tabela races se não existir
CREATE TABLE IF NOT EXISTS races (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  city TEXT NOT NULL,
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  distance_km DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela fitness_tests se não existir
CREATE TABLE IF NOT EXISTS fitness_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  distance_meters INTEGER,
  time_seconds INTEGER,
  final_heart_rate INTEGER,
  calculated_vo2max DECIMAL(5,2),
  calculated_vam DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS nas tabelas
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_tests ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own races" ON races;
DROP POLICY IF EXISTS "Users can insert their own races" ON races;
DROP POLICY IF EXISTS "Users can update their own races" ON races;
DROP POLICY IF EXISTS "Users can delete their own races" ON races;

DROP POLICY IF EXISTS "Users can view own fitness tests" ON fitness_tests;
DROP POLICY IF EXISTS "Users can insert own fitness tests" ON fitness_tests;
DROP POLICY IF EXISTS "Users can update own fitness tests" ON fitness_tests;
DROP POLICY IF EXISTS "Users can delete own fitness tests" ON fitness_tests;

-- Políticas RLS para races (permitindo treinadores verem provas dos atletas)
CREATE POLICY "Users can view own races or athlete races if coach" ON races
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships 
      WHERE athlete_id = races.user_id 
      AND coach_id = auth.uid() 
      AND status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can insert own races" ON races
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own races" ON races
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own races" ON races
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para fitness_tests (permitindo treinadores verem testes dos atletas)
CREATE POLICY "Users can view own fitness tests or athlete tests if coach" ON fitness_tests
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships 
      WHERE athlete_id = fitness_tests.user_id 
      AND coach_id = auth.uid() 
      AND status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can insert own fitness tests" ON fitness_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness tests" ON fitness_tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fitness tests" ON fitness_tests
  FOR DELETE USING (auth.uid() = user_id);

-- Atualizar políticas RLS para profiles (permitindo treinadores verem perfis dos atletas)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile or athlete profile if coach" ON profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships 
      WHERE athlete_id = profiles.id 
      AND coach_id = auth.uid() 
      AND status IN ('active', 'approved')
    )
  ); 