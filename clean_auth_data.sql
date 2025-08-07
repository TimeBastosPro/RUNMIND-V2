-- Script para limpar dados de teste e corrigir problemas de autenticação
-- ⚠️ ATENÇÃO: Execute com cuidado, pois pode deletar dados

-- 1. Fazer backup dos dados antes de limpar
-- CREATE TABLE IF NOT EXISTS auth_users_backup AS SELECT * FROM auth.users;
-- CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles;
-- CREATE TABLE IF NOT EXISTS coaches_backup AS SELECT * FROM coaches;

-- 2. Verificar dados que serão limpos (execute primeiro para ver o que será deletado)
SELECT
  'Usuários que serão limpos' as info,
  id,
  email,
  created_at,
  'Será deletado' as acao
FROM auth.users
WHERE email LIKE '%teste%' 
   OR email LIKE '%@example.com'
   OR email LIKE '%@test.com'
   OR email LIKE '%@temp.com'
   OR created_at < NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 3. Verificar perfis que serão limpos
SELECT
  'Perfis que serão limpos' as info,
  p.id,
  p.email,
  p.full_name,
  p.created_at,
  'Será deletado' as acao
FROM profiles p
WHERE p.email LIKE '%teste%' 
   OR p.email LIKE '%@example.com'
   OR p.email LIKE '%@test.com'
   OR p.email LIKE '%@temp.com'
   OR p.created_at < NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC;

-- 4. Verificar treinadores que serão limpos
SELECT
  'Treinadores que serão limpos' as info,
  c.id,
  c.full_name,
  c.email,
  c.created_at,
  'Será deletado' as acao
FROM coaches c
WHERE c.email LIKE '%teste%' 
   OR c.email LIKE '%@example.com'
   OR c.email LIKE '%@test.com'
   OR c.email LIKE '%@temp.com'
   OR c.created_at < NOW() - INTERVAL '7 days'
ORDER BY c.created_at DESC;

-- 5. Limpar relacionamentos de treinadores órfãos
DELETE FROM athlete_coach_relationships
WHERE coach_id IN (
  SELECT c.id 
  FROM coaches c 
  WHERE c.email LIKE '%teste%' 
     OR c.email LIKE '%@example.com'
     OR c.email LIKE '%@test.com'
     OR c.email LIKE '%@temp.com'
     OR c.created_at < NOW() - INTERVAL '7 days'
);

-- 6. Limpar equipes de treinadores órfãos
DELETE FROM teams
WHERE coach_id IN (
  SELECT c.id 
  FROM coaches c 
  WHERE c.email LIKE '%teste%' 
     OR c.email LIKE '%@example.com'
     OR c.email LIKE '%@test.com'
     OR c.email LIKE '%@temp.com'
     OR c.created_at < NOW() - INTERVAL '7 days'
);

-- 7. Limpar treinadores de teste
DELETE FROM coaches
WHERE email LIKE '%teste%' 
   OR email LIKE '%@example.com'
   OR email LIKE '%@test.com'
   OR email LIKE '%@temp.com'
   OR created_at < NOW() - INTERVAL '7 days';

-- 8. Limpar perfis de teste
DELETE FROM profiles
WHERE email LIKE '%teste%' 
   OR email LIKE '%@example.com'
   OR email LIKE '%@test.com'
   OR email LIKE '%@temp.com'
   OR created_at < NOW() - INTERVAL '7 days';

-- 9. Limpar usuários de teste
DELETE FROM auth.users
WHERE email LIKE '%teste%' 
   OR email LIKE '%@example.com'
   OR email LIKE '%@test.com'
   OR email LIKE '%@temp.com'
   OR created_at < NOW() - INTERVAL '7 days';

-- 10. Verificar se a limpeza foi bem-sucedida
SELECT
  'Verificação pós-limpeza' as info,
  COUNT(*) as total_usuarios
FROM auth.users;

SELECT
  'Perfis restantes' as info,
  COUNT(*) as total_perfis
FROM profiles;

SELECT
  'Treinadores restantes' as info,
  COUNT(*) as total_treinadores
FROM coaches;

-- 11. Verificar se há usuários órfãos (sem perfil)
SELECT
  'Usuários sem perfil (órfãos)' as info,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 12. Verificar se há perfis órfãos (sem usuário)
SELECT
  'Perfis sem usuário (órfãos)' as info,
  p.id,
  p.email,
  p.full_name
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 13. Verificar se há treinadores órfãos (sem usuário)
SELECT
  'Treinadores sem usuário (órfãos)' as info,
  c.id,
  c.user_id,
  c.full_name,
  c.email
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.id IS NULL;

-- 14. Limpar dados órfãos (descomente se necessário)
-- DELETE FROM profiles WHERE id NOT IN (SELECT id FROM auth.users);
-- DELETE FROM coaches WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 15. Verificar configurações de autenticação
SELECT
  'Configurações finais' as info,
  'Verificar se o email confirmation está habilitado no painel do Supabase' as config1,
  'Verificar se as políticas RLS estão corretas' as config2,
  'Verificar se não há restrições de IP' as config3; 