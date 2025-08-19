-- Script para verificar e corrigir todos os perfis duplicados
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAÇÃO INICIAL - Identificar todos os problemas

-- Perfis duplicados
SELECT 
  'PROFILES DUPLICADOS' as tipo,
  email,
  COUNT(*) as total,
  array_agg(full_name) as nomes,
  array_agg(created_at) as datas_criacao
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY total DESC;

-- Coaches duplicados
SELECT 
  'COACHES DUPLICADOS' as tipo,
  email,
  COUNT(*) as total,
  array_agg(full_name) as nomes,
  array_agg(created_at) as datas_criacao
FROM coaches 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY total DESC;

-- Usuários com ambos os perfis (problema)
SELECT 
  'USUÁRIOS COM AMBOS PERFIS' as tipo,
  p.email,
  p.full_name as perfil_nome,
  c.full_name as coach_nome,
  p.created_at as perfil_criado,
  c.created_at as coach_criado
FROM profiles p
JOIN coaches c ON p.email = c.email
ORDER BY p.email;

-- 2. CORREÇÃO - Limpar duplicatas

-- Limpar perfis duplicados (manter apenas o mais recente)
WITH duplicate_profiles AS (
  SELECT 
    email,
    id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM profiles
  WHERE email IN (
    SELECT email 
    FROM profiles 
    GROUP BY email 
    HAVING COUNT(*) > 1
  )
)
DELETE FROM profiles 
WHERE id IN (
  SELECT id 
  FROM duplicate_profiles 
  WHERE rn > 1
);

-- Limpar coaches duplicados (manter apenas o mais recente)
WITH duplicate_coaches AS (
  SELECT 
    email,
    user_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM coaches
  WHERE email IN (
    SELECT email 
    FROM coaches 
    GROUP BY email 
    HAVING COUNT(*) > 1
  )
)
DELETE FROM coaches 
WHERE user_id IN (
  SELECT user_id 
  FROM duplicate_coaches 
  WHERE rn > 1
);

-- 3. CORREÇÃO ESPECÍFICA - Remover perfis de atleta para treinadores

-- Se um usuário é treinador, não deve ter perfil de atleta
DELETE FROM profiles 
WHERE id IN (
  SELECT p.id
  FROM coaches c
  JOIN profiles p ON c.user_id = p.id
  WHERE c.user_id = p.id
);

-- 4. VERIFICAÇÃO FINAL

-- Verificar se ainda há duplicatas
SELECT 
  'VERIFICAÇÃO FINAL - PROFILES' as tipo,
  email,
  COUNT(*) as total
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY total DESC;

SELECT 
  'VERIFICAÇÃO FINAL - COACHES' as tipo,
  email,
  COUNT(*) as total
FROM coaches 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY total DESC;

-- Verificar se ainda há usuários com ambos os perfis
SELECT 
  'VERIFICAÇÃO FINAL - AMBOS PERFIS' as tipo,
  p.email,
  p.full_name as perfil_nome,
  c.full_name as coach_nome
FROM profiles p
JOIN coaches c ON p.email = c.email
ORDER BY p.email;

-- 5. RESUMO FINAL
SELECT 
  'RESUMO FINAL' as tipo,
  'profiles' as tabela,
  COUNT(*) as total_registros
FROM profiles
UNION ALL
SELECT 
  'RESUMO FINAL' as tipo,
  'coaches' as tabela,
  COUNT(*) as total_registros
FROM coaches
ORDER BY tabela;
