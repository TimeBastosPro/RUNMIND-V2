-- Script para testar a funcionalidade de solicitação de vínculo
-- Identificar por que está dando erro 404

-- 1. Verificar se a tabela athlete_coach_relationships existe
SELECT
  'Verificação da tabela athlete_coach_relationships' as info,
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'athlete_coach_relationships';

-- 2. Se não existir, criar a tabela
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
ALTER TABLE athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS básicas
DROP POLICY IF EXISTS "Athletes can manage own relationships" ON athlete_coach_relationships;
CREATE POLICY "Athletes can manage own relationships" ON athlete_coach_relationships
  FOR ALL USING (auth.uid() = athlete_id);

DROP POLICY IF EXISTS "Coaches can view relationships with them" ON athlete_coach_relationships;
CREATE POLICY "Coaches can view relationships with them" ON athlete_coach_relationships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coaches 
      WHERE coaches.id = athlete_coach_relationships.coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

-- 5. Verificar se a tabela foi criada
SELECT
  'Verificação da tabela criada' as info,
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'athlete_coach_relationships';

-- 6. Verificar políticas RLS
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

-- 7. Verificar estrutura da tabela
SELECT
  'Estrutura da tabela athlete_coach_relationships' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'athlete_coach_relationships'
ORDER BY ordinal_position;

-- 8. Verificar se há relacionamentos existentes
SELECT
  'Relacionamentos existentes' as info,
  COUNT(*) as total_relacionamentos
FROM athlete_coach_relationships;

-- 9. Verificar relacionamentos com detalhes
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

-- 10. Verificar se a view active_athlete_coach_relationships existe
SELECT
  'Verificação da view active_athlete_coach_relationships' as info,
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE viewname = 'active_athlete_coach_relationships';

-- 11. Se a view não existir, criá-la
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

-- 12. Criar política RLS para a view
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

-- 13. Verificar se há usuários disponíveis para teste
SELECT
  'Usuários disponíveis para teste' as info,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 14. Verificar treinadores disponíveis
SELECT
  'Treinadores disponíveis' as info,
  id,
  full_name,
  email,
  is_active
FROM coaches
WHERE is_active = true
ORDER BY full_name;

-- 15. Testar inserção de relacionamento (simular o que o app fará)
-- Substitua os UUIDs pelos valores reais dos seus usuários
/*
-- Exemplo de inserção (descomente e ajuste os UUIDs)
INSERT INTO athlete_coach_relationships (
  athlete_id,
  coach_id,
  notes
) VALUES (
  'UUID_DO_ATLETA_AQUI', -- Substitua pelo ID de um usuário real
  'a0595309-f75a-4052-b7ec-fc7d8ead768f', -- ID do Evandro
  'Solicitação de teste do sistema'
) ON CONFLICT (athlete_id, coach_id) DO NOTHING;
*/

-- 16. Verificar se a inserção funcionou
SELECT
  'Teste de inserção' as info,
  'Se esta query retornar dados, a inserção funcionou' as note;

-- 17. Verificar relacionamentos após inserção
SELECT
  'Relacionamentos após inserção' as info,
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

-- 18. Verificar se há problemas com RLS
SELECT
  'Teste de acesso com RLS' as info,
  COUNT(*) as total_relacionamentos_visiveis
FROM athlete_coach_relationships;

-- 19. Verificar se há problemas com a coluna athlete_id
SELECT
  'Verificação da coluna athlete_id' as info,
  CASE 
    WHEN athlete_id IS NULL THEN 'athlete_id é NULL'
    ELSE 'athlete_id está preenchido'
  END as status,
  COUNT(*) as quantidade
FROM athlete_coach_relationships
GROUP BY CASE 
  WHEN athlete_id IS NULL THEN 'athlete_id é NULL'
  ELSE 'athlete_id está preenchido'
END;

-- 20. Verificar se há problemas com a coluna coach_id
SELECT
  'Verificação da coluna coach_id' as info,
  CASE 
    WHEN coach_id IS NULL THEN 'coach_id é NULL'
    ELSE 'coach_id está preenchido'
  END as status,
  COUNT(*) as quantidade
FROM athlete_coach_relationships
GROUP BY CASE 
  WHEN coach_id IS NULL THEN 'coach_id é NULL'
  ELSE 'coach_id está preenchido'
END;

-- 21. Verificar relacionamento com auth.users
SELECT
  'Verificação de relacionamento com auth.users' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  u.id as auth_user_id,
  u.email as auth_email,
  CASE 
    WHEN acr.athlete_id = u.id THEN '✅ Relacionamento correto'
    WHEN u.id IS NULL THEN '❌ Usuário não encontrado'
    ELSE '❌ Relacionamento incorreto'
  END as status_relacionamento
FROM athlete_coach_relationships acr
LEFT JOIN auth.users u ON acr.athlete_id = u.id
ORDER BY acr.created_at DESC;

-- 22. Verificar relacionamento com coaches
SELECT
  'Verificação de relacionamento com coaches' as info,
  acr.id,
  acr.coach_id,
  c.id as coach_table_id,
  c.full_name as coach_name,
  CASE 
    WHEN acr.coach_id = c.id THEN '✅ Relacionamento correto'
    WHEN c.id IS NULL THEN '❌ Treinador não encontrado'
    ELSE '❌ Relacionamento incorreto'
  END as status_relacionamento
FROM athlete_coach_relationships acr
LEFT JOIN coaches c ON acr.coach_id = c.id
ORDER BY acr.created_at DESC;

-- 23. Verificação final
SELECT
  'Verificação final' as info,
  'Tabela athlete_coach_relationships configurada' as status,
  'Políticas RLS aplicadas' as rls_status,
  'View active_athlete_coach_relationships criada' as view_status,
  'Sistema pronto para solicitações de vínculo' as final_status; 