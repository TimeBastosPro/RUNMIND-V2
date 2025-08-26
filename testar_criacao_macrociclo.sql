-- Testar criação de macrociclo diretamente no banco
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, vamos verificar o usuário atual
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Inserir um macrociclo de teste (substitua o user_id pelo ID do seu usuário)
-- INSERT INTO public.macrociclos (
--     user_id,
--     name,
--     description,
--     start_date,
--     end_date,
--     goal,
--     notes
-- ) VALUES (
--     'SEU_USER_ID_AQUI', -- Substitua pelo seu user_id
--     'Macrociclo de Teste',
--     'Macrociclo criado para teste',
--     '2024-01-01',
--     '2024-12-31',
--     'Testar funcionalidade',
--     'Notas de teste'
-- );

-- 3. Verificar se foi inserido
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

-- 4. Verificar políticas RLS para macrociclos
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

-- 5. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'macrociclos';

-- 6. Testar inserção com RLS (execute como usuário autenticado)
-- Esta query deve ser executada no contexto do usuário logado
-- INSERT INTO public.macrociclos (
--     name,
--     description,
--     start_date,
--     end_date,
--     goal
-- ) VALUES (
--     'Macrociclo Teste RLS',
--     'Teste de inserção com RLS',
--     '2024-01-01',
--     '2024-12-31',
--     'Testar RLS'
-- ) RETURNING *;

-- 7. Verificar se a inserção funcionou
-- SELECT * FROM public.macrociclos WHERE name = 'Macrociclo Teste RLS';
