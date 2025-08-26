-- Script para verificar treinadores com problemas de login
-- Este script identifica treinadores que podem estar causando logout automático

-- 1. Verificar treinadores existentes
SELECT '=== VERIFICAÇÃO DE TREINADORES ===' as status;

SELECT 
    c.id,
    c.user_id,
    c.full_name,
    c.email,
    c.cref,
    c.created_at,
    c.updated_at,
    u.email_confirmed_at,
    u.created_at as auth_created_at
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- 2. Verificar treinadores sem CREF
SELECT '=== TREINADORES SEM CREF ===' as status;

SELECT 
    c.id,
    c.user_id,
    c.full_name,
    c.email,
    c.cref,
    c.created_at
FROM coaches c
WHERE c.cref IS NULL OR c.cref = ''
ORDER BY c.created_at DESC;

-- 3. Verificar treinadores com email não confirmado
SELECT '=== TREINADORES COM EMAIL NÃO CONFIRMADO ===' as status;

SELECT 
    c.id,
    c.user_id,
    c.full_name,
    c.email,
    c.cref,
    c.created_at,
    u.email_confirmed_at
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.email_confirmed_at IS NULL
ORDER BY c.created_at DESC;

-- 4. Verificar inconsistências entre coaches e auth.users
SELECT '=== INCONSISTÊNCIAS ENTRE COACHES E AUTH.USERS ===' as status;

SELECT 
    c.id as coach_id,
    c.user_id,
    c.full_name as coach_name,
    c.email as coach_email,
    u.email as auth_email,
    u.email_confirmed_at,
    CASE 
        WHEN c.email != u.email THEN 'Email diferente'
        WHEN u.email_confirmed_at IS NULL THEN 'Email não confirmado'
        WHEN c.cref IS NULL OR c.cref = '' THEN 'Sem CREF'
        ELSE 'OK'
    END as problema
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE c.email != u.email 
   OR u.email_confirmed_at IS NULL 
   OR c.cref IS NULL 
   OR c.cref = ''
ORDER BY c.created_at DESC;

-- 5. Verificar treinadores órfãos (sem auth.users)
SELECT '=== TREINADORES ÓRFÃOS (SEM AUTH.USERS) ===' as status;

SELECT 
    c.id,
    c.user_id,
    c.full_name,
    c.email,
    c.cref,
    c.created_at
FROM coaches c
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = c.user_id
)
ORDER BY c.created_at DESC;

-- 6. Contar por status
SELECT '=== CONTAGEM POR STATUS ===' as status;

SELECT 
    'Total de treinadores' as tipo,
    COUNT(*) as total
FROM coaches 
UNION ALL
SELECT 
    'Com CREF' as tipo,
    COUNT(*) as total
FROM coaches 
WHERE cref IS NOT NULL AND cref != ''
UNION ALL
SELECT 
    'Sem CREF' as tipo,
    COUNT(*) as total
FROM coaches 
WHERE cref IS NULL OR cref = ''
UNION ALL
SELECT 
    'Email confirmado' as tipo,
    COUNT(*) as total
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.email_confirmed_at IS NOT NULL
UNION ALL
SELECT 
    'Email não confirmado' as tipo,
    COUNT(*) as total
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.email_confirmed_at IS NULL;

-- 7. ⚠️ CORREÇÃO: Atualizar CREF para treinadores que não têm
-- Descomente e execute para corrigir CREFs ausentes

/*
-- Corrigir CREF para treinadores sem CREF
UPDATE coaches 
SET cref = '000000-GMG', updated_at = NOW()
WHERE cref IS NULL OR cref = '';

-- Verificar se a correção funcionou
SELECT '=== VERIFICAÇÃO APÓS CORREÇÃO DE CREF ===' as status;
SELECT 
    id,
    user_id,
    full_name,
    email,
    cref,
    updated_at
FROM coaches 
WHERE cref = '000000-GMG'
ORDER BY updated_at DESC;
*/

-- 8. Mensagem de instrução
SELECT '✅ VERIFICAÇÃO CONCLUÍDA!' as resultado;
SELECT 'Para corrigir problemas, descomente e execute as linhas de UPDATE acima.' as instrucao;
