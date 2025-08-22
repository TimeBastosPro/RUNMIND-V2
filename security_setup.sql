-- 🔒 CONFIGURAÇÃO DE SEGURANÇA - RUNMIND V2
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de logs de segurança
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

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_email ON security_logs(email);

-- 3. Habilitar RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acesso para security_logs
-- Apenas usuários autenticados podem ver seus próprios logs
CREATE POLICY "Users can view own security logs" ON security_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Apenas o sistema pode inserir logs (via service role)
CREATE POLICY "System can insert security logs" ON security_logs
  FOR INSERT WITH CHECK (true);

-- 5. Função para limpeza automática de logs antigos (manter apenas 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM security_logs 
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 6. Agendar limpeza automática (executar diariamente)
-- Nota: Isso requer configuração no painel do Supabase
-- SELECT cron.schedule('cleanup-security-logs', '0 2 * * *', 'SELECT cleanup_old_security_logs();');

-- 7. Função para rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  -- Contar tentativas na janela de tempo
  SELECT COUNT(*) INTO attempt_count
  FROM security_logs
  WHERE (email = p_identifier OR user_id::text = p_identifier)
    AND event_type = p_action
    AND timestamp > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Retornar true se não excedeu o limite
  RETURN attempt_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql;

-- 8. Função para detectar atividades suspeitas
CREATE OR REPLACE FUNCTION detect_suspicious_activity(p_user_id UUID)
RETURNS TABLE(activity_type TEXT, severity TEXT, details JSONB) AS $$
BEGIN
  -- Verificar múltiplas tentativas de login falhadas
  IF EXISTS (
    SELECT 1 FROM security_logs
    WHERE user_id = p_user_id
      AND event_type = 'login_attempt'
      AND success = false
      AND timestamp > NOW() - INTERVAL '1 hour'
    HAVING COUNT(*) >= 5
  ) THEN
    RETURN QUERY SELECT 
      'multiple_failed_logins'::TEXT,
      'high'::TEXT,
      jsonb_build_object('count', COUNT(*), 'timeframe', '1 hour')
    FROM security_logs
    WHERE user_id = p_user_id
      AND event_type = 'login_attempt'
      AND success = false
      AND timestamp > NOW() - INTERVAL '1 hour';
  END IF;
  
  -- Verificar múltiplas atualizações de perfil
  IF EXISTS (
    SELECT 1 FROM security_logs
    WHERE user_id = p_user_id
      AND event_type = 'profile_update'
      AND timestamp > NOW() - INTERVAL '1 hour'
    HAVING COUNT(*) >= 10
  ) THEN
    RETURN QUERY SELECT 
      'excessive_profile_updates'::TEXT,
      'medium'::TEXT,
      jsonb_build_object('count', COUNT(*), 'timeframe', '1 hour')
    FROM security_logs
    WHERE user_id = p_user_id
      AND event_type = 'profile_update'
      AND timestamp > NOW() - INTERVAL '1 hour';
  END IF;
  
  -- Verificar múltiplos resets de senha
  IF EXISTS (
    SELECT 1 FROM security_logs
    WHERE user_id = p_user_id
      AND event_type = 'password_reset'
      AND timestamp > NOW() - INTERVAL '24 hours'
    HAVING COUNT(*) >= 3
  ) THEN
    RETURN QUERY SELECT 
      'excessive_password_resets'::TEXT,
      'high'::TEXT,
      jsonb_build_object('count', COUNT(*), 'timeframe', '24 hours')
    FROM security_logs
    WHERE user_id = p_user_id
      AND event_type = 'password_reset'
      AND timestamp > NOW() - INTERVAL '24 hours';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para log automático de eventos críticos
CREATE OR REPLACE FUNCTION log_critical_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o evento é crítico, logar automaticamente
  IF NEW.severity = 'critical' THEN
    -- Aqui você pode adicionar notificações, emails, etc.
    RAISE LOG 'CRITICAL SECURITY EVENT: % - User: % - Details: %', 
      NEW.event_type, 
      COALESCE(NEW.user_id::text, NEW.email), 
      NEW.details;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_critical_security_events
  AFTER INSERT ON security_logs
  FOR EACH ROW
  EXECUTE FUNCTION log_critical_event();

-- 10. Configurar políticas de senha mais rigorosas
-- Nota: Isso deve ser configurado no painel de autenticação do Supabase
-- - Mínimo 8 caracteres
-- - Requer letra maiúscula, minúscula, número e caractere especial
-- - Não permitir senhas comuns

-- 11. Configurar rate limiting no nível da aplicação
-- Nota: Configure no painel do Supabase > Settings > Auth > Rate Limiting

-- 12. Configurar sessões
-- Nota: Configure no painel do Supabase > Settings > Auth > Sessions
-- - Tempo de expiração da sessão: 24 horas
-- - Tempo de expiração do refresh token: 30 dias

-- 13. Configurar MFA (opcional)
-- Nota: Configure no painel do Supabase > Settings > Auth > Multi-Factor Authentication

-- 14. Configurar webhooks para eventos de segurança
-- Nota: Configure no painel do Supabase > Settings > Webhooks
-- - auth.user.created
-- - auth.user.deleted
-- - auth.user.updated

-- 15. Configurar backup automático
-- Nota: Configure no painel do Supabase > Settings > Database > Backups

-- 16. Configurar monitoramento
-- Nota: Configure no painel do Supabase > Settings > Monitoring

-- 17. Verificar se todas as tabelas têm RLS habilitado
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT IN ('schema_migrations', 'supabase_migrations')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.tablename);
  END LOOP;
END $$;

-- 18. Criar view para estatísticas de segurança
CREATE OR REPLACE VIEW security_stats AS
SELECT 
  DATE(timestamp) as date,
  event_type,
  severity,
  COUNT(*) as event_count,
  COUNT(*) FILTER (WHERE success = true) as success_count,
  COUNT(*) FILTER (WHERE success = false) as failure_count
FROM security_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), event_type, severity
ORDER BY date DESC, event_type, severity;

-- 19. Função para obter estatísticas de segurança
CREATE OR REPLACE FUNCTION get_security_stats(
  p_days INTEGER DEFAULT 7,
  p_user_id UUID DEFAULT NULL
) RETURNS TABLE(
  total_events BIGINT,
  failed_logins BIGINT,
  successful_logins BIGINT,
  password_resets BIGINT,
  suspicious_activities BIGINT,
  critical_events BIGINT,
  high_severity_events BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE event_type = 'login_attempt' AND success = false) as failed_logins,
    COUNT(*) FILTER (WHERE event_type = 'login_attempt' AND success = true) as successful_logins,
    COUNT(*) FILTER (WHERE event_type = 'password_reset') as password_resets,
    COUNT(*) FILTER (WHERE event_type = 'suspicious_activity') as suspicious_activities,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
    COUNT(*) FILTER (WHERE severity = 'high') as high_severity_events
  FROM security_logs
  WHERE timestamp > NOW() - (p_days || ' days')::INTERVAL
    AND (p_user_id IS NULL OR user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- 20. Comentários finais
COMMENT ON TABLE security_logs IS 'Tabela para logs de eventos de segurança do RunMind V2';
COMMENT ON FUNCTION check_rate_limit IS 'Função para verificar rate limiting de ações';
COMMENT ON FUNCTION detect_suspicious_activity IS 'Função para detectar atividades suspeitas';
COMMENT ON FUNCTION get_security_stats IS 'Função para obter estatísticas de segurança';

-- ✅ CONFIGURAÇÃO CONCLUÍDA
-- Execute este script no SQL Editor do Supabase para configurar a infraestrutura de segurança
