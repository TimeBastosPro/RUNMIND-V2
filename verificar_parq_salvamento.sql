-- Script para verificar salvamento do questionário PAR-Q+
-- Execute este script no Supabase SQL Editor

-- ========================================
-- PASSO 1: VERIFICAR ESTRUTURA DA TABELA
-- ========================================

-- Verificar se a coluna parq_answers existe na tabela profiles
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'parq_answers';

-- ========================================
-- PASSO 2: VERIFICAR DADOS ATUAIS
-- ========================================

-- Verificar todos os perfis com dados PAR-Q
SELECT 
  id,
  full_name,
  email,
  parq_answers,
  created_at,
  updated_at
FROM profiles 
WHERE parq_answers IS NOT NULL
ORDER BY updated_at DESC;

-- ========================================
-- PASSO 3: VERIFICAR DADOS DO USUÁRIO ESPECÍFICO
-- ========================================

-- Verificar dados do usuário atual (substitua pelo ID correto)
SELECT 
  id,
  full_name,
  email,
  parq_answers,
  created_at,
  updated_at,
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
WHERE id = '3b091ca5-1967-4152-93bc-424e34ad52ad'; -- Substitua pelo ID correto

-- ========================================
-- PASSO 4: TESTAR INSERÇÃO DE DADOS PAR-Q
-- ========================================

-- Teste: Inserir dados PAR-Q de exemplo (comentado para segurança)
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
WHERE id = '3b091ca5-1967-4152-93bc-424e34ad52ad';
*/

-- ========================================
-- PASSO 5: VERIFICAR LOGS DE ATUALIZAÇÃO
-- ========================================

-- Verificar se há triggers ou logs de atualização
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- ========================================
-- PASSO 6: VERIFICAR POLÍTICAS RLS
-- ========================================

-- Verificar políticas RLS para a tabela profiles
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- ========================================
-- PASSO 7: RESUMO DOS PROBLEMAS
-- ========================================

-- Contar perfis com e sem dados PAR-Q
SELECT 
  'Com dados PAR-Q' as status,
  COUNT(*) as total
FROM profiles 
WHERE parq_answers IS NOT NULL
UNION ALL
SELECT 
  'Sem dados PAR-Q' as status,
  COUNT(*) as total
FROM profiles 
WHERE parq_answers IS NULL;

-- Verificar perfis atualizados recentemente
SELECT 
  id,
  full_name,
  email,
  updated_at,
  CASE 
    WHEN parq_answers IS NOT NULL THEN '✅ Tem dados PAR-Q'
    ELSE '❌ Sem dados PAR-Q'
  END as parq_status
FROM profiles 
ORDER BY updated_at DESC
LIMIT 10;
