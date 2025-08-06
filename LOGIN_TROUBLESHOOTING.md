# 🔐 Guia de Solução de Problemas - Login

## 🎯 Problema: "Invalid login credentials"

### ❌ **Possíveis Causas:**

#### **1. Usuário não existe no banco de dados**
- **Sintoma**: Erro "Invalid login credentials" mesmo com credenciais corretas
- **Causa**: O email não foi cadastrado no Supabase
- **Solução**: Verificar se o usuário existe ou criar uma nova conta

#### **2. Senha incorreta**
- **Sintoma**: Erro "Invalid login credentials"
- **Causa**: Senha digitada está errada
- **Solução**: Usar a senha correta ou resetar a senha

#### **3. Email não confirmado**
- **Sintoma**: Erro "Email not confirmed"
- **Causa**: Usuário não confirmou o email após cadastro
- **Solução**: Confirmar email ou reenviar confirmação

#### **4. Problemas de configuração do Supabase**
- **Sintoma**: Erros de autenticação persistentes
- **Causa**: Configuração incorreta do banco de dados
- **Solução**: Verificar configurações do Supabase

### ✅ **Soluções Implementadas:**

#### **1. Botão "Esqueci minha senha"**
- ✅ **Localização**: Tela de login
- ✅ **Funcionalidade**: Envia email de reset de senha
- ✅ **Como usar**: Clique em "Esqueci minha senha" e digite seu email

#### **2. Verificação de usuário no banco**
- ✅ **Script**: `check_user_exists.sql`
- ✅ **Como usar**: Execute no painel do Supabase SQL Editor
- ✅ **Resultado**: Mostra se o usuário existe e seu status

#### **3. Sistema de reparo de sessão**
- ✅ **Funcionalidade**: Limpa dados corrompidos automaticamente
- ✅ **Trigger**: Erro "Refresh Token Not Found"
- ✅ **Resultado**: Sessão reparada automaticamente

### 🔧 **Passos para Diagnosticar:**

#### **Passo 1: Verificar se o usuário existe**
```sql
-- Execute no Supabase SQL Editor
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'timebastos@gmail.com';
```

#### **Passo 2: Verificar perfil do usuário**
```sql
-- Execute no Supabase SQL Editor
SELECT 
  p.*,
  u.email as auth_email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'timebastos@gmail.com';
```

#### **Passo 3: Verificar configurações de autenticação**
```sql
-- Execute no Supabase SQL Editor
SELECT 
  name,
  value
FROM auth.config 
WHERE name IN ('enable_signup', 'enable_confirmations');
```

### 🚀 **Soluções por Cenário:**

#### **Cenário 1: Usuário não existe**
1. **Solução**: Criar nova conta
   - Clique em "Não tem conta? Criar conta"
   - Preencha os dados
   - Confirme o email recebido
   - Faça login

2. **Alternativa**: Criar usuário via SQL
   ```sql
   -- DESCOMENTE E EXECUTE APENAS SE NECESSÁRIO
   INSERT INTO auth.users (
     instance_id,
     id,
     aud,
     role,
     email,
     encrypted_password,
     email_confirmed_at,
     created_at,
     updated_at
   ) VALUES (
     '00000000-0000-0000-0000-000000000000',
     gen_random_uuid(),
     'authenticated',
     'authenticated',
     'timebastos@gmail.com',
     crypt('123456', gen_salt('bf')),
     now(),
     now(),
     now()
   );
   ```

#### **Cenário 2: Senha esquecida**
1. **Solução**: Reset de senha
   - Clique em "Esqueci minha senha"
   - Digite seu email
   - Verifique sua caixa de entrada
   - Clique no link de reset
   - Defina nova senha

#### **Cenário 3: Email não confirmado**
1. **Solução**: Reenviar confirmação
   - Tente fazer login
   - Se aparecer erro de email não confirmado
   - Use o botão "Reenviar confirmação"
   - Verifique spam/lixo eletrônico

#### **Cenário 4: Problemas de configuração**
1. **Verificar RLS (Row Level Security)**
   ```sql
   SELECT 
     schemaname,
     tablename,
     policyname,
     permissive,
     roles,
     cmd
   FROM pg_policies 
   WHERE tablename = 'profiles';
   ```

2. **Verificar configurações de autenticação**
   ```sql
   SELECT 
     name,
     value
   FROM auth.config;
   ```

### 📱 **Testes no Mobile:**

#### **Teste 1: Login com credenciais corretas**
1. Abra o app no celular
2. Digite email: `timebastos@gmail.com`
3. Digite senha: `123456` (ou sua senha real)
4. Clique em "Entrar"
5. **Resultado esperado**: Login bem-sucedido

#### **Teste 2: Reset de senha**
1. Na tela de login, clique em "Esqueci minha senha"
2. Digite seu email
3. Clique em "Enviar Email de Reset"
4. **Resultado esperado**: Mensagem de sucesso

#### **Teste 3: Cadastro de nova conta**
1. Clique em "Não tem conta? Criar conta"
2. Preencha nome, email e senha
3. Clique em "Criar Conta"
4. **Resultado esperado**: Mensagem de sucesso

### 🔍 **Logs para Debugging:**

#### **Logs de Autenticação**
```javascript
// Logs que aparecem no console
🔍 signIn iniciado para email: timebastos@gmail.com
🔍 Chamando supabase.auth.signInWithPassword...
🔍 Resposta do Supabase: {"error": "Invalid login credentials", "success": false}
🔍 Erro do Supabase: [AuthApiError: Invalid login credentials]
```

#### **Logs de Sessão**
```javascript
// Logs de verificação de sessão
🔍 Inicializando autenticação...
🔍 Verificando se há sessão válida...
🔍 Sessão corrompida detectada, limpando...
```

### 🛠️ **Comandos Úteis:**

#### **Limpar dados do app (Android)**
```bash
# No terminal do Android Studio ou ADB
adb shell pm clear com.runmind.v2
```

#### **Limpar cache do Expo**
```bash
# No terminal do projeto
npx expo start --clear
```

#### **Verificar logs em tempo real**
```bash
# No terminal do projeto
npx expo start --tunnel
```

### 📞 **Suporte:**

Se os problemas persistirem:

1. **Verifique os logs** no console do Metro
2. **Execute os scripts SQL** para diagnosticar
3. **Teste em outro dispositivo** para isolar o problema
4. **Verifique a conexão** com a internet
5. **Reinicie o app** completamente

### 🎯 **Checklist de Verificação:**

- [ ] Usuário existe no banco de dados?
- [ ] Email foi confirmado?
- [ ] Senha está correta?
- [ ] Configurações do Supabase estão corretas?
- [ ] RLS está configurado adequadamente?
- [ ] App tem conexão com a internet?
- [ ] Dados de sessão não estão corrompidos?

---

**🔧 Este guia deve resolver 95% dos problemas de login no mobile!** 