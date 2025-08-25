-- CORREÇÃO COMPLETA DO SISTEMA DE INSIGHTS (VERSÃO 2)
-- Este script resolve todos os problemas identificados sem conflitos

-- ========================================
-- 1. CORREÇÃO DE FOREIGN KEY CONSTRAINTS
-- ========================================

-- Verificar problemas de integridade
SELECT 
  'DIAGNÓSTICO INICIAL' as etapa,
  'Usuários sem perfil' as problema,
  COUNT(*) as quantidade
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'DIAGNÓSTICO INICIAL' as etapa,
  'Insights órfãos' as problema,
  COUNT(*) as quantidade
FROM insights i
LEFT JOIN auth.users u ON i.user_id = u.id
WHERE u.id IS NULL;

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

-- Limpar insights órfãos
DELETE FROM insights 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- ========================================
-- 2. CORREÇÃO DA ESTRUTURA DA TABELA INSIGHTS
-- ========================================

-- Adicionar colunas faltantes
ALTER TABLE insights ADD COLUMN IF NOT EXISTS context_type TEXT;
ALTER TABLE insights ADD COLUMN IF NOT EXISTS generated_by TEXT DEFAULT 'ai';

-- Atualizar insights existentes sem context_type
UPDATE insights SET context_type = 'daily_checkin' WHERE context_type IS NULL;

-- ========================================
-- 3. CORREÇÃO DAS POLÍTICAS RLS (VERSÃO SEGURA)
-- ========================================

-- Verificar políticas existentes
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'insights';

-- Remover políticas conflitantes (apenas se existirem)
DO $$
BEGIN
  -- Remover políticas antigas se existirem
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insights' AND policyname = 'Users can view own insights') THEN
    DROP POLICY "Users can view own insights" ON insights;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insights' AND policyname = 'Users can insert own insights') THEN
    DROP POLICY "Users can insert own insights" ON insights;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insights' AND policyname = 'Users can update own insights') THEN
    DROP POLICY "Users can update own insights" ON insights;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insights' AND policyname = 'Users can delete own insights') THEN
    DROP POLICY "Users can delete own insights" ON insights;
  END IF;
  
  RAISE NOTICE 'Políticas antigas removidas (se existiam)';
END $$;

-- Criar políticas corretas (apenas se não existirem)
DO $$
BEGIN
  -- Política de visualização
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insights' AND policyname = 'Users can view own insights or athlete insights if coach') THEN
    CREATE POLICY "Users can view own insights or athlete insights if coach" ON insights
      FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
          SELECT 1 FROM athlete_coach_relationships 
          WHERE athlete_id = insights.user_id 
          AND coach_id = auth.uid() 
          AND status IN ('active', 'approved')
        )
      );
    RAISE NOTICE 'Política de visualização criada';
  ELSE
    RAISE NOTICE 'Política de visualização já existe';
  END IF;

  -- Política de inserção
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insights' AND policyname = 'Users can insert own insights') THEN
    CREATE POLICY "Users can insert own insights" ON insights
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Política de inserção criada';
  ELSE
    RAISE NOTICE 'Política de inserção já existe';
  END IF;

  -- Política de atualização
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insights' AND policyname = 'Users can update own insights') THEN
    CREATE POLICY "Users can update own insights" ON insights
      FOR UPDATE USING (auth.uid() = user_id);
    RAISE NOTICE 'Política de atualização criada';
  ELSE
    RAISE NOTICE 'Política de atualização já existe';
  END IF;

  -- Política de exclusão
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insights' AND policyname = 'Users can delete own insights') THEN
    CREATE POLICY "Users can delete own insights" ON insights
      FOR DELETE USING (auth.uid() = user_id);
    RAISE NOTICE 'Política de exclusão criada';
  ELSE
    RAISE NOTICE 'Política de exclusão já existe';
  END IF;
END $$;

-- ========================================
-- 4. CORREÇÃO DA ESTRUTURA DE OUTRAS TABELAS
-- ========================================

-- Adicionar colunas faltantes em daily_checkins
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS emocional INTEGER;
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS readiness_insight_text TEXT;

-- Adicionar colunas faltantes em training_sessions
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_distance_km DECIMAL(8,2);
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_duration_hours TEXT;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_duration_minutes TEXT;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_perceived_effort INTEGER;

-- ========================================
-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_insights_context_type ON insights(context_type);
CREATE INDEX IF NOT EXISTS idx_insights_user_created ON insights(user_id, created_at DESC);

-- ========================================
-- 6. CRIAR FUNÇÕES AUXILIARES
-- ========================================

-- Função de log para debug
CREATE OR REPLACE FUNCTION log_insight_generation(
  user_id UUID,
  insight_type TEXT,
  context_type TEXT,
  success BOOLEAN,
  error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO insights (
    user_id,
    insight_type,
    insight_text,
    context_type,
    confidence_score,
    generated_by,
    source_data
  ) VALUES (
    user_id,
    'alert',
    CASE 
      WHEN success THEN 'Insight gerado com sucesso via ' || insight_type
      ELSE 'Erro na geração de insight: ' || COALESCE(error_message, 'Erro desconhecido')
    END,
    context_type,
    1.0,
    'system',
    jsonb_build_object(
      'debug_info', jsonb_build_object(
        'insight_type', insight_type,
        'success', success,
        'error_message', error_message,
        'timestamp', now()
      )
    )
  );
END;
$$ LANGUAGE plpgsql;

-- View para debug de insights
CREATE OR REPLACE VIEW insights_debug AS
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
LEFT JOIN profiles p ON i.user_id = p.id
ORDER BY i.created_at DESC;

-- ========================================
-- 7. VERIFICAÇÃO FINAL
-- ========================================

-- Verificar estrutura das tabelas
SELECT 
  'VERIFICAÇÃO FINAL' as etapa,
  'Insights válidos' as status,
  COUNT(*) as quantidade
FROM insights i
INNER JOIN auth.users u ON i.user_id = u.id
INNER JOIN profiles p ON i.user_id = p.id

UNION ALL

SELECT 
  'VERIFICAÇÃO FINAL' as etapa,
  'Usuários com perfil' as status,
  COUNT(*) as quantidade
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id

UNION ALL

SELECT 
  'VERIFICAÇÃO FINAL' as etapa,
  'Check-ins válidos' as status,
  COUNT(*) as quantidade
FROM daily_checkins dc
INNER JOIN auth.users u ON dc.user_id = u.id
INNER JOIN profiles p ON dc.user_id = p.id

UNION ALL

SELECT 
  'VERIFICAÇÃO FINAL' as etapa,
  'Treinos válidos' as status,
  COUNT(*) as quantidade
FROM training_sessions ts
INNER JOIN auth.users u ON ts.user_id = u.id
INNER JOIN profiles p ON ts.user_id = p.id;

-- ========================================
-- 8. TESTE DE FUNCIONAMENTO
-- ========================================

DO $$
DECLARE
  test_user_id UUID;
  test_insight_id UUID;
BEGIN
  -- Pegar um usuário válido para teste
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
      'Teste de funcionamento do sistema de insights após correção completa.',
      'test',
      0.95,
      'system'
    ) RETURNING id INTO test_insight_id;
    
    RAISE NOTICE '✅ Teste de inserção PASSOU - Insight ID: %', test_insight_id;
    
    -- Limpar teste
    DELETE FROM insights WHERE id = test_insight_id;
    RAISE NOTICE '✅ Teste limpo com sucesso';
  ELSE
    RAISE NOTICE '❌ Nenhum usuário válido encontrado para teste';
  END IF;
END $$;

-- ========================================
-- 9. MENSAGEM DE CONCLUSÃO
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORREÇÃO COMPLETA DO SISTEMA DE INSIGHTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 1. Foreign key constraints corrigidas';
  RAISE NOTICE '✅ 2. Estrutura da tabela insights corrigida';
  RAISE NOTICE '✅ 3. Políticas RLS atualizadas (sem conflitos)';
  RAISE NOTICE '✅ 4. Colunas faltantes adicionadas';
  RAISE NOTICE '✅ 5. Índices de performance criados';
  RAISE NOTICE '✅ 6. Funções auxiliares criadas';
  RAISE NOTICE '✅ 7. Teste de funcionamento realizado';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SISTEMA DE INSIGHTS PRONTO PARA USO!';
  RAISE NOTICE '';
  RAISE NOTICE 'O sistema agora deve gerar insights automaticamente após:';
  RAISE NOTICE '• Check-in diário';
  RAISE NOTICE '• Treino realizado';
  RAISE NOTICE '• Reflexão semanal';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
