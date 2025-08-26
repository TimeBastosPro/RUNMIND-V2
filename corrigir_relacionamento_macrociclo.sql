-- Corrigir relacionamento treinador-atleta para compartilhamento de macrociclos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o problema atual
SELECT 
    'PROBLEMA_ATUAL' as status,
    'Macrociclo criado por treinador diferente do relacionamento ativo' as descricao;

-- 2. Mostrar dados atuais
SELECT 
    'MACROCICLO' as tipo,
    id,
    user_id,
    name,
    'Criado por timebastos@gmail.com' as observacao
FROM public.macrociclos
WHERE id = 'eala5792-ca4a-4520-99b2-1b6c66e2656d';

SELECT 
    'RELACIONAMENTO_ATIVO' as tipo,
    acr.id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    coach.email as coach_email,
    athlete.email as athlete_email
FROM public.athlete_coach_relationships acr
LEFT JOIN auth.users coach ON acr.coach_id = coach.id
LEFT JOIN auth.users athlete ON acr.athlete_id = athlete.id
WHERE acr.status = 'active';

-- 3. Verificar se existe relacionamento entre o treinador correto e a atleta
SELECT 
    'VERIFICACAO' as tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.athlete_coach_relationships 
            WHERE coach_id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d' 
            AND athlete_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
            AND status = 'active'
        ) THEN 'RELACIONAMENTO JA EXISTE'
        ELSE 'RELACIONAMENTO NAO EXISTE - PRECISA CRIAR'
    END as status;

-- 4. Criar relacionamento entre o treinador correto e a atleta (se não existir)
-- DESCOMENTE A LINHA ABAIXO APENAS SE A VERIFICACAO ANTERIOR MOSTRAR "RELACIONAMENTO NAO EXISTE"
-- INSERT INTO public.athlete_coach_relationships (
--     coach_id,
--     athlete_id,
--     status,
--     requested_at,
--     created_at,
--     updated_at
-- ) VALUES (
--     'feb0227b-7a07-42a1-a9fd-0f203b6e297d', -- timebastos@gmail.com
--     '3b091ca5-1967-4152-93bc-424e34ad52ad', -- aline@gmail.com
--     'active',
--     NOW(),
--     NOW(),
--     NOW()
-- );

-- 5. Verificar se o relacionamento foi criado
SELECT 
    'RELACIONAMENTO_FINAL' as tipo,
    acr.id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    coach.email as coach_email,
    athlete.email as athlete_email
FROM public.athlete_coach_relationships acr
LEFT JOIN auth.users coach ON acr.coach_id = coach.id
LEFT JOIN auth.users athlete ON acr.athlete_id = athlete.id
WHERE (acr.coach_id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d' 
   AND acr.athlete_id = '3b091ca5-1967-4152-93bc-424e34ad52ad')
   AND acr.status = 'active';
