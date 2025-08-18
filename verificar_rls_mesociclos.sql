-- Script para verificar políticas RLS da tabela mesociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'mesociclos';

-- 2. Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'mesociclos';

-- 3. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar usuário atual
SELECT auth.uid() as current_user_id;

-- 5. Testar inserção manual (substitua os valores conforme necessário)
-- INSERT INTO public.mesociclos (
--     macrociclo_id,
--     name,
--     description,
--     start_date,
--     end_date,
--     mesociclo_type,
--     focus,
--     intensity_level,
--     volume_level,
--     notes,
--     user_id
-- ) VALUES (
--     'ID_DO_MACROCICLO',
--     'Teste',
--     'Teste de inserção',
--     '2025-01-01',
--     '2025-01-07',
--     'base',
--     'Foco em base',
--     'moderada',
--     'moderado',
--     'Teste manual',
--     auth.uid()
-- );
