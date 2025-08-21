-- Script para verificar e corrigir problemas com a busca de treinadores
-- Execute este script no Supabase SQL Editor

-- 1. Verificar todos os treinadores cadastrados
SELECT 
  'Verificação inicial' as etapa,
  COUNT(*) as total_treinadores
FROM coaches;

-- 2. Verificar treinadores ativos
SELECT 
  'Treinadores ativos' as etapa,
  COUNT(*) as total_ativos
FROM coaches 
WHERE is_active = true;

-- 3. Verificar treinadores com email confirmado
SELECT 
  'Treinadores com email confirmado' as etapa,
  COUNT(*) as total_com_email_confirmado
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.email_confirmed_at IS NOT NULL;

-- 4. Listar todos os treinadores com detalhes
SELECT 
  'Lista completa de treinadores' as etapa,
  c.id,
  c.user_id,
  c.full_name,
  c.email,
  c.is_active,
  c.created_at,
  u.email_confirmed_at,
  CASE 
    WHEN c.is_active = true AND u.email_confirmed_at IS NOT NULL THEN '✅ Válido'
    WHEN c.is_active = false THEN '❌ Inativo'
    WHEN u.email_confirmed_at IS NULL THEN '❌ Email não confirmado'
    ELSE '❓ Outro problema'
  END as status
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.full_name;

-- 5. Verificar se há problemas com RLS
-- Testar se um usuário autenticado pode ver treinadores
SELECT 
  'Teste de acesso RLS' as etapa,
  COUNT(*) as treinadores_visiveis
FROM coaches;

-- 6. Verificar políticas RLS da tabela coaches
SELECT 
  'Políticas RLS' as etapa,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'coaches'
ORDER BY policyname;

-- 7. Verificar se o RLS está habilitado
SELECT 
  'Status RLS' as etapa,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'coaches';

-- 8. Corrigir treinadores inativos (se necessário)
-- Descomente as linhas abaixo se precisar ativar treinadores
/*
UPDATE coaches 
SET is_active = true 
WHERE is_active = false 
AND user_id IN (
  SELECT id FROM auth.users 
  WHERE email_confirmed_at IS NOT NULL
);
*/

-- 9. Verificar se há treinadores sem user_id
SELECT 
  'Treinadores sem user_id' as problema,
  COUNT(*) as quantidade
FROM coaches 
WHERE user_id IS NULL;

-- 10. Verificar se há treinadores sem nome
SELECT 
  'Treinadores sem nome' as problema,
  COUNT(*) as quantidade
FROM coaches 
WHERE full_name IS NULL OR full_name = '';

-- 11. Testar busca específica por "evandro"
SELECT 
  'Teste busca por "evandro"' as teste,
  id,
  full_name,
  email,
  is_active
FROM coaches
WHERE full_name ILIKE '%evandro%'
ORDER BY full_name;

-- 12. Testar busca por "Evandro" (case sensitive)
SELECT 
  'Teste busca por "Evandro"' as teste,
  id,
  full_name,
  email,
  is_active
FROM coaches
WHERE full_name ILIKE '%Evandro%'
ORDER BY full_name;

-- 13. Recomendações
SELECT 
  'Recomendações' as etapa,
  '1. Verificar se há treinadores cadastrados' as rec1,
  '2. Verificar se os treinadores estão ativos (is_active = true)' as rec2,
  '3. Verificar se os emails foram confirmados' as rec3,
  '4. Verificar se as políticas RLS estão corretas' as rec4,
  '5. Verificar se não há problemas de case sensitivity' as rec5;
