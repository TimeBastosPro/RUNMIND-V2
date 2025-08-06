-- =====================================================
-- TESTE DE INSERÇÃO NA TABELA COACHES
-- =====================================================

-- 1. Verificar se a tabela coaches existe e sua estrutura
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se há dados na tabela
SELECT 
  COUNT(*) as total_coaches,
  'Tabela coaches' as status
FROM coaches;

-- 3. Verificar políticas RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'coaches'
ORDER BY policyname;

-- 4. Teste manual de inserção (será bloqueado pela política RLS)
-- Este teste deve falhar porque não há usuário autenticado
INSERT INTO coaches (
  user_id,
  full_name,
  email,
  phone,
  bio,
  experience_years,
  specialties,
  certifications
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Teste Coach',
  'teste@coach.com',
  '11999999999',
  'Coach de teste',
  5,
  ARRAY['Corrida de Rua'],
  ARRAY['CREF']
);

-- 5. Verificar se a inserção foi bloqueada (deve retornar 0)
SELECT 
  COUNT(*) as coaches_apos_teste,
  'Teste de segurança RLS' as status
FROM coaches 
WHERE email = 'teste@coach.com';

-- 6. Verificar se há usuários autenticados
SELECT 
  COUNT(*) as usuarios_autenticados,
  'Usuários no auth.users' as status
FROM auth.users;

-- 7. Mostrar alguns usuários (se existirem)
SELECT 
  id,
  email,
  created_at
FROM auth.users 
LIMIT 5; 