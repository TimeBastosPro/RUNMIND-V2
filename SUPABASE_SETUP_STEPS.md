# 🔧 CONFIGURAÇÃO SUPABASE - GUIA COMPLETO

## 📋 PASSO 1: CONFIGURAR AUTENTICAÇÃO

### 1.1 Acessar o Supabase
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Acesse o projeto `runmind-mvp` (ID: dxzqfbslxtkxfayhydug)

### 1.2 Configurar URLs de Autenticação
1. No menu lateral, clique em **Settings** (⚙️)
2. Clique em **Auth**
3. Na seção **URL Configuration**, configure:

**Site URL:**
```
https://neon-tanuki-1dd628.netlify.app
```

**Redirect URLs:**
```
https://neon-tanuki-1dd628.netlify.app/auth/callback
runmind-v2://auth/callback
```

4. Clique em **Save**

## 📋 PASSO 2: EXECUTAR SCRIPTS DE SEGURANÇA

### 2.1 Acessar SQL Editor
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query**

### 2.2 Executar Script de Segurança
Cole o seguinte código e execute:

```sql
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
```

## 📋 PASSO 3: CONFIGURAR EDGE FUNCTIONS

### 3.1 Acessar Edge Functions
1. No menu lateral, clique em **Edge Functions**
2. Clique em **Settings** (⚙️)

### 3.2 Adicionar Variáveis de Ambiente
Clique em **Add Environment Variable** e adicione:

**GEMINI_API_KEY:**
```
AIzaSyBahBJhhkdv59AjDg5uLLgVeloKy6-fVaQ
```

**SUPABASE_SERVICE_ROLE_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4enFmYnNseHRreGZheWh5ZHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU5NzQ5MCwiZXhwIjoyMDUwMTczNDkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8
```

## 📋 PASSO 4: DEPLOY DAS EDGE FUNCTIONS

### 4.1 Instalar Supabase CLI
```bash
npm install -g supabase
```

### 4.2 Login no Supabase
```bash
supabase login
```

### 4.3 Linkar Projeto
```bash
supabase link --project-ref dxzqfbslxtkxfayhydug
```

### 4.4 Deploy das Functions
```bash
supabase functions deploy generate-daily-readiness-insight-v2
supabase functions deploy generate-training-assimilation-insight-v2
supabase functions deploy generate-weekly-summary-insight-v2
```

## 📋 PASSO 5: VERIFICAR CONFIGURAÇÃO

### 5.1 Testar Autenticação
1. Acesse o link Netlify
2. Tente fazer login/cadastro
3. Verificar se redireciona corretamente

### 5.2 Testar Edge Functions
1. Fazer check-in diário
2. Completar um treino
3. Verificar se insights são gerados

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### Erro de Autenticação
- Verificar Site URL no Supabase
- Verificar Redirect URLs
- Verificar variáveis de ambiente no Netlify

### Insights não funcionam
- Verificar Edge Functions deployadas
- Verificar variáveis de ambiente
- Verificar logs de erro no console

### Performance lenta
- Otimizar carregamento de dados
- Implementar cache
- Otimizar queries
