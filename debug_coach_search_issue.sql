-- Script para debugar o problema de busca de treinadores
-- Verificar por que o treinador Evandro não aparece na busca

-- 1. Verificar se o treinador Evandro existe e está ativo
SELECT
  'Verificação do treinador Evandro' as info,
  c.id,
  c.user_id,
  c.full_name,
  c.email,
  c.is_active,
  c.created_at,
  u.email_confirmed_at,
  CASE 
    WHEN c.is_active = true AND u.email_confirmed_at IS NOT NULL THEN '✅ Treinador válido'
    WHEN c.is_active = false THEN '❌ Treinador inativo'
    WHEN u.email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    ELSE '❌ Outro problema'
  END as status
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE c.full_name ILIKE '%evandro%' OR c.email ILIKE '%evandro%'
ORDER BY c.created_at DESC;

-- 2. Verificar todos os treinadores cadastrados
SELECT
  'Todos os treinadores cadastrados' as info,
  c.id,
  c.full_name,
  c.email,
  c.is_active,
  c.created_at,
  u.email_confirmed_at
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.full_name;

-- 3. Verificar políticas RLS da tabela coaches
SELECT
  'Políticas RLS da tabela coaches' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'coaches'
ORDER BY policyname;

-- 4. Verificar se o RLS está habilitado na tabela coaches
SELECT
  'Status RLS da tabela coaches' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'coaches';

-- 5. Testar a busca como usuário anônimo (simular o que acontece na busca)
-- Primeiro, vamos ver qual usuário está logado (se houver)
SELECT 
  'Usuário atual' as info,
  auth.uid() as current_user_id;

-- 6. Verificar se há problemas com as políticas RLS
-- Testar se um usuário pode ver treinadores
SELECT
  'Teste de acesso aos treinadores' as teste,
  COUNT(*) as total_treinadores_visiveis
FROM coaches;

-- 7. Verificar se há treinadores inativos que podem estar sendo filtrados
SELECT
  'Status dos treinadores' as info,
  is_active,
  COUNT(*) as quantidade
FROM coaches
GROUP BY is_active;

-- 8. Verificar se há problemas com a coluna user_id
SELECT
  'Treinadores sem user_id' as problema,
  COUNT(*) as quantidade
FROM coaches
WHERE user_id IS NULL;

-- 9. Verificar se há problemas com a coluna id
SELECT
  'Treinadores sem id válido' as problema,
  COUNT(*) as quantidade
FROM coaches
WHERE id IS NULL;

-- 10. Listar todos os treinadores com detalhes completos
SELECT
  'Lista completa de treinadores' as info,
  c.id,
  c.user_id,
  c.full_name,
  c.email,
  c.phone,
  c.bio,
  c.experience_years,
  c.specialties,
  c.certifications,
  c.is_active,
  c.created_at,
  c.updated_at,
  u.email as auth_email,
  u.created_at as user_created_at
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.full_name;

-- 11. Testar a busca específica por "evandro" (como implementado no código)
SELECT
  'Teste de busca por "evandro"' as info,
  id,
  full_name,
  email,
  is_active
FROM coaches
WHERE full_name ILIKE '%evandro%'
ORDER BY full_name;

-- 12. Testar a busca por "Evandro" (case sensitive)
SELECT
  'Teste de busca por "Evandro"' as info,
  id,
  full_name,
  email,
  is_active
FROM coaches
WHERE full_name ILIKE '%Evandro%'
ORDER BY full_name;

-- 13. Verificar se há problemas com caracteres especiais no nome
SELECT
  'Verificação de caracteres especiais' as info,
  id,
  full_name,
  email
FROM coaches
WHERE full_name ~ '[^a-zA-Z0-9\s]'
ORDER BY full_name;

-- 14. Testar a busca sem filtros (como chamada inicial)
SELECT
  'Busca sem filtros (inicial)' as info,
  id,
  full_name,
  email,
  is_active
FROM coaches
ORDER BY full_name;

-- 15. Verificar se há problemas com a view active_athlete_coach_relationships
SELECT
  'Verificação da view active_athlete_coach_relationships' as info,
  COUNT(*) as total_registros
FROM active_athlete_coach_relationships;

-- 16. Verificar se há relacionamentos existentes
SELECT
  'Relacionamentos existentes' as info,
  COUNT(*) as total_relacionamentos
FROM athlete_coach_relationships;

-- 17. Recomendações para resolver o problema
SELECT
  'Recomendações para resolver o problema' as info,
  '1. Verificar se o treinador está ativo (is_active = true)' as rec1,
  '2. Verificar se o email foi confirmado' as rec2,
  '3. Verificar se as políticas RLS estão corretas' as rec3,
  '4. Verificar se não há problemas de case sensitivity' as rec4,
  '5. Verificar se o usuário tem permissão para ver treinadores' as rec5; 