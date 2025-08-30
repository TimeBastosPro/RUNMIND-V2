-- SCRIPT PARA CORRIGIR SEGURANÇA DAS TABELAS
-- ⚠️ ATENÇÃO: Este script habilita RLS e cria políticas de segurança

-- 1. HABILITAR ROW LEVEL SECURITY (RLS) NAS TABELAS PRINCIPAIS
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

-- 2. CRIAR POLÍTICAS PARA PROFILES (Usuários só veem seus próprios dados)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. CRIAR POLÍTICAS PARA COACHES (Treinadores só veem seus próprios dados)
CREATE POLICY "Coaches can view own data" ON coaches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coaches can update own data" ON coaches
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Coaches can insert own data" ON coaches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. CRIAR POLÍTICAS PARA TRAINING_SESSIONS (Usuários só veem suas próprias sessões)
CREATE POLICY "Users can view own training sessions" ON training_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training sessions" ON training_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training sessions" ON training_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training sessions" ON training_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- 5. CRIAR POLÍTICAS PARA DAILY_CHECKINS
CREATE POLICY "Users can view own checkins" ON daily_checkins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON daily_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON daily_checkins
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. CRIAR POLÍTICAS PARA RACES
CREATE POLICY "Users can view own races" ON races
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own races" ON races
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own races" ON races
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own races" ON races
    FOR DELETE USING (auth.uid() = user_id);

-- 7. CRIAR POLÍTICAS PARA FITNESS_TESTS
CREATE POLICY "Users can view own fitness tests" ON fitness_tests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fitness tests" ON fitness_tests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness tests" ON fitness_tests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fitness tests" ON fitness_tests
    FOR DELETE USING (auth.uid() = user_id);

-- 8. CRIAR POLÍTICAS PARA ANAMNESIS
CREATE POLICY "Users can view own anamnesis" ON anamnesis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own anamnesis" ON anamnesis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own anamnesis" ON anamnesis
    FOR UPDATE USING (auth.uid() = user_id);

-- 9. CRIAR POLÍTICAS PARA PARQ_RESPONSES
CREATE POLICY "Users can view own parq responses" ON parq_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own parq responses" ON parq_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parq responses" ON parq_responses
    FOR UPDATE USING (auth.uid() = user_id);

-- 10. CRIAR POLÍTICAS PARA TRAINING_PREFERENCES
CREATE POLICY "Users can view own training preferences" ON training_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training preferences" ON training_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training preferences" ON training_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- 11. CRIAR POLÍTICAS PARA INSIGHTS
CREATE POLICY "Users can view own insights" ON insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 12. CRIAR POLÍTICAS PARA CICLOS
CREATE POLICY "Users can view own macrociclos" ON macrociclos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own macrociclos" ON macrociclos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own macrociclos" ON macrociclos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own macrociclos" ON macrociclos
    FOR DELETE USING (auth.uid() = user_id);

-- 13. CRIAR POLÍTICAS PARA MESOCICLOS
CREATE POLICY "Users can view own mesociclos" ON mesociclos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mesociclos" ON mesociclos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mesociclos" ON mesociclos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mesociclos" ON mesociclos
    FOR DELETE USING (auth.uid() = user_id);

-- 14. CRIAR POLÍTICAS PARA MICROCICLOS
CREATE POLICY "Users can view own microciclos" ON microciclos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own microciclos" ON microciclos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own microciclos" ON microciclos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own microciclos" ON microciclos
    FOR DELETE USING (auth.uid() = user_id);

-- 15. CRIAR POLÍTICAS PARA CYCLE_TRAINING_SESSIONS
CREATE POLICY "Users can view own cycle training sessions" ON cycle_training_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycle training sessions" ON cycle_training_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycle training sessions" ON cycle_training_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycle training sessions" ON cycle_training_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- 16. CRIAR POLÍTICAS PARA WEEKLY_REFLECTIONS
CREATE POLICY "Users can view own weekly reflections" ON weekly_reflections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly reflections" ON weekly_reflections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly reflections" ON weekly_reflections
    FOR UPDATE USING (auth.uid() = user_id);

-- 17. CRIAR POLÍTICAS PARA WEEKLY_SUMMARIES
CREATE POLICY "Users can view own weekly summaries" ON weekly_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly summaries" ON weekly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 18. POLÍTICAS ESPECIAIS PARA RELACIONAMENTOS COACH-ATLETA
-- (Estas tabelas precisam de políticas mais complexas)

-- Para active_athlete_coach_relationships
ALTER TABLE active_athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their athletes" ON active_athlete_coach_relationships
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Athletes can view their coach" ON active_athlete_coach_relationships
    FOR SELECT USING (auth.uid() = athlete_id);

-- Para pending_athlete_coach_relationships
ALTER TABLE pending_athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view pending requests" ON pending_athlete_coach_relationships
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Athletes can view their pending requests" ON pending_athlete_coach_relationships
    FOR SELECT USING (auth.uid() = athlete_id);

-- 19. TABELAS DE ANÁLISE (Podem ser acessadas por coaches e atletas)
ALTER TABLE training_adherence_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own adherence analysis" ON training_adherence_analysis
    FOR SELECT USING (auth.uid() = user_id);

-- 20. TABELAS DE DEBUG (Podem ser acessadas por administradores)
-- insights_debug - manter sem RLS por enquanto (para debug)

-- 21. TABELAS DE BACKUP (Podem ser acessadas por administradores)
-- coaches_backup - manter sem RLS por enquanto (para backup)

-- 22. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
