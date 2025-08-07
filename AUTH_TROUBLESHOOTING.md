# 🔐 Guia de Solução de Problemas - Autenticação

## Erro: "Invalid login credentials"

Este erro indica que as credenciais fornecidas não são válidas ou há algum problema na configuração.

### 🔍 Diagnóstico Passo a Passo

#### 1. Verificar se o usuário existe
Execute no SQL Editor do Supabase:
```sql
-- Verificar se o usuário existe
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'seu-email@exemplo.com';
```

#### 2. Verificar se o email foi confirmado
```sql
-- Verificar status de confirmação
SELECT 
  id, 
  email, 
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'Email não confirmado'
    ELSE 'Email confirmado'
  END as status
FROM auth.users
WHERE email = 'seu-email@exemplo.com';
```

#### 3. Verificar se há duplicatas
```sql
-- Verificar emails duplicados
SELECT email, COUNT(*) as quantidade
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;
```

### 🛠️ Soluções

#### Solução 1: Confirmar Email
Se o email não foi confirmado:
1. Vá para **Supabase Dashboard > Authentication > Users**
2. Encontre o usuário
3. Clique em **"Confirm"** ao lado do email

#### Solução 2: Reset de Senha
1. No app, use a opção **"Esqueci minha senha"**
2. Digite seu email
3. Verifique sua caixa de entrada
4. Clique no link de reset
5. Defina uma nova senha

#### Solução 3: Limpar Cache do App
1. Feche completamente o app
2. Vá em **Configurações > Apps > RunMind**
3. Clique em **"Limpar Cache"**
4. Reabra o app

#### Solução 4: Verificar Configurações do Supabase
1. Vá para **Supabase Dashboard > Authentication > Settings**
2. Verifique se **"Enable email confirmations"** está habilitado
3. Verifique se não há restrições de IP

#### Solução 5: Limpar Dados de Teste
Execute o script `clean_auth_data.sql` para remover dados de teste que podem estar causando conflitos.

### 🔧 Scripts de Diagnóstico

#### Script 1: Diagnóstico Completo
```sql
-- Execute debug_auth_issue.sql
-- Este script verifica todos os aspectos da autenticação
```

#### Script 2: Verificar Configurações
```sql
-- Execute fix_auth_config.sql
-- Este script verifica configurações que podem estar causando problemas
```

#### Script 3: Limpeza de Dados
```sql
-- Execute clean_auth_data.sql
-- Este script limpa dados de teste e corrige problemas
```

### 📱 Problemas Específicos do Mobile

#### Problema 1: Sessão Corrompida
**Sintomas:** App trava na tela de loading
**Solução:**
1. Feche o app completamente
2. Vá em **Configurações > Apps > RunMind > Armazenamento**
3. Clique em **"Limpar Dados"**
4. Reabra o app

#### Problema 2: Problemas de Rede
**Sintomas:** Erro de conexão
**Solução:**
1. Verifique sua conexão com a internet
2. Tente conectar em uma rede diferente
3. Desative e reative o Wi-Fi

#### Problema 3: Problemas de Cache
**Sintomas:** App não atualiza dados
**Solução:**
1. Feche o app
2. Vá em **Configurações > Apps > RunMind**
3. Clique em **"Forçar Parada"**
4. Reabra o app

### 🚨 Casos Especiais

#### Caso 1: Usuário Deletado Acidentalmente
**Solução:**
1. Verifique se há backup na tabela `auth_users_backup`
2. Restaure o usuário se necessário
3. Recrie o perfil se necessário

#### Caso 2: Problemas com Caracteres Especiais
**Sintomas:** Email com acentos ou caracteres especiais
**Solução:**
1. Use um email sem caracteres especiais
2. Ou verifique se o encoding está correto

#### Caso 3: Problemas de Timezone
**Sintomas:** Erros relacionados a datas
**Solução:**
1. Verifique se o timezone do Supabase está correto
2. Verifique se o timezone do dispositivo está correto

### 📞 Suporte

Se nenhuma das soluções funcionar:

1. **Coletar Logs:**
   - Abra o console do app
   - Tente fazer login
   - Copie todos os logs de erro

2. **Verificar Configuração:**
   - Confirme que as variáveis de ambiente estão corretas
   - Verifique se o Supabase está online

3. **Contatar Suporte:**
   - Envie os logs de erro
   - Descreva os passos que tentou
   - Inclua screenshots se possível

### 🔄 Prevenção

Para evitar problemas futuros:

1. **Sempre confirme o email** após o cadastro
2. **Use senhas fortes** (mínimo 6 caracteres)
3. **Não compartilhe credenciais** entre dispositivos
4. **Mantenha o app atualizado**
5. **Faça logout quando não estiver usando**

### 📋 Checklist de Verificação

- [ ] Usuário existe na tabela `auth.users`
- [ ] Email foi confirmado (`email_confirmed_at` não é NULL)
- [ ] Não há emails duplicados
- [ ] Senha está correta
- [ ] App está atualizado
- [ ] Cache foi limpo
- [ ] Conexão com internet está funcionando
- [ ] Supabase está online
- [ ] Configurações de autenticação estão corretas
- [ ] Não há restrições de IP

### 🎯 Resolução Rápida

Para resolver rapidamente:

1. **Execute:** `debug_auth_issue.sql`
2. **Verifique:** Se o usuário existe e email está confirmado
3. **Se necessário:** Execute `clean_auth_data.sql`
4. **Teste:** Faça login novamente
5. **Se persistir:** Limpe cache do app e tente novamente 