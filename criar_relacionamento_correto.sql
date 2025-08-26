-- Criar relacionamento correto entre treinador e atleta
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o relacionamento correto já existe
SELECT 
    'VERIFICACAO_INICIAL' as tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.athlete_coach_relationships 
            WHERE coach_id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d'  -- timebastos@gmail.com
            AND athlete_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'  -- aline@gmail.com
            AND status = 'active'
        ) THEN 'RELACIONAMENTO CORRETO JA EXISTE'
        ELSE 'RELACIONAMENTO CORRETO NAO EXISTE - VAMOS CRIAR'
    END as status;

-- 2. Criar relacionamento correto
INSERT INTO public.athlete_coach_relationships (
    coach_id,
    athlete_id,
    status,
    requested_at,
    created_at,
    updated_at
) VALUES (
    'feb0227b-7a07-42a1-a9fd-0f203b6e297d',  -- timebastos@gmail.com
    '3b091ca5-1967-4152-93bc-424e34ad52ad',  -- aline@gmail.com
    'active',
    NOW(),
    NOW(),
    NOW()
);

-- 3. Verificar se o relacionamento foi criado
SELECT 
    'RELACIONAMENTO_CRIADO' as tipo,
    acr.id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    coach.email as coach_email,
    athlete.email as athlete_email,
    acr.created_at
FROM public.athlete_coach_relationships acr
LEFT JOIN auth.users coach ON acr.coach_id = coach.id
LEFT JOIN auth.users athlete ON acr.athlete_id = athlete.id
WHERE acr.coach_id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d'
   AND acr.athlete_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
   AND acr.status = 'active';

-- 4. Verificar todos os relacionamentos ativos (para confirmar)
SELECT 
    'TODOS_RELACIONAMENTOS_ATIVOS' as tipo,
    acr.id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    coach.email as coach_email,
    athlete.email as athlete_email
FROM public.athlete_coach_relationships acr
LEFT JOIN auth.users coach ON acr.coach_id = coach.id
LEFT JOIN auth.users athlete ON acr.athlete_id = athlete.id
WHERE acr.status = 'active'
ORDER BY acr.created_at DESC;

-- 5. Testar se o macrociclo agora aparece para a atleta
SELECT 
    'TESTE_FINAL' as tipo,
    m.id,
    m.user_id,
    m.name,
    u.email as criado_por,
    'Este macrociclo deve aparecer para a atleta agora' as observacao
FROM public.macrociclos m
LEFT JOIN auth.users u ON m.user_id = u.id
WHERE m.name LIKE '%Maratona%' OR m.name LIKE '%Porto%';
