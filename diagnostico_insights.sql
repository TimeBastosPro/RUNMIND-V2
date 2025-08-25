-- DIAGNÓSTICO COMPLETO DO SISTEMA DE INSIGHTS
-- Este script identifica exatamente por que os insights não aparecem na tela

-- 1. VERIFICAR SE EXISTEM INSIGHTS NO BANCO
SELECT 
  'DIAGNÓSTICO INICIAL' as etapa,
  'Total de insights no banco' as verificação,
  COUNT(*) as quantidade
FROM insights;

-- 2. VERIFICAR INSIGHTS POR USUÁRIO
SELECT 
  i.user_id,
  p.full_name,
  p.email,
  COUNT(*) as total_insights,
  MAX(i.created_at) as ultimo_insight
FROM insights i
LEFT JOIN profiles p ON i.user_id = p.id
GROUP BY i.user_id, p.full_name, p.email
ORDER BY total_insights DESC;

-- 3. VERIFICAR INSIGHTS RECENTES (ÚLTIMOS 7 DIAS)
SELECT 
  'INSIGHTS RECENTES' as tipo,
  COUNT(*) as quantidade
FROM insights 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'

UNION ALL

SELECT 
  'INSIGHTS HOJE' as tipo,
  COUNT(*) as quantidade
FROM insights 
WHERE DATE(created_at) = CURRENT_DATE;

-- 4. VERIFICAR ESTRUTURA DOS INSIGHTS
SELECT 
  id,
  user_id,
  insight_type,
  context_type,
  generated_by,
  confidence_score,
  created_at,
  LEFT(insight_text, 100) as preview_text
FROM insights
ORDER BY created_at DESC
LIMIT 10;

-- 5. VERIFICAR SE HÁ PROBLEMAS DE RLS
-- Testar se um usuário pode ver seus próprios insights
DO $$
DECLARE
  test_user_id UUID;
  insight_count INTEGER;
BEGIN
  -- Pegar um usuário que tem insights
  SELECT user_id INTO test_user_id 
  FROM insights 
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Simular consulta como se fosse o usuário
    SELECT COUNT(*) INTO insight_count
    FROM insights 
    WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Usuário % tem % insights', test_user_id, insight_count;
  ELSE
    RAISE NOTICE 'Nenhum insight encontrado no banco';
  END IF;
END $$;

-- 6. VERIFICAR POLÍTICAS RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'insights';

-- 7. VERIFICAR SE A TABELA INSIGHTS TEM TODAS AS COLUNAS NECESSÁRIAS
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'insights' 
ORDER BY ordinal_position;

-- 8. TESTE DE INSERÇÃO MANUAL
DO $$
DECLARE
  test_user_id UUID;
  test_insight_id UUID;
BEGIN
  -- Pegar um usuário de teste
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
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
    
    RAISE NOTICE '✅ Insight de teste inserido com sucesso. ID: %', test_insight_id;
    
    -- Verificar se foi inserido
    IF EXISTS (SELECT 1 FROM insights WHERE id = test_insight_id) THEN
      RAISE NOTICE '✅ Teste de inserção PASSOU';
    ELSE
      RAISE NOTICE '❌ Teste de inserção FALHOU';
    END IF;
    
    -- Limpar insight de teste
    DELETE FROM insights WHERE id = test_insight_id;
    RAISE NOTICE '✅ Insight de teste removido';
  ELSE
    RAISE NOTICE '❌ Nenhum usuário encontrado para teste';
  END IF;
END $$;

-- 9. VERIFICAR LOGS DE ERRO (se existirem)
-- Esta consulta verifica se há insights com erros
SELECT 
  'INSIGHTS COM PROBLEMAS' as tipo,
  COUNT(*) as quantidade
FROM insights 
WHERE insight_text IS NULL 
   OR insight_text = '' 
   OR user_id IS NULL;

-- 10. CONCLUSÃO DO DIAGNÓSTICO
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNÓSTICO DO SISTEMA DE INSIGHTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Verifique os resultados acima para identificar:';
  RAISE NOTICE '1. Se existem insights no banco';
  RAISE NOTICE '2. Se os insights estão associados ao usuário correto';
  RAISE NOTICE '3. Se as políticas RLS estão funcionando';
  RAISE NOTICE '4. Se a estrutura da tabela está correta';
  RAISE NOTICE '5. Se há problemas de inserção';
  RAISE NOTICE '';
  RAISE NOTICE 'Se não há insights no banco, o problema está na geração.';
  RAISE NOTICE 'Se há insights mas não aparecem na tela, o problema está no carregamento.';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
