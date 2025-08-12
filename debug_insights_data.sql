-- Verificar se os insights foram criados
SELECT 
  'insights' as table_name,
  COUNT(*) as count
FROM insights;

-- Verificar insights por usuário
SELECT 
  i.id,
  i.insight_type,
  i.insight_text,
  i.confidence_score,
  i.created_at,
  p.email as user_email,
  p.full_name as user_name
FROM insights i
JOIN profiles p ON i.user_id = p.id
ORDER BY i.created_at DESC;

-- Verificar se os relacionamentos foram criados
SELECT 
  'athlete_coach_relationships' as table_name,
  COUNT(*) as count
FROM athlete_coach_relationships;

-- Verificar relacionamentos específicos
SELECT 
  acr.id,
  acr.status,
  acr.modality,
  acr.notes,
  athlete.email as athlete_email,
  athlete.full_name as athlete_name,
  coach.email as coach_email,
  coach.full_name as coach_name
FROM athlete_coach_relationships acr
JOIN profiles athlete ON acr.athlete_id = athlete.id
JOIN profiles coach ON acr.coach_id = coach.id;

-- Verificar se as políticas RLS estão funcionando
-- Simular consulta como treinador para ver insights do atleta
SELECT 
  'RLS Test - Insights accessible by coach' as test_name,
  COUNT(*) as accessible_insights_count
FROM insights i
WHERE EXISTS (
  SELECT 1 FROM athlete_coach_relationships acr
  WHERE acr.athlete_id = i.user_id 
  AND acr.coach_id = '00000000-0000-0000-0000-000000000000' -- placeholder
  AND acr.status IN ('active', 'approved')
); 