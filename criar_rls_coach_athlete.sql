-- Script para criar/atualizar políticas RLS para acesso de treinadores aos dados dos atletas
-- Execute este script no SQL Editor do Supabase

-- 1. Política para training_sessions - permitir que treinadores vejam dados dos atletas vinculados
DROP POLICY IF EXISTS "Coaches can view their athletes' training sessions" ON training_sessions;

CREATE POLICY "Coaches can view their athletes' training sessions" ON training_sessions
FOR SELECT USING (
  -- Usuário pode ver seus próprios dados
  auth.uid() = user_id
  OR
  -- Treinador pode ver dados dos atletas vinculados
  EXISTS (
    SELECT 1 FROM athlete_coach_relationships acr
    WHERE acr.coach_id = auth.uid()
    AND acr.athlete_id = training_sessions.user_id
    AND acr.status = 'accepted'
  )
);

-- 2. Política para daily_checkins - permitir que treinadores vejam check-ins dos atletas vinculados
DROP POLICY IF EXISTS "Coaches can view their athletes' daily checkins" ON daily_checkins;

CREATE POLICY "Coaches can view their athletes' daily checkins" ON daily_checkins
FOR SELECT USING (
  -- Usuário pode ver seus próprios dados
  auth.uid() = user_id
  OR
  -- Treinador pode ver dados dos atletas vinculados
  EXISTS (
    SELECT 1 FROM athlete_coach_relationships acr
    WHERE acr.coach_id = auth.uid()
    AND acr.athlete_id = daily_checkins.user_id
    AND acr.status = 'accepted'
  )
);

-- 3. Política para insights - permitir que treinadores vejam insights dos atletas vinculados
DROP POLICY IF EXISTS "Coaches can view their athletes' insights" ON insights;

CREATE POLICY "Coaches can view their athletes' insights" ON insights
FOR SELECT USING (
  -- Usuário pode ver seus próprios dados
  auth.uid() = user_id
  OR
  -- Treinador pode ver dados dos atletas vinculados
  EXISTS (
    SELECT 1 FROM athlete_coach_relationships acr
    WHERE acr.coach_id = auth.uid()
    AND acr.athlete_id = insights.user_id
    AND acr.status = 'accepted'
  )
);

-- 4. Política para profiles - permitir que treinadores vejam perfis dos atletas vinculados
DROP POLICY IF EXISTS "Coaches can view their athletes' profiles" ON profiles;

CREATE POLICY "Coaches can view their athletes' profiles" ON profiles
FOR SELECT USING (
  -- Usuário pode ver seu próprio perfil
  auth.uid() = id
  OR
  -- Treinador pode ver perfis dos atletas vinculados
  EXISTS (
    SELECT 1 FROM athlete_coach_relationships acr
    WHERE acr.coach_id = auth.uid()
    AND acr.athlete_id = profiles.id
    AND acr.status = 'accepted'
  )
);

-- 5. Política para fitness_tests - permitir que treinadores vejam testes dos atletas vinculados
DROP POLICY IF EXISTS "Coaches can view their athletes' fitness tests" ON fitness_tests;

CREATE POLICY "Coaches can view their athletes' fitness tests" ON fitness_tests
FOR SELECT USING (
  -- Usuário pode ver seus próprios dados
  auth.uid() = user_id
  OR
  -- Treinador pode ver dados dos atletas vinculados
  EXISTS (
    SELECT 1 FROM athlete_coach_relationships acr
    WHERE acr.coach_id = auth.uid()
    AND acr.athlete_id = fitness_tests.user_id
    AND acr.status = 'accepted'
  )
);

-- 6. Política para races - permitir que treinadores vejam provas dos atletas vinculados
DROP POLICY IF EXISTS "Coaches can view their athletes' races" ON races;

CREATE POLICY "Coaches can view their athletes' races" ON races
FOR SELECT USING (
  -- Usuário pode ver suas próprias provas
  auth.uid() = user_id
  OR
  -- Treinador pode ver provas dos atletas vinculados
  EXISTS (
    SELECT 1 FROM athlete_coach_relationships acr
    WHERE acr.coach_id = auth.uid()
    AND acr.athlete_id = races.user_id
    AND acr.status = 'accepted'
  )
);

-- 7. Política para macrociclos - permitir que treinadores vejam ciclos dos atletas vinculados
DROP POLICY IF EXISTS "Coaches can view their athletes' macrociclos" ON macrociclos;

CREATE POLICY "Coaches can view their athletes' macrociclos" ON macrociclos
FOR SELECT USING (
  -- Usuário pode ver seus próprios ciclos
  auth.uid() = user_id
  OR
  -- Treinador pode ver ciclos dos atletas vinculados
  EXISTS (
    SELECT 1 FROM athlete_coach_relationships acr
    WHERE acr.coach_id = auth.uid()
    AND acr.athlete_id = macrociclos.user_id
    AND acr.status = 'accepted'
  )
);

-- 8. Política para mesociclos - permitir que treinadores vejam ciclos dos atletas vinculados
DROP POLICY IF EXISTS "Coaches can view their athletes' mesociclos" ON mesociclos;

CREATE POLICY "Coaches can view their athletes' mesociclos" ON mesociclos
FOR SELECT USING (
  -- Usuário pode ver seus próprios ciclos
  auth.uid() = user_id
  OR
  -- Treinador pode ver ciclos dos atletas vinculados
  EXISTS (
    SELECT 1 FROM athlete_coach_relationships acr
    WHERE acr.coach_id = auth.uid()
    AND acr.athlete_id = mesociclos.user_id
    AND acr.status = 'accepted'
  )
);

-- 9. Política para microciclos - permitir que treinadores vejam ciclos dos atletas vinculados
DROP POLICY IF EXISTS "Coaches can view their athletes' microciclos" ON microciclos;

CREATE POLICY "Coaches can view their athletes' microciclos" ON microciclos
FOR SELECT USING (
  -- Usuário pode ver seus próprios ciclos
  auth.uid() = user_id
  OR
  -- Treinador pode ver ciclos dos atletas vinculados
  EXISTS (
    SELECT 1 FROM athlete_coach_relationships acr
    WHERE acr.coach_id = auth.uid()
    AND acr.athlete_id = microciclos.user_id
    AND acr.status = 'accepted'
  )
);

-- 10. Verificar se as políticas foram criadas corretamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('training_sessions', 'daily_checkins', 'insights', 'profiles', 'fitness_tests', 'races', 'macrociclos', 'mesociclos', 'microciclos')
AND policyname LIKE '%Coaches can view%'
ORDER BY tablename, policyname;
