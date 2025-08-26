-- Script para testar cálculos de ritmo
-- Autor: Assistente
-- Data: 2025-01-27

-- Teste com VO2max = 59.1 (valor do teste de Cooper da Aline)
SELECT
    '=== TESTE DE CÁLCULOS DE RITMO ===' as info,
    59.1 as vo2max_teste,
    'feminino' as genero;

-- Cálculo do pace no limiar anaeróbico (FÓRMULA KARVONEN)
SELECT
    '=== CÁLCULO DO PACE LIMIAR (KARVONEN) ===' as info,
    59.1 as vo2max,
    CASE 
        WHEN 59.1 >= 60 THEN 3.5 + (60 - 59.1) * 0.08
        WHEN 59.1 >= 45 THEN 4.5 + (50 - 59.1) * 0.1
        ELSE 6.0 + (40 - 59.1) * 0.15
    END as pace_minutos_por_km,
    FLOOR(CASE 
        WHEN 59.1 >= 60 THEN 3.5 + (60 - 59.1) * 0.08
        WHEN 59.1 >= 45 THEN 4.5 + (50 - 59.1) * 0.1
        ELSE 6.0 + (40 - 59.1) * 0.15
    END) as minutos,
    ROUND((CASE 
        WHEN 59.1 >= 60 THEN 3.5 + (60 - 59.1) * 0.08
        WHEN 59.1 >= 45 THEN 4.5 + (50 - 59.1) * 0.1
        ELSE 6.0 + (40 - 59.1) * 0.15
    END - FLOOR(CASE 
        WHEN 59.1 >= 60 THEN 3.5 + (60 - 59.1) * 0.08
        WHEN 59.1 >= 45 THEN 4.5 + (50 - 59.1) * 0.1
        ELSE 6.0 + (40 - 59.1) * 0.15
    END)) * 60) as segundos,
    CONCAT(
        FLOOR(CASE 
            WHEN 59.1 >= 60 THEN 3.5 + (60 - 59.1) * 0.08
            WHEN 59.1 >= 45 THEN 4.5 + (50 - 59.1) * 0.1
            ELSE 6.0 + (40 - 59.1) * 0.15
        END)::TEXT, 
        ':', 
        LPAD(ROUND((CASE 
            WHEN 59.1 >= 60 THEN 3.5 + (60 - 59.1) * 0.08
            WHEN 59.1 >= 45 THEN 4.5 + (50 - 59.1) * 0.1
            ELSE 6.0 + (40 - 59.1) * 0.15
        END - FLOOR(CASE 
            WHEN 59.1 >= 60 THEN 3.5 + (60 - 59.1) * 0.08
            WHEN 59.1 >= 45 THEN 4.5 + (50 - 59.1) * 0.1
            ELSE 6.0 + (40 - 59.1) * 0.15
        END)) * 60)::TEXT, 2, '0')
    ) as pace_formatado;

-- Cálculo das zonas de pace (FÓRMULA KARVONEN)
WITH threshold_pace AS (
    SELECT 
        CASE 
            WHEN 59.1 >= 60 THEN 3.5 + (60 - 59.1) * 0.08
            WHEN 59.1 >= 45 THEN 4.5 + (50 - 59.1) * 0.1
            ELSE 6.0 + (40 - 59.1) * 0.15
        END as pace_minutos_por_km
)
SELECT
    '=== ZONAS DE PACE (KARVONEN) ===' as info,
    'Z1 - Recuperação' as zona,
    (SELECT pace_minutos_por_km * 1.3 FROM threshold_pace) as pace_min_minutos,
    (SELECT pace_minutos_por_km * 1.2 FROM threshold_pace) as pace_max_minutos,
    CONCAT(
        FLOOR((SELECT pace_minutos_por_km * 1.3 FROM threshold_pace))::TEXT, 
        ':', 
        LPAD(ROUND(((SELECT pace_minutos_por_km * 1.3 FROM threshold_pace) - FLOOR((SELECT pace_minutos_por_km * 1.3 FROM threshold_pace))) * 60)::TEXT, 2, '0')
    ) as pace_min_formatado,
    CONCAT(
        FLOOR((SELECT pace_minutos_por_km * 1.2 FROM threshold_pace))::TEXT, 
        ':', 
        LPAD(ROUND(((SELECT pace_minutos_por_km * 1.2 FROM threshold_pace) - FLOOR((SELECT pace_minutos_por_km * 1.2 FROM threshold_pace))) * 60)::TEXT, 2, '0')
    ) as pace_max_formatado;

SELECT
    'Z2 - Resistência' as zona,
    3600 / (59.1 * 0.87 * 3.5) * 1.2 as pace_min_segundos,
    3600 / (59.1 * 0.87 * 3.5) * 1.1 as pace_max_segundos,
    CONCAT(
        FLOOR((3600 / (59.1 * 0.87 * 3.5) * 1.2) / 60), 
        ':', 
        LPAD(FLOOR((3600 / (59.1 * 0.87 * 3.5) * 1.2) % 60)::TEXT, 2, '0')
    ) as pace_min_formatado,
    CONCAT(
        FLOOR((3600 / (59.1 * 0.87 * 3.5) * 1.1) / 60), 
        ':', 
        LPAD(FLOOR((3600 / (59.1 * 0.87 * 3.5) * 1.1) % 60)::TEXT, 2, '0')
    ) as pace_max_formatado;

SELECT
    'Z3 - Limiar' as zona,
    3600 / (59.1 * 0.87 * 3.5) * 1.1 as pace_min_segundos,
    3600 / (59.1 * 0.87 * 3.5) * 1.0 as pace_max_segundos,
    CONCAT(
        FLOOR((3600 / (59.1 * 0.87 * 3.5) * 1.1) / 60), 
        ':', 
        LPAD(FLOOR((3600 / (59.1 * 0.87 * 3.5) * 1.1) % 60)::TEXT, 2, '0')
    ) as pace_min_formatado,
    CONCAT(
        FLOOR((3600 / (59.1 * 0.87 * 3.5) * 1.0) / 60), 
        ':', 
        LPAD(FLOOR((3600 / (59.1 * 0.87 * 3.5) * 1.0) % 60)::TEXT, 2, '0')
    ) as pace_max_formatado;

SELECT
    'Z4 - VO2 Max' as zona,
    3600 / (59.1 * 0.87 * 3.5) * 1.0 as pace_min_segundos,
    3600 / (59.1 * 0.87 * 3.5) * 0.9 as pace_max_segundos,
    CONCAT(
        FLOOR((3600 / (59.1 * 0.87 * 3.5) * 1.0) / 60), 
        ':', 
        LPAD(FLOOR((3600 / (59.1 * 0.87 * 3.5) * 1.0) % 60)::TEXT, 2, '0')
    ) as pace_min_formatado,
    CONCAT(
        FLOOR((3600 / (59.1 * 0.87 * 3.5) * 0.9) / 60), 
        ':', 
        LPAD(FLOOR((3600 / (59.1 * 0.87 * 3.5) * 0.9) % 60)::TEXT, 2, '0')
    ) as pace_max_formatado;

SELECT
    'Z5 - Anaeróbico' as zona,
    3600 / (59.1 * 0.87 * 3.5) * 0.9 as pace_min_segundos,
    3600 / (59.1 * 0.87 * 3.5) * 0.8 as pace_max_segundos,
    CONCAT(
        FLOOR((3600 / (59.1 * 0.87 * 3.5) * 0.9) / 60), 
        ':', 
        LPAD(FLOOR((3600 / (59.1 * 0.87 * 3.5) * 0.9) % 60)::TEXT, 2, '0')
    ) as pace_min_formatado,
    CONCAT(
        FLOOR((3600 / (59.1 * 0.87 * 3.5) * 0.8) / 60), 
        ':', 
        LPAD(FLOOR((3600 / (59.1 * 0.87 * 3.5) * 0.8) % 60)::TEXT, 2, '0')
    ) as pace_max_formatado;
