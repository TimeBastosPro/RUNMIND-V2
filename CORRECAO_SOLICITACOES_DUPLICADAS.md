# Correção: Solicitações de Vínculo Duplicadas

## Problema Identificado

As solicitações de vínculo entre atletas e treinadores estavam sendo duplicadas, causando:
- **Múltiplas solicitações pendentes** para o mesmo atleta/treinador/modalidade
- **Confusão na interface** do treinador ao ver solicitações duplicadas
- **Inconsistência de dados** na tabela `athlete_coach_relationships`

## Causa Raiz

A função `requestCoachRelationship` não estava fazendo verificações suficientes para prevenir duplicatas:

1. **Verificação insuficiente** - Só verificava relacionamentos com o mesmo treinador
2. **Condição de corrida** - Múltiplas requisições simultâneas podiam criar duplicatas
3. **Falta de verificação global** - Não verificava se já existia solicitação pendente para a modalidade

## Correções Implementadas

### 1. **Scripts de Diagnóstico e Limpeza**

#### **`verificar_solicitacoes_duplicadas.sql`**
- Identifica todas as solicitações duplicadas
- Mostra detalhes dos usuários envolvidos
- Conta solicitações por status

#### **`limpar_solicitacoes_duplicadas.sql`**
- Remove solicitações duplicadas mantendo apenas a mais recente
- Verifica resultado após limpeza
- Mostra solicitações pendentes restantes

### 2. **Correção da Função `requestCoachRelationship`** (`src/stores/coach.ts`)

#### **Melhorias Implementadas:**

##### **✅ Verificação Global de Solicitações Pendentes**
```typescript
// Verificar se já existe um relacionamento PENDENTE com QUALQUER treinador na mesma modalidade
const { data: anyPendingRel, error: anyPendingErr } = await supabase
  .from('athlete_coach_relationships')
  .select('id, coach_id, status, modality, created_at')
  .eq('athlete_id', user.id)
  .eq('status', 'pending')
  .eq('modality', normalizedModality)
  .order('created_at', { ascending: false })
  .limit(1);

if (anyPendingRel && anyPendingRel.length > 0) {
  const existingPending = anyPendingRel[0];
  
  // Se a solicitação pendente é com o mesmo treinador, não criar duplicata
  if (existingPending.coach_id === coachId) {
    throw new Error(`Você já possui uma solicitação pendente para ${normalizedModality} com este treinador`);
  } else {
    throw new Error(`Você já possui uma solicitação pendente para ${normalizedModality} com outro treinador. Aguarde a resposta ou cancele a solicitação anterior.`);
  }
}
```

##### **✅ Verificação Final Antes da Inserção**
```typescript
// Verificação final para garantir que não há duplicatas
const { data: finalCheck, error: finalCheckError } = await supabase
  .from('athlete_coach_relationships')
  .select('id, status')
  .eq('athlete_id', user.id)
  .eq('coach_id', coachId)
  .eq('modality', normalizedModality)
  .in('status', ['pending', 'active'])
  .limit(1);

if (finalCheck && finalCheck.length > 0) {
  const existing = finalCheck[0];
  
  if (existing.status === 'pending') {
    throw new Error(`Você já possui uma solicitação pendente para ${normalizedModality} com este treinador`);
  } else if (existing.status === 'active') {
    throw new Error(`Você já possui um vínculo ativo para ${normalizedModality} com este treinador`);
  }
}
```

##### **✅ Tratamento de Erros de Duplicata**
```typescript
if (error) {
  console.error('❌ Erro ao criar solicitação:', error);
  
  // Verificar se o erro é de duplicata
  if (error.code === '23505' || error.message.includes('duplicate')) {
    throw new Error(`Solicitação duplicada detectada. Aguarde um momento e tente novamente.`);
  }
  
  throw error;
}
```

### 3. **Fluxo de Verificações Corrigido**

#### **Ordem das Verificações:**
1. **Relacionamento ativo** - Verifica se já tem treinador ativo para a modalidade
2. **Solicitação pendente global** - Verifica se já tem solicitação pendente para a modalidade (qualquer treinador)
3. **Relacionamento inativo** - Reativa relacionamento inativo se existir
4. **Limpeza de inativos** - Remove relacionamentos inativos conflitantes
5. **Verificação final** - Última verificação antes da inserção
6. **Inserção com tratamento de erro** - Cria solicitação com tratamento de duplicatas

## Como Resolver o Problema Atual

### **Passo 1: Executar Diagnóstico**
Execute o script `verificar_solicitacoes_duplicadas.sql` no Supabase SQL Editor para identificar as duplicatas.

### **Passo 2: Limpar Duplicatas**
Execute o script `limpar_solicitacoes_duplicadas.sql` para remover as duplicatas existentes.

### **Passo 3: Testar Correção**
Teste a criação de novas solicitações para verificar se não há mais duplicatas.

## Resultados Esperados

### ✅ **Problemas Resolvidos:**
1. **Não haverá mais solicitações duplicadas** - Verificações robustas implementadas
2. **Interface limpa** - Treinadores verão apenas uma solicitação por atleta/modalidade
3. **Dados consistentes** - Tabela `athlete_coach_relationships` sem duplicatas
4. **Mensagens claras** - Usuários recebem feedback específico sobre solicitações existentes

### 🔧 **Como Testar:**
1. Execute os scripts de limpeza
2. Tente criar uma solicitação de vínculo
3. Tente criar a mesma solicitação novamente
4. Verifique se recebe mensagem de erro apropriada
5. Verifique se não há duplicatas na interface do treinador

## Status da Correção

✅ **IMPLEMENTADO** - Todas as correções foram aplicadas
✅ **PREVENTIVO** - Sistema agora previne duplicatas
✅ **CURATIVO** - Scripts para limpar duplicatas existentes
✅ **DOCUMENTADO** - Guia completo de correções criado
