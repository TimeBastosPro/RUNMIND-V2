-- SCRIPT PARA IDENTIFICAR TABELAS E VIEWS
-- Este script mostra quais são tabelas reais e quais são views

-- 1. LISTAR TODAS AS TABELAS REAIS
SELECT 
    schemaname,
    tablename,
    'TABLE' as object_type
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. LISTAR TODAS AS VIEWS
SELECT 
    schemaname,
    viewname as tablename,
    'VIEW' as object_type
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 3. VERIFICAR SE RLS JÁ ESTÁ HABILITADO EM ALGUMAS TABELAS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
