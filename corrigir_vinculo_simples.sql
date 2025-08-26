-- Script simples para corrigir vínculo atleta-treinador
-- Execute este script no Supabase SQL Editor

-- ========================================
-- PASSO 1: INSERIR TREINADOR
-- ========================================

-- Inserir o Luiz Bastos na tabela coaches
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
-- PASSO 2: VERIFICAR SE FOI INSERIDO
-- ========================================

SELECT 
  'Treinador' as tipo,
  id,
  user_id,
  full_name,
  email,
  is_active
FROM coaches 
WHERE user_id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d';

-- ========================================
-- PASSO 3: VERIFICAR POLÍTICAS RLS
-- ========================================

-- Verificar políticas da tabela athlete_coach_relationships
SELECT 
  'athlete_coach_relationships' as tabela,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'athlete_coach_relationships'
ORDER BY policyname;

-- Verificar políticas da tabela coaches
SELECT 
  'coaches' as tabela,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'coaches'
ORDER BY policyname;

-- ========================================
-- PASSO 4: CRIAR POLÍTICAS BÁSICAS SE NECESSÁRIO
-- ========================================

-- Política básica para coaches (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'coaches' 
    AND policyname = 'Anyone can view active coaches'
  ) THEN
    CREATE POLICY "Anyone can view active coaches" ON coaches
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- Política básica para athlete_coach_relationships (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'athlete_coach_relationships' 
    AND policyname = 'Athletes can manage own relationships'
  ) THEN
    CREATE POLICY "Athletes can manage own relationships" ON athlete_coach_relationships
      FOR ALL USING (auth.uid() = athlete_id);
  END IF;
END $$;

-- ========================================
-- PASSO 5: VERIFICAR RESULTADO FINAL
-- ========================================

-- Verificar se tudo está funcionando
SELECT 
  'Status final' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM coaches WHERE user_id = 'feb0227b-7a07-42a1-a9fd-0f203b6e297d') 
    THEN '✅ Treinador cadastrado'
    ELSE '❌ Treinador não encontrado'
  END as treinador_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coaches') 
    THEN '✅ Políticas coaches configuradas'
    ELSE '❌ Políticas coaches não encontradas'
  END as coaches_policies,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'athlete_coach_relationships') 
    THEN '✅ Políticas relacionamentos configuradas'
    ELSE '❌ Políticas relacionamentos não encontradas'
  END as relationships_policies;
