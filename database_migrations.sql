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