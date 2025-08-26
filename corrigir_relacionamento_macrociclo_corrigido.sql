-- Corrigir relacionamento treinador-atleta para compartilhamento de macrociclos (CORRIGIDO)
-- Execute este script no Supabase SQL Editor

-- 1. Verificar o problema atual
SELECT 
    'PROBLEMA_ATUAL' as status,
    'Macrociclo criado por treinador diferente do relacionamento ativo' as descricao;

-- 2. Primeiro, encontrar o UUID correto do macrociclo
SELECT 
    'BUSCAR_MACROCICLO' as tipo,
    id,
    user_id,
    name,
    created_at,
    'Verificar se este é o macrociclo correto' as observacao
FROM public.macrociclos
WHERE name LIKE '%Maratona%' OR name LIKE '%Porto%'
ORDER BY created_at DESC;

-- 3. Mostrar relacionamentos ativos
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

-- 4. Verificar usuários existentes
SELECT 
    'USUARIOS' as tipo,
    id,
    email,
    created_at
FROM auth.users
WHERE email IN ('timebastos@gmail.com', 'aline@gmail.com')
ORDER BY created_at;

-- 5. Verificar se existe relacionamento entre o treinador correto e a atleta
-- (Substitua os UUIDs pelos valores corretos encontrados nas consultas acima)
SELECT 
    'VERIFICACAO' as tipo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.athlete_coach_relationships 
            WHERE coach_id = (
                SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com'
            )
            AND athlete_id = (
                SELECT id FROM auth.users WHERE email = 'aline@gmail.com'
            )
            AND status = 'active'
        ) THEN 'RELACIONAMENTO JA EXISTE'
        ELSE 'RELACIONAMENTO NAO EXISTE - PRECISA CRIAR'
    END as status;

-- 6. Criar relacionamento entre o treinador correto e a atleta (se não existir)
-- DESCOMENTE A LINHA ABAIXO APENAS SE A VERIFICACAO ANTERIOR MOSTRAR "RELACIONAMENTO NAO EXISTE"
/*
INSERT INTO public.athlete_coach_relationships (
    coach_id,
    athlete_id,
    status,
    requested_at,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com'),
    (SELECT id FROM auth.users WHERE email = 'aline@gmail.com'),
    'active',
    NOW(),
    NOW(),
    NOW()
);
*/

-- 7. Verificar se o relacionamento foi criado
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
WHERE (acr.coach_id = (SELECT id FROM auth.users WHERE email = 'timebastos@gmail.com')
   AND acr.athlete_id = (SELECT id FROM auth.users WHERE email = 'aline@gmail.com'))
   AND acr.status = 'active';

-- 8. Testar se o macrociclo agora aparece para a atleta
-- (Substitua o UUID pelo valor correto encontrado na consulta 2)
SELECT 
    'TESTE_MACROCICLO_ATLETA' as tipo,
    m.id,
    m.user_id,
    m.name,
    u.email as criado_por,
    'Este macrociclo deve aparecer para a atleta se o relacionamento estiver correto' as observacao
FROM public.macrociclos m
LEFT JOIN auth.users u ON m.user_id = u.id
WHERE m.name LIKE '%Maratona%' OR m.name LIKE '%Porto%';
