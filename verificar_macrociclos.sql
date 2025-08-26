-- Verificar macrociclos no banco de dados
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela macrociclos existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'macrociclos';

-- 2. Verificar estrutura da tabela macrociclos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'macrociclos'
ORDER BY ordinal_position;

-- 3. Verificar todos os macrociclos existentes
SELECT 
    id,
    user_id,
    name,
    description,
    start_date,
    end_date,
    goal,
    notes,
    created_at,
    updated_at
FROM public.macrociclos
ORDER BY created_at DESC;

-- 4. Verificar macrociclos por usuário específico (substitua o user_id)
-- SELECT 
--     id,
--     user_id,
--     name,
--     description,
--     start_date,
--     end_date,
--     goal,
--     notes,
--     created_at,
--     updated_at
-- FROM public.macrociclos
-- WHERE user_id = 'SEU_USER_ID_AQUI'
-- ORDER BY created_at DESC;

-- 5. Verificar se há políticas RLS ativas
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
WHERE tablename = 'macrociclos';

-- 6. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'macrociclos';

-- 7. Contar total de macrociclos
SELECT COUNT(*) as total_macrociclos FROM public.macrociclos;

-- 8. Verificar macrociclos criados hoje
SELECT 
    id,
    user_id,
    name,
    created_at
FROM public.macrociclos
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
