-- Testar salvamento de mesociclos e microciclos no banco
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário está autenticado
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar se há macrociclos existentes
SELECT 
    id,
    name,
    user_id,
    start_date,
    end_date
FROM public.macrociclos
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar estrutura da tabela mesociclos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'mesociclos'
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela microciclos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'microciclos'
ORDER BY ordinal_position;

-- 5. Verificar políticas RLS da tabela mesociclos
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

-- 6. Verificar políticas RLS da tabela microciclos
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
WHERE tablename = 'microciclos';

-- 7. Testar inserção de mesociclo (substitua os valores pelos seus dados)
-- INSERT INTO public.mesociclos (
--     user_id,
--     macrociclo_id,
--     name,
--     start_date,
--     end_date,
--     focus,
--     mesociclo_type,
--     intensity_level,
--     volume_level
-- ) VALUES (
--     'SEU_USER_ID_AQUI', -- Substitua pelo seu user_id
--     'SEU_MACROCICLO_ID_AQUI', -- Substitua pelo ID de um macrociclo existente
--     'Mesociclo de Teste',
--     '2024-01-01',
--     '2024-01-28',
--     'base',
--     'base',
--     'moderada',
--     'moderado'
-- );

-- 8. Verificar se a inserção funcionou
-- SELECT * FROM public.mesociclos ORDER BY created_at DESC LIMIT 5;

-- 9. Testar inserção de microciclo (substitua os valores pelos seus dados)
-- INSERT INTO public.microciclos (
--     user_id,
--     mesociclo_id,
--     name,
--     start_date,
--     end_date,
--     focus,
--     intensity_level,
--     volume_level
-- ) VALUES (
--     'SEU_USER_ID_AQUI', -- Substitua pelo seu user_id
--     'SEU_MESOCICLO_ID_AQUI', -- Substitua pelo ID de um mesociclo existente
--     'Microciclo de Teste',
--     '2024-01-01',
--     '2024-01-07',
--     'ordinario',
--     'moderada',
--     'moderado'
-- );

-- 10. Verificar se a inserção funcionou
-- SELECT * FROM public.microciclos ORDER BY created_at DESC LIMIT 5;

-- 11. Verificar logs de erro (se houver)
-- SELECT * FROM pg_stat_activity WHERE state = 'active';
