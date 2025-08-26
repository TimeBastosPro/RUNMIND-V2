-- Testar relacionamento treinador-atleta e compartilhamento de macrociclos (ULTRA SEGURO)
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se as tabelas existem
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'NÃO EXISTE'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'athlete_coach_relationships', 'macrociclos')
ORDER BY table_name;

-- 2. Verificar estrutura da tabela profiles (se existir)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela athlete_coach_relationships (se existir)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'athlete_coach_relationships'
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela macrociclos (se existir)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'macrociclos'
ORDER BY ordinal_position;

-- 5. Verificar usuários existentes
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 6. Testar acesso à tabela profiles (se existir e tiver as colunas necessárias)
-- Esta consulta só será executada se a tabela profiles existir e tiver as colunas básicas
SELECT 
    'TESTE_PROFILES' as teste,
    COUNT(*) as total_registros
FROM public.profiles;

-- 7. Se a consulta anterior funcionar, tentar buscar dados dos perfis
-- (Execute apenas se a consulta 6 retornar um número > 0)
SELECT 
    id,
    -- Tentar acessar user_id se existir
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'user_id'
        ) THEN user_id::text
        ELSE 'user_id não existe'
    END as user_id,
    -- Tentar acessar full_name se existir
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'full_name'
        ) THEN full_name
        ELSE 'full_name não existe'
    END as full_name,
    -- Tentar acessar user_type se existir
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'user_type'
        ) THEN user_type
        ELSE 'user_type não existe'
    END as user_type,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- 8. Verificar relacionamentos treinador-atleta (se a tabela existir)
SELECT 
    'TESTE_RELACIONAMENTOS' as teste,
    COUNT(*) as total_relacionamentos
FROM public.athlete_coach_relationships;

-- 9. Se a consulta anterior funcionar, buscar dados dos relacionamentos
-- (Execute apenas se a consulta 8 retornar um número > 0)
SELECT 
    id,
    coach_id,
    athlete_id,
    status,
    created_at
FROM public.athlete_coach_relationships
ORDER BY created_at DESC
LIMIT 10;

-- 10. Verificar macrociclos existentes (se a tabela existir)
SELECT 
    'TESTE_MACROCICLOS' as teste,
    COUNT(*) as total_macrociclos
FROM public.macrociclos;

-- 11. Se a consulta anterior funcionar, buscar dados dos macrociclos
-- (Execute apenas se a consulta 10 retornar um número > 0)
SELECT 
    id,
    user_id,
    name,
    start_date,
    end_date,
    created_at
FROM public.macrociclos
ORDER BY created_at DESC
LIMIT 10;

-- 12. Verificar políticas RLS da tabela macrociclos
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'macrociclos';

-- 13. Verificar status dos relacionamentos (se a tabela existir)
-- (Execute apenas se a consulta 8 retornar um número > 0)
SELECT 
    status,
    COUNT(*) as quantidade
FROM public.athlete_coach_relationships
GROUP BY status
ORDER BY status;

-- 14. Testar JOIN entre relacionamentos e perfis (se ambas as tabelas existirem)
-- (Execute apenas se as consultas 6 e 8 retornarem números > 0)
SELECT 
    acr.id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    acr.created_at,
    -- Tentar acessar perfis se existirem
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'full_name'
        ) THEN coach_profile.full_name
        ELSE 'Perfil não disponível'
    END as coach_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'full_name'
        ) THEN athlete_profile.full_name
        ELSE 'Perfil não disponível'
    END as athlete_name
FROM public.athlete_coach_relationships acr
LEFT JOIN public.profiles coach_profile ON acr.coach_id = coach_profile.user_id
LEFT JOIN public.profiles athlete_profile ON acr.athlete_id = athlete_profile.user_id
WHERE acr.status IN ('active', 'approved')
ORDER BY acr.created_at DESC
LIMIT 10;
