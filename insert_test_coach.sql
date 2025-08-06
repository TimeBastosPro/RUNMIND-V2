-- Inserir treinador de teste para verificar a busca
-- Primeiro, vamos verificar se já existe um usuário para usar como user_id

-- 1. Verificar usuários existentes
SELECT 
  'Usuários existentes' as info,
  id,
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- 2. Inserir um treinador de teste chamado Evandro
-- (Substitua o user_id pelo ID de um usuário real da sua base)
INSERT INTO coaches (
  user_id,
  full_name,
  email,
  phone,
  bio,
  experience_years,
  specialties,
  certifications,
  is_active
) VALUES (
  -- Substitua este UUID pelo ID de um usuário real
  (SELECT id FROM auth.users LIMIT 1),
  'Evandro Silva',
  'evandro.silva@teste.com',
  '(11) 99999-9999',
  'Treinador especializado em corrida de rua e maratona com mais de 10 anos de experiência.',
  10,
  ARRAY['corrida', 'maratona', 'meia-maratona'],
  ARRAY['Cref - 123456', 'Certificação Internacional de Corrida'],
  true
) ON CONFLICT (user_id) DO NOTHING;

-- 3. Verificar se o treinador foi inserido
SELECT 
  'Treinador inserido' as info,
  id,
  user_id,
  full_name,
  email,
  is_active,
  created_at
FROM coaches 
WHERE full_name ILIKE '%evandro%'
ORDER BY created_at DESC;

-- 4. Listar todos os treinadores após a inserção
SELECT 
  'Todos os treinadores' as info,
  id,
  full_name,
  email,
  is_active
FROM coaches 
ORDER BY full_name;

-- 5. Testar a busca que será usada no código
SELECT 
  'Teste de busca por "evandro"' as info,
  id,
  full_name,
  email
FROM coaches 
WHERE full_name ILIKE '%evandro%'
ORDER BY full_name;

-- 6. Testar a busca por "Evandro" (case sensitive)
SELECT 
  'Teste de busca por "Evandro"' as info,
  id,
  full_name,
  email
FROM coaches 
WHERE full_name ILIKE '%Evandro%'
ORDER BY full_name; 