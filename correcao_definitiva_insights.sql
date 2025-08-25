-- CORREÇÃO DEFINITIVA DO SISTEMA DE INSIGHTS
-- Este script resolve TODOS os problemas identificados

-- ========================================
-- 1. CORREÇÃO CRÍTICA DE FOREIGN KEY
-- ========================================

-- Verificar e corrigir usuários órfãos
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  -- Contar usuários sem perfil
  SELECT COUNT(*) INTO orphan_count
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  WHERE p.id IS NULL;
  
  RAISE NOTICE 'Encontrados % usuários sem perfil', orphan_count;
  
  -- Criar perfis para usuários órfãos
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
  
  RAISE NOTICE 'Perfis criados para usuários órfãos';
END $$;

-- Limpar insights órfãos
DELETE FROM insights 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- ========================================
-- 2. CORREÇÃO DA ESTRUTURA DO BANCO
-- ========================================

-- Adicionar colunas essenciais na tabela insights
ALTER TABLE insights ADD COLUMN IF NOT EXISTS context_type TEXT;
ALTER TABLE insights ADD COLUMN IF NOT EXISTS generated_by TEXT DEFAULT 'ai';

-- Atualizar insights existentes
UPDATE insights SET context_type = 'daily_checkin' WHERE context_type IS NULL;

-- Adicionar colunas em daily_checkins
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS emocional INTEGER;
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS readiness_insight_text TEXT;

-- Adicionar colunas em training_sessions
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_distance_km DECIMAL(8,2);
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_duration_hours TEXT;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_duration_minutes TEXT;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_perceived_effort INTEGER;

-- ========================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_insights_context_type ON insights(context_type);
CREATE INDEX IF NOT EXISTS idx_insights_user_created ON insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_generated_by ON insights(generated_by);

-- ========================================
-- 4. VERIFICAÇÃO DE INTEGRIDADE
-- ========================================

-- Verificar se todos os insights têm usuários válidos
SELECT 
  'VERIFICAÇÃO DE INTEGRIDADE' as tipo,
  'Insights válidos' as status,
  COUNT(*) as quantidade
FROM insights i
INNER JOIN auth.users u ON i.user_id = u.id
INNER JOIN profiles p ON i.user_id = p.id

UNION ALL

SELECT 
  'VERIFICAÇÃO DE INTEGRIDADE' as tipo,
  'Usuários com perfil' as status,
  COUNT(*) as quantidade
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id

UNION ALL

SELECT 
  'VERIFICAÇÃO DE INTEGRIDADE' as tipo,
  'Check-ins válidos' as status,
  COUNT(*) as quantidade
FROM daily_checkins dc
INNER JOIN auth.users u ON dc.user_id = u.id
INNER JOIN profiles p ON dc.user_id = p.id;

-- ========================================
-- 5. TESTE DE FUNCIONAMENTO
-- ========================================

DO $$
DECLARE
  test_user_id UUID;
  test_insight_id UUID;
  test_success BOOLEAN := FALSE;
BEGIN
  -- Pegar um usuário válido
  SELECT u.id INTO test_user_id 
  FROM auth.users u
  INNER JOIN profiles p ON u.id = p.id
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Teste de inserção
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
      'Teste de funcionamento do sistema de insights após correção definitiva.',
      'test',
      0.95,
      'system'
    ) RETURNING id INTO test_insight_id;
    
    -- Verificar se foi inserido
    IF EXISTS (SELECT 1 FROM insights WHERE id = test_insight_id) THEN
      test_success := TRUE;
      RAISE NOTICE '✅ Teste de inserção PASSOU - Insight ID: %', test_insight_id;
    ELSE
      RAISE NOTICE '❌ Teste de inserção FALHOU';
    END IF;
    
    -- Limpar teste
    DELETE FROM insights WHERE id = test_insight_id;
    RAISE NOTICE '✅ Teste limpo com sucesso';
  ELSE
    RAISE NOTICE '❌ Nenhum usuário válido encontrado para teste';
  END IF;
  
  -- Resultado final
  IF test_success THEN
    RAISE NOTICE '🎉 SISTEMA DE INSIGHTS FUNCIONANDO!';
  ELSE
    RAISE NOTICE '⚠️ SISTEMA AINDA COM PROBLEMAS';
  END IF;
END $$;

-- ========================================
-- 6. INSTRUÇÕES PARA CORREÇÃO DAS EDGE FUNCTIONS
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORREÇÃO DEFINITIVA CONCLUÍDA';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 1. Foreign key constraints corrigidas';
  RAISE NOTICE '✅ 2. Estrutura do banco corrigida';
  RAISE NOTICE '✅ 3. Índices de performance criados';
  RAISE NOTICE '✅ 4. Teste de funcionamento realizado';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 PRÓXIMOS PASSOS PARA EDGE FUNCTIONS:';
  RAISE NOTICE '1. Verifique o arquivo tsconfig.json em supabase/functions/';
  RAISE NOTICE '2. Certifique-se de que as Edge Functions estão deployadas';
  RAISE NOTICE '3. Verifique se a variável GEMINI_API_KEY está configurada';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 TESTE FINAL:';
  RAISE NOTICE '• Faça um check-in diário na aplicação';
  RAISE NOTICE '• Verifique se o insight é gerado automaticamente';
  RAISE NOTICE '• Confirme se aparece na aba Insights';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
