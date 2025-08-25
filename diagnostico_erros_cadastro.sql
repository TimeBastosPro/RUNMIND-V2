-- Script de diagnóstico para identificar erros no sistema de cadastro
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura das tabelas principais
SELECT '=== ESTRUTURA DA TABELA PROFILES ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

SELECT '=== ESTRUTURA DA TABELA COACHES ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'coaches' 
ORDER BY ordinal_position;

-- 2. Verificar constraints e índices
SELECT '=== CONSTRAINTS DA TABELA PROFILES ===' as info;
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;

SELECT '=== CONSTRAINTS DA TABELA COACHES ===' as info;
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'coaches'::regclass;

-- 3. Verificar dados existentes
SELECT '=== DADOS EXISTENTES EM PROFILES ===' as info;
SELECT 
    id,
    email,
    full_name,
    user_type,
    onboarding_completed,
    created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

SELECT '=== DADOS EXISTENTES EM COACHES ===' as info;
SELECT 
    id,
    user_id,
    full_name,
    email,
    cref,
    created_at
FROM coaches 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Verificar inconsistências
SELECT '=== INCONSISTÊNCIAS ENCONTRADAS ===' as info;

-- Perfis sem user_type
SELECT 'Perfis sem user_type:' as problema, COUNT(*) as quantidade
FROM profiles 
WHERE user_type IS NULL
UNION ALL
-- Perfis com user_type inválido
SELECT 'Perfis com user_type inválido:' as problema, COUNT(*) as quantidade
FROM profiles 
WHERE user_type NOT IN ('athlete', 'coach')
UNION ALL
-- Treinadores sem CREF
SELECT 'Treinadores sem CREF:' as problema, COUNT(*) as quantidade
FROM coaches 
WHERE cref IS NULL OR cref = ''
UNION ALL
-- Usuários em profiles mas não em coaches (deveriam ser treinadores)
SELECT 'Usuários em profiles como coach mas não em coaches:' as problema, COUNT(*) as quantidade
FROM profiles p
LEFT JOIN coaches c ON p.id = c.user_id
WHERE p.user_type = 'coach' AND c.id IS NULL
UNION ALL
-- Usuários em coaches mas não em profiles como coach
SELECT 'Usuários em coaches mas não em profiles como coach:' as problema, COUNT(*) as quantidade
FROM coaches c
LEFT JOIN profiles p ON c.user_id = p.id
WHERE p.user_type != 'coach' OR p.user_type IS NULL;

-- 5. Verificar RLS policies
SELECT '=== RLS POLICIES ===' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'coaches')
ORDER BY tablename, policyname;

-- 6. Verificar logs de erro recentes (se existir tabela de logs)
SELECT '=== VERIFICANDO LOGS DE ERRO ===' as info;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_logs') THEN
        RAISE NOTICE 'Tabela security_logs existe - verificando logs recentes';
    ELSE
        RAISE NOTICE 'Tabela security_logs não existe';
    END IF;
END $$;

-- 7. Estatísticas gerais
SELECT '=== ESTATÍSTICAS GERAIS ===' as info;
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
FROM coaches
UNION ALL
SELECT 
    'Usuários autenticados:' as metric,
    COUNT(*) as value
FROM auth.users;
