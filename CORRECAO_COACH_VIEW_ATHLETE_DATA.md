# Correção: Treinador não consegue ver dados da atleta vinculada

## Problema Identificado

O usuário reportou que quando logado como treinador e visualizando o perfil de uma atleta vinculada, não aparecem dados nas abas de treino e outras abas. O problema estava relacionado a várias questões principais:

1. **Funções de busca de dados não consideravam o modo coach**: As funções `fetchTrainingSessions`, `loadTodayCheckin` e `loadRecentCheckins` sempre usavam o ID do usuário logado, não o `viewAsAthleteId` quando no modo coach.

2. **Funções de ciclos não consideravam o modo coach**: As funções `fetchMicrociclos` e `fetchMesociclos` também não estavam considerando o modo coach, resultando em "0 registros" encontrados.

3. **Função de provas não considerava o modo coach**: A função `fetchRaces` não estava considerando o modo coach, resultando em provas diferentes sendo exibidas no aplicativo vs banco de dados.

4. **Possível problema com políticas RLS**: As políticas de Row Level Security no Supabase podem não estar permitindo que treinadores acessem dados dos atletas vinculados.

## Solução Implementada

### 1. Correção das Funções de Busca de Dados

#### `src/stores/checkin.ts`

**Função `fetchTrainingSessions`:**
```typescript
// ✅ NOVO: Verificar se está no modo coach
const { isCoachView, viewAsAthleteId } = useViewStore.getState();
if (isCoachView && viewAsAthleteId) {
  console.log('🔍 Modo Coach - Buscando treinos do atleta:', viewAsAthleteId);
  targetUserId = viewAsAthleteId;
} else {
  console.log('🔍 Modo Atleta - Buscando próprios treinos:', targetUserId);
}
```

**Função `loadTodayCheckin`:**
```typescript
// ✅ NOVO: Verificar se está no modo coach
const { isCoachView, viewAsAthleteId } = useViewStore.getState();
if (isCoachView && viewAsAthleteId) {
  console.log('🔍 Modo Coach - Buscando check-in do atleta:', viewAsAthleteId);
  safeUserId = viewAsAthleteId;
} else {
  console.log('🔍 Modo Atleta - Buscando próprio check-in:', safeUserId);
}
```

**Função `loadRecentCheckins`:**
```typescript
// ✅ NOVO: Verificar se está no modo coach
const { isCoachView, viewAsAthleteId } = useViewStore.getState();
if (isCoachView && viewAsAthleteId) {
  console.log('🔍 Modo Coach - Buscando check-ins do atleta:', viewAsAthleteId);
  targetUserId = viewAsAthleteId;
} else {
  console.log('🔍 Modo Atleta - Buscando próprios check-ins:', targetUserId);
}
```

### 2. Correção das Funções de Ciclos

#### `src/stores/cycles.ts`

**Função `fetchMicrociclos`:**
```typescript
// ✅ NOVO: Assinatura atualizada para aceitar athleteId
fetchMicrociclos: async (mesocicloId?: string, athleteId?: string) => {
  // Determinar o user_id correto para buscar
  let targetUserId = user.id;
  
  if (athleteId) {
    // Se athleteId foi fornecido, buscar os microciclos do atleta
    console.log('🔄 Store: Treinador buscando microciclos do atleta:', athleteId);
    targetUserId = athleteId;
  } else {
    console.log('🔄 Store: Atleta buscando próprios microciclos:', user.id);
  }
}
```

**Função `fetchMesociclos`:**
```typescript
// ✅ NOVO: Assinatura atualizada para aceitar athleteId
fetchMesociclos: async (macrocicloId?: string, athleteId?: string) => {
  // Determinar o user_id correto para buscar
  let targetUserId = user.id;
  
  if (athleteId) {
    // Se athleteId foi fornecido, buscar os mesociclos do atleta
    console.log('🔄 Store: Treinador buscando mesociclos do atleta:', athleteId);
    targetUserId = athleteId;
  } else {
    console.log('🔄 Store: Atleta buscando próprios mesociclos:', user.id);
  }
}
```

#### `src/screens/training/TrainingScreen.tsx`

**Chamada das funções atualizada:**
```typescript
// ✅ CORRIGIDO: Passar viewAsAthleteId para as funções de ciclos
useEffect(() => {
    if (userId) {
        fetchMacrociclos(isCoachView && viewAsAthleteId ? viewAsAthleteId : undefined);
        fetchMicrociclos(undefined, isCoachView && viewAsAthleteId ? viewAsAthleteId : undefined);
    }
}, [userId, fetchMacrociclos, fetchMicrociclos, isCoachView, viewAsAthleteId]);
```

### 3. Correção da Função de Provas

#### `src/stores/auth.ts`

**Função `fetchRaces`:**
```typescript
// ✅ NOVO: Verificar se está no modo coach
const { isCoachView, viewAsAthleteId } = useViewStore.getState();
if (isCoachView && viewAsAthleteId) {
  console.log('🔍 Modo Coach - Buscando provas do atleta:', viewAsAthleteId);
  targetUserId = viewAsAthleteId;
} else {
  console.log('🔍 Modo Atleta - Buscando próprias provas:', targetUserId);
}
```

### 4. Scripts SQL para Verificação e Correção

#### `verificar_rls_coach_athlete.sql`
Script para verificar:
- Políticas RLS existentes nas tabelas
- Relacionamentos coach-atleta
- Dados existentes para atletas vinculados
- Estrutura das tabelas

#### `criar_rls_coach_athlete.sql`
Script para criar/atualizar políticas RLS que permitem:
- Treinadores visualizarem dados dos atletas vinculados
- Acesso a `training_sessions`, `daily_checkins`, `insights`, `profiles`, `fitness_tests`, `races`, `macrociclos`, `mesociclos`, `microciclos`

#### `verificar_ciclos_banco.sql`
Script para verificar:
- Existência de macrociclos, mesociclos e microciclos no banco
- Detalhes dos ciclos existentes
- Relacionamentos com atletas vinculados
- Políticas RLS para tabelas de ciclos

#### `verificar_provas_discrepancia.sql`
Script para verificar:
- Discrepâncias entre provas no banco e no aplicativo
- Provas específicas do atleta
- Relacionamentos coach-atleta
- Políticas RLS para tabela races

### 5. Logs de Debug Adicionados

Foram adicionados logs detalhados para facilitar o diagnóstico:
- Identificação do modo (coach vs atleta)
- ID do usuário sendo consultado
- Quantidade de dados encontrados
- Período de busca

## Como Testar

### 1. Execute os Scripts SQL

1. Execute `verificar_rls_coach_athlete.sql` no SQL Editor do Supabase para verificar o estado atual
2. Execute `criar_rls_coach_athlete.sql` para criar/atualizar as políticas RLS
3. Execute `verificar_ciclos_banco.sql` para verificar se existem ciclos no banco
4. Execute `verificar_provas_discrepancia.sql` para verificar discrepâncias nas provas

### 2. Teste no Aplicativo

1. **Login como treinador**
2. **Acesse a lista de atletas vinculados**
3. **Clique em um atleta para visualizar seu perfil**
4. **Navegue pelas abas:**
   - **Home**: Deve mostrar dados de treino e check-ins da atleta
   - **Treino**: Deve mostrar sessões de treino da atleta
   - **Análise**: Deve mostrar gráficos e insights da atleta
   - **Perfil Esportivo**: Deve mostrar testes e provas da atleta

### 3. Verifique os Logs

No console do aplicativo, você deve ver logs como:
```
🔍 Modo Coach - Buscando treinos do atleta: [athlete-id]
🔍 Buscando treinos para usuário: [athlete-id] período: [start-date] a [end-date]
✅ Treinos encontrados: [count]
🔄 Store: Treinador buscando macrociclos do atleta: [athlete-id]
🔄 Store: Treinador buscando mesociclos do atleta: [athlete-id]
🔄 Store: Treinador buscando microciclos do atleta: [athlete-id]
🔍 Modo Coach - Buscando provas do atleta: [athlete-id]
```

## Estrutura das Políticas RLS

As políticas criadas seguem o padrão:
```sql
CREATE POLICY "Coaches can view their athletes' [table_name]" ON [table_name]
FOR SELECT USING (
  auth.uid() = user_id  -- Usuário pode ver seus próprios dados
  OR
  EXISTS (              -- Treinador pode ver dados dos atletas vinculados
    SELECT 1 FROM athlete_coach_relationships acr
    WHERE acr.coach_id = auth.uid()
    AND acr.athlete_id = [table_name].user_id
    AND acr.status = 'accepted'
  )
);
```

## Observações Importantes

1. **Permissões**: As políticas RLS permitem apenas **visualização** (SELECT). Para permitir edição, seria necessário criar políticas adicionais com `FOR UPDATE`.

2. **Relacionamentos**: Apenas atletas com relacionamento **aceito** (`status = 'accepted'`) são visíveis para o treinador.

3. **Segurança**: As políticas garantem que treinadores só vejam dados dos atletas com quem têm relacionamento ativo.

4. **Performance**: As consultas usam `EXISTS` para melhor performance em vez de `JOIN`.

5. **Ciclos**: As funções de ciclos agora consideram corretamente o modo coach, buscando dados do atleta vinculado.

6. **Provas**: A função `fetchRaces` agora considera corretamente o modo coach, exibindo as provas corretas do atleta.

## Próximos Passos

Se o problema persistir após essas correções:

1. **Verificar logs do console** para identificar erros específicos
2. **Executar scripts de diagnóstico** para verificar dados no banco
3. **Testar com diferentes atletas** para isolar o problema
4. **Verificar se há dados suficientes** para exibir nas abas

## Arquivos Modificados

- `src/stores/checkin.ts` - Funções de busca de dados atualizadas
- `src/stores/cycles.ts` - Funções de ciclos atualizadas para considerar modo coach
- `src/stores/auth.ts` - Função fetchRaces atualizada para considerar modo coach
- `src/screens/training/TrainingScreen.tsx` - Chamadas das funções de ciclos corrigidas
- `verificar_rls_coach_athlete.sql` - Script de diagnóstico
- `criar_rls_coach_athlete.sql` - Script de correção das políticas RLS
- `verificar_ciclos_banco.sql` - Script de verificação de ciclos no banco
- `verificar_provas_discrepancia.sql` - Script de verificação de discrepâncias nas provas
