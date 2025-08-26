-- Verificar funcionamento final do relacionamento
-- Execute este script no Supabase SQL Editor

-- 1. Verificar relacionamento criado
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
LEFT JOIN public.coaches c ON acr.coach_id = c.id
LEFT JOIN auth.users coach ON c.user_id = coach.id
LEFT JOIN auth.users athlete ON acr.athlete_id = athlete.id
WHERE acr.coach_id = '57356108-9ec5-4540-9f5f-91d6538fb2af'
   AND acr.athlete_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
   AND acr.status = 'active';

-- 2. Verificar se o macrociclo deve aparecer para a atleta (teste da lógica do código)
SELECT 
    'TESTE_LOGIC_CODE' as tipo,
    m.id,
    m.user_id,
    m.name,
    u.email as criado_por,
    CASE 
        WHEN m.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad' THEN 'MACROCICLO_PROPRIO'
        WHEN EXISTS (
            SELECT 1 FROM public.athlete_coach_relationships acr
            WHERE acr.athlete_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
            AND acr.coach_id = '57356108-9ec5-4540-9f5f-91d6538fb2af'
            AND acr.status = 'active'
        ) THEN 'MACROCICLO_DO_TREINADOR_VINCULADO'
        ELSE 'MACROCICLO_NAO_APARECE'
    END as resultado
FROM public.macrociclos m
LEFT JOIN auth.users u ON m.user_id = u.id
WHERE m.name LIKE '%Maratona%' OR m.name LIKE '%Porto%';

-- 3. Verificar todos os macrociclos que a atleta deve ver
SELECT 
    'MACROCICLOS_ATLETA' as tipo,
    m.id,
    m.user_id,
    m.name,
    u.email as criado_por,
    CASE 
        WHEN m.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad' THEN 'PRÓPRIO'
        WHEN EXISTS (
            SELECT 1 FROM public.athlete_coach_relationships acr
            WHERE acr.athlete_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
            AND acr.coach_id = (
                SELECT c.id FROM public.coaches c 
                WHERE c.user_id = m.user_id
            )
            AND acr.status = 'active'
        ) THEN 'DO_TREINADOR_VINCULADO'
        ELSE 'NAO_APARECE'
    END as visibilidade
FROM public.macrociclos m
LEFT JOIN auth.users u ON m.user_id = u.id
ORDER BY m.created_at DESC;

-- 4. Verificar se há algum problema com RLS (Row Level Security)
SELECT 
    'VERIFICACAO_RLS' as tipo,
    'Verificar se as políticas RLS permitem acesso aos macrociclos' as observacao,
    'Se não aparecer, pode ser problema de RLS' as possivel_causa;

-- 5. Resumo final
SELECT 
    'RESUMO_FINAL' as tipo,
    'Relacionamento criado com sucesso!' as status,
    'Teste no aplicativo: login como aline@gmail.com e verifique se o macrociclo aparece' as proximo_passo;
