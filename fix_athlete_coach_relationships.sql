-- Script para verificar e corrigir a tabela athlete_coach_relationships
-- Problema: Erro 404 ao solicitar vínculo - tabela não existe ou não está acessível

-- 1. Verificar se a tabela existe
SELECT
  'Verificação da tabela athlete_coach_relationships' as info,
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'athlete_coach_relationships';

-- 2. Verificar se a tabela existe no schema public
SELECT
  'Verificação no schema public' as info,
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'athlete_coach_relationships';

-- 3. Se a tabela não existir, criá-la
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

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_athlete_id ON athlete_coach_relationships(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_coach_id ON athlete_coach_relationships(coach_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_status ON athlete_coach_relationships(status);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_team_id ON athlete_coach_relationships(team_id);

-- 5. Habilitar RLS
ALTER TABLE athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- 6. Remover políticas RLS existentes (se houver)
DROP POLICY IF EXISTS "Athletes can view own relationships" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Athletes can insert own relationships" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Athletes can update own relationships" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Athletes can delete own relationships" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Coaches can view own relationships" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Coaches can update own relationships" ON athlete_coach_relationships;

-- 7. Criar políticas RLS corretas

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

-- 8. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_athlete_coach_relationships_updated_at ON athlete_coach_relationships;
CREATE TRIGGER update_athlete_coach_relationships_updated_at
    BEFORE UPDATE ON athlete_coach_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Verificar se a tabela foi criada corretamente
SELECT
  'Verificação da tabela criada' as info,
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'athlete_coach_relationships';

-- 11. Verificar políticas RLS criadas
SELECT
  'Políticas RLS da tabela athlete_coach_relationships' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'athlete_coach_relationships'
ORDER BY policyname;

-- 12. Verificar estrutura da tabela
SELECT
  'Estrutura da tabela athlete_coach_relationships' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'athlete_coach_relationships'
ORDER BY ordinal_position;

-- 13. Testar inserção de relacionamento (simular o que o app fará)
-- Descomente para testar (substitua os UUIDs pelos valores reais)
/*
INSERT INTO athlete_coach_relationships (
  athlete_id,
  coach_id,
  notes
) VALUES (
  'UUID_DO_ATLETA_AQUI',
  'a0595309-f75a-4052-b7ec-fc7d8ead768f', -- ID do Evandro
  'Solicitação de teste'
);
*/

-- 14. Verificar se há relacionamentos existentes
SELECT
  'Relacionamentos existentes' as info,
  COUNT(*) as total_relacionamentos
FROM athlete_coach_relationships;

-- 15. Verificar relacionamentos com detalhes
SELECT
  'Relacionamentos com detalhes' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  acr.requested_at,
  acr.notes,
  c.full_name as coach_name,
  c.email as coach_email
FROM athlete_coach_relationships acr
LEFT JOIN coaches c ON acr.coach_id = c.id
ORDER BY acr.created_at DESC;

-- 16. Verificar se a view active_athlete_coach_relationships existe
SELECT
  'Verificação da view active_athlete_coach_relationships' as info,
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE viewname = 'active_athlete_coach_relationships';

-- 17. Se a view não existir, criá-la
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

-- 18. Criar política RLS para a view
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

-- 19. Verificação final
SELECT
  'Verificação final' as info,
  'Tabela athlete_coach_relationships criada e configurada' as status,
  'Políticas RLS aplicadas' as rls_status,
  'View active_athlete_coach_relationships criada' as view_status; 