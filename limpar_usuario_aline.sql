-- Script para limpar o usuário aline@gmail.com e permitir novo cadastro
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o que existe atualmente
SELECT '=== VERIFICAÇÃO INICIAL ===' as status;

SELECT 
    'auth.users' as tabela,
    COUNT(*) as total
FROM auth.users 
WHERE email = 'aline@gmail.com'
UNION ALL
SELECT 
    'profiles' as tabela,
    COUNT(*) as total
FROM profiles 
WHERE email = 'aline@gmail.com'
UNION ALL
SELECT 
    'coaches' as tabela,
    COUNT(*) as total
FROM coaches 
WHERE email = 'aline@gmail.com';

-- 2. Mostrar detalhes dos registros existentes
SELECT '=== DETALHES DOS REGISTROS ===' as status;

SELECT 'auth.users:' as tabela, id, email, email_confirmed_at, created_at
FROM auth.users 
WHERE email = 'aline@gmail.com';

SELECT 'profiles:' as tabela, id, email, full_name, user_type, created_at
FROM profiles 
WHERE email = 'aline@gmail.com';

SELECT 'coaches:' as tabela, id, user_id, full_name, email, cref, created_at
FROM coaches 
WHERE email = 'aline@gmail.com';

-- 3. ⚠️ LIMPEZA COMPLETA - Execute apenas se quiser remover tudo
-- Isso remove o usuário e todos os dados relacionados
SELECT '=== EXECUTANDO LIMPEZA ===' as status;

-- Remover da tabela coaches primeiro (se existir)
DELETE FROM coaches 
WHERE email = 'aline@gmail.com';

-- Remover da tabela profiles (se existir)
DELETE FROM profiles 
WHERE email = 'aline@gmail.com';

-- Remover da tabela auth.users (isso remove automaticamente das outras tabelas)
DELETE FROM auth.users 
WHERE email = 'aline@gmail.com';

-- 4. Verificar se a limpeza foi bem-sucedida
SELECT '=== VERIFICAÇÃO FINAL ===' as status;

SELECT 
    'auth.users' as tabela,
    COUNT(*) as total
FROM auth.users 
WHERE email = 'aline@gmail.com'
UNION ALL
SELECT 
    'profiles' as tabela,
    COUNT(*) as total
FROM profiles 
WHERE email = 'aline@gmail.com'
UNION ALL
SELECT 
    'coaches' as tabela,
    COUNT(*) as total
FROM coaches 
WHERE email = 'aline@gmail.com';

-- 5. Mensagem de sucesso
SELECT '✅ Usuário aline@gmail.com removido com sucesso!' as resultado;
SELECT 'Agora você pode criar uma nova conta com este email.' as instrucao;
