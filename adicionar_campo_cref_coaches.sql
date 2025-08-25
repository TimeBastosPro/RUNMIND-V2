-- Script para adicionar campo CREF na tabela de coaches
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar coluna CREF na tabela coaches
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS cref TEXT;

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN coaches.cref IS 'CREF (Conselho Regional de Educação Física) - Formato: 123456-SP';

-- 3. Adicionar validação de formato (opcional - pode ser feita no frontend)
-- ALTER TABLE coaches 
-- ADD CONSTRAINT cref_format_check 
-- CHECK (cref ~ '^\d{6}-[A-Z]{2}$');

-- 4. Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'coaches' AND column_name = 'cref';

-- 5. Atualizar RLS se necessário (manter as políticas existentes)
-- As políticas RLS existentes devem continuar funcionando normalmente

-- 6. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
ORDER BY ordinal_position;
