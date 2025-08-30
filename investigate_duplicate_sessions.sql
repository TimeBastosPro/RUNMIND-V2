-- INVESTIGAÇÃO: Múltiplas sessões para o mesmo dia
-- Este script analisa por que há múltiplas sessões para 25/08

-- 1. VERIFICAR TODAS AS SESSÕES PARA 25/08
SELECT 
  'SESSÕES PARA 25/08' as categoria,
  id,
  user_id,
  training_date,
  title,
  status,
  distance_km,
  duracao_horas,
  duracao_minutos,
  esforco,
  intensidade,
  modalidade,
  treino_tipo,
  perceived_effort,
  session_satisfaction,
  avg_heart_rate,
  execution_type,
  created_at,
  updated_at
FROM training_sessions 
WHERE training_date = '2024-08-25'
ORDER BY created_at;

-- 2. CONTAR SESSÕES POR DIA DA SEMANA
SELECT 
  'CONTAGEM POR DIA' as categoria,
  training_date,
  COUNT(*) as quantidade_sessoes,
  STRING_AGG(DISTINCT status, ', ') as status_distintos,
  STRING_AGG(DISTINCT title, ' | ') as titulos_distintos
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
GROUP BY training_date
ORDER BY training_date;

-- 3. VERIFICAR SESSÕES DUPLICADAS (mesmo dia, mesmo usuário)
SELECT 
  'POSSÍVEIS DUPLICATAS' as categoria,
  training_date,
  user_id,
  COUNT(*) as quantidade,
  STRING_AGG(id::text, ', ') as ids,
  STRING_AGG(title, ' | ') as titulos,
  STRING_AGG(status, ', ') as status
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
GROUP BY training_date, user_id
HAVING COUNT(*) > 1
ORDER BY training_date, user_id;

-- 4. VERIFICAR DIFERENÇAS ENTRE SESSÕES DE 25/08
SELECT 
  'DIFERENÇAS ENTRE SESSÕES 25/08' as categoria,
  id,
  title,
  status,
  distance_km,
  esforco,
  intensidade,
  modalidade,
  treino_tipo,
  perceived_effort,
  session_satisfaction,
  created_at,
  updated_at,
  CASE 
    WHEN created_at = updated_at THEN 'Nunca foi atualizada'
    ELSE 'Foi atualizada'
  END as status_atualizacao
FROM training_sessions 
WHERE training_date = '2024-08-25'
ORDER BY created_at;

-- 5. VERIFICAR SE HÁ PADRÃO DE CRIAÇÃO
SELECT 
  'PADRÃO DE CRIAÇÃO' as categoria,
  DATE(created_at) as data_criacao,
  COUNT(*) as sessoes_criadas,
  STRING_AGG(DISTINCT training_date::text, ', ') as datas_treino
FROM training_sessions 
WHERE training_date >= '2024-08-25' 
  AND training_date <= '2024-08-31'
GROUP BY DATE(created_at)
ORDER BY data_criacao;
