-- Testar relacionamento treinador-atleta e compartilhamento de macrociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar usuários existentes
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar perfis de usuários
SELECT 
    id,
    user_id,
    full_name,
    user_type,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar relacionamentos treinador-atleta
SELECT 
    id,
    coach_id,
    athlete_id,
    status,
    created_at,
    -- Informações do treinador
    coach_profile.full_name as coach_name,
    coach_profile.user_type as coach_type,
    -- Informações do atleta
    athlete_profile.full_name as athlete_name,
    athlete_profile.user_type as athlete_type
FROM public.athlete_coach_relationships acr
LEFT JOIN public.profiles coach_profile ON acr.coach_id = coach_profile.user_id
LEFT JOIN public.profiles athlete_profile ON acr.athlete_id = athlete_profile.user_id
ORDER BY acr.created_at DESC
LIMIT 10;

-- 4. Verificar macrociclos existentes
SELECT 
    id,
    user_id,
    name,
    start_date,
    end_date,
    created_at,
    -- Informações do proprietário
    profile.full_name as owner_name,
    profile.user_type as owner_type
FROM public.macrociclos m
LEFT JOIN public.profiles profile ON m.user_id = profile.user_id
ORDER BY m.created_at DESC
LIMIT 10;

-- 5. Testar consulta que busca macrociclos próprios E de atletas vinculados
-- (Esta é a consulta que o store está usando)
SELECT 
    m.id,
    m.user_id,
    m.name,
    m.start_date,
    m.end_date,
    -- Informações do proprietário
    profile.full_name as owner_name,
    profile.user_type as owner_type,
    -- Verificar se é um relacionamento ativo
    CASE 
        WHEN acr.id IS NOT NULL THEN 'Vinculado ao treinador'
        ELSE 'Próprio'
    END as relationship_status
FROM public.macrociclos m
LEFT JOIN public.profiles profile ON m.user_id = profile.user_id
LEFT JOIN public.athlete_coach_relationships acr ON (
    m.user_id = acr.athlete_id 
    AND acr.coach_id = 'SEU_COACH_ID_AQUI' -- Substitua pelo ID do treinador
    AND acr.status IN ('active', 'approved')
)
WHERE m.user_id = 'SEU_COACH_ID_AQUI' -- Próprios do treinador
   OR acr.id IS NOT NULL -- OU de atletas vinculados
ORDER BY m.created_at DESC;

-- 6. Verificar se as políticas RLS estão funcionando
-- (Execute como o usuário treinador)
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'macrociclos';

-- 7. Testar inserção de macrociclo para atleta (como treinador)
-- INSERT INTO public.macrociclos (
--     user_id,
--     name,
--     start_date,
--     end_date,
--     goal
-- ) VALUES (
--     'ID_DO_ATLETA_AQUI', -- Substitua pelo ID do atleta
--     'Macrociclo de Teste - Atleta',
--     '2024-01-01',
--     '2024-12-31',
--     'Teste de compartilhamento'
-- );

-- 8. Verificar se o macrociclo foi criado e é visível
-- SELECT * FROM public.macrociclos WHERE name LIKE '%Teste%' ORDER BY created_at DESC;

-- 9. Verificar logs de auditoria (se houver)
-- SELECT * FROM pg_stat_activity WHERE state = 'active';
