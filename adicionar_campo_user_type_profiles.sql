-- Script para adicionar campo user_type na tabela profiles
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar coluna user_type na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'athlete';

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN profiles.user_type IS 'Tipo de usuário: athlete (atleta) ou coach (treinador)';

-- 3. Adicionar constraint para valores válidos
ALTER TABLE profiles 
ADD CONSTRAINT user_type_check 
CHECK (user_type IN ('athlete', 'coach'));

-- 4. Atualizar registros existentes para ter user_type = 'athlete' por padrão
UPDATE profiles 
SET user_type = 'athlete' 
WHERE user_type IS NULL;

-- 5. Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'user_type';

-- 6. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
