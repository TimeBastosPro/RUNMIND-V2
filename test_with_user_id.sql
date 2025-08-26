-- Script para testar inserção de provas com ID específico
-- Execute este script no Supabase SQL Editor

-- ========================================
-- PASSO 1: VERIFICAR USUÁRIOS EXISTENTES
-- ========================================

SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- ========================================
-- PASSO 2: TESTAR INSERÇÃO COM ID ESPECÍFICO
-- ========================================

-- Substitua 'SEU_USER_ID_AQUI' pelo ID de um usuário real da consulta acima
INSERT INTO public.races (user_id, event_name, city, start_date, start_time, distance_km)
VALUES ('3b091ca5-1967-4152-93bc-424e34ad52ad', 'Teste de Validação', 'São Paulo', '2025-12-01', '08:00', 42.2);

-- ========================================
-- PASSO 3: VERIFICAR SE FOI INSERIDO
-- ========================================

SELECT * FROM public.races 
WHERE event_name = 'Teste de Validação' 
ORDER BY created_at DESC 
LIMIT 1;

-- ========================================
-- PASSO 4: TESTAR VALIDAÇÕES (DESCOMENTE PARA TESTAR)
-- ========================================

-- Teste nome vazio (deve dar erro)
-- INSERT INTO public.races (user_id, event_name, city, start_date, start_time, distance_km)
-- VALUES ('3b091ca5-1967-4152-93bc-424e34ad52ad', '', 'São Paulo', '2025-12-01', '08:00', 42.2);

-- Teste hora inválida (deve dar erro)
-- INSERT INTO public.races (user_id, event_name, city, start_date, start_time, distance_km)
-- VALUES ('3b091ca5-1967-4152-93bc-424e34ad52ad', 'Teste Hora Inválida', 'São Paulo', '2025-12-01', '25:00', 42.2);

-- Teste distância inválida (deve dar erro)
-- INSERT INTO public.races (user_id, event_name, city, start_date, start_time, distance_km)
-- VALUES ('3b091ca5-1967-4152-93bc-424e34ad52ad', 'Teste Distância', 'São Paulo', '2025-12-01', '08:00', -5);
