-- Script para corrigir problemas de cadastro de treinador
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar campo user_type na tabela profiles (se não existir)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'athlete';

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN profiles.user_type IS 'Tipo de usuário: athlete (atleta) ou coach (treinador)';

-- 3. Adicionar constraint para valores válidos (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_type_check'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT user_type_check 
        CHECK (user_type IN ('athlete', 'coach'));
    END IF;
END $$;

-- 4. Atualizar registros existentes para ter user_type = 'athlete' por padrão
UPDATE profiles 
SET user_type = 'athlete' 
WHERE user_type IS NULL;

-- 5. Verificar se a coluna CREF existe na tabela coaches
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coaches' AND column_name = 'cref'
    ) THEN
        ALTER TABLE coaches 
        ADD COLUMN cref TEXT;
        
        COMMENT ON COLUMN coaches.cref IS 'CREF (Conselho Regional de Educação Física) - Formato: 123456-SP';
    END IF;
END $$;

-- 6. Verificar estrutura das tabelas
SELECT 'profiles' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

SELECT 'coaches' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
ORDER BY ordinal_position;

-- 7. Verificar se há registros duplicados ou inconsistentes
SELECT 'Perfis sem user_type definido:' as check_type, COUNT(*) as count
FROM profiles 
WHERE user_type IS NULL
UNION ALL
SELECT 'Treinadores sem CREF:' as check_type, COUNT(*) as count
FROM coaches 
WHERE cref IS NULL OR cref = '';

-- 8. Mostrar estatísticas atuais
SELECT 
    'Total de perfis:' as metric,
    COUNT(*) as value
FROM profiles
UNION ALL
SELECT 
    'Perfis de atletas:' as metric,
    COUNT(*) as value
FROM profiles 
WHERE user_type = 'athlete'
UNION ALL
SELECT 
    'Perfis de treinadores:' as metric,
    COUNT(*) as value
FROM profiles 
WHERE user_type = 'coach'
UNION ALL
SELECT 
    'Registros na tabela coaches:' as metric,
    COUNT(*) as value
FROM coaches;
