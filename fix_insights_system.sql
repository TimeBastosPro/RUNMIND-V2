-- CORREÇÃO CRÍTICA DO SISTEMA DE INSIGHTS
-- Este script corrige os problemas que impedem a geração automática de insights

-- 1. CORRIGIR ESTRUTURA DA TABELA INSIGHTS
-- Adicionar coluna context_type que está faltando
ALTER TABLE insights ADD COLUMN IF NOT EXISTS context_type TEXT;

-- Adicionar coluna generated_by se não existir (algumas versões não têm)
ALTER TABLE insights ADD COLUMN IF NOT EXISTS generated_by TEXT DEFAULT 'ai';

-- 2. CORRIGIR POLÍTICAS RLS PARA INSIGHTS
-- Remover políticas conflitantes
DROP POLICY IF EXISTS "Users can view own insights" ON insights;
DROP POLICY IF EXISTS "Users can insert own insights" ON insights;
DROP POLICY IF EXISTS "Users can update own insights" ON insights;
DROP POLICY IF EXISTS "Users can delete own insights" ON insights;

-- Recriar políticas corretas
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

CREATE POLICY "Users can insert own insights" ON insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights" ON insights
  FOR DELETE USING (auth.uid() = user_id);

-- 3. CORRIGIR ESTRUTURA DA TABELA DAILY_CHECKINS
-- Adicionar colunas que podem estar faltando
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS emocional INTEGER;
ALTER TABLE daily_checkins ADD COLUMN IF NOT EXISTS readiness_insight_text TEXT;

-- 4. CORRIGIR ESTRUTURA DA TABELA TRAINING_SESSIONS
-- Adicionar colunas que podem estar faltando
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_distance_km DECIMAL(8,2);
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_duration_hours TEXT;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_duration_minutes TEXT;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS planned_perceived_effort INTEGER;

-- 5. CRIAR ÍNDICES PARA MELHORAR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_insights_context_type ON insights(context_type);
CREATE INDEX IF NOT EXISTS idx_insights_user_created ON insights(user_id, created_at DESC);

-- 6. VERIFICAR E CORRIGIR DADOS EXISTENTES
-- Atualizar insights existentes sem context_type
UPDATE insights SET context_type = 'daily_checkin' WHERE context_type IS NULL;

-- 7. CRIAR FUNÇÃO DE LOG PARA DEBUG
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

-- 8. VERIFICAR SE AS TABELAS NECESSÁRIAS EXISTEM
DO $$
BEGIN
  -- Verificar se a tabela insights existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insights') THEN
    RAISE EXCEPTION 'Tabela insights não encontrada. Execute as migrações primeiro.';
  END IF;
  
  -- Verificar se a tabela daily_checkins existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_checkins') THEN
    RAISE EXCEPTION 'Tabela daily_checkins não encontrada. Execute as migrações primeiro.';
  END IF;
  
  -- Verificar se a tabela training_sessions existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_sessions') THEN
    RAISE EXCEPTION 'Tabela training_sessions não encontrada. Execute as migrações primeiro.';
  END IF;
  
  RAISE NOTICE 'Todas as tabelas necessárias foram verificadas com sucesso.';
END $$;

-- 9. CRIAR VIEW PARA DEBUG DE INSIGHTS
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

-- 10. VERIFICAR CONFIGURAÇÃO FINAL
SELECT 
  'INSIGHTS_TABLE' as check_type,
  COUNT(*) as record_count,
  'Tabela insights está funcionando' as status
FROM insights
UNION ALL
SELECT 
  'DAILY_CHECKINS_TABLE' as check_type,
  COUNT(*) as record_count,
  'Tabela daily_checkins está funcionando' as status
FROM daily_checkins
UNION ALL
SELECT 
  'TRAINING_SESSIONS_TABLE' as check_type,
  COUNT(*) as record_count,
  'Tabela training_sessions está funcionando' as status
FROM training_sessions;

-- MENSAGEM DE CONCLUSÃO
DO $$
BEGIN
  RAISE NOTICE '=== CORREÇÃO DO SISTEMA DE INSIGHTS CONCLUÍDA ===';
  RAISE NOTICE '1. Estrutura da tabela insights corrigida';
  RAISE NOTICE '2. Políticas RLS atualizadas';
  RAISE NOTICE '3. Colunas faltantes adicionadas';
  RAISE NOTICE '4. Índices de performance criados';
  RAISE NOTICE '5. Função de debug criada';
  RAISE NOTICE '6. View de debug criada';
  RAISE NOTICE '=== O sistema de insights deve funcionar corretamente agora ===';
END $$;
