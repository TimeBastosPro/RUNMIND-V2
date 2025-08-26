-- Script para criar tabelas separadas para anamnese e preferências
-- Execute este script no Supabase SQL Editor

-- ========================================
-- TABELA 1: PROFILES (dados pessoais básicos)
-- ========================================

-- Verificar se a tabela profiles já existe e tem a estrutura correta
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- ========================================
-- TABELA 2: ANAMNESE (dados médicos e físicos)
-- ========================================

-- Criar tabela de anamnese
CREATE TABLE IF NOT EXISTS anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 500),
  height_cm INTEGER CHECK (height_cm > 50 AND height_cm < 300),
  blood_type VARCHAR(5),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  medical_conditions TEXT[],
  medications TEXT[],
  allergies TEXT[],
  previous_injuries TEXT[],
  family_medical_history TEXT,
  smoking_status VARCHAR(50),
  alcohol_consumption VARCHAR(50),
  sleep_hours_per_night INTEGER CHECK (sleep_hours_per_night >= 0 AND sleep_hours_per_night <= 24),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT anamnesis_user_id_unique UNIQUE (user_id)
);

-- ========================================
-- TABELA 3: PREFERENCES (preferências de treino)
-- ========================================

-- Criar tabela de preferências
CREATE TABLE IF NOT EXISTS training_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_days TEXT[] CHECK (array_length(training_days, 1) > 0),
  preferred_training_period VARCHAR(50) CHECK (preferred_training_period IN ('morning', 'afternoon', 'evening', 'night')),
  terrain_preference VARCHAR(50) CHECK (terrain_preference IN ('road', 'trail', 'track', 'treadmill', 'mixed')),
  work_stress_level INTEGER CHECK (work_stress_level >= 1 AND work_stress_level <= 10),
  sleep_consistency VARCHAR(50) CHECK (sleep_consistency IN ('excellent', 'good', 'fair', 'poor')),
  wakeup_feeling VARCHAR(50) CHECK (wakeup_feeling IN ('refreshed', 'tired', 'energetic', 'groggy')),
  hydration_habit VARCHAR(50) CHECK (hydration_habit IN ('excellent', 'good', 'fair', 'poor')),
  recovery_habit VARCHAR(100),
  stress_management TEXT[],
  preferred_workout_duration INTEGER CHECK (preferred_workout_duration > 0 AND preferred_workout_duration <= 300),
  preferred_workout_intensity VARCHAR(50) CHECK (preferred_workout_intensity IN ('low', 'moderate', 'high', 'varied')),
  music_preference BOOLEAN DEFAULT true,
  group_training_preference BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT training_preferences_user_id_unique UNIQUE (user_id)
);

-- ========================================
-- TABELA 4: PARQ (Physical Activity Readiness Questionnaire)
-- ========================================

-- Criar tabela específica para PARQ
CREATE TABLE IF NOT EXISTS parq_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_1_heart_condition BOOLEAN NOT NULL,
  question_2_chest_pain BOOLEAN NOT NULL,
  question_3_dizziness BOOLEAN NOT NULL,
  question_4_bone_joint_problem BOOLEAN NOT NULL,
  question_5_blood_pressure BOOLEAN NOT NULL,
  question_6_physical_limitation BOOLEAN NOT NULL,
  question_7_doctor_recommendation BOOLEAN NOT NULL,
  additional_notes TEXT,
  is_safe_to_exercise BOOLEAN GENERATED ALWAYS AS (
    NOT (question_1_heart_condition OR question_2_chest_pain OR question_3_dizziness OR 
         question_4_bone_joint_problem OR question_5_blood_pressure OR question_6_physical_limitation OR 
         question_7_doctor_recommendation)
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT parq_responses_user_id_unique UNIQUE (user_id)
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para anamnese
CREATE INDEX IF NOT EXISTS idx_anamnesis_user_id ON anamnesis(user_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_created_at ON anamnesis(created_at);

-- Índices para preferências
CREATE INDEX IF NOT EXISTS idx_training_preferences_user_id ON training_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_training_preferences_created_at ON training_preferences(created_at);

-- Índices para PARQ
CREATE INDEX IF NOT EXISTS idx_parq_responses_user_id ON parq_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_parq_responses_created_at ON parq_responses(created_at);

-- ========================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================

-- Trigger para anamnese
CREATE OR REPLACE FUNCTION update_anamnesis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_anamnesis_updated_at
  BEFORE UPDATE ON anamnesis
  FOR EACH ROW
  EXECUTE FUNCTION update_anamnesis_updated_at();

-- Trigger para preferências
CREATE OR REPLACE FUNCTION update_training_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_training_preferences_updated_at
  BEFORE UPDATE ON training_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_training_preferences_updated_at();

-- Trigger para PARQ
CREATE OR REPLACE FUNCTION update_parq_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_parq_responses_updated_at
  BEFORE UPDATE ON parq_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_parq_responses_updated_at();

-- ========================================
-- RLS (Row Level Security)
-- ========================================

-- Habilitar RLS nas tabelas
ALTER TABLE anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE parq_responses ENABLE ROW LEVEL SECURITY;

-- Políticas para anamnese
CREATE POLICY "Users can view own anamnesis" ON anamnesis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own anamnesis" ON anamnesis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own anamnesis" ON anamnesis
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own anamnesis" ON anamnesis
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para preferências
CREATE POLICY "Users can view own training preferences" ON training_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training preferences" ON training_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training preferences" ON training_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training preferences" ON training_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para PARQ
CREATE POLICY "Users can view own parq responses" ON parq_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own parq responses" ON parq_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parq responses" ON parq_responses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own parq responses" ON parq_responses
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Verificar se as tabelas foram criadas
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name IN ('anamnesis', 'training_preferences', 'parq_responses')
ORDER BY table_name;

-- Verificar estrutura da tabela anamnese
SELECT 
  'anamnesis' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'anamnesis'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela training_preferences
SELECT 
  'training_preferences' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'training_preferences'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela parq_responses
SELECT 
  'parq_responses' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'parq_responses'
ORDER BY ordinal_position;
