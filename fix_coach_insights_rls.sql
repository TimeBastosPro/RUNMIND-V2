-- Adicionar políticas RLS para treinadores verem insights dos atletas
-- Primeiro, vamos verificar se existe a tabela athlete_coach_relationships
CREATE TABLE IF NOT EXISTS athlete_coach_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID,
  modality TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'inactive')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(athlete_id, coach_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_athlete_id ON athlete_coach_relationships(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_coach_id ON athlete_coach_relationships(coach_id);
CREATE INDEX IF NOT EXISTS idx_athlete_coach_relationships_status ON athlete_coach_relationships(status);

-- Habilitar RLS
ALTER TABLE athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para athlete_coach_relationships
CREATE POLICY "Users can view own relationships as athlete" ON athlete_coach_relationships
  FOR SELECT USING (auth.uid() = athlete_id);

CREATE POLICY "Users can view own relationships as coach" ON athlete_coach_relationships
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can insert relationships" ON athlete_coach_relationships
  FOR INSERT WITH CHECK (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Users can update own relationships" ON athlete_coach_relationships
  FOR UPDATE USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Users can delete own relationships" ON athlete_coach_relationships
  FOR DELETE USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

-- Agora vamos adicionar políticas RLS para insights que permitam treinadores verem insights dos atletas
-- Remover política existente de insights
DROP POLICY IF EXISTS "Users can view own insights" ON insights;

-- Criar nova política que permite treinadores verem insights dos atletas
CREATE POLICY "Users can view own insights or athlete insights if coach" ON insights
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM athlete_coach_relationships 
      WHERE athlete_id = insights.user_id 
      AND coach_id = auth.uid() 
      AND status IN ('active', 'approved')
    )
  );

-- Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('insights', 'athlete_coach_relationships')
ORDER BY tablename, policyname; 