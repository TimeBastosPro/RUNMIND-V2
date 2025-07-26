-- SQL para atualizar a tabela fitness_tests existente
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar colunas que estão faltando
ALTER TABLE public.fitness_tests 
ADD COLUMN IF NOT EXISTS distance_meters INTEGER,
ADD COLUMN IF NOT EXISTS time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS final_heart_rate INTEGER,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Remover colunas que não são mais necessárias
ALTER TABLE public.fitness_tests 
DROP COLUMN IF EXISTS result_value,
DROP COLUMN IF EXISTS notes;

-- 3. Verificar se as políticas existem antes de criar
-- Política para SELECT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'fitness_tests' 
        AND policyname = 'Users can view own fitness tests'
    ) THEN
        CREATE POLICY "Users can view own fitness tests" ON public.fitness_tests
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Política para INSERT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'fitness_tests' 
        AND policyname = 'Users can insert own fitness tests'
    ) THEN
        CREATE POLICY "Users can insert own fitness tests" ON public.fitness_tests
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Política para UPDATE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'fitness_tests' 
        AND policyname = 'Users can update own fitness tests'
    ) THEN
        CREATE POLICY "Users can update own fitness tests" ON public.fitness_tests
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Política para DELETE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'fitness_tests' 
        AND policyname = 'Users can delete own fitness tests'
    ) THEN
        CREATE POLICY "Users can delete own fitness tests" ON public.fitness_tests
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Habilitar RLS se não estiver habilitado
ALTER TABLE public.fitness_tests ENABLE ROW LEVEL SECURITY;

-- 5. Criar função para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger para updated_at se não existir
DROP TRIGGER IF EXISTS update_fitness_tests_updated_at ON public.fitness_tests;
CREATE TRIGGER update_fitness_tests_updated_at 
    BEFORE UPDATE ON public.fitness_tests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Verificar a estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fitness_tests' 
AND table_schema = 'public'
ORDER BY ordinal_position; 