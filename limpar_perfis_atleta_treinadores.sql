-- Script para limpar perfis de atleta criados incorretamente para treinadores
-- Este script remove registros da tabela 'profiles' para usuários que são treinadores

-- 1. Verificar treinadores que possuem perfil de atleta
SELECT 
    c.id as coach_id,
    c.user_id,
    c.full_name as coach_name,
    c.email as coach_email,
    p.id as profile_id,
    p.full_name as profile_name,
    p.user_type as profile_user_type
FROM coaches c
LEFT JOIN profiles p ON c.user_id = p.id
WHERE p.id IS NOT NULL;

-- 2. Contar quantos treinadores têm perfil de atleta
SELECT 
    COUNT(*) as treinadores_com_perfil_atleta
FROM coaches c
INNER JOIN profiles p ON c.user_id = p.id;

-- 3. Remover perfis de atleta para treinadores
-- ⚠️ ATENÇÃO: Execute apenas se estiver certo de que quer remover estes registros
DELETE FROM profiles 
WHERE id IN (
    SELECT c.user_id 
    FROM coaches c 
    WHERE c.user_id = profiles.id
);

-- 4. Verificar se a limpeza foi bem-sucedida
SELECT 
    COUNT(*) as treinadores_sem_perfil_atleta
FROM coaches c
LEFT JOIN profiles p ON c.user_id = p.id
WHERE p.id IS NULL;

-- 5. Verificar se ainda existem treinadores com perfil de atleta
SELECT 
    COUNT(*) as treinadores_com_perfil_atleta_restantes
FROM coaches c
INNER JOIN profiles p ON c.user_id = p.id;
