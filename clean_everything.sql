-- SCRIPT DE LIMPEZA COMPLETA - DADOS + AUTENTICAÇÃO
-- ⚠️ ATENÇÃO: Este script apaga TUDO - dados e usuários!

-- 1. LIMPAR DADOS DAS TABELAS
DELETE FROM training_sessions;
DELETE FROM cycle_training_sessions;
DELETE FROM microciclos;
DELETE FROM mesociclos;
DELETE FROM macrociclos;
DELETE FROM daily_checkins;
DELETE FROM weekly_reflections;
DELETE FROM insights;
DELETE FROM training_preferences;
DELETE FROM parq_responses;
DELETE FROM anamnesis;
DELETE FROM profiles;

-- 2. LIMPAR USUÁRIOS DO AUTH
DELETE FROM auth.users;

-- 3. LIMPAR SESSÕES ATIVAS
DELETE FROM auth.sessions;

-- 4. VERIFICAÇÃO FINAL
SELECT 
  'LIMPEZA COMPLETA' as categoria,
  'Dados das tabelas' as tipo,
  'Concluído' as status

UNION ALL

SELECT 
  'LIMPEZA COMPLETA' as categoria,
  'Usuários do Auth' as tipo,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = 0 THEN 'Concluído'
    ELSE 'Falhou'
  END as status

UNION ALL

SELECT 
  'LIMPEZA COMPLETA' as categoria,
  'Sessões ativas' as tipo,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.sessions) = 0 THEN 'Concluído'
    ELSE 'Falhou'
  END as status;
