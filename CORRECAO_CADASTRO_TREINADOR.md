# 🔧 CORREÇÃO DO SISTEMA DE CADASTRO DE TREINADOR

## 🎯 **PROBLEMAS IDENTIFICADOS E CORRIGIDOS**

### ❌ **Problema 1: Cadastros de Treinador Criando Perfis de Atleta**
- **Descrição**: O sistema estava criando perfis de atleta para todos os usuários, incluindo treinadores
- **Causa**: Lógica incorreta no `signUp` que não diferenciava adequadamente entre atletas e treinadores
- **Impacto**: Duplicação de dados e erros durante o cadastro de treinadores

### ❌ **Problema 2: Campo CREF no Local Errado**
- **Descrição**: O campo CREF estava sendo coletado apenas na tela de setup do perfil, não no cadastro inicial
- **Causa**: Campo CREF implementado apenas no `CoachProfileSetupScreen`
- **Impacto**: Experiência de usuário fragmentada e possível perda de dados

## ✅ **SOLUÇÕES IMPLEMENTADAS**

### 🔧 **1. Correção da Lógica de Cadastro**

#### **Arquivo**: `src/stores/auth.ts`
- **Mudança**: Atualizada a função `signUp` para diferenciar corretamente entre atletas e treinadores
- **Implementação**:
  ```typescript
  // Para treinadores: criar perfil em profiles + registro em coaches
  if (options?.isCoach) {
    // 1. Criar perfil básico em profiles com user_type = 'coach'
    // 2. Criar registro em coaches com CREF
  } else {
    // Para atletas: criar apenas perfil em profiles com user_type = 'athlete'
  }
  ```

#### **Arquivo**: `src/types/database.ts`
- **Mudança**: Adicionado campo `user_type` na interface `Profile`
- **Implementação**:
  ```typescript
  user_type: 'athlete' | 'coach'; // ✅ NOVO: Tipo de usuário
  ```

### 🔧 **2. Movimentação do Campo CREF**

#### **Arquivo**: `src/navigation/AppNavigator.tsx`
- **Mudança**: Campo CREF movido para o formulário inicial de cadastro de treinador
- **Implementação**:
  ```typescript
  // Schema atualizado
  const unifiedSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    fullName: z.string().optional(),
    cref: z.string().optional(), // ✅ NOVO: Campo CREF para treinadores
  });

  // Validação específica para CREF
  if (isCoachSignUp) {
    if (!data.cref || data.cref.trim() === '') {
      setError('cref', { message: 'CREF é obrigatório para treinadores' });
      return;
    }
    
    const crefRegex = /^\d{6}-[A-Z]{2}$/;
    if (!crefRegex.test(data.cref.trim())) {
      setError('cref', { message: 'CREF deve estar no formato: 123456-SP' });
      return;
    }
  }
  ```

#### **Arquivo**: `src/screens/auth/CoachProfileSetupScreen.tsx`
- **Mudança**: Removido campo CREF da tela de setup do perfil
- **Implementação**: Campo CREF removido do schema e da interface

### 🔧 **3. Atualizações do Banco de Dados**

#### **Script**: `correcao_cadastro_treinador.sql`
- **Mudanças**:
  1. Adicionar coluna `user_type` na tabela `profiles`
  2. Adicionar constraint para valores válidos (`athlete` ou `coach`)
  3. Verificar/criar coluna `cref` na tabela `coaches`
  4. Atualizar registros existentes

## 📋 **INSTRUÇÕES DE IMPLEMENTAÇÃO**

### **1. Execute o Script SQL**
```sql
-- Execute o arquivo: correcao_cadastro_treinador.sql
-- No Supabase SQL Editor
```

### **2. Teste o Cadastro de Treinador**
1. Acesse a tela de cadastro
2. Clique em "👨‍💼 Criar conta de Treinador"
3. Preencha:
   - Nome completo
   - Email
   - Senha
   - **CREF (novo campo obrigatório)**
4. Verifique se o cadastro é concluído sem erros

### **3. Verifique a Navegação**
- Treinadores devem ser direcionados para a área de treinador
- Atletas devem permanecer na área de atleta
- Não deve haver duplicação de perfis

## 🔍 **VALIDAÇÕES IMPLEMENTADAS**

### **Campo CREF**
- ✅ **Obrigatório** para treinadores
- ✅ **Formato válido**: `123456-SP` (6 dígitos + hífen + 2 letras)
- ✅ **Validação em tempo real** no formulário
- ✅ **Mensagens de erro claras**

### **Diferenciação de Usuários**
- ✅ **Atletas**: `user_type = 'athlete'` em `profiles`
- ✅ **Treinadores**: `user_type = 'coach'` em `profiles` + registro em `coaches`
- ✅ **Navegação correta** baseada no tipo de usuário

## 🎉 **RESULTADO ESPERADO**

Após as correções:
- ✅ Cadastros de treinador não criam mais perfis de atleta
- ✅ Campo CREF é coletado no momento do cadastro
- ✅ Sistema diferencia corretamente entre atletas e treinadores
- ✅ Navegação funciona adequadamente para ambos os tipos
- ✅ Dados são salvos nas tabelas corretas sem duplicação

## 🚨 **IMPORTANTE**

- **Execute o script SQL** antes de testar as funcionalidades
- **Teste ambos os fluxos**: cadastro de atleta e cadastro de treinador
- **Verifique se não há erros** no console durante os testes
- **Confirme que a navegação** funciona corretamente para cada tipo de usuário
