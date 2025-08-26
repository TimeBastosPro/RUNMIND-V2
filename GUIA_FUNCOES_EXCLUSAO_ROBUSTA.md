# Guia: Funções Robustas de Exclusão de Contas

## 🚨 **Problema Identificado**

A limpeza manual do banco de dados deixou dados órfãos, causando inconsistências:
- Macrociclo criado por um treinador
- Relacionamento ativo com outro treinador
- Dados não sincronizados entre tabelas

## ✅ **Solução Implementada**

### **Funções SQL Robustas Criadas:**

#### **1. `delete_user_completely(user_email)`**
**Função principal para exclusão completa de usuário**

**Como usar:**
```sql
-- Deletar completamente um usuário
SELECT delete_user_completely('email@exemplo.com');
```

**O que ela faz:**
1. ✅ Deleta macrociclos do usuário
2. ✅ Deleta mesociclos do usuário
3. ✅ Deleta microciclos do usuário
4. ✅ Deleta sessões de treino em ciclos
5. ✅ Deleta relacionamentos como treinador
6. ✅ Deleta relacionamentos como atleta
7. ✅ Deleta equipes do treinador
8. ✅ Deleta dados do treinador
9. ✅ Deleta perfil do usuário
10. ✅ Deleta checkins diários
11. ✅ Deleta sessões de treino
12. ✅ Deleta insights
13. ✅ Deleta testes de fitness
14. ✅ Deleta corridas
15. ✅ Deleta usuário do auth.users

#### **2. `list_user_data(user_email)`**
**Função para verificar dados antes da exclusão**

**Como usar:**
```sql
-- Listar todos os dados de um usuário
SELECT * FROM list_user_data('email@exemplo.com');
```

**O que ela mostra:**
- Quantidade de registros em cada tabela
- Dados como treinador e atleta
- Relacionamentos ativos
- Todos os dados relacionados

#### **3. `clean_all_data()`**
**Função para limpeza completa do banco (CUIDADO!)**

**Como usar:**
```sql
-- Limpar todos os dados (apenas em emergências)
SELECT clean_all_data();
```

**O que ela faz:**
- Limpa todas as tabelas em ordem correta
- Preserva integridade referencial
- Não deleta auth.users (deve ser manual)

## 🚀 **Como Usar no Supabase**

### **Passo 1: Criar as Funções**
1. Abra o Supabase SQL Editor
2. Cole o conteúdo do arquivo `funcao_exclusao_conta_robusta.sql`
3. Execute o script

### **Passo 2: Verificar Dados Antes de Deletar**
```sql
-- Verificar dados de um usuário específico
SELECT * FROM list_user_data('timebastos@gmail.com');
SELECT * FROM list_user_data('aline@gmail.com');
```

### **Passo 3: Deletar Usuário Completamente**
```sql
-- Deletar usuário e todos os dados relacionados
SELECT delete_user_completely('timebastos@gmail.com');
```

### **Passo 4: Verificar Limpeza**
```sql
-- Verificar se ainda há dados
SELECT * FROM list_user_data('timebastos@gmail.com');
```

## 🔧 **Correção do Problema Atual**

### **Para Corrigir o Macrociclo da Aline:**

#### **Opção 1: Criar Relacionamento Correto**
```sql
-- Criar relacionamento entre o treinador correto e a atleta
INSERT INTO public.athlete_coach_relationships (
    coach_id,
    athlete_id,
    status,
    requested_at,
    created_at,
    updated_at
) VALUES (
    'feb0227b-7a07-42a1-a9fd-0f203b6e297d', -- timebastos@gmail.com
    '3b091ca5-1967-4152-93bc-424e34ad52ad', -- aline@gmail.com
    'active',
    NOW(),
    NOW(),
    NOW()
);
```

#### **Opção 2: Atualizar o Macrociclo**
```sql
-- Atualizar o macrociclo para pertencer ao treinador correto
UPDATE public.macrociclos 
SET user_id = '57356108-9ec5-4540-9f5f-91d6538fb2af'
WHERE id = 'eala5792-ca4a-4520-99b2-1b6c66e2656d';
```

## 📋 **Checklist para Exclusão Segura**

### **Antes de Deletar:**
- [ ] Verificar dados com `list_user_data()`
- [ ] Confirmar que é o usuário correto
- [ ] Fazer backup se necessário
- [ ] Verificar relacionamentos ativos

### **Durante a Exclusão:**
- [ ] Usar `delete_user_completely()`
- [ ] Verificar logs de exclusão
- [ ] Confirmar que não há erros

### **Após a Exclusão:**
- [ ] Verificar com `list_user_data()` novamente
- [ ] Testar funcionalidades relacionadas
- [ ] Confirmar que não há dados órfãos

## 🛡️ **Prevenção de Problemas Futuros**

### **1. Sempre Use as Funções:**
- Nunca delete manualmente do Supabase
- Sempre use `delete_user_completely()`
- Verifique dados antes e depois

### **2. Implementar no Código:**
```typescript
// Função para deletar conta no frontend
const deleteAccount = async (email: string) => {
  try {
    const { data, error } = await supabase.rpc('delete_user_completely', {
      user_email: email
    });
    
    if (error) throw error;
    
    // Limpar dados locais
    await AsyncStorage.clear();
    
    // Redirecionar para login
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    });
    
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
  }
};
```

### **3. Validações Adicionais:**
- Verificar se usuário tem dados antes de deletar
- Confirmar com usuário antes da exclusão
- Manter logs de exclusão para auditoria

## 🎯 **Benefícios das Funções Robustas**

### **✅ Garantias:**
- **Integridade**: Todos os dados relacionados são deletados
- **Consistência**: Não há dados órfãos
- **Segurança**: Transações garantem rollback em caso de erro
- **Rastreabilidade**: Logs detalhados de cada operação

### **✅ Prevenção:**
- **Problemas futuros**: Não haverá dados inconsistentes
- **Escalabilidade**: Funciona com muitos usuários
- **Manutenibilidade**: Código centralizado e testado

## 📞 **Suporte**

Se houver problemas:
1. Verifique os logs de exclusão
2. Use `list_user_data()` para diagnosticar
3. Execute `clean_all_data()` apenas em emergências
4. Sempre faça backup antes de operações críticas

---

**Status:**
- ✅ **FUNÇÕES CRIADAS** - Exclusão robusta implementada
- ✅ **DOCUMENTAÇÃO** - Guia completo criado
- ⏳ **PENDENTE** - Implementação no código frontend
- ⏳ **PENDENTE** - Testes com dados reais
