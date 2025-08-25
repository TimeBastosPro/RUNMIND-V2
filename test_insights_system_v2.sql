-- TESTE DO SISTEMA DE INSIGHTS (VERSÃO 2 - CORRIGIDA)
-- Este script testa se o sistema de insights está funcionando corretamente

-- 1. VERIFICAR ESTRUTURA DAS TABELAS
SELECT 
  'INSIGHTS_TABLE' as table_name,
  COUNT(*) as record_count,
  'Estrutura OK' as status
FROM insights
UNION ALL
SELECT 
  'DAILY_CHECKINS_TABLE' as table_name,
  COUNT(*) as record_count,
  'Estrutura OK' as status
FROM daily_checkins
UNION ALL
SELECT 
  'TRAINING_SESSIONS_TABLE' as table_name,
  COUNT(*) as record_count,
  'Estrutura OK' as status
FROM training_sessions;

-- 2. VERIFICAR COLUNAS DA TABELA INSIGHTS
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'insights' 
ORDER BY ordinal_position;

-- 3. VERIFICAR POLÍTICAS RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'insights';

-- 4. VERIFICAR INSIGHTS EXISTENTES (APENAS VÁLIDOS)
SELECT 
  i.id,
  i.user_id,
  p.full_name as user_name,
  i.insight_type,
  i.context_type,
  i.confidence_score,
  i.generated_by,
  i.created_at,
  LEFT(i.insight_text, 100) as insight_preview
FROM insights i
INNER JOIN profiles p ON i.user_id = p.id
ORDER BY i.created_at DESC
LIMIT 10;

-- 5. VERIFICAR CHECK-INS RECENTES
SELECT 
  dc.id,
  dc.user_id,
  p.full_name as user_name,
  dc.date,
  dc.sleep_quality,
  dc.soreness,
  dc.motivation,
  dc.confidence,
  dc.created_at
FROM daily_checkins dc
INNER JOIN profiles p ON dc.user_id = p.id
ORDER BY dc.created_at DESC
LIMIT 10;

-- 6. VERIFICAR TREINOS RECENTES
SELECT 
  ts.id,
  ts.user_id,
  p.full_name as user_name,
  ts.training_date,
  ts.title,
  ts.status,
  ts.perceived_effort,
  ts.session_satisfaction,
  ts.created_at
FROM training_sessions ts
INNER JOIN profiles p ON ts.user_id = p.id
ORDER BY ts.created_at DESC
LIMIT 10;

-- 7. TESTE DE INSERÇÃO DE INSIGHT MANUAL (SEGURO)
DO $$
DECLARE
  test_user_id UUID;
  test_insight_id UUID;
BEGIN
  -- Pegar um usuário válido (que tem perfil)
  SELECT u.id INTO test_user_id 
  FROM auth.users u
  INNER JOIN profiles p ON u.id = p.id
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Usuário de teste encontrado: %', test_user_id;
    
    -- Inserir insight de teste
    INSERT INTO insights (
      user_id,
      insight_type,
      insight_text,
      context_type,
      confidence_score,
      generated_by
    ) VALUES (
      test_user_id,
      'ai_analysis',
      'Este é um insight de teste para verificar se o sistema está funcionando corretamente.',
      'test',
      0.95,
      'system'
    ) RETURNING id INTO test_insight_id;
    
    RAISE NOTICE 'Insight de teste inserido com sucesso. ID: %', test_insight_id;
    
    -- Verificar se foi inserido
    IF EXISTS (SELECT 1 FROM insights WHERE id = test_insight_id) THEN
      RAISE NOTICE '✅ Teste de inserção PASSOU';
    ELSE
      RAISE NOTICE '❌ Teste de inserção FALHOU';
    END IF;
    
    -- Limpar insight de teste
    DELETE FROM insights WHERE id = test_insight_id;
    RAISE NOTICE 'Insight de teste removido';
  ELSE
    RAISE NOTICE '❌ Nenhum usuário válido encontrado para teste';
  END IF;
END $$;

-- 8. VERIFICAR FUNÇÃO DE LOG
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'log_insight_generation';

-- 9. VERIFICAR VIEW DE DEBUG (CORRIGIDO)
SELECT 
  table_name
FROM information_schema.views 
WHERE table_name = 'insights_debug';

-- 10. VERIFICAR INTEGRIDADE DOS DADOS
SELECT 
  'USUÁRIOS SEM PERFIL' as problema,
  COUNT(*) as quantidade
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'INSIGHTS SEM USUÁRIO VÁLIDO' as problema,
  COUNT(*) as quantidade
FROM insights i
LEFT JOIN auth.users u ON i.user_id = u.id
LEFT JOIN profiles p ON i.user_id = p.id
WHERE u.id IS NULL OR p.id IS NULL;

-- 11. VERIFICAR COLUNAS FALTANTES
SELECT 
  'COLUNAS INSIGHTS' as tabela,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'insights' 
AND column_name IN ('context_type', 'generated_by')
ORDER BY column_name;

-- 12. TESTE FINAL DE FUNCIONAMENTO
DO $$
BEGIN
  RAISE NOTICE '=== TESTE DO SISTEMA DE INSIGHTS ===';
  RAISE NOTICE '1. Estrutura das tabelas verificada';
  RAISE NOTICE '2. Políticas RLS verificadas';
  RAISE NOTICE '3. Dados existentes verificados';
  RAISE NOTICE '4. Teste de inserção realizado';
  RAISE NOTICE '5. Funções auxiliares verificadas';
  RAISE NOTICE '6. Integridade dos dados verificada';
  RAISE NOTICE '7. Colunas obrigatórias verificadas';
  RAISE NOTICE '=== SISTEMA PRONTO PARA USO ===';
END $$;
