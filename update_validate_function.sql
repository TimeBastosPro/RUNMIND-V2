-- Script para atualizar apenas a função validate_race_data
-- Execute este script no Supabase SQL Editor

-- ========================================
-- ATUALIZAR FUNÇÃO DE VALIDAÇÃO
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
  
  -- Validar hora (convertendo para string para usar regex)
  IF NEW.start_time IS NULL THEN
    RAISE EXCEPTION 'Hora de início é obrigatória';
  END IF;
  
  IF NOT (NEW.start_time::text ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$') THEN
    RAISE EXCEPTION 'Formato de hora inválido. Use HH:MM (ex: 08:00)';
  END IF;
  
  -- Validar distância
  IF NEW.distance_km IS NULL OR NEW.distance_km <= 0 OR NEW.distance_km > 1000 THEN
    RAISE EXCEPTION 'Distância deve ser maior que 0 e menor que 1000km';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TESTE DA FUNÇÃO ATUALIZADA
-- ========================================

-- Teste 1: Inserção válida (deve funcionar)
INSERT INTO public.races (user_id, event_name, city, start_date, start_time, distance_km)
VALUES (auth.uid(), 'Teste de Validação', 'São Paulo', '2025-12-01', '08:00', 42.2);

-- Teste 2: Nome vazio (deve dar erro)
-- INSERT INTO public.races (user_id, event_name, city, start_date, start_time, distance_km)
-- VALUES (auth.uid(), '', 'São Paulo', '2025-12-01', '08:00', 42.2);

-- Teste 3: Hora inválida (deve dar erro)
-- INSERT INTO public.races (user_id, event_name, city, start_date, start_time, distance_km)
-- VALUES (auth.uid(), 'Teste', 'São Paulo', '2025-12-01', '25:00', 42.2);
