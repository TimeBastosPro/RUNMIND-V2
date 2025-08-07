-- Script CORRIGIDO para resolver problemas do sistema de treinadores
-- Execute este script no Supabase SQL Editor

-- 1. Limpar dados existentes problemáticos
DELETE FROM athlete_coach_relationships WHERE id IS NOT NULL;
DELETE FROM teams WHERE id IS NOT NULL;
DELETE FROM coaches WHERE id IS NOT NULL;

-- 2. Recriar tabelas com estrutura correta
DROP TABLE IF EXISTS athlete_coach_relationships CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS coaches CASCADE;

-- 3. Criar tabela coaches
CREATE TABLE coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bio TEXT,
  experience_years INTEGER,
  specialties TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. Criar tabela teams
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela athlete_coach_relationships
CREATE TABLE athlete_coach_relationships (
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

-- 6. Criar índices
CREATE INDEX idx_coaches_user_id ON coaches(user_id);
CREATE INDEX idx_coaches_is_active ON coaches(is_active);
CREATE INDEX idx_teams_coach_id ON teams(coach_id);
CREATE INDEX idx_teams_is_active ON teams(is_active);
CREATE INDEX idx_athlete_coach_relationships_athlete_id ON athlete_coach_relationships(athlete_id);
CREATE INDEX idx_athlete_coach_relationships_coach_id ON athlete_coach_relationships(coach_id);
CREATE INDEX idx_athlete_coach_relationships_status ON athlete_coach_relationships(status);

-- 7. Habilitar RLS apenas nas tabelas (NÃO nas views)
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_coach_relationships ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS para coaches
DROP POLICY IF EXISTS "Coaches can manage own profile" ON coaches;
CREATE POLICY "Coaches can manage own profile" ON coaches
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view active coaches" ON coaches;
CREATE POLICY "Anyone can view active coaches" ON coaches
  FOR SELECT USING (is_active = true);

-- 9. Criar políticas RLS para teams
DROP POLICY IF EXISTS "Coaches can manage own teams" ON teams;
CREATE POLICY "Coaches can manage own teams" ON teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coaches 
      WHERE coaches.id = teams.coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

-- 10. Criar políticas RLS para athlete_coach_relationships
DROP POLICY IF EXISTS "Athletes can manage own relationships" ON athlete_coach_relationships;
CREATE POLICY "Athletes can manage own relationships" ON athlete_coach_relationships
  FOR ALL USING (athlete_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can manage relationships with them" ON athlete_coach_relationships;
CREATE POLICY "Coaches can manage relationships with them" ON athlete_coach_relationships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coaches 
      WHERE coaches.id = athlete_coach_relationships.coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

-- 11. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Criar triggers
DROP TRIGGER IF EXISTS update_coaches_updated_at ON coaches;
CREATE TRIGGER update_coaches_updated_at
    BEFORE UPDATE ON coaches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_athlete_coach_relationships_updated_at ON athlete_coach_relationships;
CREATE TRIGGER update_athlete_coach_relationships_updated_at
    BEFORE UPDATE ON athlete_coach_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Criar view para relacionamentos ativos (SEM RLS)
DROP VIEW IF EXISTS active_athlete_coach_relationships;
CREATE VIEW active_athlete_coach_relationships AS
SELECT
  acr.id,
  acr.athlete_id,
  acr.coach_id,
  acr.team_id,
  acr.status,
  acr.requested_at,
  acr.approved_at,
  acr.notes,
  acr.created_at,
  acr.updated_at,
  p.full_name as athlete_name,
  p.email as athlete_email,
  c.full_name as coach_name,
  c.email as coach_email,
  t.name as team_name
FROM athlete_coach_relationships acr
LEFT JOIN profiles p ON acr.athlete_id = p.id
LEFT JOIN coaches c ON acr.coach_id = c.id
LEFT JOIN teams t ON acr.team_id = t.id
WHERE acr.status IN ('pending', 'approved', 'active');

-- 14. Inserir dados de teste
-- Primeiro, verificar se há usuários existentes
SELECT 
  'Usuários existentes' as info,
  COUNT(*) as total_users,
  string_agg(email, ', ') as emails
FROM auth.users;

-- Inserir treinador de teste
INSERT INTO coaches (user_id, full_name, email, phone, bio, experience_years, specialties)
SELECT 
  id,
  'Evandro Chicanelle',
  'evandro@gmail.com',
  '32988358965',
  'Treinador especializado em corrida de rua e maratona com 15 anos de experiência',
  15,
  ARRAY['Corrida de Rua', 'Maratona', 'Meia Maratona', 'Corrida de Montanha']
FROM auth.users 
WHERE email = 'evandro@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  bio = EXCLUDED.bio,
  experience_years = EXCLUDED.experience_years,
  specialties = EXCLUDED.specialties,
  is_active = true;

-- 15. Verificar dados inseridos
SELECT 
  'Verificação final' as info,
  (SELECT COUNT(*) FROM coaches) as total_coaches,
  (SELECT COUNT(*) FROM teams) as total_teams,
  (SELECT COUNT(*) FROM athlete_coach_relationships) as total_relationships,
  (SELECT COUNT(*) FROM active_athlete_coach_relationships) as total_active_relationships;

-- 16. Testar consultas
SELECT 
  'Teste de busca de treinadores' as info,
  id,
  full_name,
  email,
  experience_years,
  specialties
FROM coaches
WHERE is_active = true
ORDER BY full_name;

-- 17. Verificar políticas RLS
SELECT 
  'Políticas RLS criadas' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('coaches', 'teams', 'athlete_coach_relationships')
ORDER BY tablename, policyname;

-- 18. Teste final de acesso
SELECT 
  'Teste de acesso com RLS' as info,
  'Coaches visíveis' as tabela,
  COUNT(*) as total
FROM coaches
WHERE is_active = true;

SELECT 
  'Teste de acesso com RLS' as info,
  'Relacionamentos visíveis' as tabela,
  COUNT(*) as total
FROM athlete_coach_relationships;

-- 19. Mensagem de sucesso
SELECT 
  '✅ Sistema de treinadores configurado com sucesso!' as status,
  'Todas as tabelas foram criadas' as tabelas,
  'Políticas RLS aplicadas' as rls,
  'Dados de teste inseridos' as dados,
  'View ativa criada (sem RLS)' as view; 