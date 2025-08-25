-- CORREÇÃO RÁPIDA DO SISTEMA DE INSIGHTS
-- Script simples e direto para resolver os problemas principais

-- 1. CRIAR PERFIS PARA USUÁRIOS ÓRFÃOS
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

-- 2. LIMPAR INSIGHTS ÓRFÃOS
DELETE FROM insights 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 3. ADICIONAR COLUNAS FALTANTES
ALTER TABLE insights ADD COLUMN IF NOT EXISTS context_type TEXT;
ALTER TABLE insights ADD COLUMN IF NOT EXISTS generated_by TEXT DEFAULT 'ai';

-- 4. ATUALIZAR INSIGHTS EXISTENTES
UPDATE insights SET context_type = 'daily_checkin' WHERE context_type IS NULL;

-- 5. ADICIONAR COLUNAS EM OUTRAS TABELAS
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS emocional INTEGER;
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS readiness_insight_text TEXT;

ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_distance_km DECIMAL(8,2);
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_duration_hours TEXT;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_duration_minutes TEXT;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_perceived_effort INTEGER;

-- 6. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_insights_context_type ON insights(context_type);
CREATE INDEX IF NOT EXISTS idx_insights_user_created ON insights(user_id, created_at DESC);

-- 7. VERIFICAÇÃO FINAL
SELECT 
  'VERIFICAÇÃO' as tipo,
  'Insights válidos' as status,
  COUNT(*) as quantidade
FROM insights i
INNER JOIN auth.users u ON i.user_id = u.id
INNER JOIN profiles p ON i.user_id = p.id

UNION ALL

SELECT 
  'VERIFICAÇÃO' as tipo,
  'Usuários com perfil' as status,
  COUNT(*) as quantidade
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id;

-- 8. TESTE SIMPLES
DO $$
DECLARE
  test_user_id UUID;
  test_insight_id UUID;
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
      'Teste de funcionamento do sistema de insights.',
      'test',
      0.95,
      'system'
    ) RETURNING id INTO test_insight_id;
    
    RAISE NOTICE '✅ Teste PASSOU - Insight ID: %', test_insight_id;
    
    -- Limpar teste
    DELETE FROM insights WHERE id = test_insight_id;
    RAISE NOTICE '✅ Teste limpo';
  ELSE
    RAISE NOTICE '❌ Nenhum usuário válido encontrado';
  END IF;
END $$;

-- 9. MENSAGEM DE SUCESSO
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 CORREÇÃO RÁPIDA CONCLUÍDA!';
  RAISE NOTICE 'O sistema de insights deve funcionar agora.';
  RAISE NOTICE 'Teste fazendo um check-in diário.';
  RAISE NOTICE '';
END $$;
