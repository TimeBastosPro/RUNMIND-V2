# 🔧 GUIA DE CONFIGURAÇÃO SUPABASE - RUNMIND V2

## 📋 CHECKLIST DE CONFIGURAÇÃO

### ✅ 1. Criar Projeto Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Nome: `runmind-v2-prod`
4. Região: mais próxima dos usuários
5. Plano: Free (para começar)
6. Clique em "Create new project"

### ✅ 2. Configurar Autenticação
1. Vá para **Settings > Auth**
2. Configure **Site URL**: `https://runmind-v2-3oe5uml7r-luiz-bastos-projects.vercel.app`
3. Configure **Redirect URLs**: 
   - `https://runmind-v2-3oe5uml7r-luiz-bastos-projects.vercel.app/auth/callback`
   - `runmind-v2://auth/callback`
4. Configure **Password Policy**:
   - Minimum length: 8
   - Require uppercase: true
   - Require lowercase: true
   - Require numbers: true
   - Require special characters: true

### ✅ 3. Configurar Rate Limiting
1. Vá para **Settings > Auth > Rate Limiting**
2. Configure:
   - **Sign in attempts**: 5 per 15 minutes
   - **Sign up attempts**: 3 per hour
   - **Password reset attempts**: 3 per hour

### ✅ 4. Executar Scripts SQL
1. Vá para **SQL Editor**
2. Execute o script `security_setup.sql`
3. Execute o script `database_migrations.sql` (se existir)

### ✅ 5. Configurar Edge Functions
1. Vá para **Settings > Edge Functions**
2. Configure variáveis de ambiente:
   - `GEMINI_API_KEY`: sua chave da API Gemini
   - `SUPABASE_SERVICE_ROLE_KEY`: chave service role do projeto

### ✅ 6. Deploy das Edge Functions
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

### ✅ 7. Atualizar Variáveis de Ambiente
1. Copie as chaves do Supabase:
   - **Project URL**: Settings > API
   - **Anon Key**: Settings > API
   - **Service Role Key**: Settings > API

2. Atualize no Vercel:
   - Vá para [vercel.com](https://vercel.com)
   - Seu projeto > Settings > Environment Variables
   - Adicione:
     - `EXPO_PUBLIC_SUPABASE_URL`
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `EXPO_PUBLIC_GEMINI_API_KEY`

### ✅ 8. Testar Configuração
1. Acesse o link web
2. Teste cadastro/login
3. Teste insights automáticos
4. Verifique logs de segurança

## 🚨 PROBLEMAS COMUNS

### Erro 406 (Not Acceptable)
- Verificar RLS policies
- Verificar configuração de autenticação

### Insights não funcionam
- Verificar Edge Functions deployadas
- Verificar variáveis de ambiente
- Verificar logs de erro

### Rate limiting muito restritivo
- Ajustar configurações em Settings > Auth > Rate Limiting

## 📞 SUPORTE

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Support**: https://supabase.com/support
- **Vercel Support**: https://vercel.com/support
