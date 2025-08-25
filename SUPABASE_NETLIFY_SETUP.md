# 🔧 CONFIGURAÇÃO SUPABASE + NETLIFY

## 📋 CHECKLIST DE CONFIGURAÇÃO

### ✅ 1. Configurar Autenticação no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Entre no projeto `runmind-mvp` (ID: dxzqfbslxtkxfayhydug)
3. Vá para **Settings > Auth**
4. Configure:
   - **Site URL**: `https://neon-tanuki-1dd628.netlify.app`
   - **Redirect URLs**: 
     - `https://neon-tanuki-1dd628.netlify.app/auth/callback`
     - `runmind-v2://auth/callback`

### ✅ 2. Executar Scripts de Segurança
1. Vá para **SQL Editor**
2. Execute o script `security_setup.sql`
3. Verificar se todas as tabelas foram criadas

### ✅ 3. Configurar Edge Functions
1. Vá para **Settings > Edge Functions**
2. Adicionar variáveis:
   - `GEMINI_API_KEY`: sua chave da API Gemini
   - `SUPABASE_SERVICE_ROLE_KEY`: chave service role

### ✅ 4. Deploy das Edge Functions
```bash
# Instalar Supabase CLI localmente
npm install -g supabase

# Login no Supabase
supabase login

# Linkar projeto
supabase link --project-ref dxzqfbslxtkxfayhydug

# Deploy das functions
supabase functions deploy generate-daily-readiness-insight-v2
supabase functions deploy generate-training-assimilation-insight-v2
supabase functions deploy generate-weekly-summary-insight-v2
```

### ✅ 5. Testar Configuração
1. Acesse o link Netlify
2. Teste cadastro/login
3. Teste insights automáticos
4. Verificar logs de erro

## 🚨 PROBLEMAS COMUNS

### Erro de Autenticação
- Verificar Site URL no Supabase
- Verificar Redirect URLs
- Verificar variáveis de ambiente no Netlify

### Insights não funcionam
- Verificar Edge Functions deployadas
- Verificar variáveis de ambiente
- Verificar logs de erro

### Performance lenta
- Otimizar carregamento de dados
- Implementar cache
- Otimizar queries
