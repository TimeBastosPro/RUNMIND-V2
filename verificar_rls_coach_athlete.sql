-- Script para verificar políticas RLS para acesso de treinadores aos dados dos atletas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar políticas existentes na tabela training_sessions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'training_sessions'
ORDER BY policyname;

-- 2. Verificar políticas existentes na tabela daily_checkins
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'daily_checkins'
ORDER BY policyname;

-- 3. Verificar políticas existentes na tabela insights
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'insights'
ORDER BY policyname;

-- 4. Verificar relacionamentos coach-atleta existentes
SELECT 
    acr.id as relationship_id,
    acr.coach_id,
    acr.athlete_id,
    acr.status,
    acr.created_at,
    c.full_name as coach_name,
    c.email as coach_email,
    p.full_name as athlete_name,
    p.email as athlete_email
FROM athlete_coach_relationships acr
LEFT JOIN coaches c ON acr.coach_id = c.user_id
LEFT JOIN profiles p ON acr.athlete_id = p.id
WHERE acr.status = 'accepted'
ORDER BY acr.created_at DESC;

-- 5. Verificar se existem dados de treino para atletas vinculados
SELECT 
    ts.id,
    ts.user_id,
    ts.training_date,
    ts.title,
    ts.status,
    ts.created_at,
    p.full_name as athlete_name,
    p.email as athlete_email
FROM training_sessions ts
LEFT JOIN profiles p ON ts.user_id = p.id
WHERE ts.user_id IN (
    SELECT athlete_id 
    FROM athlete_coach_relationships 
    WHERE status = 'accepted'
)
ORDER BY ts.training_date DESC
LIMIT 10;

-- 6. Verificar se existem check-ins para atletas vinculados
SELECT 
    dc.id,
    dc.user_id,
    dc.date,
    dc.sleep_quality,
    dc.soreness,
    dc.motivation,
    dc.created_at,
    p.full_name as athlete_name,
    p.email as athlete_email
FROM daily_checkins dc
LEFT JOIN profiles p ON dc.user_id = p.id
WHERE dc.user_id IN (
    SELECT athlete_id 
    FROM athlete_coach_relationships 
    WHERE status = 'accepted'
)
ORDER BY dc.date DESC
LIMIT 10;

-- 7. Verificar se existem insights para atletas vinculados
SELECT 
    i.id,
    i.user_id,
    i.insight_type,
    i.context_type,
    i.created_at,
    p.full_name as athlete_name,
    p.email as athlete_email
FROM insights i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE i.user_id IN (
    SELECT athlete_id 
    FROM athlete_coach_relationships 
    WHERE status = 'accepted'
)
ORDER BY i.created_at DESC
LIMIT 10;

-- 8. Verificar estrutura da tabela athlete_coach_relationships
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'athlete_coach_relationships'
ORDER BY ordinal_position;

-- 9. Verificar se RLS está habilitado nas tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('training_sessions', 'daily_checkins', 'insights', 'profiles', 'coaches', 'athlete_coach_relationships')
ORDER BY tablename;
