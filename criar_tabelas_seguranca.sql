-- CRIAR TABELAS DE SEGURANÇA
-- Este script cria as tabelas necessárias para o sistema de segurança robusto

-- 1. TABELA DE LOGS DE SEGURANÇA
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  details JSONB,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  location_data JSONB,
  session_id TEXT,
  device_info JSONB,
  network_info JSONB
);

-- 2. TABELA DE ALERTAS DE SEGURANÇA
CREATE TABLE IF NOT EXISTS security_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('suspicious_login', 'multiple_failures', 'unusual_activity', 'rate_limit', 'data_breach')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- 3. TABELA DE RATE LIMITING
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action_type TEXT NOT NULL,
  attempts_count INTEGER DEFAULT 1,
  first_attempt TIMESTAMPTZ DEFAULT NOW(),
  last_attempt TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE SESSÕES ATIVAS
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- 5. TABELA DE RECUPERAÇÃO DE SENHA
CREATE TABLE IF NOT EXISTS password_recovery_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_email ON security_logs(email);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);

CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_timestamp ON security_alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON security_alerts(resolved);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_action_type ON rate_limits(action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked_until ON rate_limits(blocked_until);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_id ON active_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at ON active_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_password_recovery_email ON password_recovery_requests(email);
CREATE INDEX IF NOT EXISTS idx_password_recovery_request_id ON password_recovery_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_password_recovery_expires_at ON password_recovery_requests(expires_at);

-- POLÍTICAS RLS (ROW LEVEL SECURITY)
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_recovery_requests ENABLE ROW LEVEL SECURITY;

-- Política para security_logs: Usuários podem ver apenas seus próprios logs
CREATE POLICY "Users can view own security logs" ON security_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Política para security_alerts: Usuários podem ver apenas seus próprios alertas
CREATE POLICY "Users can view own security alerts" ON security_alerts
  FOR SELECT USING (auth.uid() = user_id);

-- Política para rate_limits: Apenas o sistema pode acessar
CREATE POLICY "System can manage rate limits" ON rate_limits
  FOR ALL USING (false);

-- Política para active_sessions: Usuários podem ver apenas suas próprias sessões
CREATE POLICY "Users can view own active sessions" ON active_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Política para password_recovery_requests: Apenas o sistema pode acessar
CREATE POLICY "System can manage password recovery" ON password_recovery_requests
  FOR ALL USING (false);

-- FUNÇÕES AUXILIARES

-- Função para limpar logs antigos (mais de 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM security_logs 
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  DELETE FROM security_alerts 
  WHERE timestamp < NOW() - INTERVAL '30 days' AND resolved = true;
  
  DELETE FROM rate_limits 
  WHERE last_attempt < NOW() - INTERVAL '7 days';
  
  DELETE FROM active_sessions 
  WHERE expires_at < NOW();
  
  DELETE FROM password_recovery_requests 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de segurança
CREATE OR REPLACE FUNCTION get_security_stats(user_uuid UUID, days_count INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalEvents', COUNT(*),
    'failedLogins', COUNT(*) FILTER (WHERE event_type = 'login_attempt' AND success = false),
    'successfulLogins', COUNT(*) FILTER (WHERE event_type = 'login_attempt' AND success = true),
    'suspiciousActivities', COUNT(*) FILTER (WHERE event_type = 'suspicious_activity'),
    'criticalEvents', COUNT(*) FILTER (WHERE severity = 'critical'),
    'highSeverityEvents', COUNT(*) FILTER (WHERE severity = 'high'),
    'lastLogin', MAX(timestamp) FILTER (WHERE event_type = 'login_attempt' AND success = true)
  ) INTO result
  FROM security_logs
  WHERE user_id = user_uuid 
    AND timestamp >= NOW() - (days_count || ' days')::INTERVAL;
  
  RETURN COALESCE(result, '{}'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Função para registrar evento de segurança
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT false,
  p_details JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO security_logs (
    event_type, user_id, email, success, details, severity
  ) VALUES (
    p_event_type, p_user_id, p_email, p_success, p_details, p_severity
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS PARA MANUTENÇÃO AUTOMÁTICA

-- Trigger para atualizar updated_at em rate_limits
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limits_updated_at();

-- Trigger para atualizar last_activity em active_sessions
CREATE OR REPLACE FUNCTION update_active_sessions_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_active_sessions_last_activity
  BEFORE UPDATE ON active_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_active_sessions_last_activity();

-- COMENTÁRIOS NAS TABELAS
COMMENT ON TABLE security_logs IS 'Logs de eventos de segurança do sistema';
COMMENT ON TABLE security_alerts IS 'Alertas de segurança para usuários';
COMMENT ON TABLE rate_limits IS 'Controle de rate limiting para ações sensíveis';
COMMENT ON TABLE active_sessions IS 'Sessões ativas dos usuários';
COMMENT ON TABLE password_recovery_requests IS 'Solicitações de recuperação de senha';

-- VERIFICAÇÃO FINAL
DO $$
BEGIN
  RAISE NOTICE '=== TABELAS DE SEGURANÇA CRIADAS COM SUCESSO ===';
  RAISE NOTICE '✅ security_logs - Logs de eventos de segurança';
  RAISE NOTICE '✅ security_alerts - Alertas de segurança';
  RAISE NOTICE '✅ rate_limits - Controle de rate limiting';
  RAISE NOTICE '✅ active_sessions - Sessões ativas';
  RAISE NOTICE '✅ password_recovery_requests - Recuperação de senha';
  RAISE NOTICE '✅ Índices criados para performance';
  RAISE NOTICE '✅ Políticas RLS configuradas';
  RAISE NOTICE '✅ Funções auxiliares criadas';
  RAISE NOTICE '✅ Triggers configurados';
  RAISE NOTICE '=== SISTEMA DE SEGURANÇA PRONTO ===';
END $$;
