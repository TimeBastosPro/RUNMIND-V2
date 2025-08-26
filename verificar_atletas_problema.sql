-- Script para verificar e corrigir problemas com atletas
-- Este script resolve problemas de login de atletas

-- 1. Verificar atletas existentes
SELECT '=== VERIFICAÇÃO DE ATLETAS ===' as status;

SELECT 
    id,
    email,
    full_name,
    user_type,
    onboarding_completed,
    created_at,
    updated_at
FROM profiles 
WHERE user_type = 'athlete' OR user_type IS NULL
ORDER BY created_at DESC;

-- 2. Verificar atletas sem user_type definido
SELECT '=== ATLETAS SEM USER_TYPE ===' as status;

SELECT 
    id,
    email,
    full_name,
    user_type,
    onboarding_completed,
    created_at
FROM profiles 
WHERE user_type IS NULL OR user_type = ''
ORDER BY created_at DESC;

-- 3. Verificar usuários auth que não têm perfil
SELECT '=== USUÁRIOS AUTH SEM PERFIL ===' as status;

SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    CASE 
        WHEN p.id IS NOT NULL THEN 'Tem perfil'
        WHEN c.id IS NOT NULL THEN 'É treinador'
        ELSE 'Sem perfil'
    END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN coaches c ON u.id = c.user_id
WHERE p.id IS NULL AND c.id IS NULL
ORDER BY u.created_at DESC;

-- 4. Contar por tipo de usuário
SELECT '=== CONTAGEM POR TIPO ===' as status;

SELECT 
    'Total de usuários auth' as tipo,
    COUNT(*) as total
FROM auth.users 
UNION ALL
SELECT 
    'Atletas com perfil' as tipo,
    COUNT(*) as total
FROM profiles 
WHERE user_type = 'athlete'
UNION ALL
SELECT 
    'Atletas sem user_type' as tipo,
    COUNT(*) as total
FROM profiles 
WHERE user_type IS NULL OR user_type = ''
UNION ALL
SELECT 
    'Treinadores' as tipo,
    COUNT(*) as total
FROM coaches 
UNION ALL
SELECT 
    'Usuários órfãos' as tipo,
    COUNT(*) as total
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
  AND NOT EXISTS (SELECT 1 FROM coaches c WHERE c.user_id = u.id);

-- 5. ⚠️ CORREÇÃO: Definir user_type para atletas que não têm
-- Descomente e execute para corrigir atletas sem user_type

/*
-- Corrigir atletas sem user_type
UPDATE profiles 
SET user_type = 'athlete', updated_at = NOW()
WHERE user_type IS NULL OR user_type = '';

-- Verificar se a correção funcionou
SELECT '=== VERIFICAÇÃO APÓS CORREÇÃO ===' as status;
SELECT 
    id,
    email,
    full_name,
    user_type,
    onboarding_completed,
    updated_at
FROM profiles 
WHERE user_type = 'athlete'
ORDER BY updated_at DESC;
*/

-- 6. ⚠️ CORREÇÃO: Criar perfis para usuários órfãos (se necessário)
-- Descomente e modifique para criar perfis para usuários que não têm

/*
-- Exemplo: Criar perfil para um usuário específico
INSERT INTO profiles (
    id, 
    email, 
    full_name, 
    experience_level, 
    main_goal, 
    context_type, 
    onboarding_completed, 
    user_type,
    created_at,
    updated_at
) VALUES (
    'user_id_aqui', -- Substitua pelo user_id real
    'email_aqui@gmail.com', -- Substitua pelo email real
    'Nome do Usuário', -- Substitua pelo nome real
    'beginner',
    'health',
    'solo',
    false,
    'athlete',
    NOW(),
    NOW()
);
*/

-- 7. Mensagem de instrução
SELECT '✅ VERIFICAÇÃO CONCLUÍDA!' as resultado;
SELECT 'Para corrigir problemas, descomente e execute as linhas de UPDATE/INSERT acima.' as instrucao;
