-- Script para corrigir políticas RLS da tabela coaches
-- Problema: Treinadores não aparecem na busca devido a políticas RLS restritivas

-- 1. Verificar políticas RLS atuais
SELECT
  'Políticas RLS atuais da tabela coaches' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'coaches'
ORDER BY policyname;

-- 2. Remover políticas RLS existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Coaches can view own profile" ON coaches;
DROP POLICY IF EXISTS "Coaches can insert own profile" ON coaches;
DROP POLICY IF EXISTS "Coaches can update own profile" ON coaches;
DROP POLICY IF EXISTS "Coaches can delete own profile" ON coaches;
DROP POLICY IF EXISTS "Athletes can view coaches" ON coaches;
DROP POLICY IF EXISTS "Public can view active coaches" ON coaches;

-- 3. Criar políticas RLS corretas para permitir busca de treinadores

-- Política para treinadores verem e gerenciarem seu próprio perfil
CREATE POLICY "Coaches can manage own profile" ON coaches
  FOR ALL USING (auth.uid() = user_id);

-- Política para atletas e usuários autenticados verem treinadores ativos
CREATE POLICY "Authenticated users can view active coaches" ON coaches
  FOR SELECT USING (
    auth.role() = 'authenticated' 
    AND is_active = true
  );

-- Política para permitir inserção de perfil de treinador
CREATE POLICY "Users can create coach profile" ON coaches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir atualização de perfil de treinador
CREATE POLICY "Coaches can update own profile" ON coaches
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir exclusão de perfil de treinador
CREATE POLICY "Coaches can delete own profile" ON coaches
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Verificar se o RLS está habilitado
SELECT
  'Verificando se RLS está habilitado' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'coaches';

-- 5. Habilitar RLS se não estiver habilitado
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- 6. Verificar políticas RLS criadas
SELECT
  'Políticas RLS após correção' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'coaches'
ORDER BY policyname;

-- 7. Testar se a busca funciona agora
SELECT
  'Teste de busca após correção' as info,
  COUNT(*) as total_treinadores_visiveis
FROM coaches
WHERE is_active = true;

-- 8. Testar busca específica por Evandro
SELECT
  'Teste de busca por Evandro após correção' as info,
  id,
  full_name,
  email,
  is_active
FROM coaches
WHERE full_name ILIKE '%evandro%' AND is_active = true
ORDER BY full_name;

-- 9. Verificar se há treinadores ativos
SELECT
  'Treinadores ativos disponíveis' as info,
  id,
  full_name,
  email,
  is_active
FROM coaches
WHERE is_active = true
ORDER BY full_name;

-- 10. Verificar se o usuário atual tem permissão
SELECT
  'Verificação de permissões do usuário atual' as info,
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 11. Testar acesso como usuário autenticado
SELECT
  'Teste de acesso como usuário autenticado' as info,
  'Se esta query retornar dados, as políticas estão funcionando' as note;

-- 12. Verificar se há problemas com a coluna is_active
SELECT
  'Verificação da coluna is_active' as info,
  is_active,
  COUNT(*) as quantidade
FROM coaches
GROUP BY is_active;

-- 13. Atualizar treinadores para garantir que estão ativos (se necessário)
-- UPDATE coaches SET is_active = true WHERE is_active IS NULL OR is_active = false;

-- 14. Verificar se há problemas com a coluna user_id
SELECT
  'Verificação da coluna user_id' as info,
  CASE 
    WHEN user_id IS NULL THEN 'user_id é NULL'
    ELSE 'user_id está preenchido'
  END as status,
  COUNT(*) as quantidade
FROM coaches
GROUP BY CASE 
  WHEN user_id IS NULL THEN 'user_id é NULL'
  ELSE 'user_id está preenchido'
END;

-- 15. Verificar relacionamento com auth.users
SELECT
  'Verificação de relacionamento com auth.users' as info,
  c.id,
  c.full_name,
  c.user_id,
  u.id as auth_user_id,
  u.email as auth_email,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Relacionamento válido'
    ELSE '❌ Relacionamento inválido'
  END as status
FROM coaches c
LEFT JOIN auth.users u ON c.user_id = u.id
ORDER BY c.full_name; 