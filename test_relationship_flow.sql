-- Script para testar o fluxo completo de vinculação atleta-treinador
-- Este script simula o processo completo para identificar problemas

-- 1. Verificar dados de teste disponíveis
SELECT
  'Dados de teste disponíveis' as info,
  'coaches' as table_name,
  COUNT(*) as count
FROM coaches
WHERE is_active = true
UNION ALL
SELECT
  'profiles' as table_name,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT
  'athlete_coach_relationships' as table_name,
  COUNT(*) as count
FROM athlete_coach_relationships;

-- 2. Verificar coaches ativos
SELECT
  'Coaches ativos disponíveis' as info,
  id,
  full_name,
  email,
  is_active,
  created_at
FROM coaches
WHERE is_active = true
ORDER BY created_at DESC;

-- 3. Verificar profiles (atletas) disponíveis
SELECT
  'Profiles (atletas) disponíveis' as info,
  id,
  full_name,
  email,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar relacionamentos existentes
SELECT
  'Relacionamentos existentes' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  acr.notes,
  p.full_name as athlete_name,
  c.full_name as coach_name,
  acr.created_at
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
ORDER BY acr.created_at DESC;

-- 5. Simular criação de um relacionamento (comentado - descomente para testar)
/*
-- Primeiro, pegar IDs válidos
DO $$
DECLARE
  athlete_id UUID;
  coach_id UUID;
  relationship_id UUID;
BEGIN
  -- Pegar um athlete_id válido
  SELECT id INTO athlete_id FROM profiles LIMIT 1;
  
  -- Pegar um coach_id válido
  SELECT id INTO coach_id FROM coaches WHERE is_active = true LIMIT 1;
  
  -- Verificar se temos dados válidos
  IF athlete_id IS NULL THEN
    RAISE NOTICE 'Nenhum profile encontrado';
    RETURN;
  END IF;
  
  IF coach_id IS NULL THEN
    RAISE NOTICE 'Nenhum coach ativo encontrado';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Testando com athlete_id: %, coach_id: %', athlete_id, coach_id;
  
  -- Inserir relacionamento de teste
  INSERT INTO athlete_coach_relationships (
    athlete_id, 
    coach_id, 
    status, 
    notes
  ) VALUES (
    athlete_id,
    coach_id,
    'pending',
    'Teste de relacionamento'
  ) RETURNING id INTO relationship_id;
  
  RAISE NOTICE 'Relacionamento criado com ID: %', relationship_id;
  
  -- Verificar se foi criado
  SELECT 
    id, 
    athlete_id, 
    coach_id, 
    status, 
    notes 
  FROM athlete_coach_relationships 
  WHERE id = relationship_id;
  
  -- Simular aprovação
  UPDATE athlete_coach_relationships 
  SET 
    status = 'active',
    approved_at = NOW(),
    approved_by = coach_id,
    notes = 'Aprovado via teste'
  WHERE id = relationship_id;
  
  RAISE NOTICE 'Relacionamento aprovado';
  
  -- Verificar resultado final
  SELECT 
    id, 
    athlete_id, 
    coach_id, 
    status, 
    approved_at,
    notes 
  FROM athlete_coach_relationships 
  WHERE id = relationship_id;
  
  -- Limpar teste
  DELETE FROM athlete_coach_relationships WHERE id = relationship_id;
  RAISE NOTICE 'Teste concluído e limpo';
  
END $$;
*/

-- 6. Verificar RLS policies ativas
SELECT
  'RLS policies ativas' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('athlete_coach_relationships', 'coaches', 'profiles', 'teams')
ORDER BY tablename, policyname;

-- 7. Verificar se RLS está habilitado nas tabelas
SELECT
  'RLS habilitado nas tabelas' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('athlete_coach_relationships', 'coaches', 'profiles', 'teams');

-- 8. Testar query de relacionamentos pendentes
SELECT
  'Teste de query de relacionamentos pendentes' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  p.full_name as athlete_name,
  c.full_name as coach_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
WHERE acr.status = 'pending'
ORDER BY acr.created_at DESC;

-- 9. Verificar se a view está funcionando
SELECT
  'Teste da view active_athlete_coach_relationships' as info,
  COUNT(*) as total_records
FROM active_athlete_coach_relationships;

-- 10. Verificar relacionamentos por status
SELECT
  'Relacionamentos por status' as info,
  status,
  COUNT(*) as count
FROM athlete_coach_relationships
GROUP BY status
ORDER BY status;

-- 11. Verificar se há relacionamentos com dados nulos
SELECT
  'Relacionamentos com dados nulos' as info,
  COUNT(*) as total_with_nulls
FROM athlete_coach_relationships
WHERE 
  athlete_id IS NULL OR 
  coach_id IS NULL OR 
  status IS NULL;

-- 12. Verificar relacionamentos recentes (últimas 24h)
SELECT
  'Relacionamentos criados nas últimas 24h' as info,
  id,
  athlete_id,
  coach_id,
  status,
  notes,
  created_at
FROM athlete_coach_relationships
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC; 