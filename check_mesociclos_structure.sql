-- Verificar estrutura da tabela mesociclos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se a coluna mesociclo_type existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
AND table_schema = 'public'
AND column_name LIKE '%mesociclo%';

-- Verificar dados da tabela (se houver)
SELECT * FROM mesociclos LIMIT 5;
