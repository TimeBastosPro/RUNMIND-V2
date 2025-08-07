-- Script para verificar e corrigir configurações de autenticação
-- Problemas comuns que causam "Invalid login credentials"

-- 1. Verificar se o usuário existe e está ativo
-- Execute esta query substituindo o email pelo que está tentando logar
-- SELECT
--   'Verificação de usuário' as info,
--   id,
--   email,
--   email_confirmed_at,
--   created_at,
--   last_sign_in_at,
--   CASE 
--     WHEN email_confirmed_at IS NULL THEN 'Email não confirmado'
--     ELSE 'Email confirmado'
--   END as status
-- FROM auth.users
-- WHERE email = 'exemplo@email.com';

-- 2. Verificar se há usuários com email duplicado (pode causar problemas)
SELECT
  'Usuários com email duplicado' as info,
  email,
  COUNT(*) as quantidade
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;

-- 3. Verificar se há perfis órfãos (sem usuário correspondente)
SELECT
  'Perfis órfãos' as info,
  p.id,
  p.email,
  p.full_name
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 4. Verificar se há treinadores órfãos (sem usuário correspondente)
SELECT
  'Treinadores órfãos' as info,
  c.id,
  c.user_id,
  c.full_name,
  c.email
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.id IS NULL;

-- 5. Verificar configurações de RLS que podem estar bloqueando acesso
SELECT
  'Políticas RLS da tabela profiles' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 6. Verificar se o RLS está habilitado nas tabelas principais
SELECT
  'Status RLS das tabelas' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'coaches', 'teams', 'athlete_coach_relationships');

-- 7. Verificar se há usuários com email não confirmado que podem estar causando problemas
SELECT
  'Usuários com email não confirmado' as info,
  id,
  email,
  created_at,
  'Considere confirmar o email ou deletar o usuário' as acao
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 8. Verificar se há usuários muito antigos que podem ter problemas
SELECT
  'Usuários antigos (mais de 30 dias)' as info,
  id,
  email,
  created_at,
  last_sign_in_at,
  'Considere verificar se ainda são válidos' as acao
FROM auth.users
WHERE created_at < NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- 9. Verificar se há problemas com caracteres especiais no email
SELECT
  'Emails com caracteres especiais' as info,
  id,
  email,
  created_at
FROM auth.users
WHERE email ~ '[^a-zA-Z0-9@._-]'
ORDER BY created_at DESC;

-- 10. Verificar se há usuários com email em maiúsculas/minúsculas
SELECT
  'Emails com variações de case' as info,
  email,
  LOWER(email) as email_lower,
  COUNT(*) as quantidade
FROM auth.users
GROUP BY email, LOWER(email)
HAVING COUNT(*) > 1;

-- 11. Limpar usuários de teste (descomente se necessário)
-- DELETE FROM auth.users 
-- WHERE email LIKE '%teste%' 
--   OR email LIKE '%@example.com'
--   OR created_at < NOW() - INTERVAL '7 days';

-- 12. Verificar se há problemas com sessões corrompidas
SELECT
  'Verificação de sessões' as info,
  'Verificar se há sessões corrompidas no AsyncStorage' as note;

-- 13. Recomendações para resolver o problema
SELECT
  'Recomendações para resolver "Invalid login credentials"' as info,
  '1. Verificar se o email está correto' as rec1,
  '2. Verificar se a senha está correta' as rec2,
  '3. Verificar se o email foi confirmado' as rec3,
  '4. Verificar se não há caracteres especiais no email' as rec4,
  '5. Verificar se o usuário existe na tabela auth.users' as rec5,
  '6. Verificar logs de autenticação no painel do Supabase' as rec6,
  '7. Limpar cache do app e tentar novamente' as rec7; 