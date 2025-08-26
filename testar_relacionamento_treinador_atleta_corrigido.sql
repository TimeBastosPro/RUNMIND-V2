-- Testar relacionamento treinador-atleta e compartilhamento de macrociclos (CORRIGIDO)
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura das tabelas primeiro
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'athlete_coach_relationships', 'macrociclos')
ORDER BY table_name, ordinal_position;

-- 2. Verificar usuários existentes
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar se a tabela profiles existe e tem dados
SELECT 
    COUNT(*) as total_profiles
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- 4. Se a tabela profiles existir, verificar seus dados
-- (Execute apenas se a consulta anterior retornar 1)
SELECT 
    id,
    user_id,
    full_name,
    user_type,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar relacionamentos treinador-atleta
SELECT 
    id,
    coach_id,
    athlete_id,
    status,
    created_at
FROM public.athlete_coach_relationships
ORDER BY created_at DESC
LIMIT 10;

-- 6. Verificar macrociclos existentes
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

-- 7. Testar consulta simples de macrociclos (sem JOINs complexos)
SELECT 
    m.id,
    m.user_id,
    m.name,
    m.start_date,
    m.end_date,
    m.created_at
FROM public.macrociclos m
ORDER BY m.created_at DESC
LIMIT 10;

-- 8. Verificar políticas RLS da tabela macrociclos
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'macrociclos';

-- 9. Verificar se há relacionamentos ativos
SELECT 
    COUNT(*) as total_relacionamentos,
    status,
    COUNT(*) as quantidade_por_status
FROM public.athlete_coach_relationships
GROUP BY status;

-- 10. Testar consulta de relacionamentos com informações básicas
SELECT 
    acr.id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    acr.created_at,
    -- Verificar se conseguimos acessar os perfis
    coach_profile.full_name as coach_name,
    athlete_profile.full_name as athlete_name
FROM public.athlete_coach_relationships acr
LEFT JOIN public.profiles coach_profile ON acr.coach_id = coach_profile.user_id
LEFT JOIN public.profiles athlete_profile ON acr.athlete_id = athlete_profile.user_id
WHERE acr.status IN ('active', 'approved')
ORDER BY acr.created_at DESC
LIMIT 10;
