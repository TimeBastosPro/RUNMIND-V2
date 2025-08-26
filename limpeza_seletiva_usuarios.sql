-- Script para limpeza seletiva de usuários
-- Permite escolher quais dados remover

-- 1. Verificar todos os usuários existentes
SELECT '=== TODOS OS USUÁRIOS EXISTENTES ===' as status;

SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    CASE 
        WHEN p.id IS NOT NULL THEN 'Atleta'
        WHEN c.id IS NOT NULL THEN 'Treinador'
        ELSE 'Apenas Auth'
    END as tipo_usuario,
    p.full_name as nome_atleta,
    c.full_name as nome_treinador,
    c.cref as cref_treinador
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN coaches c ON u.id = c.user_id
ORDER BY u.created_at DESC;

-- 2. Contar por tipo de usuário
SELECT '=== CONTAGEM POR TIPO ===' as status;

SELECT 
    'Total de usuários' as tipo,
    COUNT(*) as total
FROM auth.users 
UNION ALL
SELECT 
    'Atletas (com perfil)' as tipo,
    COUNT(*) as total
FROM profiles 
UNION ALL
SELECT 
    'Treinadores (com registro)' as tipo,
    COUNT(*) as total
FROM coaches 
UNION ALL
SELECT 
    'Usuários órfãos (só auth)' as tipo,
    COUNT(*) as total
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
  AND NOT EXISTS (SELECT 1 FROM coaches c WHERE c.user_id = u.id);

-- 3. ⚠️ OPÇÃO 1: Limpar apenas usuários órfãos (mais seguro)
SELECT '=== LIMPANDO USUÁRIOS ÓRFÃOS ===' as status;

-- Remover usuários que não têm perfil nem registro de treinador
DELETE FROM auth.users 
WHERE id NOT IN (
    SELECT id FROM profiles
    UNION
    SELECT user_id FROM coaches
);

-- 4. ⚠️ OPÇÃO 2: Limpar usuários específicos por email
-- Descomente e modifique para limpar emails específicos
/*
DELETE FROM athlete_coach_relationships 
WHERE athlete_id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('email1@gmail.com', 'email2@gmail.com')
);

DELETE FROM profiles 
WHERE email IN ('email1@gmail.com', 'email2@gmail.com');

DELETE FROM coaches 
WHERE email IN ('email1@gmail.com', 'email2@gmail.com');

DELETE FROM auth.users 
WHERE email IN ('email1@gmail.com', 'email2@gmail.com');
*/

-- 5. ⚠️ OPÇÃO 3: Limpar todos os dados de um usuário específico
-- Descomente e modifique para limpar um usuário específico
/*
-- Substitua 'email_especifico@gmail.com' pelo email desejado
DELETE FROM athlete_coach_relationships 
WHERE athlete_id = (SELECT id FROM auth.users WHERE email = 'email_especifico@gmail.com');

DELETE FROM daily_checkins 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'email_especifico@gmail.com');

DELETE FROM training_sessions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'email_especifico@gmail.com');

DELETE FROM insights 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'email_especifico@gmail.com');

DELETE FROM fitness_tests 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'email_especifico@gmail.com');

DELETE FROM races 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'email_especifico@gmail.com');

DELETE FROM profiles 
WHERE email = 'email_especifico@gmail.com';

DELETE FROM coaches 
WHERE email = 'email_especifico@gmail.com';

DELETE FROM auth.users 
WHERE email = 'email_especifico@gmail.com';
*/

-- 6. Verificar resultado da limpeza
SELECT '=== VERIFICAÇÃO APÓS LIMPEZA ===' as status;

SELECT 
    'Total de usuários restantes' as tipo,
    COUNT(*) as total
FROM auth.users 
UNION ALL
SELECT 
    'Atletas restantes' as tipo,
    COUNT(*) as total
FROM profiles 
UNION ALL
SELECT 
    'Treinadores restantes' as tipo,
    COUNT(*) as total
FROM coaches;

-- 7. Mostrar usuários restantes
SELECT '=== USUÁRIOS RESTANTES ===' as status;

SELECT 
    u.id,
    u.email,
    u.created_at,
    CASE 
        WHEN p.id IS NOT NULL THEN 'Atleta'
        WHEN c.id IS NOT NULL THEN 'Treinador'
        ELSE 'Apenas Auth'
    END as tipo_usuario,
    COALESCE(p.full_name, c.full_name) as nome
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN coaches c ON u.id = c.user_id
ORDER BY u.created_at DESC;
