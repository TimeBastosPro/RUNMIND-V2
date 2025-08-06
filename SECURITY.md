# 🔒 Segurança e Configuração de Variáveis de Ambiente

## ⚠️ Importante: Configuração de Segurança

Este projeto agora utiliza variáveis de ambiente para proteger chaves de API sensíveis. **NUNCA** commite chaves de API diretamente no código-fonte.

## 📋 Configuração Necessária

### 1. Criar arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://dxzqfbslxtkxfayhydug.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4enFmYnNseHRreGZheWh5ZHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTYzMDgsImV4cCI6MjA2NzQ5MjMwOH0.CVNLjXJyRuNEOf_1P8YnF7zVlMUrsCvBUlMVxxn1tc4

# Gemini API Configuration
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Service Role Key (para operações administrativas)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Obter Chaves do Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **Settings > API**
4. Copie:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Obter Chave da Gemini

1. Acesse o [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma nova API key
3. Copie a chave → `EXPO_PUBLIC_GEMINI_API_KEY`

## 🛡️ Medidas de Segurança Implementadas

### ✅ Variáveis de Ambiente
- Chaves movidas para arquivo `.env`
- Arquivo `.env` adicionado ao `.gitignore`
- Uso do `expo-constants` para acesso seguro

### ✅ Validação de Configuração
- Verificação automática se variáveis estão configuradas
- Erro claro se configuração estiver faltando
- Fallback para desenvolvimento local

### ✅ Prefixo EXPO_PUBLIC_
- Variáveis com prefixo `EXPO_PUBLIC_` são expostas ao cliente
- Apenas chaves públicas devem usar este prefixo
- Chaves secretas (service_role) não devem usar este prefixo

## 🚨 Avisos de Segurança

### ❌ NUNCA faça:
- Commite o arquivo `.env` no repositório
- Compartilhe chaves de API em mensagens ou chats
- Use chaves de produção em ambiente de desenvolvimento
- Exponha chaves `service_role` no cliente

### ✅ SEMPRE faça:
- Use variáveis de ambiente para todas as chaves
- Mantenha o arquivo `.env` no `.gitignore`
- Use chaves diferentes para cada ambiente
- Revogue chaves comprometidas imediatamente

## 🔧 Configuração para Desenvolvimento

### Para novos desenvolvedores:

1. Clone o repositório
2. Copie `.env.example` para `.env` (se existir)
3. Configure suas próprias chaves de API
4. Nunca commite o arquivo `.env`

### Para produção:

1. Configure variáveis de ambiente no servidor
2. Use chaves específicas para produção
3. Monitore logs para detectar uso anômalo
4. Implemente rotação regular de chaves

## 📞 Suporte

Se você encontrar problemas com a configuração:

1. Verifique se o arquivo `.env` existe na raiz do projeto
2. Confirme se todas as variáveis estão configuradas
3. Reinicie o servidor de desenvolvimento após alterações
4. Verifique os logs do console para mensagens de erro

---

**Lembre-se**: A segurança é responsabilidade de todos. Mantenha suas chaves seguras! 🔐 