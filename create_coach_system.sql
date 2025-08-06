-- =====================================================
-- SISTEMA DE TREINADOR - RUNMIND V2
-- =====================================================

-- 1. Tabela de Treinadores
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

-- 2. Tabela de Equipes
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

-- 3. Tabela de Relacionamento Atleta-Treinador
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

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para coaches
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_coaches_email ON coaches(email);
CREATE INDEX IF NOT EXISTS idx_coaches_is_active ON coaches(is_active);

-- Índices para teams
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_teams_is_active ON teams(is_active);

-- Índices para athlete_coach_relationships
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_athlete_id ON athlete_coach_relationships(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_coach_id ON athlete_coach_relationships(coach_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_team_id ON athlete_coach_relationships(team_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_status ON athlete_coach_relationships(status);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athlete_coach_relationships_updated_at BEFORE UPDATE ON athlete_coach_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS PARA COACHES
-- =====================================================

-- Treinadores podem ver, inserir, atualizar e deletar apenas seu próprio perfil
CREATE POLICY "Coaches can view own profile" ON coaches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coaches can insert own profile" ON coaches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can update own profile" ON coaches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Coaches can delete own profile" ON coaches
  FOR DELETE USING (auth.uid() = user_id);

-- Atletas podem ver perfis de treinadores ativos
CREATE POLICY "Athletes can view active coaches" ON coaches
  FOR SELECT USING (is_active = true);

-- =====================================================
-- POLÍTICAS RLS PARA TEAMS
-- =====================================================

-- Treinadores podem gerenciar apenas suas próprias equipes
CREATE POLICY "Coaches can view own teams" ON teams
  FOR SELECT USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert own teams" ON teams
  FOR INSERT WITH CHECK (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update own teams" ON teams
  FOR UPDATE USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete own teams" ON teams
  FOR DELETE USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

-- Atletas podem ver equipes ativas
CREATE POLICY "Athletes can view active teams" ON teams
  FOR SELECT USING (is_active = true);

-- =====================================================
-- POLÍTICAS RLS PARA ATHLETE_COACH_RELATIONSHIPS
-- =====================================================

-- Atletas podem ver seus próprios relacionamentos
CREATE POLICY "Athletes can view own relationships" ON athlete_coach_relationships
  FOR SELECT USING (athlete_id = auth.uid());

-- Atletas podem solicitar relacionamentos
CREATE POLICY "Athletes can request relationships" ON athlete_coach_relationships
  FOR INSERT WITH CHECK (athlete_id = auth.uid());

-- Atletas podem cancelar solicitações pendentes
CREATE POLICY "Athletes can cancel pending relationships" ON athlete_coach_relationships
  FOR UPDATE USING (
    athlete_id = auth.uid() AND 
    status = 'pending'
  );

-- Treinadores podem ver relacionamentos com seus atletas
CREATE POLICY "Coaches can view athlete relationships" ON athlete_coach_relationships
  FOR SELECT USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

-- Treinadores podem aprovar/rejeitar relacionamentos
CREATE POLICY "Coaches can approve/reject relationships" ON athlete_coach_relationships
  FOR UPDATE USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- VIEW PARA RELACIONAMENTOS ATIVOS
-- =====================================================

-- View para relacionamentos ativos com informações completas
CREATE OR REPLACE VIEW active_athlete_coach_relationships AS
SELECT 
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.team_id,
  acr.status,
  acr.requested_at,
  acr.approved_at,
  p.full_name as athlete_name,
  p.email as athlete_email,
  c.full_name as coach_name,
  c.email as coach_email,
  t.name as team_name
FROM athlete_coach_relationships acr
JOIN profiles p ON acr.athlete_id = p.id
JOIN coaches c ON acr.coach_id = c.id
LEFT JOIN teams t ON acr.team_id = t.id
WHERE acr.status IN ('active', 'approved');

-- Habilitar RLS na view
ALTER VIEW active_athlete_coach_relationships SET (security_invoker = true);

-- Política RLS para a view
CREATE POLICY "Users can view own active relationships" ON active_athlete_coach_relationships
  FOR SELECT USING (
    athlete_id = auth.uid() OR 
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNÇÃO PARA CRIAR PERFIL DE TREINADOR
-- =====================================================

-- Função para criar perfil de treinador (será chamada manualmente)
CREATE OR REPLACE FUNCTION create_coach_profile(
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_experience_years INTEGER DEFAULT NULL,
  p_certifications TEXT[] DEFAULT NULL,
  p_specialties TEXT[] DEFAULT NULL
)
RETURNS coaches AS $$
DECLARE
  new_coach coaches;
BEGIN
  INSERT INTO coaches (
    user_id,
    full_name,
    email,
    phone,
    bio,
    experience_years,
    certifications,
    specialties
  ) VALUES (
    auth.uid(),
    p_full_name,
    p_email,
    p_phone,
    p_bio,
    p_experience_years,
    p_certifications,
    p_specialties
  )
  RETURNING * INTO new_coach;
  
  RETURN new_coach;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 
  'coaches' as table_name,
  COUNT(*) as row_count
FROM coaches
UNION ALL
SELECT 
  'teams' as table_name,
  COUNT(*) as row_count
FROM teams
UNION ALL
SELECT 
  'athlete_coach_relationships' as table_name,
  COUNT(*) as row_count
FROM athlete_coach_relationships;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('coaches', 'teams', 'athlete_coach_relationships')
ORDER BY tablename, policyname; 