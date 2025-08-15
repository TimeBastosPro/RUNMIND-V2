-- Script para limpar mesociclos problemáticos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar dados atuais
SELECT 
    id,
    name,
    mesociclo_type,
    start_date,
    end_date,
    macrociclo_id,
    created_at
FROM public.mesociclos
ORDER BY created_at;

-- 2. Verificar mesociclos com datas idênticas
SELECT 
    start_date,
    end_date,
    COUNT(*) as quantidade,
    STRING_AGG(name, ', ') as nomes,
    STRING_AGG(mesociclo_type, ', ') as tipos
FROM public.mesociclos
GROUP BY start_date, end_date
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 3. Deletar mesociclos com datas idênticas (manter apenas o mais antigo)
DELETE FROM public.mesociclos
WHERE id IN (
  WITH duplicates AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY start_date, end_date, mesociclo_type
        ORDER BY created_at
      ) as rn
    FROM public.mesociclos
  )
  SELECT id FROM duplicates WHERE rn > 1
);

-- 4. Verificar mesociclos restantes
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

-- 5. Contar total final
SELECT COUNT(*) as total_mesociclos FROM public.mesociclos;
