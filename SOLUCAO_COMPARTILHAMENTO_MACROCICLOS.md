# Solução: Compartilhamento de Macrociclos entre Treinador e Atleta

## Problema Identificado
- Treinador criou macrociclo para atleta Aline
- Macrociclo não aparecia na página da atleta
- Sistema não estava compartilhando dados entre treinadores e atletas vinculados

## Solução Implementada

### 1. **Modificação do Store de Ciclos** (`src/stores/cycles.ts`)

#### **Antes:**
```typescript
// Buscava apenas macrociclos próprios
const { data, error } = await supabase
  .from('macrociclos')
  .select('*')
  .eq('user_id', user.id)
```

#### **Depois:**
```typescript
// Busca macrociclos próprios E de atletas vinculados
const { data, error } = await supabase
  .from('macrociclos')
  .select(`
    *,
    user:user_id(
      id,
      email,
      profiles!inner(
        id,
        full_name,
        user_type
      )
    )
  `)
  .or(`user_id.eq.${user.id},user_id.in.(
    SELECT athlete_id 
    FROM public.athlete_coach_relationships 
    WHERE coach_id = '${user.id}' 
    AND status IN ('active', 'approved')
  )`)
```

### 2. **Atualização das Interfaces** (`src/types/database.ts`)

Adicionada propriedade `user` nas interfaces:
```typescript
export interface Macrociclo {
  // ... campos existentes
  user?: {
    id: string;
    email: string;
    profiles: Profile[];
  };
}
```

### 3. **Interface Visual** (`src/screens/training/CyclesOverview.tsx`)

Adicionado chip para mostrar o proprietário do macrociclo:
```typescript
{macrociclo.user && (
  <Chip 
    icon="account" 
    style={styles.ownerChip}
    textStyle={styles.ownerChipText}
  >
    {macrociclo.user.profiles?.[0]?.full_name || 'Atleta'}
  </Chip>
)}
```

## Como Funciona

### **Para Treinadores:**
1. **Visualização**: Veem seus próprios macrociclos + macrociclos de atletas vinculados
2. **Identificação**: Chip azul mostra o nome do atleta proprietário
3. **Criação**: Podem criar macrociclos para si ou para atletas vinculados

### **Para Atletas:**
1. **Visualização**: Veem apenas seus próprios macrociclos
2. **Criação**: Podem criar seus próprios macrociclos

### **Políticas RLS:**
- **Visualização**: Treinadores podem ver macrociclos de atletas com relacionamento ativo
- **Criação**: Usuários podem criar macrociclos para si mesmos
- **Edição**: Apenas o proprietário pode editar

## Testes Necessários

### **1. Execute o Script de Diagnóstico:**
```sql
-- Arquivo: testar_relacionamento_treinador_atleta.sql
-- Execute no Supabase SQL Editor
```

### **2. Verifique no Console:**
- Logs de debug mostram quantos macrociclos foram carregados
- Informações do proprietário de cada macrociclo

### **3. Teste na Interface:**
- Login como treinador → deve ver macrociclos próprios + dos atletas
- Login como atleta → deve ver apenas macrociclos próprios
- Chip azul deve mostrar o nome do atleta quando aplicável

## Logs de Debug

### **Logs Importantes:**
```
🔄 Store: Buscando macrociclos para usuário: [USER_ID]
✅ Store: Macrociclos carregados: X registros
🔍 Store: Detalhes dos macrociclos: [lista com proprietários]
```

### **Informações Mostradas:**
- ID do macrociclo
- Nome do macrociclo
- ID do proprietário
- Nome do proprietário
- Tipo do usuário (athlete/coach)
- Datas de início e fim

## Próximos Passos

### **1. Teste o Sistema:**
- Execute o script de diagnóstico
- Verifique os logs no console
- Teste a interface como treinador e atleta

### **2. Se Ainda Não Funcionar:**
- Verifique se o relacionamento treinador-atleta está ativo
- Confirme se as políticas RLS estão corretas
- Verifique se há erros no console

### **3. Melhorias Futuras:**
- Adicionar filtros por atleta
- Implementar notificações quando treinador cria macrociclo
- Adicionar permissões granulares de edição

## Status

- ✅ **IMPLEMENTADO** - Compartilhamento de macrociclos
- ✅ **IMPLEMENTADO** - Interface visual com identificação do proprietário
- ✅ **IMPLEMENTADO** - Logs de debug detalhados
- ⏳ **PENDENTE** - Testes e validação
- ⏳ **PENDENTE** - Feedback do usuário
