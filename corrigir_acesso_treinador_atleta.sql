-- Script para corrigir acesso do treinador aos dados do atleta
-- Execute este script no Supabase SQL Editor

-- =====================================================
-- 1. VERIFICAR RELACIONAMENTO ATUAL
-- =====================================================

-- Verificar se o relacionamento existe e está ativo
SELECT 
  'Relacionamento atual' as info,
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.status,
  acr.requested_at,
  acr.approved_at,
  p.full_name as athlete_name,
  c.full_name as coach_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
WHERE acr.athlete_id = '3b091ca5-1967-4152-93bc-424e34ad52ad' -- ID da Aline
  OR acr.coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid());

-- =====================================================
-- 2. CORRIGIR POLÍTICAS RLS PARA MACROCICLOS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own macrociclos or athlete macrociclos if coach" ON macrociclos;
DROP POLICY IF EXISTS "Users can insert own macrociclos" ON macrociclos;
DROP POLICY IF EXISTS "Users can update own macrociclos" ON macrociclos;
DROP POLICY IF EXISTS "Users can delete own macrociclos" ON macrociclos;

-- Criar políticas corretas para macrociclos
CREATE POLICY "Users can view own macrociclos or athlete macrociclos if coach" ON macrociclos
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships acr
      JOIN coaches c ON acr.coach_id = c.id
      WHERE acr.athlete_id = macrociclos.user_id 
      AND c.user_id = auth.uid()
      AND acr.status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can insert own macrociclos" ON macrociclos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own macrociclos" ON macrociclos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own macrociclos" ON macrociclos
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. CORRIGIR POLÍTICAS RLS PARA MESOCICLOS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own mesociclos or athlete mesociclos if coach" ON mesociclos;
DROP POLICY IF EXISTS "Users can insert own mesociclos" ON mesociclos;
DROP POLICY IF EXISTS "Users can update own mesociclos" ON mesociclos;
DROP POLICY IF EXISTS "Users can delete own mesociclos" ON mesociclos;

-- Criar políticas corretas para mesociclos
CREATE POLICY "Users can view own mesociclos or athlete mesociclos if coach" ON mesociclos
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships acr
      JOIN coaches c ON acr.coach_id = c.id
      WHERE acr.athlete_id = mesociclos.user_id 
      AND c.user_id = auth.uid()
      AND acr.status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can insert own mesociclos" ON mesociclos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mesociclos" ON mesociclos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mesociclos" ON mesociclos
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. CORRIGIR POLÍTICAS RLS PARA MICROCICLOS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own microciclos or athlete microciclos if coach" ON microciclos;
DROP POLICY IF EXISTS "Users can insert own microciclos" ON microciclos;
DROP POLICY IF EXISTS "Users can update own microciclos" ON microciclos;
DROP POLICY IF EXISTS "Users can delete own microciclos" ON microciclos;

-- Criar políticas corretas para microciclos
CREATE POLICY "Users can view own microciclos or athlete microciclos if coach" ON microciclos
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships acr
      JOIN coaches c ON acr.coach_id = c.id
      WHERE acr.athlete_id = microciclos.user_id 
      AND c.user_id = auth.uid()
      AND acr.status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can insert own microciclos" ON microciclos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own microciclos" ON microciclos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own microciclos" ON microciclos
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. CORRIGIR POLÍTICAS RLS PARA INSIGHTS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own insights or athlete insights if coach" ON insights;
DROP POLICY IF EXISTS "Users can insert own insights" ON insights;
DROP POLICY IF EXISTS "Users can update own insights" ON insights;
DROP POLICY IF EXISTS "Users can delete own insights" ON insights;

-- Criar políticas corretas para insights
CREATE POLICY "Users can view own insights or athlete insights if coach" ON insights
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships acr
      JOIN coaches c ON acr.coach_id = c.id
      WHERE acr.athlete_id = insights.user_id 
      AND c.user_id = auth.uid()
      AND acr.status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can insert own insights" ON insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights" ON insights
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. CORRIGIR POLÍTICAS RLS PARA PROFILES
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own profile or athlete profile if coach" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Criar políticas corretas para profiles
CREATE POLICY "Users can view own profile or athlete profile if coach" ON profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships acr
      JOIN coaches c ON acr.coach_id = c.id
      WHERE acr.athlete_id = profiles.id 
      AND c.user_id = auth.uid()
      AND acr.status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- 7. CORRIGIR POLÍTICAS RLS PARA FITNESS_TESTS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own fitness tests or athlete tests if coach" ON fitness_tests;
DROP POLICY IF EXISTS "Users can insert own fitness tests" ON fitness_tests;
DROP POLICY IF EXISTS "Users can update own fitness tests" ON fitness_tests;
DROP POLICY IF EXISTS "Users can delete own fitness tests" ON fitness_tests;

-- Criar políticas corretas para fitness_tests
CREATE POLICY "Users can view own fitness tests or athlete tests if coach" ON fitness_tests
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships acr
      JOIN coaches c ON acr.coach_id = c.id
      WHERE acr.athlete_id = fitness_tests.user_id 
      AND c.user_id = auth.uid()
      AND acr.status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can insert own fitness tests" ON fitness_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness tests" ON fitness_tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fitness tests" ON fitness_tests
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 8. CORRIGIR POLÍTICAS RLS PARA RACES
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own races or athlete races if coach" ON races;
DROP POLICY IF EXISTS "Users can insert own races" ON races;
DROP POLICY IF EXISTS "Users can update own races" ON races;
DROP POLICY IF EXISTS "Users can delete own races" ON races;

-- Criar políticas corretas para races
CREATE POLICY "Users can view own races or athlete races if coach" ON races
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships acr
      JOIN coaches c ON acr.coach_id = c.id
      WHERE acr.athlete_id = races.user_id 
      AND c.user_id = auth.uid()
      AND acr.status IN ('active', 'approved')
    )
  );

CREATE POLICY "Users can insert own races" ON races
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own races" ON races
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own races" ON races
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 9. VERIFICAR RESULTADOS
-- =====================================================

-- Verificar políticas criadas
SELECT 
  'Políticas RLS criadas' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('macrociclos', 'mesociclos', 'microciclos', 'insights', 'profiles', 'fitness_tests', 'races')
ORDER BY tablename, policyname;

-- Verificar se há dados para o atleta
SELECT 
  'Dados do atleta Aline' as info,
  'macrociclos' as tabela,
  COUNT(*) as total
FROM macrociclos 
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'

UNION ALL

SELECT 
  'Dados do atleta Aline' as info,
  'insights' as tabela,
  COUNT(*) as total
FROM insights 
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'

UNION ALL

SELECT 
  'Dados do atleta Aline' as info,
  'fitness_tests' as tabela,
  COUNT(*) as total
FROM fitness_tests 
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'

UNION ALL

SELECT 
  'Dados do atleta Aline' as info,
  'races' as tabela,
  COUNT(*) as total
FROM races 
WHERE user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad';

-- =====================================================
-- 10. TESTAR ACESSO DO TREINADOR
-- =====================================================

-- Testar se o treinador consegue ver os dados do atleta
-- (Execute como o usuário treinador logado)

-- Testar macrociclos
SELECT 
  'Teste macrociclos' as info,
  m.id,
  m.name,
  m.user_id,
  p.full_name as athlete_name
FROM macrociclos m
LEFT JOIN profiles p ON m.user_id = p.id
WHERE m.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY m.created_at DESC;

-- Testar insights
SELECT 
  'Teste insights' as info,
  i.id,
  i.insight_type as type,
  i.user_id,
  p.full_name as athlete_name
FROM insights i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE i.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY i.created_at DESC;

-- Testar fitness_tests
SELECT 
  'Teste fitness_tests' as info,
  ft.id,
  ft.protocol_name as test_type,
  ft.user_id,
  p.full_name as athlete_name
FROM fitness_tests ft
LEFT JOIN profiles p ON ft.user_id = p.id
WHERE ft.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY ft.created_at DESC;

-- Testar races
SELECT 
  'Teste races' as info,
  r.id,
  r.event_name as name,
  r.user_id,
  p.full_name as athlete_name
FROM races r
LEFT JOIN profiles p ON r.user_id = p.id
WHERE r.user_id = '3b091ca5-1967-4152-93bc-424e34ad52ad'
ORDER BY r.created_at DESC;
