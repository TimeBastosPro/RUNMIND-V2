-- Script para testar autenticação diretamente
-- Execute este script para verificar se há problemas de configuração

-- 1. Verificar configurações de autenticação do Supabase
SELECT
  'Configurações de Autenticação' as info,
  'Verificar no painel do Supabase > Authentication > Settings:' as config1,
  '- Enable email confirmations' as config2,
  '- Enable sign ups' as config3,
  '- Site URL' as config4,
  '- Redirect URLs' as config5;

-- 2. Verificar se há usuários de teste válidos
SELECT
  'Usuários válidos para teste' as info,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
    ELSE '❌ Email não confirmado'
  END as status
FROM auth.users
WHERE email_confirmed_at IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar se há usuários com problemas
SELECT
  'Usuários com problemas' as info,
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'Email não confirmado'
    WHEN last_sign_in_at IS NULL THEN 'Nunca fez login'
    ELSE 'Outro problema'
  END as problema
FROM auth.users
WHERE email_confirmed_at IS NULL 
   OR last_sign_in_at IS NULL
ORDER BY created_at DESC;

-- 4. Verificar perfis correspondentes
SELECT
  'Perfis de usuários válidos' as info,
  p.id,
  p.email,
  p.full_name,
  p.onboarding_completed,
  u.email_confirmed_at,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN '✅ Usuário válido'
    ELSE '❌ Usuário inválido'
  END as status
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.email_confirmed_at IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 5;

-- 5. Verificar treinadores válidos
SELECT
  'Treinadores válidos' as info,
  c.id,
  c.full_name,
  c.email,
  c.is_active,
  u.email_confirmed_at,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL AND c.is_active = true THEN '✅ Treinador válido'
    WHEN u.email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    WHEN c.is_active = false THEN '❌ Treinador inativo'
    ELSE '❌ Outro problema'
  END as status
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- 6. Verificar configurações de RLS
SELECT
  'Políticas RLS - auth.users' as info,
  'A tabela auth.users não tem RLS habilitado por padrão' as note;

SELECT
  'Políticas RLS - profiles' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles';

-- 7. Verificar se há problemas de sessão
SELECT
  'Verificação de sessões' as info,
  'Verificar se há sessões corrompidas no AsyncStorage' as note,
  'Verificar logs de autenticação no painel do Supabase' as note2;

-- 8. Teste de inserção de usuário de teste (descomente se necessário)
-- INSERT INTO auth.users (
--   id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at
-- ) VALUES (
--   gen_random_uuid(),
--   'teste@exemplo.com',
--   crypt('123456', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- );

-- 9. Verificar se há problemas com caracteres especiais
SELECT
  'Verificação de caracteres especiais' as info,
  id,
  email,
  created_at
FROM auth.users
WHERE email ~ '[^a-zA-Z0-9@._-]'
ORDER BY created_at DESC;

-- 10. Verificar se há problemas com case sensitivity
SELECT
  'Verificação de case sensitivity' as info,
  email,
  LOWER(email) as email_lower
FROM auth.users
WHERE email != LOWER(email)
ORDER BY email;

-- 11. Recomendações para resolver problemas
SELECT
  'Recomendações para resolver problemas de autenticação' as info,
  '1. Verificar se o email está correto (sem espaços extras)' as rec1,
  '2. Verificar se a senha está correta' as rec2,
  '3. Verificar se o email foi confirmado' as rec3,
  '4. Verificar se não há caracteres especiais no email' as rec4,
  '5. Verificar se o usuário existe na tabela auth.users' as rec5,
  '6. Verificar logs de autenticação no painel do Supabase' as rec6,
  '7. Limpar cache do app e tentar novamente' as rec7,
  '8. Verificar se o Supabase está online' as rec8,
  '9. Verificar se não há restrições de IP' as rec9,
  '10. Verificar se as configurações de autenticação estão corretas' as rec10;

-- 12. Verificar logs de autenticação (se disponível)
SELECT
  'Logs de autenticação' as info,
  'Verificar no painel do Supabase > Authentication > Logs' as note,
  'Procurar por tentativas de login recentes' as note2,
  'Verificar se há erros específicos' as note3; 