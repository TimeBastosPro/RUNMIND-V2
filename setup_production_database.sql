-- 🚀 CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS PARA PRODUÇÃO
-- Execute este script no SQL Editor do Supabase para configurar o banco para múltiplos usuários

-- =====================================================
-- 1. CONFIGURAÇÃO DE SEGURANÇA
-- =====================================================

-- Criar tabela de logs de segurança
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  details JSONB,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_email ON security_logs(email);

-- Habilitar RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para security_logs
CREATE POLICY "Users can view own security logs" ON security_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all security logs" ON security_logs
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 2. CONFIGURAÇÃO DE PERFORMANCE
-- =====================================================

-- Função para limpar logs antigos (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM security_logs 
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_event_type TEXT,
  p_time_window_minutes INTEGER DEFAULT 5,
  p_max_attempts INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM security_logs
  WHERE user_id = p_user_id
    AND event_type = p_event_type
    AND timestamp > NOW() - INTERVAL '1 minute' * p_time_window_minutes
    AND success = false;
  
  RETURN attempt_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. CONFIGURAÇÃO DE MONITORAMENTO
-- =====================================================

-- Função para log de eventos de segurança
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_details JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'low'
)
RETURNS void AS $$
BEGIN
  INSERT INTO security_logs (
    event_type,
    user_id,
    email,
    success,
    details,
    severity
  ) VALUES (
    p_event_type,
    p_user_id,
    p_email,
    p_success,
    p_details,
    p_severity
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CONFIGURAÇÃO DE BACKUP E RECUPERAÇÃO
-- =====================================================

-- Função para backup de dados críticos
CREATE OR REPLACE FUNCTION backup_critical_data()
RETURNS void AS $$
BEGIN
  -- Criar backup das configurações de usuário
  CREATE TABLE IF NOT EXISTS user_backups AS
  SELECT 
    u.id,
    u.email,
    p.full_name,
    p.created_at,
    NOW() as backup_date
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  WHERE u.created_at > NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CONFIGURAÇÃO DE ESCALABILIDADE
-- =====================================================

-- Otimizar queries frequentes
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date ON training_sessions(user_id, training_date);

-- Configurar particionamento para tabelas grandes (futuro)
-- CREATE TABLE daily_checkins_partitioned (
--   LIKE daily_checkins INCLUDING ALL
-- ) PARTITION BY RANGE (date);

-- =====================================================
-- 6. CONFIGURAÇÃO DE ALERTAS
-- =====================================================

-- Função para detectar atividades suspeitas
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TABLE (
  user_id UUID,
  event_count BIGINT,
  severity TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.user_id,
    COUNT(*) as event_count,
    CASE 
      WHEN COUNT(*) > 50 THEN 'critical'
      WHEN COUNT(*) > 20 THEN 'high'
      WHEN COUNT(*) > 10 THEN 'medium'
      ELSE 'low'
    END as severity
  FROM security_logs sl
  WHERE sl.timestamp > NOW() - INTERVAL '1 hour'
    AND sl.success = false
  GROUP BY sl.user_id
  HAVING COUNT(*) > 5;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CONFIGURAÇÃO DE LIMPEZA AUTOMÁTICA
-- =====================================================

-- Função para limpeza automática de dados antigos
CREATE OR REPLACE FUNCTION auto_cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Limpar logs de segurança antigos
  DELETE FROM security_logs 
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Limpar dados de teste antigos
  DELETE FROM daily_checkins 
  WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email LIKE '%@test.com' 
    AND created_at < NOW() - INTERVAL '30 days'
  );
  
  -- Limpar sessões expiradas
  DELETE FROM auth.sessions 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. CONFIGURAÇÃO DE MONITORAMENTO DE PERFORMANCE
-- =====================================================

-- Função para monitorar performance do banco
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    ROUND(pg_total_relation_size(schemaname||'.'||tablename) / 1024.0 / 1024.0, 2) as size_mb
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY size_mb DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. CONFIGURAÇÃO DE SEGURANÇA AVANÇADA
-- =====================================================

-- Função para verificar integridade dos dados
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE (
  issue_type TEXT,
  count BIGINT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Verificar usuários órfãos
  SELECT 
    'orphaned_users' as issue_type,
    COUNT(*) as count,
    'Users without profiles' as details
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  WHERE p.id IS NULL;
  
  -- Verificar check-ins órfãos
  UNION ALL
  SELECT 
    'orphaned_checkins' as issue_type,
    COUNT(*) as count,
    'Check-ins without valid users' as details
  FROM daily_checkins dc
  LEFT JOIN auth.users u ON dc.user_id = u.id
  WHERE u.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. CONFIGURAÇÃO DE NOTIFICAÇÕES
-- =====================================================

-- Função para enviar alertas de segurança
CREATE OR REPLACE FUNCTION send_security_alert(
  p_severity TEXT,
  p_message TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Log do alerta
  INSERT INTO security_logs (
    event_type,
    user_id,
    success,
    details,
    severity
  ) VALUES (
    'security_alert',
    p_user_id,
    true,
    jsonb_build_object('message', p_message),
    p_severity
  );
  
  -- Aqui você pode adicionar integração com serviços de notificação
  -- como email, Slack, Discord, etc.
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. CONFIGURAÇÃO DE BACKUP AUTOMÁTICO
-- =====================================================

-- Função para backup automático
CREATE OR REPLACE FUNCTION schedule_automatic_backup()
RETURNS void AS $$
BEGIN
  -- Executar backup de dados críticos
  PERFORM backup_critical_data();
  
  -- Executar limpeza automática
  PERFORM auto_cleanup_old_data();
  
  -- Log da execução
  PERFORM log_security_event(
    'automatic_backup',
    NULL,
    NULL,
    true,
    jsonb_build_object('timestamp', NOW()),
    'low'
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 12. CONFIGURAÇÃO DE MONITORAMENTO EM TEMPO REAL
-- =====================================================

-- Função para dashboard de monitoramento
CREATE OR REPLACE FUNCTION get_monitoring_dashboard()
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Total de usuários ativos
  SELECT 
    'active_users' as metric_name,
    COUNT(*)::NUMERIC as metric_value,
    CASE 
      WHEN COUNT(*) > 1000 THEN 'high'
      WHEN COUNT(*) > 100 THEN 'medium'
      ELSE 'low'
    END as status
  FROM auth.users
  WHERE created_at > NOW() - INTERVAL '30 days'
  
  UNION ALL
  
  -- Total de check-ins hoje
  SELECT 
    'checkins_today' as metric_name,
    COUNT(*)::NUMERIC as metric_value,
    CASE 
      WHEN COUNT(*) > 1000 THEN 'high'
      WHEN COUNT(*) > 100 THEN 'medium'
      ELSE 'low'
    END as status
  FROM daily_checkins
  WHERE date = CURRENT_DATE
  
  UNION ALL
  
  -- Tentativas de login falhadas hoje
  SELECT 
    'failed_logins_today' as metric_name,
    COUNT(*)::NUMERIC as metric_value,
    CASE 
      WHEN COUNT(*) > 100 THEN 'critical'
      WHEN COUNT(*) > 50 THEN 'high'
      WHEN COUNT(*) > 10 THEN 'medium'
      ELSE 'low'
    END as status
  FROM security_logs
  WHERE event_type = 'login_attempt'
    AND success = false
    AND timestamp > CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 13. CONFIGURAÇÃO DE ESCALABILIDADE
-- =====================================================

-- Função para otimizar performance
CREATE OR REPLACE FUNCTION optimize_database_performance()
RETURNS void AS $$
BEGIN
  -- Atualizar estatísticas
  ANALYZE;
  
  -- Reindexar tabelas críticas
  REINDEX TABLE profiles;
  REINDEX TABLE daily_checkins;
  REINDEX TABLE training_sessions;
  REINDEX TABLE security_logs;
  
  -- Log da otimização
  PERFORM log_security_event(
    'database_optimization',
    NULL,
    NULL,
    true,
    jsonb_build_object('timestamp', NOW()),
    'low'
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 14. CONFIGURAÇÃO DE ALERTAS AUTOMÁTICOS
-- =====================================================

-- Função para verificar saúde do sistema
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  message TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Verificar espaço em disco
  SELECT 
    'disk_space' as check_name,
    CASE 
      WHEN pg_database_size(current_database()) > 1000000000 THEN 'warning'
      ELSE 'ok'
    END as status,
    'Database size: ' || ROUND(pg_database_size(current_database()) / 1024.0 / 1024.0, 2) || ' MB' as message
  
  UNION ALL
  
  -- Verificar conexões ativas
  SELECT 
    'active_connections' as check_name,
    CASE 
      WHEN (SELECT count(*) FROM pg_stat_activity) > 50 THEN 'warning'
      ELSE 'ok'
    END as status,
    'Active connections: ' || (SELECT count(*) FROM pg_stat_activity) as message
  
  UNION ALL
  
  -- Verificar logs de erro recentes
  SELECT 
    'error_logs' as check_name,
    CASE 
      WHEN COUNT(*) > 10 THEN 'critical'
      WHEN COUNT(*) > 5 THEN 'warning'
      ELSE 'ok'
    END as status,
    'Error logs in last hour: ' || COUNT(*) as message
  FROM security_logs
  WHERE severity IN ('high', 'critical')
    AND timestamp > NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 15. CONFIGURAÇÃO FINAL
-- =====================================================

-- Criar usuário para monitoramento (opcional)
-- CREATE USER monitoring_user WITH PASSWORD 'secure_password';
-- GRANT SELECT ON security_logs TO monitoring_user;
-- GRANT EXECUTE ON FUNCTION get_monitoring_dashboard() TO monitoring_user;

-- Configurar limpeza automática (executar via cron job)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT auto_cleanup_old_data();');
-- SELECT cron.schedule('backup-critical-data', '0 3 * * *', 'SELECT backup_critical_data();');
-- SELECT cron.schedule('optimize-performance', '0 4 * * 0', 'SELECT optimize_database_performance();');

-- =====================================================
-- 16. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as configurações foram aplicadas
DO $$
BEGIN
  RAISE NOTICE '✅ Configuração de produção concluída com sucesso!';
  RAISE NOTICE '📊 Total de tabelas: %', (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public');
  RAISE NOTICE '🔒 Total de políticas RLS: %', (SELECT count(*) FROM pg_policies);
  RAISE NOTICE '⚡ Total de índices: %', (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public');
  RAISE NOTICE '🚀 Sistema pronto para múltiplos usuários!';
END $$;
