-- Script para verificar problemas com o botão de desvincular
-- Execute este script no Supabase SQL Editor

-- 1. Verificar relacionamentos ativos do usuário
SELECT 
  'Relacionamentos ativos' as etapa,
  COUNT(*) as total_ativos
FROM athlete_coach_relationships 
WHERE status = 'active';

-- 2. Verificar relacionamentos do usuário atual (substitua pelo user_id correto)
-- SELECT 
--   'Relacionamentos do usuário' as etapa,
--   id,
--   athlete_id,
--   coach_id,
--   status,
--   created_at,
--   updated_at
-- FROM athlete_coach_relationships 
-- WHERE athlete_id = 'SEU_USER_ID_AQUI'
-- ORDER BY created_at DESC;

-- 3. Verificar se há relacionamentos com status 'inactive'
SELECT 
  'Relacionamentos inativos' as etapa,
  COUNT(*) as total_inativos
FROM athlete_coach_relationships 
WHERE status = 'inactive';

-- 4. Verificar estrutura da tabela
SELECT 
  'Estrutura da tabela' as etapa,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'athlete_coach_relationships'
ORDER BY ordinal_position;

-- 5. Verificar políticas RLS da tabela
SELECT 
  'Políticas RLS' as etapa,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'athlete_coach_relationships'
ORDER BY policyname;

-- 6. Verificar se o RLS está habilitado
SELECT 
  'Status RLS' as etapa,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'athlete_coach_relationships';

-- 7. Testar update manual (substitua pelos IDs corretos)
-- UPDATE athlete_coach_relationships 
-- SET status = 'inactive', updated_at = NOW()
-- WHERE id = 'RELATIONSHIP_ID_AQUI' 
-- AND athlete_id = 'USER_ID_AQUI'
-- RETURNING *;

-- 8. Verificar se há triggers na tabela
SELECT 
  'Triggers' as etapa,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'athlete_coach_relationships';

-- 9. Recomendações
SELECT 
  'Recomendações' as etapa,
  '1. Verificar se o relationship_id está correto' as rec1,
  '2. Verificar se o usuário tem permissão para atualizar' as rec2,
  '3. Verificar se as políticas RLS estão corretas' as rec3,
  '4. Verificar se não há triggers impedindo o update' as rec4,
  '5. Verificar se o status atual é "active"' as rec5;
