# 🚀 GUIA DE DEPLOY PARA PRODUÇÃO - RUNMIND V2

## 📋 CHECKLIST PRÉ-DEPLOY

### ✅ Configuração de Segurança
- [ ] Executar script `security_setup.sql` no Supabase
- [ ] Configurar variáveis de ambiente de produção
- [ ] Configurar rate limiting no Supabase
- [ ] Configurar políticas de senha rigorosas
- [ ] Configurar backup automático
- [ ] Configurar monitoramento

### ✅ Configuração do Supabase
- [ ] Criar projeto de produção no Supabase
- [ ] Configurar domínio personalizado (opcional)
- [ ] Configurar autenticação
- [ ] Configurar storage (se necessário)
- [ ] Configurar Edge Functions
- [ ] Configurar webhooks

### ✅ Configuração do App
- [ ] Configurar variáveis de ambiente
- [ ] Testar build de produção
- [ ] Configurar CI/CD (opcional)
- [ ] Configurar analytics
- [ ] Configurar crash reporting

## 🔧 CONFIGURAÇÃO PASSO A PASSO

### 1. Configuração do Supabase

#### 1.1 Criar Projeto de Produção
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha sua organização
4. Digite nome: `runmind-v2-prod`
5. Escolha região mais próxima dos usuários
6. Escolha plano (Free para começar)
7. Clique em "Create new project"

#### 1.2 Configurar Autenticação
1. Vá para **Settings > Auth**
2. Configure **Site URL**: `https://seu-dominio.com`
3. Configure **Redirect URLs**: 
   - `https://seu-dominio.com/auth/callback`
   - `runmind-v2://auth/callback`
4. Configure **Email Templates** (opcional)
5. Configure **Password Policy**:
   - Minimum length: 8
   - Require uppercase: true
   - Require lowercase: true
   - Require numbers: true
   - Require special characters: true

#### 1.3 Configurar Rate Limiting
1. Vá para **Settings > Auth > Rate Limiting**
2. Configure:
   - **Sign in attempts**: 5 per 15 minutes
   - **Sign up attempts**: 3 per hour
   - **Password reset attempts**: 3 per hour

#### 1.4 Configurar Sessões
1. Vá para **Settings > Auth > Sessions**
2. Configure:
   - **Session timeout**: 24 hours
   - **Refresh token rotation**: Enabled
   - **Refresh token reuse interval**: 10 seconds

#### 1.5 Executar Scripts SQL
1. Vá para **SQL Editor**
2. Execute o script `database_migrations.sql`
3. Execute o script `security_setup.sql`

### 2. Configuração do App

#### 2.1 Variáveis de Ambiente
Crie arquivo `.env.production`:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# Gemini API Configuration
EXPO_PUBLIC_GEMINI_API_KEY=sua_chave_gemini_aqui

# Supabase Service Role Key (para operações administrativas)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Configurações de Produção
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_APP_VERSION=1.0.0
```

#### 2.2 Configurar app.json
```json
{
  "expo": {
    "name": "RunMind V2",
    "slug": "runmind-v2",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.runmind.v2"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.runmind.v2"
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "extra": {
      "EXPO_PUBLIC_SUPABASE_URL": "https://seu-projeto.supabase.co",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY": "sua_chave_anonima_aqui",
      "EXPO_PUBLIC_GEMINI_API_KEY": "sua_chave_gemini_aqui"
    },
    "plugins": [
      "expo-router"
    ],
    "scheme": "runmind-v2"
  }
}
```

### 3. Deploy das Edge Functions

#### 3.1 Configurar Supabase CLI
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Linkar projeto
supabase link --project-ref seu-project-ref

# Deploy das functions
supabase functions deploy generate-daily-readiness-insight-v2
supabase functions deploy generate-training-assimilation-insight-v2
supabase functions deploy generate-weekly-summary-insight-v2
```

#### 3.2 Configurar Variáveis de Ambiente das Functions
1. Vá para **Settings > Edge Functions**
2. Configure as variáveis:
   - `GEMINI_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 4. Build e Deploy do App

#### 4.1 Build para Produção
```bash
# Instalar dependências
npm install

# Build para produção
npx expo build:android --release-channel production
npx expo build:ios --release-channel production

# Ou para web
npx expo build:web
```

#### 4.2 Deploy para Web (se aplicável)
```bash
# Build para web
npx expo build:web

# Deploy para Vercel/Netlify/etc
# Configure seu provedor de hosting
```

#### 4.3 Deploy para App Stores
1. **Google Play Store**:
   - Criar conta de desenvolvedor
   - Fazer upload do APK/AAB
   - Configurar store listing
   - Submeter para revisão

2. **Apple App Store**:
   - Criar conta de desenvolvedor
   - Fazer upload via Xcode
   - Configurar App Store Connect
   - Submeter para revisão

### 5. Configuração de Monitoramento

#### 5.1 Analytics
```bash
# Instalar Sentry para crash reporting
npm install @sentry/react-native

# Configurar no app
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'sua-dsn-do-sentry',
  environment: 'production',
});
```

#### 5.2 Logs de Produção
1. Configure logs no Supabase
2. Configure alertas para eventos críticos
3. Configure monitoramento de performance

### 6. Testes Pós-Deploy

#### 6.1 Testes de Segurança
- [ ] Testar login/logout
- [ ] Testar cadastro com validações
- [ ] Testar reset de senha
- [ ] Testar rate limiting
- [ ] Testar RLS policies

#### 6.2 Testes Funcionais
- [ ] Testar todas as funcionalidades principais
- [ ] Testar insights automáticos
- [ ] Testar métricas CTL/ATL/TSB
- [ ] Testar navegação
- [ ] Testar performance

#### 6.3 Testes de Performance
- [ ] Testar tempo de carregamento
- [ ] Testar uso de memória
- [ ] Testar consumo de bateria
- [ ] Testar em diferentes dispositivos

## 🔒 CONFIGURAÇÕES DE SEGURANÇA ADICIONAIS

### 1. Headers de Segurança (Web)
```javascript
// Adicionar no servidor web
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### 2. Configuração de CORS
```sql
-- No Supabase
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON auth.users
  FOR SELECT USING (auth.uid() = id);
```

### 3. Backup e Recuperação
1. Configure backup automático no Supabase
2. Configure backup dos logs de segurança
3. Configure plano de recuperação de desastres

## 📊 MONITORAMENTO EM PRODUÇÃO

### 1. Métricas Importantes
- **Performance**: Tempo de resposta, uso de CPU/memória
- **Segurança**: Tentativas de login falhadas, atividades suspeitas
- **Usabilidade**: Taxa de conversão, retenção de usuários
- **Técnico**: Uptime, erros, latência

### 2. Alertas Configurar
- Eventos críticos de segurança
- Falhas de autenticação
- Performance degradada
- Erros de aplicação

### 3. Dashboards
- Dashboard de segurança
- Dashboard de performance
- Dashboard de usuários
- Dashboard de insights

## 🚨 PROCEDIMENTOS DE EMERGÊNCIA

### 1. Rollback
```bash
# Reverter para versão anterior
git checkout v1.0.0
npx expo build:android --release-channel production
```

### 2. Bloqueio de Usuário
```sql
-- Bloquear usuário suspeito
UPDATE auth.users 
SET banned_until = NOW() + INTERVAL '24 hours'
WHERE email = 'usuario@suspeito.com';
```

### 3. Limpeza de Dados
```sql
-- Limpar logs antigos
DELETE FROM security_logs 
WHERE timestamp < NOW() - INTERVAL '90 days';
```

## 📞 CONTATOS DE SUPORTE

- **Supabase Support**: https://supabase.com/support
- **Expo Support**: https://docs.expo.dev/support/
- **Google Cloud Support**: https://cloud.google.com/support

## ✅ CHECKLIST FINAL

### Antes do Deploy
- [ ] Todos os testes passando
- [ ] Validações de segurança implementadas
- [ ] Logs de segurança configurados
- [ ] Rate limiting configurado
- [ ] Backup configurado
- [ ] Monitoramento configurado

### Após o Deploy
- [ ] Testes de produção executados
- [ ] Monitoramento funcionando
- [ ] Alertas configurados
- [ ] Documentação atualizada
- [ ] Equipe treinada

---

**⚠️ IMPORTANTE**: Sempre teste em ambiente de staging antes de fazer deploy para produção!
