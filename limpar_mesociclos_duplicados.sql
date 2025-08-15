-- Script para limpar mesociclos duplicados
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, vamos verificar os duplicados
WITH duplicates AS (
  SELECT 
    id,
    name,
    mesociclo_type,
    start_date,
    end_date,
    macrociclo_id,
    ROW_NUMBER() OVER (
      PARTITION BY name, mesociclo_type, start_date, end_date, macrociclo_id 
      ORDER BY created_at
    ) as rn
  FROM public.mesociclos
)
SELECT 
  id,
  name,
  mesociclo_type,
  start_date,
  end_date,
  macrociclo_id,
  rn
FROM duplicates
WHERE rn > 1
ORDER BY name, start_date;

-- 2. Deletar duplicados (manter apenas o mais antigo)
DELETE FROM public.mesociclos
WHERE id IN (
  WITH duplicates AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY name, mesociclo_type, start_date, end_date, macrociclo_id 
        ORDER BY created_at
      ) as rn
    FROM public.mesociclos
  )
  SELECT id FROM duplicates WHERE rn > 1
);

-- 3. Verificar se ainda há duplicados
SELECT 
  name,
  mesociclo_type,
  start_date,
  end_date,
  COUNT(*) as quantidade
FROM public.mesociclos
GROUP BY name, mesociclo_type, start_date, end_date
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 4. Mostrar mesociclos restantes
SELECT 
  id,
  name,
  mesociclo_type,
  start_date,
  end_date,
  macrociclo_id,
  created_at
FROM public.mesociclos
ORDER BY start_date;
