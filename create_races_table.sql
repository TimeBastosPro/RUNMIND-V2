-- Criar tabela de provas
CREATE TABLE IF NOT EXISTS races (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_name TEXT NOT NULL,
  city TEXT NOT NULL,
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  distance_km DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_races_user_id ON races(user_id);
CREATE INDEX IF NOT EXISTS idx_races_start_date ON races(start_date);

-- Habilitar RLS (Row Level Security)
ALTER TABLE races ENABLE ROW LEVEL SECURITY;

-- Criar política para usuários só verem suas próprias provas
CREATE POLICY "Users can view their own races" ON races
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own races" ON races
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own races" ON races
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own races" ON races
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_races_updated_at 
  BEFORE UPDATE ON races 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 