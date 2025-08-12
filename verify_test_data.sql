-- Verificar se os usuários foram criados
SELECT 
  'auth.users' as table_name,
  COUNT(*) as count
FROM auth.users 
WHERE email IN ('aline@gmail.com', 'luiz@gmail.com');

-- Verificar se os perfis foram criados
SELECT 
  'profiles' as table_name,
  COUNT(*) as count
FROM profiles 
WHERE email IN ('aline@gmail.com', 'luiz@gmail.com');

-- Verificar se os insights foram criados
SELECT 
  'insights' as table_name,
  COUNT(*) as count
FROM insights;

-- Verificar insights por usuário
SELECT 
  i.id,
  i.insight_type,
  LEFT(i.insight_text, 50) as insight_preview,
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

-- Testar se as políticas RLS permitem acesso aos insights
-- Simular consulta como treinador (luiz@gmail.com) para ver insights da atleta (aline@gmail.com)
SELECT 
  'RLS Test - Insights accessible by coach' as test_name,
  COUNT(*) as accessible_insights_count
FROM insights i
JOIN profiles athlete ON i.user_id = athlete.id
WHERE athlete.email = 'aline@gmail.com'
AND EXISTS (
  SELECT 1 FROM athlete_coach_relationships acr
  JOIN profiles coach ON acr.coach_id = coach.id
  WHERE acr.athlete_id = i.user_id 
  AND coach.email = 'luiz@gmail.com'
  AND acr.status IN ('active', 'approved')
); 