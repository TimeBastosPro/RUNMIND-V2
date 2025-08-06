-- =====================================================
-- TESTE DO SISTEMA DE VINCULAÇÃO ATLETA-TREINADOR
-- =====================================================

-- 1. Verificar estrutura das tabelas
SELECT 
  'coaches' as tabela,
  COUNT(*) as total_registros
FROM coaches
UNION ALL
SELECT 
  'teams' as tabela,
  COUNT(*) as total_registros
FROM teams
UNION ALL
SELECT 
  'athlete_coach_relationships' as tabela,
  COUNT(*) as total_registros
FROM athlete_coach_relationships;

-- 2. Verificar treinadores disponíveis
SELECT 
  id,
  full_name,
  email,
  experience_years,
  specialties,
  is_active,
  created_at
FROM coaches
ORDER BY created_at DESC;

-- 3. Verificar equipes criadas
SELECT 
  t.id,
  t.name,
  t.description,
  c.full_name as coach_name,
  t.created_at
FROM teams t
JOIN coaches c ON t.coach_id = c.id
ORDER BY t.created_at DESC;

-- 4. Verificar relacionamentos existentes
SELECT 
  acr.id,
  acr.status,
  acr.requested_at,
  acr.approved_at,
  acr.notes,
  a.email as athlete_email,
  c.full_name as coach_name,
  t.name as team_name
FROM athlete_coach_relationships acr
JOIN auth.users a ON acr.athlete_id = a.id
JOIN coaches c ON acr.coach_id = c.id
LEFT JOIN teams t ON acr.team_id = t.id
ORDER BY acr.created_at DESC;

-- 5. Verificar view de relacionamentos ativos
SELECT 
  id,
  athlete_name,
  athlete_email,
  coach_name,
  coach_email,
  team_name,
  status,
  requested_at,
  approved_at
FROM active_athlete_coach_relationships
ORDER BY requested_at DESC;

-- 6. Teste: Simular solicitação de vínculo (se houver usuários)
DO $$
DECLARE
  test_athlete_id UUID;
  test_coach_id UUID;
BEGIN
  -- Pegar primeiro atleta
  SELECT id INTO test_athlete_id FROM auth.users 
  WHERE id NOT IN (SELECT user_id FROM coaches) 
  LIMIT 1;
  
  -- Pegar primeiro treinador
  SELECT id INTO test_coach_id FROM coaches LIMIT 1;
  
  IF test_athlete_id IS NOT NULL AND test_coach_id IS NOT NULL THEN
    -- Inserir solicitação de teste
    INSERT INTO athlete_coach_relationships (
      athlete_id,
      coach_id,
      status,
      notes
    ) VALUES (
      test_athlete_id,
      test_coach_id,
      'pending',
      'Solicitação de teste automática'
    );
    
    RAISE NOTICE '✅ Solicitação de teste criada: Atleta % -> Treinador %', test_athlete_id, test_coach_id;
  ELSE
    RAISE NOTICE '⚠️ Não foi possível criar teste: atleta_id=%, coach_id=%', test_athlete_id, test_coach_id;
  END IF;
END $$;

-- 7. Verificar políticas RLS
SELECT 
  policyname,
  tablename,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('coaches', 'teams', 'athlete_coach_relationships')
ORDER BY tablename, policyname;

-- 8. Estatísticas finais
SELECT 
  'ESTATÍSTICAS DO SISTEMA' as titulo,
  '' as valor
UNION ALL
SELECT 
  'Total de Treinadores' as titulo,
  COUNT(*)::text as valor
FROM coaches
UNION ALL
SELECT 
  'Treinadores Ativos' as titulo,
  COUNT(*)::text as valor
FROM coaches WHERE is_active = true
UNION ALL
SELECT 
  'Total de Equipes' as titulo,
  COUNT(*)::text as valor
FROM teams
UNION ALL
SELECT 
  'Solicitações Pendentes' as titulo,
  COUNT(*)::text as valor
FROM athlete_coach_relationships WHERE status = 'pending'
UNION ALL
SELECT 
  'Vínculos Ativos' as titulo,
  COUNT(*)::text as valor
FROM athlete_coach_relationships WHERE status = 'active'
UNION ALL
SELECT 
  'Solicitações Aprovadas' as titulo,
  COUNT(*)::text as valor
FROM athlete_coach_relationships WHERE status = 'approved'
UNION ALL
SELECT 
  'Solicitações Rejeitadas' as titulo,
  COUNT(*)::text as valor
FROM athlete_coach_relationships WHERE status = 'rejected'; 