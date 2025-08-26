# Correção Implementada: Tipos de Mesociclos

## Resumo da Correção

Corrigimos a **inconsistência** entre os tipos de mesociclos definidos no código e os tipos permitidos no banco de dados Supabase.

## Problema Identificado

### **Dados Reais no Banco:**
- **Choque**: 16 mesociclos
- **Ordinário**: 12 mesociclos  
- **Competitivo**: 9 mesociclos
- **Pré-competitivo**: 8 mesociclos
- **Regenerativo**: 3 mesociclos

### **Inconsistência:**
Os tipos usados no código (`Ordinário`, `Choque`, `Regenerativo`) **não existiam** na constraint do banco de dados.

## Solução Implementada

### **1. Atualização dos Tipos no Código**

**Arquivo**: `src/screens/training/CreateMesocicloModal.tsx`

```typescript
// ✅ CORRIGIDO: Tipos alinhados com o banco
const MESOCICLO_TYPES = [
  'base',              // Mapeia para 'Ordinário'
  'desenvolvimento',    // Mapeia para 'Choque'
  'estabilizador',      // Mapeia para 'Estabilizador'
  'especifico',         // Novo tipo
  'pre_competitivo',    // Mapeia para 'Pré-competitivo'
  'polimento',          // Novo tipo
  'competitivo',        // Mapeia para 'Competitivo'
  'transicao',          // Novo tipo
  'recuperativo'        // Mapeia para 'Regenerativo'
];

// ✅ NOVO: Mapeamento para exibição em português
const MESOCICLO_TYPE_LABELS: Record<string, string> = {
  'base': 'Ordinário',
  'desenvolvimento': 'Choque',
  'estabilizador': 'Estabilizador',
  'especifico': 'Específico',
  'pre_competitivo': 'Pré-competitivo',
  'polimento': 'Polimento',
  'competitivo': 'Competitivo',
  'transicao': 'Transição',
  'recuperativo': 'Regenerativo'
};
```

### **2. Função de Conversão de Tipos**

```typescript
// ✅ NOVO: Função para converter tipos para o banco
const getTypeForDatabase = (displayType: string): string => {
  // Se já é um tipo válido do banco, usar como está
  if (MESOCICLO_TYPES.includes(displayType)) {
    return displayType;
  }
  // Caso contrário, procurar pelo mapeamento reverso
  const reverseMapping = Object.entries(MESOCICLO_TYPE_LABELS)
    .find(([key, value]) => value === displayType);
  return reverseMapping ? reverseMapping[0] : displayType;
};
```

### **3. Salvamento Corrigido**

```typescript
// ✅ CORRIGIDO: Salvamento com ambos os campos
const mesocicloData: CreateMesocicloData = {
  macrociclo_id: selectedMacrocicloId,
  name: `Mesociclo ${row.number}`,
  start_date: convertDateToISO(row.startDate),
  end_date: convertDateToISO(row.endDate),
  focus: row.type.trim(), // Manter para compatibilidade
  mesociclo_type: getTypeForDatabase(row.type.trim()), // Novo campo
  intensity_level: 'moderada' as const,
  volume_level: 'moderado' as const
};
```

### **4. Exibição Atualizada**

**Arquivo**: `src/screens/training/CyclesOverview.tsx`

```typescript
// ✅ CORRIGIDO: Exibição priorizando mesociclo_type
<Text variant="bodyMedium" style={styles.mesocicloName}>
  {mesociclo.mesociclo_type || mesociclo.focus || 'Ordinário'}
</Text>
```

## Mapeamento de Tipos

| Código (Antes) | Banco (Agora) | Exibição |
|----------------|---------------|----------|
| `'Ordinário'` | `'base'` | `'Ordinário'` |
| `'Choque'` | `'desenvolvimento'` | `'Choque'` |
| `'Estabilizador'` | `'estabilizador'` | `'Estabilizador'` |
| `'Regenerativo'` | `'recuperativo'` | `'Regenerativo'` |
| `'Pré-competitivo'` | `'pre_competitivo'` | `'Pré-competitivo'` |
| `'Competitivo'` | `'competitivo'` | `'Competitivo'` |
| - | `'especifico'` | `'Específico'` |
| - | `'polimento'` | `'Polimento'` |
| - | `'transicao'` | `'Transição'` |

## Script de Correção do Banco

**Arquivo**: `corrigir_tipos_mesociclos.sql`

Este script:
1. **Mapeia** os tipos existentes para os tipos válidos do banco
2. **Atualiza** o campo `mesociclo_type` com os valores corretos
3. **Mantém** o campo `focus` para compatibilidade
4. **Verifica** se a correção foi aplicada corretamente

## Benefícios da Correção

### ✅ **Consistência**
- Tipos do código alinhados com o banco
- Validação de dados funcionando corretamente

### ✅ **Compatibilidade**
- Dados existentes preservados
- Campo `focus` mantido para compatibilidade

### ✅ **Flexibilidade**
- Novos tipos disponíveis (`especifico`, `polimento`, `transicao`)
- Mapeamento reverso para exibição em português

### ✅ **Manutenibilidade**
- Estrutura padronizada
- Evita problemas futuros de validação

## Próximos Passos

1. **Executar** o script `corrigir_tipos_mesociclos.sql` no Supabase
2. **Testar** a criação de novos mesociclos
3. **Verificar** se a exibição está correta
4. **Validar** que não há erros de constraint no banco

## Status da Implementação

✅ **TIPOS ATUALIZADOS** - Código alinhado com o banco
✅ **FUNÇÃO DE CONVERSÃO** - Mapeamento implementado
✅ **SALVAMENTO CORRIGIDO** - Ambos os campos preenchidos
✅ **EXIBIÇÃO ATUALIZADA** - Prioriza mesociclo_type
✅ **SCRIPT DE CORREÇÃO** - Para dados existentes

⚠️ **PENDENTE**: Execução do script SQL no banco de dados
