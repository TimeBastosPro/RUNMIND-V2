# Guia Completo: Limpeza de Todos os Cadastros

## 🎯 **Objetivo**
Limpar todos os cadastros existentes no sistema para permitir testes do zero, sem conflitos de "User already registered".

## 📋 **Opções Disponíveis**

### **1. Limpeza Completa (Recomendado para Testes)**

**Arquivo:** `limpeza_completa_banco.sql`

**O que faz:**
- Remove **TODOS** os dados do sistema
- Limpa todas as tabelas relacionadas
- Permite começar do zero

**Quando usar:**
- ✅ Ambiente de desenvolvimento/teste
- ✅ Quando quer testar o sistema do zero
- ✅ Quando não há dados importantes para preservar

**⚠️ ATENÇÃO:** Este script remove **TUDO** do banco de dados!

### **2. Limpeza Seletiva (Mais Segura)**

**Arquivo:** `limpeza_seletiva_usuarios.sql`

**O que faz:**
- Mostra todos os usuários existentes
- Permite escolher o que remover
- Opções de limpeza específicas

**Opções disponíveis:**
- **Opção 1:** Limpar apenas usuários órfãos (mais seguro)
- **Opção 2:** Limpar usuários específicos por email
- **Opção 3:** Limpar todos os dados de um usuário específico

**Quando usar:**
- ✅ Quando quer preservar alguns dados
- ✅ Quando quer limpar apenas usuários problemáticos
- ✅ Quando quer ver o que existe antes de limpar

### **3. Limpeza Específica (Para Casos Específicos)**

**Arquivo:** `limpar_usuario_aline.sql`

**O que faz:**
- Remove apenas o usuário `aline@gmail.com`
- Resolve o erro específico que você está enfrentando

**Quando usar:**
- ✅ Quando quer resolver apenas o erro do `aline@gmail.com`
- ✅ Quando quer manter outros usuários

## 🚀 **Como Executar**

### **Passo 1: Escolha o Script**

1. **Para limpeza completa:** Use `limpeza_completa_banco.sql`
2. **Para limpeza seletiva:** Use `limpeza_seletiva_usuarios.sql`
3. **Para limpeza específica:** Use `limpar_usuario_aline.sql`

### **Passo 2: Execute no Supabase**

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Cole o conteúdo do script escolhido
4. Clique em **Run**

### **Passo 3: Verifique o Resultado**

O script mostrará:
- ✅ Contagem de dados antes da limpeza
- ✅ Contagem de dados após a limpeza
- ✅ Mensagem de sucesso

## 📊 **O que Cada Script Remove**

### **Limpeza Completa:**
- `auth.users` - Todos os usuários
- `profiles` - Todos os perfis de atleta
- `coaches` - Todos os treinadores
- `athlete_coach_relationships` - Todos os relacionamentos
- `teams` - Todas as equipes
- `daily_checkins` - Todos os check-ins
- `training_sessions` - Todas as sessões de treino
- `insights` - Todos os insights
- `fitness_tests` - Todos os testes de fitness
- `races` - Todas as corridas

### **Limpeza Seletiva:**
- Apenas o que você escolher
- Pode preservar dados importantes

## 🧪 **Teste Após a Limpeza**

1. **Execute o script de limpeza**
2. **Tente criar uma nova conta de atleta**
3. **Tente criar uma nova conta de treinador**
4. **Verifique se ambos funcionam sem erros**
5. **Teste o login com as novas contas**

## ✅ **Resultado Esperado**

Após a limpeza, você deve conseguir:
- ✅ Criar contas de atleta sem erro
- ✅ Criar contas de treinador sem erro
- ✅ Fazer login normalmente
- ✅ Não ter mais erros de "User already registered"

## 🚨 **Importante**

- **Faça backup** se houver dados importantes
- **Execute apenas em ambiente de desenvolvimento/teste**
- **Confirme que quer remover os dados** antes de executar
- **Verifique o resultado** após a execução

## 📁 **Arquivos Criados**

- `limpeza_completa_banco.sql` - Limpeza total
- `limpeza_seletiva_usuarios.sql` - Limpeza seletiva
- `limpar_usuario_aline.sql` - Limpeza específica
- `GUIA_LIMPEZA_COMPLETA.md` - Este guia

## 🎉 **Próximos Passos**

1. **Escolha o script adequado**
2. **Execute no Supabase SQL Editor**
3. **Teste o cadastro de novas contas**
4. **Confirme que tudo funciona corretamente**
