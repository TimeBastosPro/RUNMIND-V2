-- =====================================================
-- RECRIAÇÃO COMPLETA DA TABELA COACHES
-- =====================================================

-- 1. Fazer backup dos dados existentes (se houver)
CREATE TABLE IF NOT EXISTS coaches_backup AS 
SELECT * FROM coaches;

-- 2. Remover todas as constraints e dependências
DROP TABLE IF EXISTS coaches CASCADE;

-- 3. Recriar a tabela coaches com a estrutura correta
CREATE TABLE coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  bio TEXT,
  experience_years INTEGER,
  certifications TEXT[],
  specialties TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_coaches_email ON coaches(email);
CREATE INDEX IF NOT EXISTS idx_coaches_is_active ON coaches(is_active);

-- 5. Habilitar RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
DROP POLICY IF EXISTS "Coaches can view own profile" ON coaches;
CREATE POLICY "Coaches can view own profile" ON coaches
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can insert own profile" ON coaches;
CREATE POLICY "Coaches can insert own profile" ON coaches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can update own profile" ON coaches;
CREATE POLICY "Coaches can update own profile" ON coaches
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can delete own profile" ON coaches;
CREATE POLICY "Coaches can delete own profile" ON coaches
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_coaches_updated_at ON coaches;
CREATE TRIGGER update_coaches_updated_at
  BEFORE UPDATE ON coaches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Verificar a estrutura criada
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Verificar as constraints
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'coaches'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 11. Teste de inserção (deve funcionar agora)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Pegar um usuário para teste
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
      'Teste Coach Recriado',
      'teste4@coach.com',
      '11999999999',
      'Coach de teste recriado',
      5,
      ARRAY['Corrida de Rua'],
      ARRAY['CREF']
    );
    
    RAISE NOTICE '✅ Teste inserido com sucesso para user_id: %', test_user_id;
    
    -- Verificar se foi inserido
    PERFORM COUNT(*) FROM coaches WHERE email = 'teste4@coach.com';
    RAISE NOTICE '✅ Registro encontrado na tabela';
    
    -- Limpar o teste
    DELETE FROM coaches WHERE email = 'teste4@coach.com';
    RAISE NOTICE '✅ Teste limpo com sucesso';
  ELSE
    RAISE NOTICE '⚠️ Nenhum usuário encontrado para teste';
  END IF;
END $$;

-- 12. Mostrar estatísticas finais
SELECT 
  COUNT(*) as total_coaches,
  'Tabela coaches recriada' as status
FROM coaches; 