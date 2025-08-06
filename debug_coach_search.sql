-- Script para debugar o problema de busca de treinadores
-- Verificar se o treinador Evandro existe na base

-- 1. Verificar todos os treinadores cadastrados
SELECT 
  id,
  user_id,
  full_name,
  email,
  is_active,
  created_at
FROM coaches 
ORDER BY full_name;

-- 2. Verificar se há treinadores com nome contendo "evandro" (case insensitive)
SELECT 
  id,
  user_id,
  full_name,
  email,
  is_active,
  created_at
FROM coaches 
WHERE LOWER(full_name) LIKE '%evandro%'
ORDER BY full_name;

-- 3. Verificar as políticas RLS da tabela coaches
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
WHERE tablename = 'coaches';

-- 4. Verificar se o RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'coaches';

-- 5. Testar a busca como usuário anônimo (simular o que acontece na busca)
-- Primeiro, vamos ver qual usuário está logado (se houver)
SELECT auth.uid() as current_user_id;

-- 6. Verificar se há problemas com as políticas RLS
-- Testar se um usuário pode ver treinadores
SELECT 
  'Teste de acesso aos treinadores' as teste,
  COUNT(*) as total_treinadores_visiveis
FROM coaches;

-- 7. Verificar se há treinadores inativos que podem estar sendo filtrados
SELECT 
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