-- Script para testar inserção de provas
-- Execute este script APÓS executar fix_validate_function.sql

-- ========================================
-- TESTE 1: INSERÇÃO VÁLIDA (DEVE FUNCIONAR)
-- ========================================

INSERT INTO public.races (user_id, event_name, city, start_date, start_time, distance_km)
VALUES (auth.uid(), 'Teste de Validação', 'São Paulo', '2025-12-01', '08:00', 42.2);

-- ========================================
-- TESTE 2: VERIFICAR SE FOI INSERIDO
-- ========================================

SELECT * FROM public.races 
WHERE event_name = 'Teste de Validação' 
ORDER BY created_at DESC 
LIMIT 1;

-- ========================================
-- TESTE 3: TESTAR VALIDAÇÃO DE NOME VAZIO (DESCOMENTE PARA TESTAR)
-- ========================================

-- INSERT INTO public.races (user_id, event_name, city, start_date, start_time, distance_km)
-- VALUES (auth.uid(), '', 'São Paulo', '2025-12-01', '08:00', 42.2);

-- ========================================
-- TESTE 4: TESTAR VALIDAÇÃO DE HORA INVÁLIDA (DESCOMENTE PARA TESTAR)
-- ========================================

-- INSERT INTO public.races (user_id, event_name, city, start_date, start_time, distance_km)
-- VALUES (auth.uid(), 'Teste Hora Inválida', 'São Paulo', '2025-12-01', '25:00', 42.2);
