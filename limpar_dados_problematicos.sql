-- Script para limpar dados problemáticos dos mesociclos
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

-- 2. Deletar todos os mesociclos existentes (cuidado!)
-- DESCOMENTE A LINHA ABAIXO APENAS SE QUISER LIMPAR TUDO
-- DELETE FROM public.mesociclos;

-- 3. Verificar se a tabela está limpa
SELECT COUNT(*) as total_mesociclos FROM public.mesociclos;

-- 4. Verificar macrociclos
SELECT 
    id,
    name,
    start_date,
    end_date
FROM public.macrociclos
ORDER BY created_at;
