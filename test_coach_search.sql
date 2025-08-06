-- Teste de busca de treinadores
-- Verificar se o treinador Evandro existe e se a busca funciona

-- 1. Verificar todos os treinadores cadastrados
SELECT 
  'Todos os treinadores' as teste,
  COUNT(*) as total
FROM coaches;

-- 2. Verificar treinadores ativos
SELECT 
  'Treinadores ativos' as teste,
  COUNT(*) as total
FROM coaches 
WHERE is_active = true;

-- 3. Buscar treinadores com nome contendo "evandro" (case insensitive)
SELECT 
  'Busca por "evandro"' as teste,
  id,
  full_name,
  email,
  is_active
FROM coaches 
WHERE LOWER(full_name) LIKE '%evandro%'
ORDER BY full_name;

-- 4. Buscar treinadores com nome contendo "Evandro" (case sensitive)
SELECT 
  'Busca por "Evandro"' as teste,
  id,
  full_name,
  email,
  is_active
FROM coaches 
WHERE full_name LIKE '%Evandro%'
ORDER BY full_name;

-- 5. Listar todos os treinadores com detalhes
SELECT 
  'Lista completa' as teste,
  id,
  user_id,
  full_name,
  email,
  phone,
  bio,
  experience_years,
  specialties,
  certifications,
  is_active,
  created_at
FROM coaches 
ORDER BY full_name;

-- 6. Verificar se há problemas com RLS
-- Testar se um usuário autenticado pode ver treinadores
SELECT 
  'Teste RLS - usuário autenticado' as teste,
  COUNT(*) as treinadores_visiveis
FROM coaches;

-- 7. Verificar se há treinadores com user_id nulo
SELECT 
  'Treinadores sem user_id' as problema,
  COUNT(*) as quantidade
FROM coaches 
WHERE user_id IS NULL;

-- 8. Verificar se há treinadores com id nulo
SELECT 
  'Treinadores sem id' as problema,
  COUNT(*) as quantidade
FROM coaches 
WHERE id IS NULL;

-- 9. Verificar se há treinadores com full_name nulo
SELECT 
  'Treinadores sem nome' as problema,
  COUNT(*) as quantidade
FROM coaches 
WHERE full_name IS NULL;

-- 10. Verificar se há treinadores com email nulo
SELECT 
  'Treinadores sem email' as problema,
  COUNT(*) as quantidade
FROM coaches 
WHERE email IS NULL;

-- 11. Testar a busca com ILIKE (como implementado no código)
SELECT 
  'Teste ILIKE com "evandro"' as teste,
  id,
  full_name,
  email
FROM coaches 
WHERE full_name ILIKE '%evandro%'
ORDER BY full_name;

-- 12. Testar a busca com ILIKE (como implementado no código) - case insensitive
SELECT 
  'Teste ILIKE com "EVANDRO"' as teste,
  id,
  full_name,
  email
FROM coaches 
WHERE full_name ILIKE '%EVANDRO%'
ORDER BY full_name;

-- 13. Verificar se há treinadores com especialidades
SELECT 
  'Treinadores com especialidades' as teste,
  id,
  full_name,
  specialties
FROM coaches 
WHERE specialties IS NOT NULL AND array_length(specialties, 1) > 0
ORDER BY full_name;

-- 14. Testar busca por especialidade
SELECT 
  'Teste busca por especialidade' as teste,
  id,
  full_name,
  specialties
FROM coaches 
WHERE specialties && ARRAY['corrida']::text[]
ORDER BY full_name; 