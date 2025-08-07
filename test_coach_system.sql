-- Script para testar o sistema de treinadores
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se as tabelas existem
SELECT 
  'Verificação das tabelas' as info,
  schemaname,
  tablename
FROM pg_tables
WHERE tablename IN ('coaches', 'teams', 'athlete_coach_relationships', 'profiles')
ORDER BY tablename;

-- 2. Criar tabelas se não existirem
CREATE TABLE IF NOT EXISTS coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bio TEXT,
  experience_years INTEGER,
  specialties TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS athlete_coach_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'inactive')) DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES coaches(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(athlete_id, coach_id)
);

-- 3. Habilitar RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS básicas
DROP POLICY IF EXISTS "Coaches can manage own profile" ON coaches;
CREATE POLICY "Coaches can manage own profile" ON coaches
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can manage own teams" ON teams;
CREATE POLICY "Coaches can manage own teams" ON teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coaches 
      WHERE coaches.id = teams.coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Athletes can manage own relationships" ON athlete_coach_relationships;
CREATE POLICY "Athletes can manage own relationships" ON athlete_coach_relationships
  FOR ALL USING (athlete_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can manage relationships with them" ON athlete_coach_relationships;
CREATE POLICY "Coaches can manage relationships with them" ON athlete_coach_relationships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coaches 
      WHERE coaches.id = athlete_coach_relationships.coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

-- 5. Inserir dados de teste
-- Primeiro, vamos verificar se há usuários existentes
SELECT 
  'Usuários existentes' as info,
  COUNT(*) as total_users
FROM auth.users;

-- Inserir um treinador de teste (se não existir)
INSERT INTO coaches (user_id, full_name, email, phone, bio, experience_years, specialties)
SELECT 
  id,
  'Evandro Chicanelle',
  'evandro@gmail.com',
  '32988358965',
  'Treinador especializado em corrida de rua e maratona',
  15,
  ARRAY['Corrida de Rua', 'Maratona', 'Meia Maratona', 'Corrida de Montanha']
FROM auth.users 
WHERE email = 'evandro@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 6. Verificar dados inseridos
SELECT 
  'Treinadores existentes' as info,
  COUNT(*) as total_coaches,
  COUNT(CASE WHEN is_active THEN 1 END) as ativos
FROM coaches;

SELECT 
  'Relacionamentos existentes' as info,
  COUNT(*) as total_relationships,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos
FROM athlete_coach_relationships;

-- 7. Testar busca de treinadores
SELECT 
  'Teste de busca de treinadores' as info,
  id,
  full_name,
  email,
  experience_years,
  specialties
FROM coaches
WHERE is_active = true
ORDER BY full_name;

-- 8. Testar relacionamentos
SELECT 
  'Teste de relacionamentos' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  p.full_name as athlete_name,
  c.full_name as coach_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
ORDER BY acr.created_at DESC;

-- 9. Verificar políticas RLS
SELECT 
  'Políticas RLS coaches' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'coaches'
ORDER BY policyname;

SELECT 
  'Políticas RLS athlete_coach_relationships' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'athlete_coach_relationships'
ORDER BY policyname;

-- 10. Teste final
SELECT 
  'Teste final do sistema' as info,
  'Sistema de treinadores configurado' as status,
  (SELECT COUNT(*) FROM coaches) as total_coaches,
  (SELECT COUNT(*) FROM athlete_coach_relationships) as total_relationships; 