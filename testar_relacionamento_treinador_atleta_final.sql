-- Testar relacionamento treinador-atleta e compartilhamento de macrociclos (FINAL)
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se as tabelas existem
SELECT 
    table_name,
    'EXISTE' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'athlete_coach_relationships', 'macrociclos')
ORDER BY table_name;

-- 2. Verificar estrutura da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela athlete_coach_relationships
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'athlete_coach_relationships'
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela macrociclos
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

-- 6. Testar acesso à tabela profiles
SELECT 
    'PROFILES' as tabela,
    COUNT(*) as total_registros
FROM public.profiles;

-- 7. Testar acesso à tabela athlete_coach_relationships
SELECT 
    'RELACIONAMENTOS' as tabela,
    COUNT(*) as total_registros
FROM public.athlete_coach_relationships;

-- 8. Testar acesso à tabela macrociclos
SELECT 
    'MACROCICLOS' as tabela,
    COUNT(*) as total_registros
FROM public.macrociclos;

-- 9. Verificar políticas RLS da tabela macrociclos
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'macrociclos';

-- 10. Verificar status dos relacionamentos
SELECT 
    status,
    COUNT(*) as quantidade
FROM public.athlete_coach_relationships
GROUP BY status
ORDER BY status;

-- 11. Ver detalhes dos relacionamentos
SELECT 
    id,
    coach_id,
    athlete_id,
    status,
    created_at
FROM public.athlete_coach_relationships
ORDER BY created_at DESC;

-- 12. Ver detalhes dos macrociclos (se existirem)
SELECT 
    id,
    user_id,
    name,
    start_date,
    end_date,
    created_at
FROM public.macrociclos
ORDER BY created_at DESC;
