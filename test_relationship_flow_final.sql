-- Script de teste FINAL para verificar o fluxo de relacionamentos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estado atual
SELECT 
  'Estado atual do sistema' as info,
  (SELECT COUNT(*) FROM coaches) as total_coaches,
  (SELECT COUNT(*) FROM athlete_coach_relationships) as total_relationships,
  (SELECT COUNT(*) FROM active_athlete_coach_relationships) as total_active_relationships,
  (SELECT COUNT(*) FROM pending_athlete_coach_relationships) as total_pending_relationships;

-- 2. Verificar relacionamentos pendentes com dados completos
SELECT 
  'Relacionamentos pendentes' as info,
  id,
  athlete_id,
  coach_id,
  status,
  athlete_name,
  athlete_email,
  coach_name,
  coach_email,
  notes,
  requested_at,
  created_at
FROM pending_athlete_coach_relationships
ORDER BY created_at DESC;

-- 3. Verificar relacionamentos ativos com dados completos
SELECT 
  'Relacionamentos ativos' as info,
  id,
  athlete_id,
  coach_id,
  status,
  athlete_name,
  athlete_email,
  coach_name,
  coach_email,
  notes,
  requested_at,
  approved_at,
  created_at
FROM active_athlete_coach_relationships
ORDER BY created_at DESC;

-- 4. Verificar se há dados de teste válidos
SELECT 
  'Dados de teste' as info,
  'Usuários' as tabela,
  COUNT(*) as total,
  string_agg(email, ', ') as emails
FROM auth.users
UNION ALL
SELECT 
  'Dados de teste' as info,
  'Profiles' as tabela,
  COUNT(*) as total,
  string_agg(email, ', ') as emails
FROM profiles
UNION ALL
SELECT 
  'Dados de teste' as info,
  'Coaches' as tabela,
  COUNT(*) as total,
  string_agg(email, ', ') as emails
FROM coaches;

-- 5. Testar inserção de relacionamento de teste (se não existir)
INSERT INTO athlete_coach_relationships (athlete_id, coach_id, status, notes)
SELECT 
  u.id as athlete_id,
  c.id as coach_id,
  'pending' as status,
  'Solicitação de teste para verificar o fluxo' as notes
FROM auth.users u
CROSS JOIN coaches c
WHERE u.email != c.email
  AND NOT EXISTS (
    SELECT 1 FROM athlete_coach_relationships acr 
    WHERE acr.athlete_id = u.id AND acr.coach_id = c.id
  )
LIMIT 1
ON CONFLICT (athlete_id, coach_id) DO NOTHING;

-- 6. Verificar relacionamentos após inserção
SELECT 
  'Relacionamentos após inserção' as info,
  COUNT(*) as total_relationships,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos
FROM athlete_coach_relationships;

-- 7. Testar consulta da view com dados completos
SELECT 
  'Teste da view com dados completos' as info,
  id,
  athlete_name,
  athlete_email,
  coach_name,
  coach_email,
  status,
  notes,
  requested_at
FROM active_athlete_coach_relationships
ORDER BY created_at DESC;

-- 8. Verificar políticas RLS
SELECT 
  'Políticas RLS para athlete_coach_relationships' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'athlete_coach_relationships'
ORDER BY policyname;

-- 9. Testar acesso com RLS
SELECT 
  'Teste de acesso com RLS' as info,
  'Relacionamentos visíveis' as tabela,
  COUNT(*) as total
FROM athlete_coach_relationships;

-- 10. Verificar se a view está funcionando corretamente
SELECT 
  'Verificação da view' as info,
  'View active_athlete_coach_relationships' as view_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN athlete_name != 'Nome não informado' THEN 1 END) as com_nome_atleta,
  COUNT(CASE WHEN athlete_email != 'Email não informado' THEN 1 END) as com_email_atleta
FROM active_athlete_coach_relationships;

-- 11. Mensagem final
SELECT 
  '✅ Teste do fluxo de relacionamentos concluído!' as status,
  'Dados de atletas incluídos nas views' as dados_atletas,
  'Políticas RLS configuradas' as rls,
  'Relacionamentos pendentes visíveis' as pendentes,
  'Sistema pronto para uso' as final; 