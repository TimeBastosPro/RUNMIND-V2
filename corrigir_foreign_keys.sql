-- Corrigir Foreign Keys - Diagnóstico e Correção
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura atual das tabelas
SELECT 
    'VERIFICAR_ESTRUTURA' as tipo,
    'Verificando estrutura atual das tabelas de ciclos' as descricao;

-- Verificar se existe foreign key em macrociclos
SELECT 
    'FOREIGN_KEYS_MACROCICLOS' as tipo,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'macrociclos';

-- Verificar se existe foreign key em mesociclos
SELECT 
    'FOREIGN_KEYS_MESOCICLOS' as tipo,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'mesociclos';

-- Verificar se existe foreign key em microciclos
SELECT 
    'FOREIGN_KEYS_MICROCICLOS' as tipo,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'microciclos';

-- 2. Verificar se as colunas user_id existem
SELECT 
    'COLUNAS_USER_ID' as tipo,
    'Verificando se as colunas user_id existem' as descricao;

SELECT 
    'COLUNAS_MACROCICLOS' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'macrociclos'
    AND column_name = 'user_id';

SELECT 
    'COLUNAS_MESOCICLOS' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'mesociclos'
    AND column_name = 'user_id';

SELECT 
    'COLUNAS_MICROCICLOS' as tipo,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'microciclos'
    AND column_name = 'user_id';

-- 3. Verificar se a tabela auth.users existe
SELECT 
    'VERIFICAR_AUTH_USERS' as tipo,
    'Verificando se auth.users existe' as descricao;

SELECT 
    'AUTH_USERS_EXISTE' as tipo,
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'users'
    ) as auth_users_existe;

-- 4. Criar foreign keys se não existirem
-- NOTA: Execute estas queries apenas se as foreign keys não existirem

-- Adicionar foreign key para macrociclos.user_id -> auth.users.id
-- ALTER TABLE public.macrociclos 
-- ADD CONSTRAINT fk_macrociclos_user_id 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar foreign key para mesociclos.user_id -> auth.users.id
-- ALTER TABLE public.mesociclos 
-- ADD CONSTRAINT fk_mesociclos_user_id 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar foreign key para microciclos.user_id -> auth.users.id
-- ALTER TABLE public.microciclos 
-- ADD CONSTRAINT fk_microciclos_user_id 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Resumo do diagnóstico
SELECT 
    'RESUMO_DIAGNOSTICO' as tipo,
    'Diagnóstico das foreign keys:' as descricao,
    '1. Verificar se foreign keys existem' as passo1,
    '2. Verificar se colunas user_id existem' as passo2,
    '3. Verificar se auth.users existe' as passo3,
    '4. Criar foreign keys se necessário' as passo4,
    'Execute as queries de criação se as foreign keys não existirem' as proximo_passo;
