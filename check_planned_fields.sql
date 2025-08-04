-- Verificar se os campos planned_ existem na tabela training_sessions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'training_sessions'
AND column_name LIKE 'planned_%'
ORDER BY column_name;

-- Verificar também os campos legacy para comparação
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'training_sessions'
AND column_name IN ('distance_km', 'duracao_horas', 'duracao_minutos')
ORDER BY column_name;

-- Verificar alguns registros de treinos planejados
SELECT id, title, status, training_date, 
       planned_distance_km, planned_duration_hours, planned_duration_minutes,
       distance_km, duracao_horas, duracao_minutos
FROM training_sessions
WHERE status = 'planned'
ORDER BY training_date DESC
LIMIT 5; 