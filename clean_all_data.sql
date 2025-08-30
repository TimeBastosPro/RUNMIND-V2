-- SCRIPT DE LIMPEZA COMPLETA - CUIDADO: APAGA TODOS OS DADOS!
-- Execute apenas se tiver certeza de que quer apagar todos os dados

-- ⚠️ ATENÇÃO: Este script apaga TODOS os dados das tabelas!
-- ⚠️ Faça backup antes de executar!
-- ⚠️ Execute em ordem para respeitar as dependências (foreign keys)

-- 1. LIMPAR DADOS DE TREINOS (sem dependências)
DELETE FROM training_sessions;
DELETE FROM cycle_training_sessions;

-- 2. LIMPAR DADOS DE CICLOS DE TREINAMENTO
DELETE FROM microciclos;
DELETE FROM mesociclos;
DELETE FROM macrociclos;

-- 3. LIMPAR DADOS DE CHECK-INS E BEM-ESTAR
DELETE FROM daily_checkins;
DELETE FROM weekly_reflections;

-- 4. LIMPAR DADOS DE INSIGHTS
DELETE FROM insights;

-- 5. LIMPAR DADOS DE PERFIL E PREFERÊNCIAS
DELETE FROM training_preferences;
DELETE FROM parq_responses;
DELETE FROM anamnesis;
DELETE FROM profiles;

-- 6. LIMPAR DADOS DE RELACIONAMENTOS (se existirem)
-- DELETE FROM coach_athlete_relationships;
-- DELETE FROM team_memberships;

-- 7. VERIFICAR SE AS TABELAS FORAM LIMPAS
SELECT 
  'VERIFICAÇÃO DE LIMPEZA' as categoria,
  'training_sessions' as tabela,
  COUNT(*) as registros_restantes
FROM training_sessions

UNION ALL

SELECT 
  'VERIFICAÇÃO DE LIMPEZA' as categoria,
  'cycle_training_sessions' as tabela,
  COUNT(*) as registros_restantes
FROM cycle_training_sessions

UNION ALL

SELECT 
  'VERIFICAÇÃO DE LIMPEZA' as categoria,
  'microciclos' as tabela,
  COUNT(*) as registros_restantes
FROM microciclos

UNION ALL

SELECT 
  'VERIFICAÇÃO DE LIMPEZA' as categoria,
  'mesociclos' as tabela,
  COUNT(*) as registros_restantes
FROM mesociclos

UNION ALL

SELECT 
  'VERIFICAÇÃO DE LIMPEZA' as categoria,
  'macrociclos' as tabela,
  COUNT(*) as registros_restantes
FROM macrociclos

UNION ALL

SELECT 
  'VERIFICAÇÃO DE LIMPEZA' as categoria,
  'daily_checkins' as tabela,
  COUNT(*) as registros_restantes
FROM daily_checkins

UNION ALL

SELECT 
  'VERIFICAÇÃO DE LIMPEZA' as categoria,
  'weekly_reflections' as tabela,
  COUNT(*) as registros_restantes
FROM weekly_reflections

UNION ALL

SELECT 
  'VERIFICAÇÃO DE LIMPEZA' as categoria,
  'insights' as tabela,
  COUNT(*) as registros_restantes
FROM insights

UNION ALL

SELECT 
  'VERIFICAÇÃO DE LIMPEZA' as categoria,
  'training_preferences' as tabela,
  COUNT(*) as registros_restantes
FROM training_preferences

UNION ALL

SELECT 
  'VERIFICAÇÃO DE LIMPEZA' as categoria,
  'parq_responses' as tabela,
  COUNT(*) as registros_restantes
FROM parq_responses

UNION ALL

SELECT 
  'VERIFICAÇÃO DE LIMPEZA' as categoria,
  'anamnesis' as tabela,
  COUNT(*) as registros_restantes
FROM anamnesis

UNION ALL

SELECT 
  'VERIFICAÇÃO DE LIMPEZA' as categoria,
  'profiles' as tabela,
  COUNT(*) as registros_restantes
FROM profiles;

-- 8. RESETAR SEQUENCES (se necessário)
-- ALTER SEQUENCE training_sessions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE daily_checkins_id_seq RESTART WITH 1;
-- ALTER SEQUENCE insights_id_seq RESTART WITH 1;
