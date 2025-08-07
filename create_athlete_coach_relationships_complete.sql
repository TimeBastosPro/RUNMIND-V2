-- Script COMPLETO para criar a tabela athlete_coach_relationships
-- Problema: Tabela não existe, causando erro 404

-- 1. Criar a tabela athlete_coach_relationships
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

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_athlete_id ON athlete_coach_relationships(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_coach_id ON athlete_coach_relationships(coach_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_status ON athlete_coach_relationships(status);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_team_id ON athlete_coach_relationships(team_id);

-- 3. Habilitar RLS
ALTER TABLE athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS

-- Política para atletas verem seus próprios relacionamentos
CREATE POLICY "Athletes can view own relationships" ON athlete_coach_relationships
  FOR SELECT USING (auth.uid() = athlete_id);

-- Política para atletas criarem relacionamentos
CREATE POLICY "Athletes can insert own relationships" ON athlete_coach_relationships
  FOR INSERT WITH CHECK (auth.uid() = athlete_id);

-- Política para atletas atualizarem seus relacionamentos
CREATE POLICY "Athletes can update own relationships" ON athlete_coach_relationships
  FOR UPDATE USING (auth.uid() = athlete_id);

-- Política para atletas cancelarem seus relacionamentos
CREATE POLICY "Athletes can delete own relationships" ON athlete_coach_relationships
  FOR DELETE USING (auth.uid() = athlete_id);

-- Política para treinadores verem relacionamentos com eles
CREATE POLICY "Coaches can view relationships with them" ON athlete_coach_relationships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coaches 
      WHERE coaches.id = athlete_coach_relationships.coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

-- Política para treinadores atualizarem relacionamentos com eles
CREATE POLICY "Coaches can update relationships with them" ON athlete_coach_relationships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM coaches 
      WHERE coaches.id = athlete_coach_relationships.coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

-- 5. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_athlete_coach_relationships_updated_at ON athlete_coach_relationships;
CREATE TRIGGER update_athlete_coach_relationships_updated_at
    BEFORE UPDATE ON athlete_coach_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Criar a view active_athlete_coach_relationships
CREATE OR REPLACE VIEW active_athlete_coach_relationships AS
SELECT
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.team_id,
  acr.status,
  acr.requested_at,
  acr.approved_at,
  acr.notes,
  p.full_name as athlete_name,
  p.email as athlete_email,
  c.full_name as coach_name,
  c.email as coach_email,
  t.name as team_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
LEFT JOIN teams t ON acr.team_id = t.id
WHERE acr.status IN ('pending', 'approved', 'active');

-- 8. Criar política RLS para a view
DROP POLICY IF EXISTS "Users can view active relationships" ON active_athlete_coach_relationships;
CREATE POLICY "Users can view active relationships" ON active_athlete_coach_relationships
  FOR SELECT USING (
    auth.uid() = athlete_id OR
    EXISTS (
      SELECT 1 FROM coaches 
      WHERE coaches.id = coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

-- 9. Verificar se a tabela foi criada corretamente
SELECT
  'Verificação da tabela criada' as info,
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'athlete_coach_relationships';

-- 10. Verificar políticas RLS criadas
SELECT
  'Políticas RLS da tabela athlete_coach_relationships' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'athlete_coach_relationships'
ORDER BY policyname;

-- 11. Verificar estrutura da tabela
SELECT
  'Estrutura da tabela athlete_coach_relationships' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'athlete_coach_relationships'
ORDER BY ordinal_position;

-- 12. Verificar se a view foi criada
SELECT
  'Verificação da view active_athlete_coach_relationships' as info,
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE viewname = 'active_athlete_coach_relationships';

-- 13. Verificar se há relacionamentos existentes
SELECT
  'Relacionamentos existentes' as info,
  COUNT(*) as total_relacionamentos
FROM athlete_coach_relationships;

-- 14. Testar acesso com RLS
SELECT
  'Teste de acesso com RLS' as info,
  COUNT(*) as total_relacionamentos_visiveis
FROM athlete_coach_relationships;

-- 15. Verificação final
SELECT
  'Verificação final' as info,
  'Tabela athlete_coach_relationships criada com sucesso' as status,
  'Políticas RLS aplicadas' as rls_status,
  'View active_athlete_coach_relationships criada' as view_status,
  'Sistema pronto para solicitações de vínculo' as final_status; 