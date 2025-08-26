-- Script para corrigir a função validate_race_data
-- Execute este script no Supabase SQL Editor

-- ========================================
-- PASSO 1: ATUALIZAR A FUNÇÃO
-- ========================================

CREATE OR REPLACE FUNCTION validate_race_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar nome do evento
  IF NEW.event_name IS NULL OR trim(NEW.event_name) = '' THEN
    RAISE EXCEPTION 'Nome do evento é obrigatório';
  END IF;
  
  -- Validar cidade
  IF NEW.city IS NULL OR trim(NEW.city) = '' THEN
    RAISE EXCEPTION 'Cidade é obrigatória';
  END IF;
  
  -- Validar data
  IF NEW.start_date IS NULL THEN
    RAISE EXCEPTION 'Data de início é obrigatória';
  END IF;
  
  IF NEW.start_date < '2020-01-01' THEN
    RAISE EXCEPTION 'Data não pode ser anterior a 2020';
  END IF;
  
  -- Validar hora (usando uma abordagem mais simples)
  IF NEW.start_time IS NULL THEN
    RAISE EXCEPTION 'Hora de início é obrigatória';
  END IF;
  
  -- Validar se a hora está entre 00:00 e 23:59
  IF EXTRACT(HOUR FROM NEW.start_time) > 23 OR EXTRACT(MINUTE FROM NEW.start_time) > 59 THEN
    RAISE EXCEPTION 'Hora inválida. Use formato HH:MM (ex: 08:00)';
  END IF;
  
  -- Validar distância
  IF NEW.distance_km IS NULL OR NEW.distance_km <= 0 OR NEW.distance_km > 1000 THEN
    RAISE EXCEPTION 'Distância deve ser maior que 0 e menor que 1000km';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PASSO 2: VERIFICAR SE A FUNÇÃO FOI CRIADA
-- ========================================

SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'validate_race_data';
