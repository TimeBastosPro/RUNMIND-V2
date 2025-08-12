-- Criar usuários de teste primeiro
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'aline@gmail.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'luiz@gmail.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Criar perfis de teste
INSERT INTO profiles (id, email, full_name, experience_level, main_goal, context_type, onboarding_completed)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'aline@gmail.com', 'Aline Cabral', 'intermediate', 'performance', 'coached', true),
  ('22222222-2222-2222-2222-222222222222', 'luiz@gmail.com', 'Luiz de Barros Bastos', 'advanced', 'performance', 'solo', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

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

-- Criar relacionamento entre treinador e atleta para testar políticas RLS
INSERT INTO athlete_coach_relationships (id, athlete_id, coach_id, status, modality, notes)
SELECT 
  gen_random_uuid(),
  athlete.id,
  coach.id,
  'active',
  'Trail Running',
  'Relacionamento ativo para teste de visualização de insights'
FROM profiles athlete, profiles coach
WHERE athlete.email = 'aline@gmail.com'
AND coach.email = 'luiz@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM athlete_coach_relationships 
  WHERE athlete_id = athlete.id AND coach_id = coach.id
); 