# 🔍 DEBUG CADASTRO DE NOVOS USUÁRIOS

## 🚨 PROBLEMAS IDENTIFICADOS

### **1. Possíveis Causas:**

1. **Configuração de Autenticação no Supabase**
   - URLs de redirecionamento incorretas
   - Políticas de senha muito restritivas
   - Email de confirmação obrigatório

2. **Problemas no Código**
   - Validação muito restritiva
   - Erro na criação do perfil
   - Problema com metadados do usuário

3. **Problemas de Rede/Conectividade**
   - Timeout na requisição
   - CORS mal configurado
   - Problemas de DNS

## 🔧 SOLUÇÕES PARA TESTAR

### **SOLUÇÃO 1: Verificar Configuração do Supabase**

1. **Acesse o Supabase Dashboard**
2. **Vá em Settings > Auth**
3. **Verifique:**
   - **Site URL:** `https://neon-tanuki-1dd628.netlify.app`
   - **Redirect URLs:** 
     - `https://neon-tanuki-1dd628.netlify.app/auth/callback`
     - `runmind-v2://auth/callback`

4. **Vá em Settings > Auth > Policies**
   - Verifique se não há políticas muito restritivas

### **SOLUÇÃO 2: Testar Cadastro Simples**

1. **Acesse o link Netlify**
2. **Abra o Console do Navegador (F12)**
3. **Tente fazer cadastro e observe os erros**

### **SOLUÇÃO 3: Verificar Logs do Supabase**

1. **No Supabase Dashboard**
2. **Vá em Logs > Auth**
3. **Tente fazer cadastro e verifique os logs**

### **SOLUÇÃO 4: Testar com Dados Mínimos**

Use estes dados para teste:
- **Email:** `teste@teste.com`
- **Senha:** `123456`
- **Nome:** `Usuário Teste`

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] **URLs de autenticação configuradas corretamente**
- [ ] **Console do navegador sem erros**
- [ ] **Logs do Supabase mostrando tentativas**
- [ ] **Email de confirmação não é obrigatório**
- [ ] **Políticas de senha adequadas**

## 🚨 ERROS COMUNS E SOLUÇÕES

### **Erro: "User already registered"**
- **Solução:** Usar email diferente para teste

### **Erro: "Password should be at least..."**
- **Solução:** Usar senha com pelo menos 6 caracteres

### **Erro: "Invalid email"**
- **Solução:** Verificar formato do email

### **Erro: "Network error"**
- **Solução:** Verificar conexão com internet

### **Erro: "Email not confirmed"**
- **Solução:** Desabilitar confirmação de email temporariamente

## 🔧 CONFIGURAÇÃO TEMPORÁRIA PARA TESTES

### **Desabilitar Confirmação de Email:**

1. **No Supabase Dashboard**
2. **Vá em Settings > Auth**
3. **Desabilite temporariamente "Enable email confirmations"**
4. **Teste o cadastro**
5. **Reabilite após os testes**

### **Ajustar Políticas de Senha:**

1. **No Supabase Dashboard**
2. **Vá em Settings > Auth**
3. **Configure "Minimum password length" para 6**
4. **Teste o cadastro**

## 📞 PRÓXIMOS PASSOS

1. **Teste com dados mínimos**
2. **Verifique console do navegador**
3. **Verifique logs do Supabase**
4. **Me informe qual erro específico aparece**
