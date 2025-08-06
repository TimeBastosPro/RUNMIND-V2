-- =====================================================
-- LIMPEZA DE USUÁRIOS DE TESTE
-- =====================================================

-- 1. Verificar usuários existentes
SELECT 
  id,
  email,
  created_at,
  CASE 
    WHEN email LIKE '%teste%' OR email LIKE '%@teste%' OR email LIKE '%@exemplo%' 
    THEN 'TESTE'
    ELSE 'PRODUÇÃO'
  END as tipo_usuario
FROM auth.users
ORDER BY created_at DESC;

-- 2. Contar usuários de teste
SELECT 
  COUNT(*) as total_usuarios_teste,
  'Usuários com email de teste' as status
FROM auth.users
WHERE email LIKE '%teste%' 
   OR email LIKE '%@teste%' 
   OR email LIKE '%@exemplo%'
   OR email LIKE '%coach%'
   OR email LIKE '%treinador%';

-- 3. Mostrar coaches existentes
SELECT 
  COUNT(*) as total_coaches,
  'Coaches existentes' as status
FROM coaches;

-- 4. Limpar coaches de teste (se houver)
DELETE FROM coaches 
WHERE email LIKE '%teste%' 
   OR email LIKE '%@teste%' 
   OR email LIKE '%@exemplo%'
   OR email LIKE '%coach%'
   OR email LIKE '%treinador%';

-- 5. Limpar usuários de teste (CUIDADO: isso remove permanentemente)
-- DESCOMENTE AS LINHAS ABAIXO APENAS SE QUISER LIMPAR USUÁRIOS DE TESTE
/*
DELETE FROM auth.users
WHERE email LIKE '%teste%' 
   OR email LIKE '%@teste%' 
   OR email LIKE '%@exemplo%'
   OR email LIKE '%coach%'
   OR email LIKE '%treinador%';
*/

-- 6. Verificar resultado após limpeza
SELECT 
  COUNT(*) as usuarios_restantes,
  'Usuários restantes' as status
FROM auth.users;

SELECT 
  COUNT(*) as coaches_restantes,
  'Coaches restantes' as status
FROM coaches; 