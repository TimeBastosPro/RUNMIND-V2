-- Script para verificar a data de nascimento no banco de dados
-- Autor: Assistente
-- Data: 2025-01-27

-- 1. Verificar dados do perfil da atleta Aline
SELECT
    '=== DADOS DO PERFIL DA ALINE ===' as info,
    id,
    email,
    full_name,
    date_of_birth,
    CASE 
        WHEN date_of_birth IS NULL THEN 'NULL'
        WHEN date_of_birth = '' THEN 'VAZIO'
        ELSE 'PREENCHIDO: ' || date_of_birth
    END as status_data_nascimento,
    LENGTH(date_of_birth) as tamanho_string,
    gender,
    height_cm,
    weight_kg,
    max_heart_rate,
    resting_heart_rate,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'aline@gmail.com';

-- 2. Verificar se há outros perfis com data de nascimento para comparação
SELECT
    '=== COMPARAÇÃO COM OUTROS PERFIS ===' as info,
    email,
    full_name,
    date_of_birth,
    CASE 
        WHEN date_of_birth IS NULL THEN 'NULL'
        WHEN date_of_birth = '' THEN 'VAZIO'
        ELSE 'PREENCHIDO: ' || date_of_birth
    END as status_data_nascimento,
    LENGTH(date_of_birth) as tamanho_string
FROM profiles 
WHERE date_of_birth IS NOT NULL 
   OR date_of_birth != ''
ORDER BY updated_at DESC
LIMIT 10;

-- 3. Verificar estrutura da coluna date_of_birth
SELECT
    '=== ESTRUTURA DA COLUNA ===' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'date_of_birth';

-- 4. Testar inserção de uma data de exemplo
SELECT
    '=== TESTE DE FORMATO ===' as info,
    '2025-01-27' as formato_iso,
    '27-01-2025' as formato_dd_mm_yyyy,
    '01/27/2025' as formato_mm_dd_yyyy;
