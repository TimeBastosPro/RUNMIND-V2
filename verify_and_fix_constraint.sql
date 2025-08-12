-- Verificar se a constraint existe e quais valores ela aceita
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'athlete_coach_relationships'::regclass 
AND conname = 'athlete_coach_relationships_status_check';

-- Se a constraint não existir ou não incluir 'removed', vamos corrigir
DO $$
BEGIN
  -- Verificar se a constraint existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'athlete_coach_relationships'::regclass 
    AND conname = 'athlete_coach_relationships_status_check'
  ) THEN
    -- Criar a constraint se não existir
    ALTER TABLE athlete_coach_relationships 
    ADD CONSTRAINT athlete_coach_relationships_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'inactive', 'removed'));
    RAISE NOTICE 'Constraint criada com sucesso';
  ELSE
    -- Verificar se a constraint inclui 'removed'
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = 'athlete_coach_relationships'::regclass 
      AND conname = 'athlete_coach_relationships_status_check'
      AND pg_get_constraintdef(oid) LIKE '%removed%'
    ) THEN
      -- Remover e recriar a constraint
      ALTER TABLE athlete_coach_relationships 
      DROP CONSTRAINT athlete_coach_relationships_status_check;
      
      ALTER TABLE athlete_coach_relationships 
      ADD CONSTRAINT athlete_coach_relationships_status_check 
      CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'inactive', 'removed'));
      RAISE NOTICE 'Constraint atualizada com sucesso';
    ELSE
      RAISE NOTICE 'Constraint já está correta';
    END IF;
  END IF;
END $$;

-- Verificar novamente após a correção
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'athlete_coach_relationships'::regclass 
AND conname = 'athlete_coach_relationships_status_check';

-- Testar se o status 'removed' é aceito
INSERT INTO athlete_coach_relationships (id, athlete_id, coach_id, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'removed',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Verificar se foi inserido
SELECT id, status FROM athlete_coach_relationships 
WHERE status = 'removed' 
LIMIT 1;

-- Limpar o teste
DELETE FROM athlete_coach_relationships WHERE status = 'removed'; 