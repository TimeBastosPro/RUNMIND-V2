-- Script para verificar tipos de usuário e dados PAR-Q
-- Execute este script no Supabase SQL Editor

-- ========================================
-- VERIFICAR TIPOS DE USUÁRIO E DADOS PAR-Q
-- ========================================

-- Verificar todos os perfis com seus tipos e dados PAR-Q
SELECT 
  id,
  full_name,
  email,
  user_type,
  context_type,
  parq_answers,
  created_at,
  updated_at,
  -- Verificar se todos os campos estão presentes
  CASE 
    WHEN parq_answers IS NOT NULL THEN '✅ Tem dados PAR-Q'
    ELSE '❌ Sem dados PAR-Q'
  END as parq_status,
  -- Verificar se faz sentido ter dados PAR-Q
  CASE 
    WHEN user_type = 'coach' AND parq_answers IS NULL THEN '✅ Correto - Treinador sem PAR-Q'
    WHEN user_type = 'coach' AND parq_answers IS NOT NULL THEN '⚠️ Inconsistente - Treinador com PAR-Q'
    WHEN user_type = 'athlete' AND parq_answers IS NOT NULL THEN '✅ Correto - Atleta com PAR-Q'
    WHEN user_type = 'athlete' AND parq_answers IS NULL THEN '⚠️ Inconsistente - Atleta sem PAR-Q'
    ELSE '❓ Tipo de usuário não definido'
  END as consistencia
FROM profiles 
ORDER BY user_type, full_name;

-- ========================================
-- RESUMO POR TIPO DE USUÁRIO
-- ========================================

-- Contar usuários por tipo
SELECT 
  user_type,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN parq_answers IS NOT NULL THEN 1 END) as com_parq,
  COUNT(CASE WHEN parq_answers IS NULL THEN 1 END) as sem_parq
FROM profiles 
GROUP BY user_type
ORDER BY user_type;

-- ========================================
-- VERIFICAR DADOS ESPECÍFICOS
-- ========================================

-- Verificar dados da Aline Cabral (atleta)
SELECT 
  'Aline Cabral (Atleta)' as usuario,
  user_type,
  parq_answers,
  CASE 
    WHEN parq_answers IS NOT NULL THEN '✅ Correto'
    ELSE '❌ Deveria ter dados PAR-Q'
  END as status
FROM profiles 
WHERE id = '3b091ca5-1967-4152-93bc-424e34ad52ad';

-- Verificar dados do Luiz Bastos (treinador)
SELECT 
  'Luiz Bastos (Treinador)' as usuario,
  user_type,
  parq_answers,
  CASE 
    WHEN parq_answers IS NULL THEN '✅ Correto'
    ELSE '❌ Não deveria ter dados PAR-Q'
  END as status
FROM profiles 
WHERE id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d';

-- ========================================
-- VERIFICAR ESTRUTURA DA TABELA
-- ========================================

-- Verificar se a coluna user_type existe
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'user_type';
