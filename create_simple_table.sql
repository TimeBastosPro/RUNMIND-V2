-- Script SIMPLES para criar apenas a tabela que está faltando
-- Problema: "athlete_coach_relationships" does not exist

-- Criar a tabela athlete_coach_relationships
CREATE TABLE IF NOT EXISTS athlete_coach_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'inactive')) DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES coaches(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(athlete_id, coach_id)
);

-- Habilitar RLS
ALTER TABLE athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS básicas
CREATE POLICY "Athletes can manage own relationships" ON athlete_coach_relationships
  FOR ALL USING (auth.uid() = athlete_id);

CREATE POLICY "Coaches can view relationships with them" ON athlete_coach_relationships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coaches 
      WHERE coaches.id = athlete_coach_relationships.coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

-- Verificar se foi criada
SELECT
  'Tabela criada com sucesso' as status,
  schemaname,
  tablename
FROM pg_tables
WHERE tablename = 'athlete_coach_relationships'; 