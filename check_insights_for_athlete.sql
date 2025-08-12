-- Verificar se existem insights para o atleta Aline Cabral
SELECT 
  i.id,
  i.insight_type,
  i.insight_text,
  i.confidence_score,
  i.created_at,
  p.full_name,
  p.email
FROM insights i
JOIN profiles p ON i.user_id = p.id
WHERE p.email = 'aline@gmail.com'
ORDER BY i.created_at DESC;

-- Se não houver insights, criar alguns de teste
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
WHERE p.email = 'aline@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM insights i2 WHERE i2.user_id = p.id
);

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
WHERE p.email = 'aline@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM insights i2 WHERE i2.user_id = p.id AND i2.insight_type = 'correlation'
);

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
WHERE p.email = 'aline@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM insights i2 WHERE i2.user_id = p.id AND i2.insight_type = 'trend'
);

-- Verificar novamente após inserção
SELECT 
  i.id,
  i.insight_type,
  i.insight_text,
  i.confidence_score,
  i.created_at,
  p.full_name,
  p.email
FROM insights i
JOIN profiles p ON i.user_id = p.id
WHERE p.email = 'aline@gmail.com'
ORDER BY i.created_at DESC; 