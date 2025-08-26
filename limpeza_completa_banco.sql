-- Script para limpeza completa de todos os cadastros
-- ⚠️ ATENÇÃO: Este script remove TODOS os dados do sistema
-- Execute apenas em ambiente de desenvolvimento/teste

-- 1. Verificar o que existe atualmente
SELECT '=== VERIFICAÇÃO INICIAL ===' as status;

SELECT 
    'auth.users' as tabela,
    COUNT(*) as total
FROM auth.users 
UNION ALL
SELECT 
    'profiles' as tabela,
    COUNT(*) as total
FROM profiles 
UNION ALL
SELECT 
    'coaches' as tabela,
    COUNT(*) as total
FROM coaches 
UNION ALL
SELECT 
    'athlete_coach_relationships' as tabela,
    COUNT(*) as total
FROM athlete_coach_relationships 
UNION ALL
SELECT 
    'teams' as tabela,
    COUNT(*) as total
FROM teams 
UNION ALL
SELECT 
    'daily_checkins' as tabela,
    COUNT(*) as total
FROM daily_checkins 
UNION ALL
SELECT 
    'training_sessions' as tabela,
    COUNT(*) as total
FROM training_sessions 
UNION ALL
SELECT 
    'insights' as tabela,
    COUNT(*) as total
FROM insights 
UNION ALL
SELECT 
    'fitness_tests' as tabela,
    COUNT(*) as total
FROM fitness_tests 
UNION ALL
SELECT 
    'races' as tabela,
    COUNT(*) as total
FROM races;

-- 2. Mostrar alguns exemplos dos dados existentes
SELECT '=== EXEMPLOS DE DADOS EXISTENTES ===' as status;

SELECT 'Usuários:' as tipo, id, email, created_at
FROM auth.users 
LIMIT 5;

SELECT 'Perfis:' as tipo, id, email, full_name, user_type
FROM profiles 
LIMIT 5;

SELECT 'Treinadores:' as tipo, id, full_name, email, cref
FROM coaches 
LIMIT 5;

-- 3. ⚠️ LIMPEZA COMPLETA - Execute apenas se quiser remover TUDO
SELECT '=== EXECUTANDO LIMPEZA COMPLETA ===' as status;

-- Remover dados relacionados em ordem (para evitar problemas de foreign key)
-- 1. Relacionamentos atleta-treinador
DELETE FROM athlete_coach_relationships;

-- 2. Equipes
DELETE FROM teams;

-- 3. Check-ins diários
DELETE FROM daily_checkins;

-- 4. Sessões de treino
DELETE FROM training_sessions;

-- 5. Insights
DELETE FROM insights;

-- 6. Testes de fitness
DELETE FROM fitness_tests;

-- 7. Corridas
DELETE FROM races;

-- 8. Perfis de atleta
DELETE FROM profiles;

-- 9. Treinadores
DELETE FROM coaches;

-- 10. Usuários do auth (isso remove automaticamente das outras tabelas)
DELETE FROM auth.users;

-- 4. Verificar se a limpeza foi bem-sucedida
SELECT '=== VERIFICAÇÃO FINAL ===' as status;

SELECT 
    'auth.users' as tabela,
    COUNT(*) as total
FROM auth.users 
UNION ALL
SELECT 
    'profiles' as tabela,
    COUNT(*) as total
FROM profiles 
UNION ALL
SELECT 
    'coaches' as tabela,
    COUNT(*) as total
FROM coaches 
UNION ALL
SELECT 
    'athlete_coach_relationships' as tabela,
    COUNT(*) as total
FROM athlete_coach_relationships 
UNION ALL
SELECT 
    'teams' as tabela,
    COUNT(*) as total
FROM teams 
UNION ALL
SELECT 
    'daily_checkins' as tabela,
    COUNT(*) as total
FROM daily_checkins 
UNION ALL
SELECT 
    'training_sessions' as tabela,
    COUNT(*) as total
FROM training_sessions 
UNION ALL
SELECT 
    'insights' as tabela,
    COUNT(*) as total
FROM insights 
UNION ALL
SELECT 
    'fitness_tests' as tabela,
    COUNT(*) as total
FROM fitness_tests 
UNION ALL
SELECT 
    'races' as tabela,
    COUNT(*) as total
FROM races;

-- 5. Mensagem de sucesso
SELECT '✅ LIMPEZA COMPLETA REALIZADA COM SUCESSO!' as resultado;
SELECT 'Todos os dados foram removidos do sistema.' as instrucao;
SELECT 'Agora você pode testar o cadastro do zero.' as proximo_passo;
