-- Criar apenas a tabela teams que está faltando
-- Passo 1 de 2

CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Política RLS básica
CREATE POLICY "Coaches can manage own teams" ON teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coaches 
      WHERE coaches.id = teams.coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

-- Verificar se foi criada
SELECT
  'Tabela teams criada com sucesso' as status,
  schemaname,
  tablename
FROM pg_tables
WHERE tablename = 'teams'; 