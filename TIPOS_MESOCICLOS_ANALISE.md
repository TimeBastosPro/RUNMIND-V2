# Análise: Tipos de Mesociclos no Sistema

## Resumo da Situação

Existe uma **inconsistência** entre os tipos de mesociclos definidos no código e os tipos permitidos no banco de dados Supabase.

## Tipos Definidos no Código

### **Arquivo**: `src/screens/training/CreateMesocicloModal.tsx`

```typescript
const MESOCICLO_TYPES = [
  'Ordinário',
  'Estabilizador', 
  'Choque',
  'Regenerativo',
  'Pré-competitivo',
  'Competitivo'
];
```

## Tipos Permitidos no Banco de Dados

### **Tabela**: `mesociclos`

```sql
mesociclo_type TEXT CHECK (mesociclo_type IN (
  'base', 
  'desenvolvimento', 
  'estabilizador', 
  'especifico', 
  'pre_competitivo', 
  'polimento', 
  'competitivo', 
  'transicao', 
  'recuperativo'
))
```

## Campos na Tabela Mesociclos

A tabela `mesociclos` possui **dois campos** relacionados aos tipos:

1. **`focus`** - Campo TEXT livre (sem restrições)
2. **`mesociclo_type`** - Campo TEXT com restrições CHECK

## Problema Identificado

### **Inconsistência de Tipos:**

| Código | Banco de Dados | Status |
|--------|----------------|--------|
| `'Ordinário'` | ❌ Não existe | **PROBLEMA** |
| `'Estabilizador'` | ✅ `'estabilizador'` | **OK** |
| `'Choque'` | ❌ Não existe | **PROBLEMA** |
| `'Regenerativo'` | ❌ Não existe | **PROBLEMA** |
| `'Pré-competitivo'` | ✅ `'pre_competitivo'` | **OK** |
| `'Competitivo'` | ✅ `'competitivo'` | **OK** |

### **Mapeamento Atual:**

O código está salvando os tipos do `MESOCICLO_TYPES` no campo **`focus`** (que é livre), mas o banco tem restrições no campo **`mesociclo_type`**.

## Como Está Sendo Salvo Atualmente

### **No Código:**
```typescript
// Em CreateMesocicloModal.tsx
const mesocicloData = {
  name: `Mesociclo ${row.number}`,
  focus: row.type, // ← Aqui está sendo salvo no campo 'focus'
  start_date: row.startDate,
  end_date: row.endDate,
  macrociclo_id: selectedMacrocicloId
};
```

### **No Banco:**
- Campo `focus`: Recebe os valores do `MESOCICLO_TYPES`
- Campo `mesociclo_type`: Fica NULL ou com valores não permitidos

## Soluções Possíveis

### **Opção 1: Alinhar o Código com o Banco**
Atualizar `MESOCICLO_TYPES` para usar os tipos do banco:

```typescript
const MESOCICLO_TYPES = [
  'base',
  'desenvolvimento', 
  'estabilizador',
  'especifico',
  'pre_competitivo',
  'polimento',
  'competitivo',
  'transicao',
  'recuperativo'
];
```

### **Opção 2: Alinhar o Banco com o Código**
Atualizar a constraint do banco para aceitar os tipos do código:

```sql
ALTER TABLE mesociclos 
DROP CONSTRAINT IF EXISTS mesociclos_mesociclo_type_check;

ALTER TABLE mesociclos 
ADD CONSTRAINT mesociclos_mesociclo_type_check 
CHECK (mesociclo_type IN (
  'Ordinário',
  'Estabilizador', 
  'Choque',
  'Regenerativo',
  'Pré-competitivo',
  'Competitivo'
));
```

### **Opção 3: Usar Apenas o Campo `focus`**
Remover a constraint do `mesociclo_type` e usar apenas o campo `focus`:

```sql
ALTER TABLE mesociclos 
DROP CONSTRAINT IF EXISTS mesociclos_mesociclo_type_check;
```

## Recomendação

**Recomendo a Opção 1** (alinhar o código com o banco) porque:

1. **Consistência**: O banco já tem uma estrutura bem definida
2. **Padrão**: Os tipos do banco seguem nomenclatura padrão em inglês
3. **Flexibilidade**: O campo `focus` pode ser usado para descrições adicionais
4. **Manutenibilidade**: Evita problemas futuros de compatibilidade

## Implementação Recomendada

### **1. Atualizar MESOCICLO_TYPES:**
```typescript
const MESOCICLO_TYPES = [
  'base',
  'desenvolvimento', 
  'estabilizador',
  'especifico',
  'pre_competitivo',
  'polimento',
  'competitivo',
  'transicao',
  'recuperativo'
];
```

### **2. Atualizar o Salvamento:**
```typescript
const mesocicloData = {
  name: `Mesociclo ${row.number}`,
  focus: row.type, // Para compatibilidade
  mesociclo_type: row.type, // Novo campo
  start_date: row.startDate,
  end_date: row.endDate,
  macrociclo_id: selectedMacrocicloId
};
```

### **3. Atualizar a Exibição:**
```typescript
// Em CyclesOverview.tsx
<Text variant="bodyMedium" style={styles.mesocicloName}>
  {mesociclo.mesociclo_type || mesociclo.focus || 'Ordinário'}
</Text>
```

## Script de Verificação

Execute o script `verificar_tipos_mesociclos.sql` para verificar:
- Estrutura atual da tabela
- Dados salvos
- Inconsistências
- Tipos fora dos permitidos

## Status Atual

⚠️ **PROBLEMA IDENTIFICADO**: Inconsistência entre tipos do código e banco
🔧 **SOLUÇÃO NECESSÁRIA**: Alinhar tipos do código com os do banco
📊 **IMPACTO**: Pode causar erros de validação no banco
