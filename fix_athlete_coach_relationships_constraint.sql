-- Corrigir constraint única para permitir múltiplos relacionamentos por modalidade
-- O problema é que a constraint UNIQUE(athlete_id, coach_id) impede relacionamentos
-- em modalidades diferentes com o mesmo treinador

-- 1. Remover a constraint única atual
ALTER TABLE athlete_coach_relationships 
DROP CONSTRAINT IF EXISTS athlete_coach_relationships_athlete_id_coach_id_key;

-- 2. Criar nova constraint única que inclui a modalidade
-- Isso permite múltiplos relacionamentos com o mesmo treinador em modalidades diferentes
ALTER TABLE athlete_coach_relationships 
ADD CONSTRAINT athlete_coach_relationships_athlete_coach_modality_unique 
UNIQUE(athlete_id, coach_id, modality);

-- 3. Verificar se há dados duplicados que precisam ser limpos
-- (opcional - executar apenas se necessário)
-- DELETE FROM athlete_coach_relationships 
-- WHERE id NOT IN (
--   SELECT MIN(id) 
--   FROM athlete_coach_relationships 
--   GROUP BY athlete_id, coach_id, modality
-- );

-- 4. Verificar a estrutura atual
SELECT 
  constraint_name, 
  constraint_type, 
  table_name 
FROM information_schema.table_constraints 
WHERE table_name = 'athlete_coach_relationships' 
AND constraint_type = 'UNIQUE';
