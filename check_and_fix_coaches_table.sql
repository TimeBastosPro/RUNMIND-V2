-- =====================================================
-- VERIFICAR E CORRIGIR ESTRUTURA DA TABELA COACHES
-- =====================================================

-- 1. Verificar se a tabela coaches existe
SELECT 
  table_name,
  'Tabela existe' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'coaches';

-- 2. Verificar as colunas atuais da tabela coaches
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Se a coluna user_id não existir, adicionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coaches' 
      AND column_name = 'user_id'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE coaches ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE coaches ADD CONSTRAINT coaches_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 4. Verificar novamente as colunas após a correção
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_coaches_email ON coaches(email);
CREATE INDEX IF NOT EXISTS idx_coaches_is_active ON coaches(is_active);

-- 6. Habilitar RLS se não estiver habilitado
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS básicas (com DROP IF EXISTS para evitar erros)
DROP POLICY IF EXISTS "Coaches can view own profile" ON coaches;
CREATE POLICY "Coaches can view own profile" ON coaches
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can insert own profile" ON coaches;
CREATE POLICY "Coaches can insert own profile" ON coaches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can update own profile" ON coaches;
CREATE POLICY "Coaches can update own profile" ON coaches
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Athletes can view active coaches" ON coaches;
CREATE POLICY "Athletes can view active coaches" ON coaches
  FOR SELECT USING (is_active = true);

-- 8. Verificar se as políticas foram criadas
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'coaches'
ORDER BY policyname;

-- 9. Teste: tentar inserir um registro de teste (será bloqueado pela política RLS)
-- Isso deve funcionar se tudo estiver configurado corretamente
SELECT 'Estrutura da tabela coaches verificada e corrigida com sucesso!' as resultado; 