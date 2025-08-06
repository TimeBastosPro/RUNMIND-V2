-- Script para verificar se o usuário timebastos@gmail.com existe
-- Execute este script no painel do Supabase SQL Editor

-- 1. Verificar se o usuário existe na tabela auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'timebastos@gmail.com';

-- 2. Verificar se existe um perfil para este usuário
SELECT 
  p.*,
  u.email as auth_email,
  u.email_confirmed_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'timebastos@gmail.com';

-- 3. Verificar todos os usuários cadastrados (últimos 10)
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Verificar se há problemas com RLS (Row Level Security)
-- Esta query deve retornar dados se o RLS estiver configurado corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Verificar configurações de autenticação
SELECT 
  name,
  value
FROM auth.config 
WHERE name IN ('enable_signup', 'enable_confirmations', 'enable_email_change_confirmations');

-- 6. Se o usuário não existir, criar um novo usuário de teste
-- DESCOMENTE AS LINHAS ABAIXO APENAS SE QUISER CRIAR UM USUÁRIO DE TESTE

/*
-- Criar usuário de teste (senha: 123456)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'timebastos@gmail.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Criar perfil para o usuário
INSERT INTO profiles (
  id,
  email,
  full_name,
  experience_level,
  main_goal,
  context_type,
  onboarding_completed
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com'),
  'timebastos@gmail.com',
  'Time Bastos',
  'beginner',
  'health',
  'solo',
  false
);
*/ 