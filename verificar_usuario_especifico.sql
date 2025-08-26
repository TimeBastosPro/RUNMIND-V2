-- Script para verificar dados específicos do usuário Luiz Bastos
-- Execute este script no Supabase SQL Editor

-- ========================================
-- VERIFICAR DADOS DO USUÁRIO LUIZ BASTOS
-- ========================================

-- Verificar dados completos do perfil
SELECT 
  id,
  full_name,
  email,
  parq_answers,
  created_at,
  updated_at,
  -- Verificar se todos os campos estão presentes
  CASE 
    WHEN parq_answers IS NOT NULL THEN '✅ Tem dados PAR-Q'
    ELSE '❌ Sem dados PAR-Q'
  END as parq_status,
  -- Verificar se todos os campos estão presentes
  CASE 
    WHEN parq_answers->>'q1' IS NOT NULL THEN '✅ Q1 presente'
    ELSE '❌ Q1 ausente'
  END as q1_status,
  CASE 
    WHEN parq_answers->>'q2' IS NOT NULL THEN '✅ Q2 presente'
    ELSE '❌ Q2 ausente'
  END as q2_status,
  CASE 
    WHEN parq_answers->>'q3' IS NOT NULL THEN '✅ Q3 presente'
    ELSE '❌ Q3 ausente'
  END as q3_status,
  CASE 
    WHEN parq_answers->>'q4' IS NOT NULL THEN '✅ Q4 presente'
    ELSE '❌ Q4 ausente'
  END as q4_status,
  CASE 
    WHEN parq_answers->>'q5' IS NOT NULL THEN '✅ Q5 presente'
    ELSE '❌ Q5 ausente'
  END as q5_status,
  CASE 
    WHEN parq_answers->>'q6' IS NOT NULL THEN '✅ Q6 presente'
    ELSE '❌ Q6 ausente'
  END as q6_status,
  CASE 
    WHEN parq_answers->>'q7' IS NOT NULL THEN '✅ Q7 presente'
    ELSE '❌ Q7 ausente'
  END as q7_status
FROM profiles 
WHERE id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d'; -- ID do Luiz Bastos

-- ========================================
-- INSERIR DADOS PAR-Q DE TESTE (DESCOMENTAR PARA TESTAR)
-- ========================================

-- Teste: Inserir dados PAR-Q de exemplo para Luiz Bastos
/*
UPDATE profiles 
SET 
  parq_answers = '{
    "q1": false,
    "q2": false,
    "q3": false,
    "q4": false,
    "q5": false,
    "q6": false,
    "q7": false
  }'::jsonb,
  updated_at = NOW()
WHERE id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d';
*/

-- ========================================
-- VERIFICAR APÓS INSERÇÃO
-- ========================================

-- Verificar se os dados foram inseridos corretamente
SELECT 
  id,
  full_name,
  email,
  parq_answers,
  updated_at,
  CASE 
    WHEN parq_answers IS NOT NULL THEN '✅ Tem dados PAR-Q'
    ELSE '❌ Sem dados PAR-Q'
  END as parq_status
FROM profiles 
WHERE id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d';
