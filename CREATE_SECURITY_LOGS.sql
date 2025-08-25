-- Script para criar a tabela security_logs no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de logs de segurança
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir inserção de logs
CREATE POLICY "Allow insert security logs" ON security_logs
  FOR INSERT WITH CHECK (true);

-- Criar política para permitir leitura apenas para o próprio usuário
CREATE POLICY "Allow read own security logs" ON security_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Função para limpar logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM security_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
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
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
    
  RETURN attempt_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Trigger para detectar atividades suspeitas
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log de eventos críticos
  IF NEW.event_type IN ('login_failed', 'password_reset', 'account_locked') THEN
    INSERT INTO security_logs (user_id, event_type, event_data)
    VALUES (NEW.user_id, 'suspicious_activity', jsonb_build_object(
      'original_event', NEW.event_type,
      'timestamp', NOW()
    ));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_detect_suspicious_activity ON security_logs;
CREATE TRIGGER trigger_detect_suspicious_activity
  AFTER INSERT ON security_logs
  FOR EACH ROW
  EXECUTE FUNCTION detect_suspicious_activity();

-- Inserir log de teste para verificar se está funcionando
INSERT INTO security_logs (event_type, event_data) 
VALUES ('system_test', '{"message": "Security logs table created successfully"}');
