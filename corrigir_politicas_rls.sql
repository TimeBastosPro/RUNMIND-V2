-- Script para corrigir políticas RLS da tabela athlete_coach_relationships
-- Execute este script no Supabase SQL Editor

-- ========================================
-- PASSO 1: VERIFICAR POLÍTICAS ATUAIS
-- ========================================

-- Verificar políticas RLS atuais
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'athlete_coach_relationships'
ORDER BY policyname;

-- ========================================
-- PASSO 2: REMOVER POLÍTICAS PROBLEMÁTICAS
-- ========================================

-- Remover políticas existentes para recriar corretamente
DROP POLICY IF EXISTS "Athletes can manage own relationships" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Coaches can view relationships with them" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Coaches can update relationships with them" ON athlete_coach_relationships;
DROP POLICY IF EXISTS "Coaches can view athlete relationships" ON athlete_coach_relationships;

-- ========================================
-- PASSO 3: CRIAR POLÍTICAS CORRIGIDAS
-- ========================================

-- Política para atletas gerenciarem seus próprios relacionamentos
CREATE POLICY "Athletes can manage own relationships" ON athlete_coach_relationships
  FOR ALL USING (auth.uid() = athlete_id);

-- Política para treinadores visualizarem relacionamentos com eles
CREATE POLICY "Coaches can view relationships with them" ON athlete_coach_relationships
  FOR SELECT USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

-- Política para treinadores atualizarem relacionamentos com eles
CREATE POLICY "Coaches can update relationships with them" ON athlete_coach_relationships
  FOR UPDATE USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

-- Política para treinadores inserirem relacionamentos
CREATE POLICY "Coaches can insert relationships" ON athlete_coach_relationships
  FOR INSERT WITH CHECK (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

-- Política para atletas inserirem relacionamentos
CREATE POLICY "Athletes can insert relationships" ON athlete_coach_relationships
  FOR INSERT WITH CHECK (auth.uid() = athlete_id);

-- ========================================
-- PASSO 4: VERIFICAR POLÍTICAS APÓS CORREÇÃO
-- ========================================

-- Verificar políticas RLS após correção
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'athlete_coach_relationships'
ORDER BY policyname;

-- ========================================
-- PASSO 5: VERIFICAR SE O TREINADOR ESTÁ NA TABELA COACHES
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
-- PASSO 6: INSERIR TREINADOR SE NÃO EXISTIR
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
-- PASSO 7: VERIFICAR POLÍTICAS DA TABELA COACHES
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

-- ========================================
-- PASSO 8: CRIAR POLÍTICAS PARA COACHES SE NECESSÁRIO
-- ========================================

-- Remover políticas existentes para coaches
DROP POLICY IF EXISTS "Coaches can view own data" ON coaches;
DROP POLICY IF EXISTS "Coaches can update own data" ON coaches;
DROP POLICY IF EXISTS "Coaches can insert own data" ON coaches;
DROP POLICY IF EXISTS "Anyone can view active coaches" ON coaches;

-- Política para coaches visualizarem seus próprios dados
CREATE POLICY "Coaches can view own data" ON coaches
  FOR SELECT USING (user_id = auth.uid());

-- Política para coaches atualizarem seus próprios dados
CREATE POLICY "Coaches can update own data" ON coaches
  FOR UPDATE USING (user_id = auth.uid());

-- Política para coaches inserirem seus dados
CREATE POLICY "Coaches can insert own data" ON coaches
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Política para visualizar coaches ativos (para busca)
CREATE POLICY "Anyone can view active coaches" ON coaches
  FOR SELECT USING (is_active = true);

-- ========================================
-- PASSO 9: VERIFICAR RESULTADO FINAL
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

-- Verificar políticas finais
SELECT 
  'Políticas athlete_coach_relationships' as tabela,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'athlete_coach_relationships'
UNION ALL
SELECT 
  'Políticas coaches' as tabela,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'coaches';
