-- Script para criar tabelas de ciclos no banco remoto
-- Execute este script no SQL Editor do Supabase Dashboard

-- ========================================
-- TABELAS DE CICLOS DE TREINAMENTO
-- ========================================

-- Tabela de Macrociclos (períodos longos - meses/anos)
CREATE TABLE IF NOT EXISTS public.macrociclos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goal TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Mesociclos (períodos médios - semanas/meses)
CREATE TABLE IF NOT EXISTS public.mesociclos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  macrociclo_id UUID REFERENCES public.macrociclos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  focus TEXT, -- foco do mesociclo (base, força, velocidade, etc.)
  intensity_level TEXT CHECK (intensity_level IN ('baixa', 'moderada', 'alta', 'muito_alta')),
  volume_level TEXT CHECK (volume_level IN ('baixo', 'moderado', 'alto', 'muito_alto')),
  mesociclo_type TEXT CHECK (mesociclo_type IN ('base', 'desenvolvimento', 'estabilizador', 'especifico', 'pre_competitivo', 'polimento', 'competitivo', 'transicao', 'recuperativo')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Microciclos (períodos curtos - semanas)
CREATE TABLE IF NOT EXISTS public.microciclos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mesociclo_id UUID REFERENCES public.mesociclos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  week_number INTEGER, -- número da semana no mesociclo
  focus TEXT, -- foco específico da semana
  intensity_level TEXT CHECK (intensity_level IN ('baixa', 'moderada', 'alta', 'muito_alta')),
  volume_level TEXT CHECK (volume_level IN ('baixo', 'moderado', 'alto', 'muito_alto')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões de treino vinculadas aos ciclos
CREATE TABLE IF NOT EXISTS public.cycle_training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  training_session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  microciclo_id UUID REFERENCES public.microciclos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = domingo, 6 = sábado
  week_number INTEGER, -- semana no microciclo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE public.macrociclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesociclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_training_sessions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS RLS PARA MACROCICLOS
-- ========================================

-- Política para visualizar macrociclos próprios ou de atletas (se treinador)
CREATE POLICY "Users can view own macrociclos or athlete macrociclos if coach" ON public.macrociclos
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.athlete_coach_relationships 
      WHERE athlete_id = public.macrociclos.user_id 
      AND coach_id = auth.uid() 
      AND status IN ('active', 'approved')
    )
  );

-- Política para inserir macrociclos próprios
CREATE POLICY "Users can insert own macrociclos" ON public.macrociclos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para atualizar macrociclos próprios
CREATE POLICY "Users can update own macrociclos" ON public.macrociclos
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para deletar macrociclos próprios
CREATE POLICY "Users can delete own macrociclos" ON public.macrociclos
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- POLÍTICAS RLS PARA MESOCICLOS
-- ========================================

-- Política para visualizar mesociclos próprios ou de atletas (se treinador)
CREATE POLICY "Users can view own mesociclos or athlete mesociclos if coach" ON public.mesociclos
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.athlete_coach_relationships 
      WHERE athlete_id = public.mesociclos.user_id 
      AND coach_id = auth.uid() 
      AND status IN ('active', 'approved')
    )
  );

-- Política para inserir mesociclos próprios
CREATE POLICY "Users can insert own mesociclos" ON public.mesociclos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para atualizar mesociclos próprios
CREATE POLICY "Users can update own mesociclos" ON public.mesociclos
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para deletar mesociclos próprios
CREATE POLICY "Users can delete own mesociclos" ON public.mesociclos
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- POLÍTICAS RLS PARA MICROCICLOS
-- ========================================

-- Política para visualizar microciclos próprios ou de atletas (se treinador)
CREATE POLICY "Users can view own microciclos or athlete microciclos if coach" ON public.microciclos
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.athlete_coach_relationships 
      WHERE athlete_id = public.microciclos.user_id 
      AND coach_id = auth.uid() 
      AND status IN ('active', 'approved')
    )
  );

-- Política para inserir microciclos próprios
CREATE POLICY "Users can insert own microciclos" ON public.microciclos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para atualizar microciclos próprios
CREATE POLICY "Users can update own microciclos" ON public.microciclos
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para deletar microciclos próprios
CREATE POLICY "Users can delete own microciclos" ON public.microciclos
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- POLÍTICAS RLS PARA SESSÕES DE TREINO EM CICLOS
-- ========================================

-- Política para visualizar sessões próprias ou de atletas (se treinador)
CREATE POLICY "Users can view own cycle training sessions or athlete sessions if coach" ON public.cycle_training_sessions
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.athlete_coach_relationships 
      WHERE athlete_id = public.cycle_training_sessions.user_id 
      AND coach_id = auth.uid() 
      AND status IN ('active', 'approved')
    )
  );

-- Política para inserir sessões próprias
CREATE POLICY "Users can insert own cycle training sessions" ON public.cycle_training_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para atualizar sessões próprias
CREATE POLICY "Users can update own cycle training sessions" ON public.cycle_training_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para deletar sessões próprias
CREATE POLICY "Users can delete own cycle training sessions" ON public.cycle_training_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para macrociclos
CREATE INDEX IF NOT EXISTS idx_macrociclos_user_id ON public.macrociclos(user_id);
CREATE INDEX IF NOT EXISTS idx_macrociclos_dates ON public.macrociclos(start_date, end_date);

-- Índices para mesociclos
CREATE INDEX IF NOT EXISTS idx_mesociclos_user_id ON public.mesociclos(user_id);
CREATE INDEX IF NOT EXISTS idx_mesociclos_macrociclo_id ON public.mesociclos(macrociclo_id);
CREATE INDEX IF NOT EXISTS idx_mesociclos_dates ON public.mesociclos(start_date, end_date);

-- Índices para microciclos
CREATE INDEX IF NOT EXISTS idx_microciclos_user_id ON public.microciclos(user_id);
CREATE INDEX IF NOT EXISTS idx_microciclos_mesociclo_id ON public.microciclos(mesociclo_id);
CREATE INDEX IF NOT EXISTS idx_microciclos_dates ON public.microciclos(start_date, end_date);

-- Índices para sessões de treino em ciclos
CREATE INDEX IF NOT EXISTS idx_cycle_training_sessions_user_id ON public.cycle_training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cycle_training_sessions_microciclo_id ON public.cycle_training_sessions(microciclo_id);
CREATE INDEX IF NOT EXISTS idx_cycle_training_sessions_training_session_id ON public.cycle_training_sessions(training_session_id);

-- ========================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================

-- Trigger para macrociclos
CREATE OR REPLACE FUNCTION update_macrociclos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_macrociclos_updated_at
  BEFORE UPDATE ON public.macrociclos
  FOR EACH ROW
  EXECUTE FUNCTION update_macrociclos_updated_at();

-- Trigger para mesociclos
CREATE OR REPLACE FUNCTION update_mesociclos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mesociclos_updated_at
  BEFORE UPDATE ON public.mesociclos
  FOR EACH ROW
  EXECUTE FUNCTION update_mesociclos_updated_at();

-- Trigger para microciclos
CREATE OR REPLACE FUNCTION update_microciclos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_microciclos_updated_at
  BEFORE UPDATE ON public.microciclos
  FOR EACH ROW
  EXECUTE FUNCTION update_microciclos_updated_at();

-- ========================================
-- VERIFICAÇÕES FINAIS
-- ========================================

-- Verificar se as tabelas foram criadas
SELECT 'macrociclos' as table_name, COUNT(*) as row_count FROM public.macrociclos
UNION ALL
SELECT 'mesociclos' as table_name, COUNT(*) as row_count FROM public.mesociclos
UNION ALL
SELECT 'microciclos' as table_name, COUNT(*) as row_count FROM public.microciclos
UNION ALL
SELECT 'cycle_training_sessions' as table_name, COUNT(*) as row_count FROM public.cycle_training_sessions;
