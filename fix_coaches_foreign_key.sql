-- =====================================================
-- CORREÇÃO DA FOREIGN KEY DA TABELA COACHES
-- =====================================================

-- 1. Verificar as foreign keys atuais da tabela coaches
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'coaches';

-- 2. Remover a foreign key constraint incorreta (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'coaches_id_fkey' 
    AND table_name = 'coaches'
  ) THEN
    ALTER TABLE coaches DROP CONSTRAINT coaches_id_fkey;
  END IF;
END $$;

-- 3. Verificar se a foreign key correta existe
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'coaches'
  AND kcu.column_name = 'user_id';

-- 4. Adicionar a foreign key correta (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'coaches_user_id_fkey' 
    AND table_name = 'coaches'
  ) THEN
    ALTER TABLE coaches 
    ADD CONSTRAINT coaches_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Verificar a estrutura final da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Teste de inserção com um user_id válido (se houver usuários)
-- Primeiro, vamos ver se há usuários na tabela auth.users
SELECT 
  COUNT(*) as total_users,
  'Usuários disponíveis' as status
FROM auth.users;

-- 7. Se houver usuários, pegar o primeiro para teste
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Inserir teste
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
      test_user_id,
      'Teste Coach Final',
      'teste3@coach.com',
      '11999999999',
      'Coach de teste final',
      5,
      ARRAY['Corrida de Rua'],
      ARRAY['CREF']
    );
    
    RAISE NOTICE 'Teste inserido com sucesso para user_id: %', test_user_id;
    
    -- Limpar o teste
    DELETE FROM coaches WHERE email = 'teste3@coach.com';
  ELSE
    RAISE NOTICE 'Nenhum usuário encontrado para teste';
  END IF;
END $$; 