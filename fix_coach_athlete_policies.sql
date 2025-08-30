-- SCRIPT PARA IMPLEMENTAR POLÍTICAS DE RELACIONAMENTO TREINADOR-ATLETA
-- ⚠️ ATENÇÃO: Este script adiciona políticas de treinador-atleta às tabelas existentes

-- 1. PRIMEIRO, VAMOS VERIFICAR A ESTRUTURA DA TABELA athlete_coach_relationships
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'athlete_coach_relationships' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR SE A TABELA athlete_coach_relationships É REALMENTE UMA TABELA
SELECT 
    schemaname,
    tablename,
    'TABLE' as object_type
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'athlete_coach_relationships';

-- 3. HABILITAR RLS NA TABELA athlete_coach_relationships (se for uma tabela)
ALTER TABLE athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS PARA athlete_coach_relationships
-- Atletas podem ver seus próprios relacionamentos
CREATE POLICY "Athletes can view own relationships" ON athlete_coach_relationships
    FOR SELECT USING (auth.uid() = athlete_id);

-- Treinadores podem ver relacionamentos onde são o treinador
CREATE POLICY "Coaches can view own relationships" ON athlete_coach_relationships
    FOR SELECT USING (auth.uid() = coach_id);

-- Atletas podem criar relacionamentos (solicitar vínculo)
CREATE POLICY "Athletes can create relationships" ON athlete_coach_relationships
    FOR INSERT WITH CHECK (auth.uid() = athlete_id);

-- Treinadores podem atualizar relacionamentos (aprovar/rejeitar)
CREATE POLICY "Coaches can update relationships" ON athlete_coach_relationships
    FOR UPDATE USING (auth.uid() = coach_id);

-- Treinadores podem deletar relacionamentos (remover vínculo)
CREATE POLICY "Coaches can delete relationships" ON athlete_coach_relationships
    FOR DELETE USING (auth.uid() = coach_id);

-- Atletas podem deletar seus próprios relacionamentos (cancelar solicitação)
CREATE POLICY "Athletes can delete own relationships" ON athlete_coach_relationships
    FOR DELETE USING (auth.uid() = athlete_id);

-- 5. ADICIONAR POLÍTICAS DE TREINADOR-ATLETA PARA TRAINING_SESSIONS
-- Treinadores podem ver sessões de seus atletas
CREATE POLICY "Coaches can view athlete training sessions" ON training_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = training_sessions.user_id
            AND status = 'approved'
        )
    );

-- Treinadores podem editar sessões de seus atletas
CREATE POLICY "Coaches can update athlete training sessions" ON training_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = training_sessions.user_id
            AND status = 'approved'
        )
    );

-- 6. ADICIONAR POLÍTICAS DE TREINADOR-ATLETA PARA DAILY_CHECKINS
-- Treinadores podem ver check-ins de seus atletas
CREATE POLICY "Coaches can view athlete checkins" ON daily_checkins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = daily_checkins.user_id
            AND status = 'approved'
        )
    );

-- 7. ADICIONAR POLÍTICAS DE TREINADOR-ATLETA PARA RACES
-- Treinadores podem ver provas de seus atletas
CREATE POLICY "Coaches can view athlete races" ON races
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = races.user_id
            AND status = 'approved'
        )
    );

-- Treinadores podem editar provas de seus atletas
CREATE POLICY "Coaches can update athlete races" ON races
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = races.user_id
            AND status = 'approved'
        )
    );

-- 8. ADICIONAR POLÍTICAS DE TREINADOR-ATLETA PARA FITNESS_TESTS
-- Treinadores podem ver testes de seus atletas
CREATE POLICY "Coaches can view athlete fitness tests" ON fitness_tests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = fitness_tests.user_id
            AND status = 'approved'
        )
    );

-- Treinadores podem editar testes de seus atletas
CREATE POLICY "Coaches can update athlete fitness tests" ON fitness_tests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = fitness_tests.user_id
            AND status = 'approved'
        )
    );

-- 9. ADICIONAR POLÍTICAS DE TREINADOR-ATLETA PARA ANAMNESIS
-- Treinadores podem ver anamnese de seus atletas
CREATE POLICY "Coaches can view athlete anamnesis" ON anamnesis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = anamnesis.user_id
            AND status = 'approved'
        )
    );

-- 10. ADICIONAR POLÍTICAS DE TREINADOR-ATLETA PARA PARQ_RESPONSES
-- Treinadores podem ver PARQ de seus atletas
CREATE POLICY "Coaches can view athlete parq responses" ON parq_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = parq_responses.user_id
            AND status = 'approved'
        )
    );

-- 11. ADICIONAR POLÍTICAS DE TREINADOR-ATLETA PARA TRAINING_PREFERENCES
-- Treinadores podem ver preferências de seus atletas
CREATE POLICY "Coaches can view athlete training preferences" ON training_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = training_preferences.user_id
            AND status = 'approved'
        )
    );

-- Treinadores podem editar preferências de seus atletas
CREATE POLICY "Coaches can update athlete training preferences" ON training_preferences
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = training_preferences.user_id
            AND status = 'approved'
        )
    );

-- 12. ADICIONAR POLÍTICAS DE TREINADOR-ATLETA PARA INSIGHTS
-- Treinadores podem ver insights de seus atletas
CREATE POLICY "Coaches can view athlete insights" ON insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = insights.user_id
            AND status = 'approved'
        )
    );

-- 13. ADICIONAR POLÍTICAS DE TREINADOR-ATLETA PARA CICLOS
-- Macrociclos
CREATE POLICY "Coaches can view athlete macrociclos" ON macrociclos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = macrociclos.user_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Coaches can update athlete macrociclos" ON macrociclos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = macrociclos.user_id
            AND status = 'approved'
        )
    );

-- Mesociclos
CREATE POLICY "Coaches can view athlete mesociclos" ON mesociclos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = mesociclos.user_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Coaches can update athlete mesociclos" ON mesociclos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = mesociclos.user_id
            AND status = 'approved'
        )
    );

-- Microciclos
CREATE POLICY "Coaches can view athlete microciclos" ON microciclos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = microciclos.user_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Coaches can update athlete microciclos" ON microciclos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = microciclos.user_id
            AND status = 'approved'
        )
    );

-- Cycle Training Sessions
CREATE POLICY "Coaches can view athlete cycle training sessions" ON cycle_training_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = cycle_training_sessions.user_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Coaches can update athlete cycle training sessions" ON cycle_training_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = cycle_training_sessions.user_id
            AND status = 'approved'
        )
    );

-- 14. ADICIONAR POLÍTICAS DE TREINADOR-ATLETA PARA WEEKLY_REFLECTIONS
-- Treinadores podem ver reflexões de seus atletas
CREATE POLICY "Coaches can view athlete weekly reflections" ON weekly_reflections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = weekly_reflections.user_id
            AND status = 'approved'
        )
    );

-- 15. ADICIONAR POLÍTICAS DE TREINADOR-ATLETA PARA WEEKLY_SUMMARIES
-- Treinadores podem ver resumos de seus atletas
CREATE POLICY "Coaches can view athlete weekly summaries" ON weekly_summaries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = weekly_summaries.user_id
            AND status = 'approved'
        )
    );

-- 16. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE '%coach%' OR policyname LIKE '%athlete%'
ORDER BY tablename, policyname;
