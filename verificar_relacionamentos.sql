-- Script para verificar relacionamentos entre atletas e treinadores
-- Execute este script no Supabase SQL Editor

-- ========================================
-- VERIFICAR ESTRUTURA DA TABELA
-- ========================================

-- Verificar se a tabela existe e sua estrutura
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'athlete_coach_relationships'
ORDER BY ordinal_position;

-- ========================================
-- VERIFICAR DADOS DOS USUÁRIOS
-- ========================================

-- Verificar usuários e seus tipos
SELECT 
  id,
  full_name,
  email,
  user_type,
  created_at
FROM profiles 
ORDER BY user_type, full_name;

-- ========================================
-- VERIFICAR RELACIONAMENTOS EXISTENTES
-- ========================================

-- Verificar todos os relacionamentos
SELECT 
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.team_id,
  acr.status,
  acr.modality,
  acr.notes,
  acr.created_at,
  acr.updated_at,
  -- Dados do atleta
  athlete.full_name as athlete_name,
  athlete.email as athlete_email,
  athlete.user_type as athlete_type,
  -- Dados do treinador
  coach.full_name as coach_name,
  coach.email as coach_email,
  coach.user_type as coach_type
FROM athlete_coach_relationships acr
LEFT JOIN profiles athlete ON acr.athlete_id = athlete.id
LEFT JOIN profiles coach ON acr.coach_id = coach.id
ORDER BY acr.created_at DESC;

-- ========================================
-- VERIFICAR RELACIONAMENTOS POR STATUS
-- ========================================

-- Contar relacionamentos por status
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN modality = 'Corrida de Rua' THEN 1 END) as corrida_rua,
  COUNT(CASE WHEN modality = 'Trail Running' THEN 1 END) as trail_running,
  COUNT(CASE WHEN modality = 'Força' THEN 1 END) as forca,
  COUNT(CASE WHEN modality = 'Flexibilidade' THEN 1 END) as flexibilidade
FROM athlete_coach_relationships
GROUP BY status
ORDER BY status;

-- ========================================
-- VERIFICAR RELACIONAMENTOS ATIVOS
-- ========================================

-- Verificar relacionamentos ativos e aprovados
SELECT 
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  acr.modality,
  athlete.full_name as athlete_name,
  coach.full_name as coach_name,
  acr.created_at
FROM athlete_coach_relationships acr
LEFT JOIN profiles athlete ON acr.athlete_id = athlete.id
LEFT JOIN profiles coach ON acr.coach_id = coach.id
WHERE acr.status IN ('active', 'approved')
ORDER BY acr.created_at DESC;

-- ========================================
-- VERIFICAR RELACIONAMENTOS PENDENTES
-- ========================================

-- Verificar relacionamentos pendentes
SELECT 
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  acr.modality,
  athlete.full_name as athlete_name,
  coach.full_name as coach_name,
  acr.created_at
FROM athlete_coach_relationships acr
LEFT JOIN profiles athlete ON acr.athlete_id = athlete.id
LEFT JOIN profiles coach ON acr.coach_id = coach.id
WHERE acr.status = 'pending'
ORDER BY acr.created_at DESC;

-- ========================================
-- VERIFICAR POLÍTICAS RLS
-- ========================================

-- Verificar políticas RLS para a tabela
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'athlete_coach_relationships';

-- ========================================
-- TESTE DE INSERÇÃO (COMENTADO)
-- ========================================

-- Teste: Inserir relacionamento de exemplo (comentado para segurança)
/*
INSERT INTO athlete_coach_relationships (
  athlete_id,
  coach_id,
  status,
  modality,
  notes
) VALUES (
  '3b091ca5-1967-4152-93bc-424e34ad52ad', -- ID da Aline Cabral (atleta)
  'feb0227b-7a07-42a1-a9fd-0f203b6e297d', -- ID do Luiz Bastos (treinador)
  'pending',
  'Corrida de Rua',
  'Solicitação de vínculo'
);
*/
