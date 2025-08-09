-- =====================================================
-- Modality em athlete_coach_relationships + regra 1 ativo por modalidade
-- Execute no SQL Editor do Supabase
-- =====================================================

-- 1) Adicionar coluna modality (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'athlete_coach_relationships' 
      AND column_name = 'modality'
  ) THEN
    ALTER TABLE athlete_coach_relationships
      ADD COLUMN modality TEXT DEFAULT 'unspecified' NOT NULL;
  END IF;
END $$;

-- 2) Índice único parcial: um vínculo ativo por atleta e modalidade
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'uniq_active_modality_per_athlete'
  ) THEN
    CREATE UNIQUE INDEX uniq_active_modality_per_athlete
      ON athlete_coach_relationships (athlete_id, modality)
      WHERE status = 'active';
  END IF;
END $$;

-- 3) Atualizar view active_athlete_coach_relationships para incluir modality
CREATE OR REPLACE VIEW active_athlete_coach_relationships AS
SELECT 
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.team_id,
  acr.status,
  acr.requested_at,
  acr.approved_at,
  acr.notes,
  acr.modality,
  p.full_name as athlete_name,
  p.email as athlete_email,
  c.full_name as coach_name,
  c.email as coach_email,
  t.name as team_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
LEFT JOIN teams t ON acr.team_id = t.id
WHERE acr.status IN ('pending', 'approved', 'active');