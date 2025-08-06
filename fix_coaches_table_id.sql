-- =====================================================
-- CORREÇÃO DA COLUNA ID DA TABELA COACHES
-- =====================================================

-- 1. Verificar a estrutura atual da tabela coaches
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Corrigir a coluna id para ter valor padrão gen_random_uuid()
ALTER TABLE coaches 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Verificar se a correção foi aplicada
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND table_schema = 'public'
  AND column_name = 'id';

-- 4. Teste de inserção (deve funcionar agora)
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
  'Teste Coach Corrigido',
  'teste2@coach.com',
  '11999999999',
  'Coach de teste corrigido',
  5,
  ARRAY['Corrida de Rua'],
  ARRAY['CREF']
);

-- 5. Verificar se a inserção funcionou
SELECT 
  id,
  full_name,
  email,
  created_at
FROM coaches 
WHERE email = 'teste2@coach.com';

-- 6. Limpar o teste
DELETE FROM coaches WHERE email = 'teste2@coach.com'; 