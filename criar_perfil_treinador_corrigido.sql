-- Criar perfil do treinador timebastos@gmail.com (CORRIGIDO)
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o perfil já existe
SELECT 
    'VERIFICACAO_PERFIL' as tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE email = 'timebastos@gmail.com'
        ) THEN 'PERFIL JA EXISTE'
        ELSE 'PERFIL NAO EXISTE - VAMOS CRIAR'
    END as status;

-- 2. Criar perfil do treinador com valores válidos
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    user_type,
    experience_level,
    main_goal,
    context_type,
    onboarding_completed,
    created_at,
    updated_at
) VALUES (
    'feb0227b-7a07-42a1-a9fd-0f203b6e297d',  -- mesmo ID do auth.users
    'timebastos@gmail.com',
    'Luiz Bastos',
    'coach',  -- user_type pode ser 'coach'
    'advanced',  -- experience_level válido
    'performance',  -- main_goal válido
    'solo',  -- context_type válido (baseado no perfil da Aline)
    true,
    NOW(),
    NOW()
);

-- 3. Verificar se o perfil foi criado
SELECT 
    'PERFIL_CRIADO' as tipo,
    id,
    email,
    full_name,
    user_type,
    experience_level,
    main_goal,
    context_type,
    onboarding_completed,
    created_at
FROM public.profiles
WHERE email = 'timebastos@gmail.com';

-- 4. Verificar todos os perfis existentes
SELECT 
    'TODOS_PERFIS' as tipo,
    id,
    email,
    full_name,
    user_type,
    context_type,
    created_at
FROM public.profiles
ORDER BY created_at DESC;

-- 5. Verificar se o login deve funcionar agora
SELECT 
    'DIAGNOSTICO_LOGIN' as tipo,
    u.email,
    CASE 
        WHEN u.email_confirmed_at IS NULL THEN 'PROBLEMA: Email não confirmado'
        WHEN p.id IS NULL THEN 'PROBLEMA: Sem perfil'
        WHEN p.user_type = 'coach' AND c.id IS NULL THEN 'PROBLEMA: Treinador sem registro na tabela coaches'
        ELSE 'OK: Usuário deve conseguir fazer login'
    END as diagnostico
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id  -- JOIN correto: auth.users.id = profiles.id
LEFT JOIN public.coaches c ON u.id = c.user_id
WHERE u.email IN ('timebastos@gmail.com', 'aline@gmail.com')
ORDER BY u.created_at;

-- 6. Resumo final
SELECT 
    'RESUMO_FINAL' as tipo,
    'Perfil do treinador criado com sucesso!' as status,
    'Agora teste o login com timebastos@gmail.com' as proximo_passo;
