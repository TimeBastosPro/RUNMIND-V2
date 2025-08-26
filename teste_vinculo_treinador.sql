-- Script de teste para vínculo entre atleta e treinador
-- Execute este script no Supabase SQL Editor

-- ========================================
-- PASSO 1: VERIFICAR DADOS ATUAIS
-- ========================================

-- Verificar se os usuários existem
SELECT 
  'Aline Cabral (Atleta)' as usuario,
  id,
  full_name,
  email,
  user_type
FROM profiles 
WHERE id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
UNION ALL
SELECT 
  'Luiz Bastos (Treinador)' as usuario,
  id,
  full_name,
  email,
  user_type
FROM profiles 
WHERE id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d';

-- ========================================
-- PASSO 2: VERIFICAR SE O TREINADOR ESTÁ NA TABELA COACHES
-- ========================================

-- Verificar se o Luiz Bastos está na tabela coaches
SELECT 
  id,
  user_id,
  full_name,
  email,
  is_active,
  created_at
FROM coaches 
WHERE user_id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d';

-- ========================================
-- PASSO 3: VERIFICAR RELACIONAMENTOS EXISTENTES
-- ========================================

-- Verificar relacionamentos existentes entre Aline e Luiz
SELECT 
  id,
  athlete_id,
  coach_id,
  status,
  modality,
  created_at,
  updated_at
FROM athlete_coach_relationships 
WHERE athlete_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
  AND coach_id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d'
ORDER BY created_at DESC;

-- ========================================
-- PASSO 4: INSERIR TREINADOR SE NÃO EXISTIR
-- ========================================

-- Inserir o Luiz Bastos na tabela coaches se não existir
INSERT INTO coaches (
  user_id,
  full_name,
  email,
  is_active,
  experience_years,
  specialties,
  bio
) 
SELECT 
  'feb0227b-7a07-42a1-a9fd-0f203b6e297d',
  'Luiz Bastos',
  'timebastos@gmail.com',
  true,
  5,
  ARRAY['Corrida de Rua', 'Trail Running'],
  'Treinador experiente em corrida de rua e trail running'
WHERE NOT EXISTS (
  SELECT 1 FROM coaches WHERE user_id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d'
);

-- ========================================
-- PASSO 5: CRIAR RELACIONAMENTO DE TESTE
-- ========================================

-- Criar relacionamento de teste (comentado para segurança)
/*
INSERT INTO athlete_coach_relationships (
  athlete_id,
  coach_id,
  status,
  modality,
  notes
) VALUES (
  '3b091ca5-1967-4152-93bc-424e34ad52ad', -- Aline Cabral
  'feb0227b-7a07-42a1-a9fd-0f203b6e297d', -- Luiz Bastos
  'pending',
  'Corrida de Rua',
  'Solicitação de vínculo de teste'
);
*/

-- ========================================
-- PASSO 6: VERIFICAR APÓS INSERÇÃO
-- ========================================

-- Verificar se o treinador foi inserido
SELECT 
  'Treinador inserido' as status,
  id,
  user_id,
  full_name,
  email,
  is_active
FROM coaches 
WHERE user_id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d';

-- Verificar relacionamentos após inserção
SELECT 
  'Relacionamentos após inserção' as status,
  id,
  athlete_id,
  coach_id,
  status,
  modality,
  created_at
FROM athlete_coach_relationships 
WHERE athlete_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
  AND coach_id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d'
ORDER BY created_at DESC;

-- ========================================
-- PASSO 7: VERIFICAR POLÍTICAS RLS
-- ========================================

-- Verificar políticas RLS para coaches
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'coaches';

-- Verificar políticas RLS para athlete_coach_relationships
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'athlete_coach_relationships';
