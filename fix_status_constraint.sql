-- Corrigir a constraint de status para incluir 'removed'
-- Primeiro, remover a constraint existente
ALTER TABLE athlete_coach_relationships 
DROP CONSTRAINT IF EXISTS athlete_coach_relationships_status_check;

-- Recriar a constraint com o status 'removed' incluído
ALTER TABLE athlete_coach_relationships 
ADD CONSTRAINT athlete_coach_relationships_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'inactive', 'removed'));

-- Verificar se a constraint foi criada corretamente
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'athlete_coach_relationships'::regclass 
AND conname = 'athlete_coach_relationships_status_check'; 