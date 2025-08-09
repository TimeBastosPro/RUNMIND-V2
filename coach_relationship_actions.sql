-- =====================================================
-- Funções de Ações de Relacionamento (Aprovar, Rejeitar, Desativar)
-- Segurança: SECURITY DEFINER com checagens explícitas de autorização
-- Executar no SQL Editor do Supabase
-- =====================================================

-- Aprovar relacionamento (status: pending -> active)
CREATE OR REPLACE FUNCTION public.approve_relationship(
  p_id uuid,
  p_team_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  athlete_id uuid,
  coach_id uuid,
  team_id uuid,
  status text,
  requested_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  -- Autorizar: o usuário logado deve ser o dono do coach do relacionamento e o status deve ser 'pending'
  IF NOT EXISTS (
    SELECT 1
    FROM athlete_coach_relationships acr
    JOIN coaches c ON c.id = acr.coach_id
    WHERE acr.id = p_id
      AND c.user_id = auth.uid()
      AND acr.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Not authorized or invalid status';
  END IF;

  UPDATE athlete_coach_relationships
  SET 
    status = 'active',
    approved_at = NOW(),
    approved_by = (SELECT c.id FROM coaches c JOIN athlete_coach_relationships acr2 ON c.id = acr2.coach_id WHERE acr2.id = p_id),
    team_id = COALESCE(p_team_id, team_id),
    notes = COALESCE(NULLIF(TRIM(p_notes), ''), notes),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO STRICT id, athlete_id, coach_id, team_id, status, requested_at, approved_at, approved_by, notes, created_at, updated_at;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rejeitar relacionamento (status: pending -> rejected)
CREATE OR REPLACE FUNCTION public.reject_relationship(
  p_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  athlete_id uuid,
  coach_id uuid,
  team_id uuid,
  status text,
  requested_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM athlete_coach_relationships acr
    JOIN coaches c ON c.id = acr.coach_id
    WHERE acr.id = p_id
      AND c.user_id = auth.uid()
      AND acr.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Not authorized or invalid status';
  END IF;

  UPDATE athlete_coach_relationships
  SET 
    status = 'rejected',
    notes = COALESCE(NULLIF(TRIM(p_notes), ''), notes),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO STRICT id, athlete_id, coach_id, team_id, status, requested_at, approved_at, approved_by, notes, created_at, updated_at;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Desativar relacionamento (status: active -> inactive)
CREATE OR REPLACE FUNCTION public.deactivate_relationship(
  p_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  athlete_id uuid,
  coach_id uuid,
  team_id uuid,
  status text,
  requested_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM athlete_coach_relationships acr
    JOIN coaches c ON c.id = acr.coach_id
    WHERE acr.id = p_id
      AND c.user_id = auth.uid()
      AND acr.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized or invalid status';
  END IF;

  UPDATE athlete_coach_relationships
  SET 
    status = 'inactive',
    notes = COALESCE(NULLIF(TRIM(p_notes), ''), notes),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO STRICT id, athlete_id, coach_id, team_id, status, requested_at, approved_at, approved_by, notes, created_at, updated_at;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Observação: estas funções executam com privilégio do owner e não sofrem RLS,
-- porém mantêm validação de autorização via coaches.user_id = auth.uid().