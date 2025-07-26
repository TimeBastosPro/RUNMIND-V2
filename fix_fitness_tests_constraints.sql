-- SQL para corrigir as constraints da tabela fitness_tests
-- Execute este SQL no Supabase SQL Editor

-- 1. Tornar user_id NOT NULL
ALTER TABLE public.fitness_tests 
ALTER COLUMN user_id SET NOT NULL;

-- 2. Verificar se as políticas RLS estão funcionando
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
WHERE tablename = 'fitness_tests';

-- 3. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'fitness_tests';

-- 4. Testar inserção (opcional - para verificar se tudo está funcionando)
-- Este comando irá falhar se não houver usuário autenticado, mas serve para testar
-- INSERT INTO public.fitness_tests (user_id, protocol_name, test_date, calculated_vo2max, calculated_vam)
-- VALUES (auth.uid(), 'Teste de Cooper (12 min)', CURRENT_DATE, 45.5, 15.2); 