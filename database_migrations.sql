-- Adicionar coluna gender à tabela profiles
ALTER TABLE profiles ADD COLUMN gender TEXT;

-- Criar tabela fitness_tests
CREATE TABLE IF NOT EXISTS fitness_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  distance_meters INTEGER,
  time_seconds INTEGER,
  final_heart_rate INTEGER,
  calculated_vo2max DECIMAL(5,2) NOT NULL,
  calculated_vam DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_fitness_tests_user_id ON fitness_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_tests_test_date ON fitness_tests(test_date);

-- Habilitar RLS (Row Level Security)
ALTER TABLE fitness_tests ENABLE ROW LEVEL SECURITY;

-- Criar política para usuários só verem seus próprios testes
CREATE POLICY "Users can view own fitness tests" ON fitness_tests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fitness tests" ON fitness_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fitness tests" ON fitness_tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fitness tests" ON fitness_tests
  FOR DELETE USING (auth.uid() = user_id); 

-- Criar tabela de insights
CREATE TABLE IF NOT EXISTS insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('correlation', 'trend', 'ai_analysis', 'alert')),
  insight_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.8,
  source_data JSONB,
  generated_by TEXT NOT NULL CHECK (generated_by IN ('system', 'ai')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(insight_type);

-- Habilitar RLS na tabela insights
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para insights
DO $$
BEGIN
  -- Política para usuários visualizarem apenas seus próprios insights
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insights' AND policyname = 'Users can view own insights') THEN
    CREATE POLICY "Users can view own insights" ON insights
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Política para usuários inserirem seus próprios insights
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insights' AND policyname = 'Users can insert own insights') THEN
    CREATE POLICY "Users can insert own insights" ON insights
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Política para usuários atualizarem seus próprios insights
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insights' AND policyname = 'Users can update own insights') THEN
    CREATE POLICY "Users can update own insights" ON insights
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Política para usuários deletarem seus próprios insights
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insights' AND policyname = 'Users can delete own insights') THEN
    CREATE POLICY "Users can delete own insights" ON insights
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$; 