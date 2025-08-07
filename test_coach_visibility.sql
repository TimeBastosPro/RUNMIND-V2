-- Script para testar a visibilidade dos treinadores
-- Identificar por que o treinador Evandro não aparece na busca

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
WHERE c.full_name ILIKE '%evandro%' OR c.email ILIKE '%evandro%';

-- 2. Verificar todos os treinadores e seus status
SELECT
  'Status de todos os treinadores' as info,
  c.id,
  c.full_name,
  c.email,
  c.is_active,
  u.email_confirmed_at,
  CASE 
    WHEN c.is_active = true AND u.email_confirmed_at IS NOT NULL THEN '✅ Disponível'
    WHEN c.is_active = false THEN '❌ Inativo'
    WHEN u.email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    ELSE '❌ Problema'
  END as disponibilidade
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.full_name;

-- 3. Verificar se há problemas com a coluna is_active
SELECT
  'Análise da coluna is_active' as info,
  is_active,
  COUNT(*) as quantidade,
  STRING_AGG(full_name, ', ') as treinadores
FROM coaches
GROUP BY is_active;

-- 4. Verificar se há problemas com email confirmation
SELECT
  'Análise de email confirmation' as info,
  c.full_name,
  c.email,
  u.email_confirmed_at,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    ELSE '✅ Email confirmado'
  END as status_email
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.full_name;

-- 5. Testar a query exata que o código está executando
SELECT
  'Teste da query do código (sem filtros)' as info,
  id,
  full_name,
  email,
  is_active
FROM coaches
ORDER BY full_name;

-- 6. Testar a query com filtro is_active = true
SELECT
  'Teste da query com filtro is_active = true' as info,
  id,
  full_name,
  email,
  is_active
FROM coaches
WHERE is_active = true
ORDER BY full_name;

-- 7. Testar a busca por texto "evandro"
SELECT
  'Teste de busca por "evandro"' as info,
  id,
  full_name,
  email,
  is_active
FROM coaches
WHERE full_name ILIKE '%evandro%'
ORDER BY full_name;

-- 8. Testar a busca por texto "evandro" E is_active = true
SELECT
  'Teste de busca por "evandro" E is_active = true' as info,
  id,
  full_name,
  email,
  is_active
FROM coaches
WHERE full_name ILIKE '%evandro%' AND is_active = true
ORDER BY full_name;

-- 9. Verificar se há problemas com RLS
SELECT
  'Teste de acesso com RLS' as info,
  COUNT(*) as total_treinadores_visiveis
FROM coaches;

-- 10. Verificar se há problemas com a coluna user_id
SELECT
  'Verificação da coluna user_id' as info,
  c.id,
  c.full_name,
  c.user_id,
  u.id as auth_user_id,
  CASE 
    WHEN c.user_id = u.id THEN '✅ Relacionamento correto'
    WHEN u.id IS NULL THEN '❌ Usuário não encontrado'
    ELSE '❌ Relacionamento incorreto'
  END as status_relacionamento
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.full_name;

-- 11. Verificar se há treinadores órfãos (sem usuário correspondente)
SELECT
  'Treinadores órfãos' as info,
  c.id,
  c.full_name,
  c.email,
  c.user_id
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.id IS NULL;

-- 12. Verificar se há usuários sem treinador correspondente
SELECT
  'Usuários sem treinador correspondente' as info,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN coaches c ON u.id = c.user_id
WHERE c.id IS NULL
ORDER BY u.created_at DESC;

-- 13. Corrigir problemas identificados

-- Se o treinador Evandro estiver inativo, ativá-lo
UPDATE coaches 
SET is_active = true 
WHERE full_name ILIKE '%evandro%' AND (is_active = false OR is_active IS NULL);

-- Se o email não estiver confirmado, confirmá-lo (apenas para teste)
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW() 
-- WHERE email = 'evandro@gmail.com' AND email_confirmed_at IS NULL;

-- 14. Verificar se a correção funcionou
SELECT
  'Verificação após correção' as info,
  c.id,
  c.full_name,
  c.email,
  c.is_active,
  u.email_confirmed_at,
  CASE 
    WHEN c.is_active = true AND u.email_confirmed_at IS NOT NULL THEN '✅ Disponível'
    WHEN c.is_active = false THEN '❌ Inativo'
    WHEN u.email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    ELSE '❌ Problema'
  END as disponibilidade
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE c.full_name ILIKE '%evandro%' OR c.email ILIKE '%evandro%';

-- 15. Teste final da busca
SELECT
  'Teste final da busca' as info,
  id,
  full_name,
  email,
  is_active
FROM coaches
WHERE is_active = true
ORDER BY full_name; 