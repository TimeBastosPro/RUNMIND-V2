-- Verificar quais tabelas do sistema de treinadores existem
-- Vamos ver o que temos antes de criar algo

-- 1. Verificar se a tabela coaches existe
SELECT
  'Tabela coaches' as tabela,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'coaches') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- 2. Verificar se a tabela teams existe
SELECT
  'Tabela teams' as tabela,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'teams') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- 3. Verificar se a tabela athlete_coach_relationships existe
SELECT
  'Tabela athlete_coach_relationships' as tabela,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'athlete_coach_relationships') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- 4. Listar todas as tabelas que temos
SELECT
  'Todas as tabelas existentes' as info,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename; 