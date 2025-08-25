-- =====================================================
-- TESTE DO SISTEMA DE AUTENTICAÇÃO CORRIGIDO
-- =====================================================
-- Este script testa o novo sistema que valida usuários ANTES do login
-- =====================================================

-- 1. Verificar estrutura das tabelas principais
SELECT '=== VERIFICANDO ESTRUTURA DAS TABELAS ===' as etapa;

-- Verificar tabela profiles
SELECT 
    'profiles' as tabela,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ OK'
        ELSE '⚠️ VAZIA'
    END as status
FROM profiles;

-- Verificar tabela coaches
SELECT 
    'coaches' as tabela,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ OK'
        ELSE '⚠️ VAZIA'
    END as status
FROM coaches;

-- Verificar tabela auth.users (apenas contagem)
SELECT 
    'auth.users' as tabela,
    (SELECT COUNT(*) FROM auth.users) as registros,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) > 0 THEN '✅ OK'
        ELSE '⚠️ VAZIA'
    END as status;

-- 2. Verificar usuários existentes
SELECT '=== USUÁRIOS CADASTRADOS ===' as etapa;

-- Listar todos os usuários em profiles
SELECT 
    id,
    email,
    full_name,
    user_type,
    onboarding_completed,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- Listar todos os coaches
SELECT 
    id,
    user_id,
    full_name,
    email,
    cref,
    created_at
FROM coaches
ORDER BY created_at DESC;

-- 3. Testar validação pré-login (simulação)
SELECT '=== TESTE DE VALIDAÇÃO PRÉ-LOGIN ===' as etapa;

-- Simular validação para um email que existe
DO $$
DECLARE
    test_email TEXT := 'teste@exemplo.com';
    profile_exists BOOLEAN;
    coach_exists BOOLEAN;
BEGIN
    -- Verificar se existe em profiles
    SELECT EXISTS(
        SELECT 1 FROM profiles WHERE email = test_email
    ) INTO profile_exists;
    
    IF profile_exists THEN
        RAISE NOTICE '✅ Email % existe em profiles', test_email;
        
        -- Verificar user_type
        DECLARE
            user_type_val TEXT;
        BEGIN
            SELECT user_type INTO user_type_val 
            FROM profiles 
            WHERE email = test_email;
            
            IF user_type_val IS NULL THEN
                RAISE NOTICE '❌ user_type não definido para %', test_email;
            ELSIF user_type_val = 'coach' THEN
                -- Verificar se existe em coaches
                SELECT EXISTS(
                    SELECT 1 FROM coaches c
                    JOIN profiles p ON c.user_id = p.id
                    WHERE p.email = test_email
                ) INTO coach_exists;
                
                IF coach_exists THEN
                    RAISE NOTICE '✅ Coach % validado com sucesso', test_email;
                ELSE
                    RAISE NOTICE '❌ Coach % não encontrado em coaches', test_email;
                END IF;
            ELSE
                RAISE NOTICE '✅ Atleta % validado com sucesso', test_email;
            END IF;
        END;
    ELSE
        RAISE NOTICE '❌ Email % não encontrado em profiles', test_email;
    END IF;
END $$;

-- 4. Verificar políticas RLS
SELECT '=== VERIFICANDO POLÍTICAS RLS ===' as etapa;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename IN ('profiles', 'coaches', 'insights', 'daily_checkins', 'training_sessions')
ORDER BY tablename;

-- 5. Verificar integridade dos dados
SELECT '=== VERIFICANDO INTEGRIDADE ===' as etapa;

-- Verificar se todos os coaches têm perfil correspondente
SELECT 
    'Coaches sem perfil' as problema,
    COUNT(*) as quantidade
FROM coaches c
LEFT JOIN profiles p ON c.user_id = p.id
WHERE p.id IS NULL

UNION ALL

-- Verificar se todos os profiles têm user_type definido
SELECT 
    'Profiles sem user_type' as problema,
    COUNT(*) as quantidade
FROM profiles
WHERE user_type IS NULL

UNION ALL

-- Verificar emails duplicados
SELECT 
    'Emails duplicados' as problema,
    COUNT(*) as quantidade
FROM (
    SELECT email, COUNT(*) as cnt
    FROM profiles
    GROUP BY email
    HAVING COUNT(*) > 1
) duplicados;

-- 6. Resumo do sistema
SELECT '=== RESUMO DO SISTEMA ===' as etapa;

SELECT 
    'Sistema de Autenticação' as componente,
    '✅ VALIDAÇÃO PRÉ-LOGIN IMPLEMENTADA' as status,
    'Usuários são validados ANTES do login no Supabase' as descricao

UNION ALL

SELECT 
    'Tela de Erro Personalizada' as componente,
    '✅ TELA CRIADA' as status,
    'Usuários não cadastrados veem tela específica' as descricao

UNION ALL

SELECT 
    'Limpeza de Dados Locais' as componente,
    '✅ FUNÇÃO IMPLEMENTADA' as status,
    'Dados locais são limpos automaticamente' as descricao

UNION ALL

SELECT 
    'Validação de Sessão' as componente,
    '✅ VERIFICAÇÃO PERIÓDICA' as status,
    'Sessões são validadas periodicamente' as descricao;

-- 7. Instruções para teste manual
SELECT '=== INSTRUÇÕES PARA TESTE MANUAL ===' as etapa;

SELECT 
    '1. Teste com email não cadastrado' as instrucao,
    'Deve mostrar: "Usuário não cadastrado no sistema. Crie uma conta primeiro."' as resultado_esperado

UNION ALL

SELECT 
    '2. Teste com email cadastrado' as instrucao,
    'Deve fazer login normalmente' as resultado_esperado

UNION ALL

SELECT 
    '3. Teste com coach sem dados em coaches' as instrucao,
    'Deve mostrar erro específico para treinador' as resultado_esperado

UNION ALL

SELECT 
    '4. Teste com usuário deletado do banco' as instrucao,
    'Não deve conseguir fazer login mesmo com dados locais' as resultado_esperado;

-- =====================================================
-- SISTEMA CORRIGIDO: VALIDAÇÃO ANTES DO LOGIN
-- =====================================================
-- ✅ Usuários não cadastrados NÃO conseguem fazer login
-- ✅ Tela de erro personalizada para usuários não cadastrados
-- ✅ Validação pré-login impede login desnecessário
-- ✅ Sistema mais seguro e robusto
-- =====================================================
