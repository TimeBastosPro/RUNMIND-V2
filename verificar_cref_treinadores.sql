-- Script para verificar e corrigir CREF dos treinadores
-- Este script resolve o problema de CREF não salvo no cadastro

-- 1. Verificar treinadores existentes e seus CREFs
SELECT '=== VERIFICAÇÃO DE TREINADORES E CREFs ===' as status;

SELECT 
    id,
    user_id,
    full_name,
    email,
    cref,
    created_at,
    updated_at
FROM coaches 
ORDER BY created_at DESC;

-- 2. Verificar se há treinadores sem CREF
SELECT '=== TREINADORES SEM CREF ===' as status;

SELECT 
    id,
    user_id,
    full_name,
    email,
    cref,
    created_at
FROM coaches 
WHERE cref IS NULL OR cref = ''
ORDER BY created_at DESC;

-- 3. Contar treinadores com e sem CREF
SELECT '=== CONTAGEM DE CREFs ===' as status;

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
WHERE cref IS NULL OR cref = '';

-- 4. ⚠️ CORREÇÃO: Atualizar CREF para treinadores que não têm
-- Descomente e modifique para adicionar CREF aos treinadores que precisam

/*
-- Exemplo: Atualizar CREF para um treinador específico
UPDATE coaches 
SET cref = '123456-GMG', updated_at = NOW()
WHERE email = 'timebastos@gmail.com' AND (cref IS NULL OR cref = '');

-- Exemplo: Atualizar CREF para todos os treinadores sem CREF
UPDATE coaches 
SET cref = '000000-GMG', updated_at = NOW()
WHERE cref IS NULL OR cref = '';
*/

-- 5. Verificar resultado após correção
SELECT '=== VERIFICAÇÃO FINAL ===' as status;

SELECT 
    id,
    user_id,
    full_name,
    email,
    cref,
    created_at,
    updated_at
FROM coaches 
ORDER BY created_at DESC;

-- 6. Mensagem de instrução
SELECT '✅ VERIFICAÇÃO CONCLUÍDA!' as resultado;
SELECT 'Para corrigir CREFs, descomente e execute as linhas de UPDATE acima.' as instrucao;
