-- SCRIPT PARA LIMPAR USUÁRIOS DO SUPABASE AUTH
-- ⚠️ ATENÇÃO: Este script apaga TODOS os usuários do sistema de autenticação!

-- 1. VERIFICAR USUÁRIOS EXISTENTES NO AUTH
SELECT 
  'USUÁRIOS NO AUTH' as categoria,
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at;

-- 2. APAGAR TODOS OS USUÁRIOS DO AUTH
-- ⚠️ CUIDADO: Isso apaga TODOS os usuários do sistema!
DELETE FROM auth.users;

-- 3. VERIFICAR SE OS USUÁRIOS FORAM REMOVIDOS
SELECT 
  'VERIFICAÇÃO AUTH' as categoria,
  COUNT(*) as usuarios_restantes
FROM auth.users;

-- 4. LIMPAR SESSÕES ATIVAS (se necessário)
DELETE FROM auth.sessions;

-- 5. VERIFICAR SESSÕES
SELECT 
  'VERIFICAÇÃO SESSÕES' as categoria,
  COUNT(*) as sessoes_restantes
FROM auth.sessions;
