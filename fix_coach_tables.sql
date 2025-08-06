-- =====================================================
-- VERIFICAÇÃO E CORREÇÃO DAS TABELAS DO SISTEMA DE TREINADOR
-- =====================================================

-- 1. Verificar se as tabelas existem
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'coaches' THEN 'Tabela de Treinadores'
    WHEN table_name = 'teams' THEN 'Tabela de Equipes'
    WHEN table_name = 'athlete_coach_relationships' THEN 'Tabela de Relacionamentos'
    ELSE 'Outra tabela'
  END as descricao
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('coaches', 'teams', 'athlete_coach_relationships')
ORDER BY table_name;

-- 2. Se a tabela coaches não existir, criar
CREATE TABLE IF NOT EXISTS coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  bio TEXT,
  experience_years INTEGER,
  certifications TEXT[],
  specialties TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Se a tabela teams não existir, criar
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

-- 4. Se a tabela athlete_coach_relationships não existir, criar
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

-- 5. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_coaches_email ON coaches(email);
CREATE INDEX IF NOT EXISTS idx_coaches_is_active ON coaches(is_active);

CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_teams_is_active ON teams(is_active);

CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_athlete_id ON athlete_coach_relationships(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_coach_id ON athlete_coach_relationships(coach_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_team_id ON athlete_coach_relationships(team_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_status ON athlete_coach_relationships(status);

-- 6. Habilitar RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS básicas
-- Políticas para coaches
DROP POLICY IF EXISTS "Coaches can view own profile" ON coaches;
CREATE POLICY "Coaches can view own profile" ON coaches
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can insert own profile" ON coaches;
CREATE POLICY "Coaches can insert own profile" ON coaches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can update own profile" ON coaches;
CREATE POLICY "Coaches can update own profile" ON coaches
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Athletes can view active coaches" ON coaches;
CREATE POLICY "Athletes can view active coaches" ON coaches
  FOR SELECT USING (is_active = true);

-- Políticas para teams
DROP POLICY IF EXISTS "Coaches can view own teams" ON teams;
CREATE POLICY "Coaches can view own teams" ON teams
  FOR SELECT USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can insert own teams" ON teams;
CREATE POLICY "Coaches can insert own teams" ON teams
  FOR INSERT WITH CHECK (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Athletes can view active teams" ON teams;
CREATE POLICY "Athletes can view active teams" ON teams
  FOR SELECT USING (is_active = true);

-- Políticas para athlete_coach_relationships
DROP POLICY IF EXISTS "Athletes can view own relationships" ON athlete_coach_relationships;
CREATE POLICY "Athletes can view own relationships" ON athlete_coach_relationships
  FOR SELECT USING (athlete_id = auth.uid());

DROP POLICY IF EXISTS "Athletes can request relationships" ON athlete_coach_relationships;
CREATE POLICY "Athletes can request relationships" ON athlete_coach_relationships
  FOR INSERT WITH CHECK (athlete_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can view athlete relationships" ON athlete_coach_relationships;
CREATE POLICY "Coaches can view athlete relationships" ON athlete_coach_relationships
  FOR SELECT USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can approve/reject relationships" ON athlete_coach_relationships;
CREATE POLICY "Coaches can approve/reject relationships" ON athlete_coach_relationships
  FOR UPDATE USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

-- 8. Verificar se tudo foi criado corretamente
SELECT 
  'coaches' as table_name,
  COUNT(*) as row_count,
  'Tabela criada com sucesso' as status
FROM coaches
UNION ALL
SELECT 
  'teams' as table_name,
  COUNT(*) as row_count,
  'Tabela criada com sucesso' as status
FROM teams
UNION ALL
SELECT 
  'athlete_coach_relationships' as table_name,
  COUNT(*) as row_count,
  'Tabela criada com sucesso' as status
FROM athlete_coach_relationships;

-- 9. Verificar colunas da tabela coaches
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 