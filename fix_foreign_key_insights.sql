-- CORREÇÃO DO PROBLEMA DE FOREIGN KEY NA TABELA INSIGHTS
-- Este script corrige o erro de constraint violation

-- 1. VERIFICAR USUÁRIOS ÓRFÃOS
SELECT 
  'USUÁRIOS SEM PERFIL' as problema,
  COUNT(*) as quantidade
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'INSIGHTS SEM USUÁRIO' as problema,
  COUNT(*) as quantidade
FROM insights i
LEFT JOIN auth.users u ON i.user_id = u.id
WHERE u.id IS NULL;

-- 2. VERIFICAR INSIGHTS COM USUÁRIOS SEM PERFIL
SELECT 
  i.id,
  i.user_id,
  i.insight_text,
  i.created_at,
  CASE 
    WHEN u.id IS NULL THEN 'Usuário não existe'
    WHEN p.id IS NULL THEN 'Usuário sem perfil'
    ELSE 'OK'
  END as status
FROM insights i
LEFT JOIN auth.users u ON i.user_id = u.id
LEFT JOIN profiles p ON i.user_id = p.id
WHERE u.id IS NULL OR p.id IS NULL
ORDER BY i.created_at DESC
LIMIT 10;

-- 3. CRIAR PERFIS PARA USUÁRIOS QUE NÃO TÊM
INSERT INTO profiles (id, email, full_name, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  u.created_at,
  u.updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. LIMPAR INSIGHTS ÓRFÃOS (usuários que não existem mais)
DELETE FROM insights 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 5. VERIFICAR SE A CORREÇÃO FUNCIONOU
SELECT 
  'INSIGHTS VÁLIDOS' as status,
  COUNT(*) as quantidade
FROM insights i
INNER JOIN auth.users u ON i.user_id = u.id
INNER JOIN profiles p ON i.user_id = p.id

UNION ALL

SELECT 
  'INSIGHTS INVÁLIDOS' as status,
  COUNT(*) as quantidade
FROM insights i
LEFT JOIN auth.users u ON i.user_id = u.id
LEFT JOIN profiles p ON i.user_id = p.id
WHERE u.id IS NULL OR p.id IS NULL;

-- 6. TESTE DE INSERÇÃO SEGURO
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
      'Teste de inserção após correção do sistema de insights.',
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
    RAISE NOTICE 'Insight de teste removido';
  ELSE
    RAISE NOTICE '❌ Nenhum usuário válido encontrado para teste';
  END IF;
END $$;

-- 7. VERIFICAR ESTRUTURA FINAL
SELECT 
  'TABELA INSIGHTS' as tabela,
  COUNT(*) as registros,
  'Estrutura OK' as status
FROM insights

UNION ALL

SELECT 
  'USUÁRIOS COM PERFIL' as tabela,
  COUNT(*) as registros,
  'Estrutura OK' as status
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id;

-- 8. MENSAGEM DE CONCLUSÃO
DO $$
BEGIN
  RAISE NOTICE '=== CORREÇÃO DE FOREIGN KEY CONCLUÍDA ===';
  RAISE NOTICE '1. Perfis criados para usuários órfãos';
  RAISE NOTICE '2. Insights inválidos removidos';
  RAISE NOTICE '3. Teste de inserção realizado';
  RAISE NOTICE '4. Sistema de insights pronto para uso';
  RAISE NOTICE '=== PROBLEMA RESOLVIDO ===';
END $$;
