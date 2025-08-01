-- Adicionar coluna clima à tabela training_sessions
-- Esta coluna armazenará as condições climáticas como JSON

ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS clima JSONB;

-- Adicionar comentário para documentar o uso da coluna
COMMENT ON COLUMN training_sessions.clima IS 'Array JSON com as condições climáticas do treino (ex: ["ensolarado", "quente", "vento"])';

-- Verificar se a coluna foi criada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'training_sessions' 
AND column_name = 'clima'; 