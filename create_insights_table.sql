-- Criar tabela insights se não existir
CREATE TABLE IF NOT EXISTS insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('correlation', 'trend', 'ai_analysis', 'alert')),
  insight_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  source_data JSONB,
  generated_by TEXT NOT NULL CHECK (generated_by IN ('system', 'ai')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at);

-- Habilitar RLS
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own insights" ON insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights" ON insights
  FOR DELETE USING (auth.uid() = user_id);

-- Inserir insights de teste para o atleta Aline Cabral
INSERT INTO insights (id, user_id, insight_type, insight_text, confidence_score, source_data, generated_by, created_at)
SELECT 
  gen_random_uuid(),
  p.id,
  'ai_analysis',
  'Baseado nos seus últimos check-ins, você está mostrando uma tendência positiva na qualidade do sono. Sua média de sono melhorou 15% na última semana, o que pode estar contribuindo para sua maior disposição nos treinos.',
  0.85,
  '{"sleep_quality_trend": "increasing", "weekly_avg": 6.8, "previous_avg": 5.9}',
  'ai',
  NOW() - INTERVAL '2 days'
FROM profiles p
WHERE p.email = 'aline@gmail.com';

INSERT INTO insights (id, user_id, insight_type, insight_text, confidence_score, source_data, generated_by, created_at)
SELECT 
  gen_random_uuid(),
  p.id,
  'correlation',
  'Há uma correlação forte (0.78) entre sua motivação e a qualidade dos treinos. Quando você reporta motivação alta, seus treinos tendem a ter melhor satisfação e esforço percebido.',
  0.78,
  '{"correlation_coefficient": 0.78, "data_points": 12, "period": "last_month"}',
  'system',
  NOW() - INTERVAL '5 days'
FROM profiles p
WHERE p.email = 'aline@gmail.com';

INSERT INTO insights (id, user_id, insight_type, insight_text, confidence_score, source_data, generated_by, created_at)
SELECT 
  gen_random_uuid(),
  p.id,
  'trend',
  'Sua consistência nos treinos de trail running está aumentando. Você completou 80% dos treinos planejados este mês, comparado a 65% no mês anterior.',
  0.92,
  '{"completion_rate": 0.80, "previous_rate": 0.65, "trend": "increasing"}',
  'system',
  NOW() - INTERVAL '1 day'
FROM profiles p
WHERE p.email = 'aline@gmail.com'; 