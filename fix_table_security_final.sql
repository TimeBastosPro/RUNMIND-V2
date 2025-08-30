-- SCRIPT FINAL PARA CORRIGIR SEGURANÇA DAS TABELAS
-- ⚠️ ATENÇÃO: Este script trata apenas TABELAS, não VIEWS

-- 1. REMOVER POLÍTICAS EXISTENTES (se existirem)
-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Coaches
DROP POLICY IF EXISTS "Coaches can view own data" ON coaches;
DROP POLICY IF EXISTS "Coaches can update own data" ON coaches;
DROP POLICY IF EXISTS "Coaches can insert own data" ON coaches;

-- Training Sessions
DROP POLICY IF EXISTS "Users can view own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Users can insert own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Users can update own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Users can delete own training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can view athlete training sessions" ON training_sessions;
DROP POLICY IF EXISTS "Coaches can update athlete training sessions" ON training_sessions;

-- Daily Checkins
DROP POLICY IF EXISTS "Users can view own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Coaches can view athlete checkins" ON daily_checkins;

-- Races
DROP POLICY IF EXISTS "Users can view own races" ON races;
DROP POLICY IF EXISTS "Users can insert own races" ON races;
DROP POLICY IF EXISTS "Users can update own races" ON races;
DROP POLICY IF EXISTS "Users can delete own races" ON races;
DROP POLICY IF EXISTS "Coaches can view athlete races" ON races;
DROP POLICY IF EXISTS "Coaches can update athlete races" ON races;

-- Fitness Tests
DROP POLICY IF EXISTS "Users can view own fitness tests" ON fitness_tests;
DROP POLICY IF EXISTS "Users can insert own fitness tests" ON fitness_tests;
DROP POLICY IF EXISTS "Users can update own fitness tests" ON fitness_tests;
DROP POLICY IF EXISTS "Users can delete own fitness tests" ON fitness_tests;
DROP POLICY IF EXISTS "Coaches can view athlete fitness tests" ON fitness_tests;
DROP POLICY IF EXISTS "Coaches can update athlete fitness tests" ON fitness_tests;

-- Anamnesis
DROP POLICY IF EXISTS "Users can view own anamnesis" ON anamnesis;
DROP POLICY IF EXISTS "Users can insert own anamnesis" ON anamnesis;
DROP POLICY IF EXISTS "Users can update own anamnesis" ON anamnesis;
DROP POLICY IF EXISTS "Coaches can view athlete anamnesis" ON anamnesis;

-- PARQ Responses
DROP POLICY IF EXISTS "Users can view own parq responses" ON parq_responses;
DROP POLICY IF EXISTS "Users can insert own parq responses" ON parq_responses;
DROP POLICY IF EXISTS "Users can update own parq responses" ON parq_responses;
DROP POLICY IF EXISTS "Coaches can view athlete parq responses" ON parq_responses;

-- Training Preferences
DROP POLICY IF EXISTS "Users can view own training preferences" ON training_preferences;
DROP POLICY IF EXISTS "Users can insert own training preferences" ON training_preferences;
DROP POLICY IF EXISTS "Users can update own training preferences" ON training_preferences;
DROP POLICY IF EXISTS "Coaches can view athlete training preferences" ON training_preferences;
DROP POLICY IF EXISTS "Coaches can update athlete training preferences" ON training_preferences;

-- Insights
DROP POLICY IF EXISTS "Users can view own insights" ON insights;
DROP POLICY IF EXISTS "Users can insert own insights" ON insights;
DROP POLICY IF EXISTS "Coaches can view athlete insights" ON insights;

-- Macrociclos
DROP POLICY IF EXISTS "Users can view own macrociclos" ON macrociclos;
DROP POLICY IF EXISTS "Users can insert own macrociclos" ON macrociclos;
DROP POLICY IF EXISTS "Users can update own macrociclos" ON macrociclos;
DROP POLICY IF EXISTS "Users can delete own macrociclos" ON macrociclos;
DROP POLICY IF EXISTS "Coaches can view athlete macrociclos" ON macrociclos;
DROP POLICY IF EXISTS "Coaches can update athlete macrociclos" ON macrociclos;

-- Mesociclos
DROP POLICY IF EXISTS "Users can view own mesociclos" ON mesociclos;
DROP POLICY IF EXISTS "Users can insert own mesociclos" ON mesociclos;
DROP POLICY IF EXISTS "Users can update own mesociclos" ON mesociclos;
DROP POLICY IF EXISTS "Users can delete own mesociclos" ON mesociclos;
DROP POLICY IF EXISTS "Coaches can view athlete mesociclos" ON mesociclos;
DROP POLICY IF EXISTS "Coaches can update athlete mesociclos" ON mesociclos;

-- Microciclos
DROP POLICY IF EXISTS "Users can view own microciclos" ON microciclos;
DROP POLICY IF EXISTS "Users can insert own microciclos" ON microciclos;
DROP POLICY IF EXISTS "Users can update own microciclos" ON microciclos;
DROP POLICY IF EXISTS "Users can delete own microciclos" ON microciclos;
DROP POLICY IF EXISTS "Coaches can view athlete microciclos" ON microciclos;
DROP POLICY IF EXISTS "Coaches can update athlete microciclos" ON microciclos;

-- Cycle Training Sessions
DROP POLICY IF EXISTS "Users can view own cycle training sessions" ON cycle_training_sessions;
DROP POLICY IF EXISTS "Users can insert own cycle training sessions" ON cycle_training_sessions;
DROP POLICY IF EXISTS "Users can update own cycle training sessions" ON cycle_training_sessions;
DROP POLICY IF EXISTS "Users can delete own cycle training sessions" ON cycle_training_sessions;
DROP POLICY IF EXISTS "Coaches can view athlete cycle training sessions" ON cycle_training_sessions;
DROP POLICY IF EXISTS "Coaches can update athlete cycle training sessions" ON cycle_training_sessions;

-- Weekly Reflections
DROP POLICY IF EXISTS "Users can view own weekly reflections" ON weekly_reflections;
DROP POLICY IF EXISTS "Users can insert own weekly reflections" ON weekly_reflections;
DROP POLICY IF EXISTS "Users can update own weekly reflections" ON weekly_reflections;
DROP POLICY IF EXISTS "Coaches can view athlete weekly reflections" ON weekly_reflections;

-- Weekly Summaries
DROP POLICY IF EXISTS "Users can view own weekly summaries" ON weekly_summaries;
DROP POLICY IF EXISTS "Users can insert own weekly summaries" ON weekly_summaries;
DROP POLICY IF EXISTS "Coaches can view athlete weekly summaries" ON weekly_summaries;

-- Pending Athlete Coach Relationships (TABELA)
DROP POLICY IF EXISTS "Coaches can view pending requests" ON pending_athlete_coach_relationships;
DROP POLICY IF EXISTS "Athletes can view their pending requests" ON pending_athlete_coach_relationships;
DROP POLICY IF EXISTS "Coaches can update pending requests" ON pending_athlete_coach_relationships;
DROP POLICY IF EXISTS "Coaches can delete pending requests" ON pending_athlete_coach_relationships;
DROP POLICY IF EXISTS "Athletes can delete own pending requests" ON pending_athlete_coach_relationships;
DROP POLICY IF EXISTS "Athletes can create pending requests" ON pending_athlete_coach_relationships;

-- Training Adherence Analysis (VIEW - não precisa de RLS)
DROP POLICY IF EXISTS "Users can view own adherence analysis" ON training_adherence_analysis;
DROP POLICY IF EXISTS "Coaches can view athlete adherence analysis" ON training_adherence_analysis;

-- 2. HABILITAR ROW LEVEL SECURITY (RLS) APENAS NAS TABELAS REAIS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE parq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE macrociclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesociclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE microciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- NOTA: active_athlete_coach_relationships é uma VIEW, não uma tabela
-- NOTA: training_adherence_analysis é uma VIEW, não uma tabela

-- 3. CRIAR POLÍTICAS PARA PROFILES (Usuários só veem seus próprios dados)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. CRIAR POLÍTICAS PARA COACHES (Treinadores só veem seus próprios dados)
CREATE POLICY "Coaches can view own data" ON coaches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coaches can update own data" ON coaches
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Coaches can insert own data" ON coaches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. CRIAR POLÍTICAS PARA TRAINING_SESSIONS (Usuários + Treinadores vinculados)
CREATE POLICY "Users can view own training sessions" ON training_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training sessions" ON training_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training sessions" ON training_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training sessions" ON training_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Treinadores podem ver/editar sessões de seus atletas
-- NOTA: Como active_athlete_coach_relationships é uma VIEW, vamos usar uma abordagem diferente
-- Vamos assumir que existe uma tabela base para relacionamentos ou usar uma lógica alternativa
CREATE POLICY "Coaches can view athlete training sessions" ON training_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = training_sessions.user_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Coaches can update athlete training sessions" ON training_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = training_sessions.user_id
            AND status = 'approved'
        )
    );

-- 6. CRIAR POLÍTICAS PARA DAILY_CHECKINS (Usuários + Treinadores vinculados)
CREATE POLICY "Users can view own checkins" ON daily_checkins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON daily_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON daily_checkins
    FOR UPDATE USING (auth.uid() = user_id);

-- Treinadores podem ver check-ins de seus atletas
CREATE POLICY "Coaches can view athlete checkins" ON daily_checkins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = daily_checkins.user_id
            AND status = 'approved'
        )
    );

-- 7. CRIAR POLÍTICAS PARA RACES (Usuários + Treinadores vinculados)
CREATE POLICY "Users can view own races" ON races
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own races" ON races
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own races" ON races
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own races" ON races
    FOR DELETE USING (auth.uid() = user_id);

-- Treinadores podem ver/editar provas de seus atletas
CREATE POLICY "Coaches can view athlete races" ON races
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = races.user_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Coaches can update athlete races" ON races
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = races.user_id
            AND status = 'approved'
        )
    );

-- 8. CRIAR POLÍTICAS PARA FITNESS_TESTS (Usuários + Treinadores vinculados)
CREATE POLICY "Users can view own fitness tests" ON fitness_tests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fitness tests" ON fitness_tests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness tests" ON fitness_tests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fitness tests" ON fitness_tests
    FOR DELETE USING (auth.uid() = user_id);

-- Treinadores podem ver/editar testes de seus atletas
CREATE POLICY "Coaches can view athlete fitness tests" ON fitness_tests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = fitness_tests.user_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Coaches can update athlete fitness tests" ON fitness_tests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = fitness_tests.user_id
            AND status = 'approved'
        )
    );

-- 9. CRIAR POLÍTICAS PARA ANAMNESIS (Usuários + Treinadores vinculados)
CREATE POLICY "Users can view own anamnesis" ON anamnesis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own anamnesis" ON anamnesis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own anamnesis" ON anamnesis
    FOR UPDATE USING (auth.uid() = user_id);

-- Treinadores podem ver anamnese de seus atletas
CREATE POLICY "Coaches can view athlete anamnesis" ON anamnesis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = anamnesis.user_id
            AND status = 'approved'
        )
    );

-- 10. CRIAR POLÍTICAS PARA PARQ_RESPONSES (Usuários + Treinadores vinculados)
CREATE POLICY "Users can view own parq responses" ON parq_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own parq responses" ON parq_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parq responses" ON parq_responses
    FOR UPDATE USING (auth.uid() = user_id);

-- Treinadores podem ver PARQ de seus atletas
CREATE POLICY "Coaches can view athlete parq responses" ON parq_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = parq_responses.user_id
            AND status = 'approved'
        )
    );

-- 11. CRIAR POLÍTICAS PARA TRAINING_PREFERENCES (Usuários + Treinadores vinculados)
CREATE POLICY "Users can view own training preferences" ON training_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training preferences" ON training_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training preferences" ON training_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Treinadores podem ver/editar preferências de seus atletas
CREATE POLICY "Coaches can view athlete training preferences" ON training_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = training_preferences.user_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Coaches can update athlete training preferences" ON training_preferences
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = training_preferences.user_id
            AND status = 'approved'
        )
    );

-- 12. CRIAR POLÍTICAS PARA INSIGHTS (Usuários + Treinadores vinculados)
CREATE POLICY "Users can view own insights" ON insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Treinadores podem ver insights de seus atletas
CREATE POLICY "Coaches can view athlete insights" ON insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = insights.user_id
            AND status = 'approved'
        )
    );

-- 13. CRIAR POLÍTICAS PARA CICLOS (Usuários + Treinadores vinculados)
-- Macrociclos
CREATE POLICY "Users can view own macrociclos" ON macrociclos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own macrociclos" ON macrociclos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own macrociclos" ON macrociclos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own macrociclos" ON macrociclos
    FOR DELETE USING (auth.uid() = user_id);

-- Treinadores podem ver/editar macrociclos de seus atletas
CREATE POLICY "Coaches can view athlete macrociclos" ON macrociclos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = macrociclos.user_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Coaches can update athlete macrociclos" ON macrociclos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = macrociclos.user_id
            AND status = 'approved'
        )
    );

-- Mesociclos
CREATE POLICY "Users can view own mesociclos" ON mesociclos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mesociclos" ON mesociclos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mesociclos" ON mesociclos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mesociclos" ON mesociclos
    FOR DELETE USING (auth.uid() = user_id);

-- Treinadores podem ver/editar mesociclos de seus atletas
CREATE POLICY "Coaches can view athlete mesociclos" ON mesociclos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = mesociclos.user_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Coaches can update athlete mesociclos" ON mesociclos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = mesociclos.user_id
            AND status = 'approved'
        )
    );

-- Microciclos
CREATE POLICY "Users can view own microciclos" ON microciclos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own microciclos" ON microciclos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own microciclos" ON microciclos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own microciclos" ON microciclos
    FOR DELETE USING (auth.uid() = user_id);

-- Treinadores podem ver/editar microciclos de seus atletas
CREATE POLICY "Coaches can view athlete microciclos" ON microciclos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = microciclos.user_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Coaches can update athlete microciclos" ON microciclos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = microciclos.user_id
            AND status = 'approved'
        )
    );

-- Cycle Training Sessions
CREATE POLICY "Users can view own cycle training sessions" ON cycle_training_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycle training sessions" ON cycle_training_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycle training sessions" ON cycle_training_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycle training sessions" ON cycle_training_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Treinadores podem ver/editar sessões de ciclo de seus atletas
CREATE POLICY "Coaches can view athlete cycle training sessions" ON cycle_training_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = cycle_training_sessions.user_id
            AND status = 'approved'
        )
    );

CREATE POLICY "Coaches can update athlete cycle training sessions" ON cycle_training_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = cycle_training_sessions.user_id
            AND status = 'approved'
        )
    );

-- 14. CRIAR POLÍTICAS PARA WEEKLY_REFLECTIONS (Usuários + Treinadores vinculados)
CREATE POLICY "Users can view own weekly reflections" ON weekly_reflections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly reflections" ON weekly_reflections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly reflections" ON weekly_reflections
    FOR UPDATE USING (auth.uid() = user_id);

-- Treinadores podem ver reflexões de seus atletas
CREATE POLICY "Coaches can view athlete weekly reflections" ON weekly_reflections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = weekly_reflections.user_id
            AND status = 'approved'
        )
    );

-- 15. CRIAR POLÍTICAS PARA WEEKLY_SUMMARIES (Usuários + Treinadores vinculados)
CREATE POLICY "Users can view own weekly summaries" ON weekly_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly summaries" ON weekly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Treinadores podem ver resumos de seus atletas
CREATE POLICY "Coaches can view athlete weekly summaries" ON weekly_summaries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pending_athlete_coach_relationships 
            WHERE coach_id = auth.uid() AND athlete_id = weekly_summaries.user_id
            AND status = 'approved'
        )
    );

-- 16. CRIAR POLÍTICAS PARA PENDING_ATHLETE_COACH_RELATIONSHIPS (TABELA)
CREATE POLICY "Coaches can view pending requests" ON pending_athlete_coach_relationships
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Athletes can view their pending requests" ON pending_athlete_coach_relationships
    FOR SELECT USING (auth.uid() = athlete_id);

-- Treinadores podem aprovar/rejeitar solicitações
CREATE POLICY "Coaches can update pending requests" ON pending_athlete_coach_relationships
    FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete pending requests" ON pending_athlete_coach_relationships
    FOR DELETE USING (auth.uid() = coach_id);

-- Atletas podem cancelar suas solicitações
CREATE POLICY "Athletes can delete own pending requests" ON pending_athlete_coach_relationships
    FOR DELETE USING (auth.uid() = athlete_id);

-- Atletas podem criar solicitações
CREATE POLICY "Athletes can create pending requests" ON pending_athlete_coach_relationships
    FOR INSERT WITH CHECK (auth.uid() = athlete_id);

-- 17. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
