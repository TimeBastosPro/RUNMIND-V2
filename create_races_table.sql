-- Script para melhorar a tabela de provas existente no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- ========================================
-- MELHORAR TABELA DE PROVAS EXISTENTE
-- ========================================

-- Adicionar validações CHECK à tabela existente (com tratamento de erro)
DO $$
BEGIN
  -- Adicionar constraint para nome do evento
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'races_event_name_check'
  ) THEN
    ALTER TABLE public.races 
    ADD CONSTRAINT races_event_name_check 
    CHECK (length(trim(event_name)) > 0);
  END IF;
  
  -- Adicionar constraint para cidade
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'races_city_check'
  ) THEN
    ALTER TABLE public.races 
    ADD CONSTRAINT races_city_check 
    CHECK (length(trim(city)) > 0);
  END IF;
  
  -- Adicionar constraint para distância
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'races_distance_km_check'
  ) THEN
    ALTER TABLE public.races 
    ADD CONSTRAINT races_distance_km_check 
    CHECK (distance_km > 0);
  END IF;
  
  RAISE NOTICE 'Constraints de validação adicionadas com sucesso';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Algumas constraints já existem, continuando...';
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao adicionar constraints: %', SQLERRM;
END $$;

-- ========================================
-- CRIAR ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ========================================

-- Índice composto para buscar provas de um usuário ordenadas por data
CREATE INDEX IF NOT EXISTS idx_races_user_date ON public.races(user_id, start_date);

-- Índice para buscar provas por data (útil para encontrar próximas provas)
CREATE INDEX IF NOT EXISTS idx_races_start_date ON public.races(start_date);

-- ========================================
-- VERIFICAR E MELHORAR POLÍTICAS RLS
-- ========================================

-- Verificar se as políticas RLS existem e recriar se necessário
DROP POLICY IF EXISTS "Users can view their own races" ON public.races;
CREATE POLICY "Users can view their own races" ON public.races
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own races" ON public.races;
CREATE POLICY "Users can insert their own races" ON public.races
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own races" ON public.races;
CREATE POLICY "Users can update their own races" ON public.races
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own races" ON public.races;
CREATE POLICY "Users can delete their own races" ON public.races
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- MELHORAR FUNÇÕES E TRIGGERS
-- ========================================

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_races_updated_at ON public.races;
CREATE TRIGGER update_races_updated_at 
  BEFORE UPDATE ON public.races 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FUNÇÃO DE VALIDAÇÃO DE DADOS
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

-- Trigger para validar dados antes de inserir/atualizar
DROP TRIGGER IF EXISTS validate_race_data_trigger ON public.races;
CREATE TRIGGER validate_race_data_trigger
  BEFORE INSERT OR UPDATE ON public.races
  FOR EACH ROW
  EXECUTE FUNCTION validate_race_data();

-- ========================================
-- FUNÇÃO PARA LIMPAR DADOS EXISTENTES (OPCIONAL)
-- ========================================

-- Função para limpar dados inválidos existentes (execute apenas se necessário)
CREATE OR REPLACE FUNCTION cleanup_invalid_races()
RETURNS void AS $$
BEGIN
  -- Remover provas com nomes vazios ou apenas espaços
  DELETE FROM public.races 
  WHERE event_name IS NULL OR length(trim(event_name)) = 0;
  
  -- Remover provas com cidades vazias ou apenas espaços
  DELETE FROM public.races 
  WHERE city IS NULL OR length(trim(city)) = 0;
  
  -- Remover provas com distância inválida
  DELETE FROM public.races 
  WHERE distance_km <= 0 OR distance_km > 1000;
  
  -- Remover provas com datas muito antigas
  DELETE FROM public.races 
  WHERE start_date < '2020-01-01';
  
  RAISE NOTICE 'Limpeza de dados inválidos concluída';
END;
$$ language 'plpgsql';

-- ========================================
-- VERIFICAR CONFIGURAÇÃO ATUAL
-- ========================================

-- Verificar estrutura atual da tabela
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'races'
ORDER BY ordinal_position;

-- Verificar se as políticas RLS foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'races'
ORDER BY policyname;

-- Verificar se os índices foram criados
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'races'
ORDER BY indexname;

-- Verificar se os triggers foram criados
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'races'
ORDER BY trigger_name;

-- ========================================
-- INSTRUÇÕES DE USO
-- ========================================

-- ✅ MELHORIAS IMPLEMENTADAS:
-- 1. Validações CHECK para nome, cidade e distância
-- 2. Índices para melhor performance nas consultas
-- 3. Políticas RLS atualizadas
-- 4. Triggers para validação automática e timestamps
-- 5. Função de limpeza de dados inválidos

-- Para limpar dados inválidos existentes (execute apenas se necessário):
-- SELECT cleanup_invalid_races();

-- ========================================
-- TESTES E VERIFICAÇÕES
-- ========================================

-- Para verificar as provas existentes:
SELECT * FROM public.races ORDER BY start_date;

-- Para testar as validações (deve dar erro):
INSERT INTO public.races (user_id, event_name, city, start_date, start_time, distance_km)
VALUES (auth.uid(), '', 'São Paulo', '2025-12-01', '08:00', 42.2);

-- Para testar inserção válida (deve funcionar):
INSERT INTO public.races (user_id, event_name, city, start_date, start_time, distance_km)
VALUES (auth.uid(), 'Teste de Validação', 'São Paulo', '2025-12-01', '08:00', 42.2); 