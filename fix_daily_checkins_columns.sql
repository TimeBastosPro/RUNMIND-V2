-- Adicionar colunas que estão faltando na tabela daily_checkins
-- Este script corrige o erro "column daily_checkins.sleep_quality_score does not exist"

-- Adicionar coluna sleep_quality_score
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS sleep_quality_score INTEGER;

-- Adicionar coluna soreness_score
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS soreness_score INTEGER;

-- Adicionar coluna mood_score
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS mood_score INTEGER;

-- Adicionar coluna confidence_score
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS confidence_score INTEGER;

-- Adicionar coluna focus_score
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS focus_score INTEGER;

-- Adicionar coluna energy_score
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS energy_score INTEGER;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN daily_checkins.sleep_quality_score IS 'Qualidade do sono (1-10)';
COMMENT ON COLUMN daily_checkins.soreness_score IS 'Nível de dor muscular (1-10)';
COMMENT ON COLUMN daily_checkins.mood_score IS 'Humor (1-10)';
COMMENT ON COLUMN daily_checkins.confidence_score IS 'Confiança (1-10)';
COMMENT ON COLUMN daily_checkins.focus_score IS 'Foco (1-10)';
COMMENT ON COLUMN daily_checkins.energy_score IS 'Energia (1-10)';

-- Verificar se as colunas foram criadas corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'daily_checkins' 
AND column_name IN ('sleep_quality_score', 'soreness_score', 'mood_score', 'confidence_score', 'focus_score', 'energy_score')
ORDER BY column_name; 