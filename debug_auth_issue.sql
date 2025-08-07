-- Script para diagnosticar problemas de autenticação
-- Verificar se o usuário existe e está configurado corretamente

-- 1. Verificar todos os usuários na tabela auth.users
SELECT
  'Usuários na auth.users' as info,
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Verificar se há usuários com email não confirmado
SELECT
  'Usuários com email não confirmado' as info,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 3. Verificar perfis de usuários
SELECT
  'Perfis de usuários' as info,
  p.id,
  p.email,
  p.full_name,
  p.onboarding_completed,
  p.created_at,
  u.email_confirmed_at
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- 4. Verificar treinadores
SELECT
  'Treinadores cadastrados' as info,
  c.id,
  c.user_id,
  c.full_name,
  c.email,
  c.is_active,
  c.created_at,
  u.email_confirmed_at
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- 5. Verificar se há usuários sem perfil
SELECT
  'Usuários sem perfil' as info,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 6. Verificar se há treinadores sem usuário correspondente
SELECT
  'Treinadores sem usuário correspondente' as info,
  c.id,
  c.user_id,
  c.full_name,
  c.email
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.id IS NULL
ORDER BY c.created_at DESC;

-- 7. Verificar configurações de autenticação
SELECT
  'Configurações de autenticação' as info,
  'Verificar se o email confirmation está habilitado' as config;

-- 8. Testar busca por email específico (substitua pelo email que está tentando logar)
-- SELECT
--   'Busca por email específico' as info,
--   id,
--   email,
--   email_confirmed_at,
--   created_at
-- FROM auth.users
-- WHERE email ILIKE '%exemplo@email.com%';

-- 9. Verificar se há problemas com senhas
SELECT
  'Verificação de senhas' as info,
  'As senhas são armazenadas de forma segura no Supabase' as note;

-- 10. Verificar logs de autenticação recentes (se disponível)
SELECT
  'Logs de autenticação' as info,
  'Verificar logs no painel do Supabase > Authentication > Logs' as note; 