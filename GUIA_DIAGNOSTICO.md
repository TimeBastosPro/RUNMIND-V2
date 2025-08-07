# Guia de Diagnóstico - Sistema de Relacionamentos

## Problema Identificado
As solicitações de treinador não aparecem e ao aceitar está gerando erro.

## Análise Passo a Passo

### 1. **Verificar Estrutura do Banco de Dados**
Execute o script `debug_step_by_step.sql` no Supabase SQL Editor para verificar:
- ✅ Se as tabelas existem
- ✅ Se há dados nas tabelas
- ✅ Se as views estão criadas corretamente
- ✅ Se as políticas RLS estão configuradas

### 2. **Verificar Fluxo de Criação de Relacionamento**

#### 2.1 Código do Atleta (CoachSearchScreen.tsx)
```typescript
// Linha 58-75: Função handleRequestRelationship
const handleRequestRelationship = async () => {
  if (!selectedCoach) return;
  
  try {
    await requestCoachRelationship(
      selectedCoach.id,
      undefined, // team_id
      requestNotes.trim() || undefined
    );
    // ...
  } catch (error) {
    console.error('Erro ao solicitar vínculo:', error);
  }
};
```

#### 2.2 Store do Coach (coach.ts)
```typescript
// Linha 275-295: Função requestCoachRelationship
requestCoachRelationship: async (coachId: string, teamId?: string, notes?: string) => {
  set({ isLoading: true, error: null });
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('athlete_coach_relationships')
      .insert([{
        athlete_id: user.id,
        coach_id: coachId,
        team_id: teamId,
        notes,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    // ...
  } catch (error: any) {
    set({ error: error.message, isLoading: false });
    throw error;
  }
}
```

### 3. **Verificar Fluxo de Carregamento de Solicitações**

#### 3.1 Tela do Treinador (CoachRequestsScreen.tsx)
```typescript
// Linha 32-40: Função loadData
const loadData = async () => {
  try {
    console.log('📋 Carregando solicitações...');
    await loadCoachRelationships({ status: 'pending' });
    console.log('📋 Solicitações carregadas:', relationships?.length || 0);
  } catch (error) {
    console.error('Erro ao carregar solicitações:', error);
  }
};
```

#### 3.2 Store do Coach (coach.ts)
```typescript
// Linha 320-380: Função loadCoachRelationships
loadCoachRelationships: async (filters?: RelationshipFilters) => {
  set({ isLoading: true, error: null });
  try {
    const { currentCoach } = get();
    if (!currentCoach) throw new Error('Perfil de treinador não encontrado');

    // Usar a view que inclui dados do atleta
    let query = supabase
      .from('active_athlete_coach_relationships')
      .select('*')
      .eq('coach_id', currentCoach.id);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    // ...
  } catch (error: any) {
    set({ error: error.message, isLoading: false });
    throw error;
  }
}
```

### 4. **Possíveis Problemas Identificados**

#### 4.1 **Problema 1: View não existe**
- **Sintoma**: Erro "relation does not exist"
- **Solução**: Executar script `test_complete_flow.sql` para criar as views

#### 4.2 **Problema 2: Dados não estão sendo inseridos**
- **Sintoma**: Relacionamento não aparece na tabela
- **Causa**: Erro na inserção ou política RLS bloqueando
- **Verificação**: Executar `debug_step_by_step.sql` passo 6

#### 4.3 **Problema 3: Dados não estão sendo carregados**
- **Sintoma**: View existe mas não retorna dados
- **Causa**: JOIN incorreto ou dados nulos
- **Verificação**: Executar `debug_step_by_step.sql` passo 6

#### 4.4 **Problema 4: Erro PGRST116 na aprovação**
- **Sintoma**: "JSON object requested, multiple (or no) rows returned"
- **Causa**: Uso de `.single()` quando deveria ser `.maybeSingle()`
- **Solução**: Já corrigido no código

### 5. **Passos para Correção**

#### 5.1 Execute o Script de Teste
```sql
-- Execute no Supabase SQL Editor
-- Arquivo: test_complete_flow.sql
```

#### 5.2 Verifique os Resultados
- ✅ Treinador criado
- ✅ Relacionamento criado
- ✅ Views funcionando
- ✅ Dados aparecendo corretamente

#### 5.3 Teste no Aplicativo
1. Faça login como atleta
2. Busque treinadores
3. Solicite vínculo
4. Faça login como treinador
5. Verifique se a solicitação aparece

### 6. **Logs para Verificar**

#### 6.1 Console do Navegador
```javascript
// Verificar se aparecem estes logs:
🔍 Carregando dados iniciais...
🔍 Dados carregados: { coachesCount: X, relationshipsCount: Y }
📋 Carregando solicitações...
📋 Solicitações carregadas: X
```

#### 6.2 Logs do Store
```javascript
// Verificar se aparecem estes logs:
🔍 loadCoachRelationships - Treinador: [ID], [NOME]
🔍 Resultado da consulta active_athlete_coach_relationships: { data: X, error: null }
```

### 7. **Comandos para Executar**

#### 7.1 No Supabase SQL Editor
```sql
-- Execute em ordem:
1. debug_step_by_step.sql
2. test_complete_flow.sql
```

#### 7.2 No Terminal
```bash
# Reiniciar o aplicativo
npm start
```

### 8. **Resultado Esperado**

Após executar os scripts e testar:
- ✅ Solicitações aparecem com dados completos do atleta
- ✅ Aprovação/rejeição funcionam sem erros
- ✅ Não há mais erros PGRST116
- ✅ Sistema totalmente funcional

### 9. **Próximos Passos**

1. Execute o script `test_complete_flow.sql`
2. Verifique os resultados no Supabase
3. Teste o fluxo no aplicativo
4. Se ainda houver problemas, execute `debug_step_by_step.sql`
5. Analise os logs do console para identificar onde está falhando

### 10. **Arquivos de Referência**

- `debug_step_by_step.sql` - Diagnóstico detalhado
- `test_complete_flow.sql` - Teste completo do fluxo
- `src/stores/coach.ts` - Lógica do store
- `src/screens/athlete/CoachSearchScreen.tsx` - Tela do atleta
- `src/screens/coach/CoachRequestsScreen.tsx` - Tela do treinador 