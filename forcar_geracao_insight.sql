-- FORÇAR GERAÇÃO DE INSIGHT PARA TESTE
-- Este script força a criação de um insight para testar o sistema

-- 1. VERIFICAR USUÁRIO ATUAL
SELECT 
  'USUÁRIO ATUAL' as tipo,
  id,
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;

-- 2. CRIAR INSIGHT FORÇADO
DO $$
DECLARE
  current_user_id UUID;
  new_insight_id UUID;
BEGIN
  -- Pegar o usuário mais recente
  SELECT id INTO current_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  
  IF current_user_id IS NOT NULL THEN
    -- Criar insight forçado
    INSERT INTO insights (
      user_id,
      insight_type,
      insight_text,
      context_type,
      confidence_score,
      generated_by,
      created_at
    ) VALUES (
      current_user_id,
      'ai_analysis',
      '🎯 INSIGHT FORÇADO: Este é um insight de teste criado diretamente no banco para verificar se o sistema de exibição está funcionando corretamente. Se você consegue ver este insight na tela, significa que o problema está na geração automática, não na exibição.',
      'forced_test',
      0.99,
      'system',
      NOW()
    ) RETURNING id INTO new_insight_id;
    
    RAISE NOTICE '✅ INSIGHT FORÇADO CRIADO COM SUCESSO!';
    RAISE NOTICE 'ID do insight: %', new_insight_id;
    RAISE NOTICE 'User ID: %', current_user_id;
    RAISE NOTICE 'Texto: INSIGHT FORÇADO: Este é um insight de teste...';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 AGORA TESTE:';
    RAISE NOTICE '1. Vá para a aba Insights na aplicação';
    RAISE NOTICE '2. Verifique se este insight aparece';
    RAISE NOTICE '3. Se aparecer, o problema está na geração automática';
    RAISE NOTICE '4. Se não aparecer, o problema está na exibição';
    RAISE NOTICE '';
    RAISE NOTICE '📱 Para limpar este teste depois, execute:';
    RAISE NOTICE 'DELETE FROM insights WHERE id = ''%'';', new_insight_id;
  ELSE
    RAISE NOTICE '❌ Nenhum usuário encontrado';
  END IF;
END $$;

-- 3. VERIFICAR SE O INSIGHT FOI CRIADO
SELECT 
  'VERIFICAÇÃO' as tipo,
  id,
  user_id,
  insight_type,
  context_type,
  generated_by,
  confidence_score,
  created_at,
  LEFT(insight_text, 50) as preview
FROM insights 
WHERE context_type = 'forced_test'
ORDER BY created_at DESC;

-- 4. MOSTRAR TODOS OS INSIGHTS DO USUÁRIO
SELECT 
  'TODOS OS INSIGHTS' as tipo,
  id,
  insight_type,
  context_type,
  generated_by,
  created_at,
  LEFT(insight_text, 50) as preview
FROM insights 
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
ORDER BY created_at DESC;
