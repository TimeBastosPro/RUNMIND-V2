# Guia de Diagnóstico: Problema ao Salvar Múltiplas Provas

## Problema Reportado
"Parece que não está sendo possível salvar mais de uma prova"

## Possíveis Causas

### 1. Verificação de Duplicatas Muito Restritiva
**Localização**: `src/stores/auth.ts` - função `saveRace` (linhas 1154-1166)

**Código Atual**:
```typescript
const duplicateCheck = existingRaces.find(race => 
  race.event_name === raceData.event_name && 
  race.start_date === raceData.start_date &&
  race.city === raceData.city
);

if (duplicateCheck) {
  console.warn('DEBUG - saveRace: Prova duplicada detectada:', duplicateCheck);
  throw new Error('Já existe uma prova com os mesmos dados');
}
```

**Problema Potencial**: Esta verificação pode estar bloqueando provas legítimas que têm:
- Mesmo nome mas cidade diferente
- Mesmo nome e cidade mas data diferente
- Mesmo nome, cidade e data mas horário diferente

### 2. Constraints Únicas no Banco de Dados
**Verificar**: Execute o script `teste_salvar_multiplas_provas.sql` no Supabase

**Possíveis Constraints Problemáticas**:
- Constraint única em `(event_name, start_date, city)`
- Constraint única em `(user_id, event_name)`
- Constraint única em `(event_name, city)`

### 3. Políticas RLS (Row Level Security)
**Verificar**: Políticas de inserção na tabela `races`

**Possíveis Problemas**:
- Política que limita número de provas por usuário
- Política que bloqueia inserções baseada em condições específicas

### 4. Triggers no Banco de Dados
**Verificar**: Triggers que podem estar interferindo na inserção

### 5. Problemas de Estado Local
**Possível**: O estado local não está sendo atualizado corretamente após salvar

## Passos para Diagnóstico

### Passo 1: Verificar Logs do Console
1. Abra o console do navegador
2. Tente salvar uma segunda prova
3. Procure por logs que começam com `DEBUG - saveRace:`
4. Verifique se aparece:
   - "Prova duplicada detectada"
   - "Erro do Supabase"
   - "Prova salva com sucesso"

### Passo 2: Executar Script SQL
Execute o script `teste_salvar_multiplas_provas.sql` no Supabase SQL Editor e verifique:

**Seção 1 - Constraints Únicas**:
```sql
SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'races'
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');
```

**Seção 3 - Políticas RLS**:
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'races'
    AND cmd = 'INSERT';
```

### Passo 3: Testar Inserção Manual
No Supabase SQL Editor, tente inserir provas manualmente:

```sql
-- Substitua 'SEU_USER_ID' pelo ID real do usuário
INSERT INTO races (user_id, event_name, city, start_date, start_time, distance_km) 
VALUES ('SEU_USER_ID', 'Teste Prova 1', 'São Paulo', '2025-02-15', '08:00', 10.0);

INSERT INTO races (user_id, event_name, city, start_date, start_time, distance_km) 
VALUES ('SEU_USER_ID', 'Teste Prova 2', 'Rio de Janeiro', '2025-03-20', '07:30', 21.1);
```

### Passo 4: Verificar Estado Local
No console do navegador, execute:
```javascript
// Verificar estado atual de provas
console.log('Provas no estado:', useAuthStore.getState().races);

// Verificar se fetchRaces está funcionando
useAuthStore.getState().fetchRaces();
```

## Soluções Possíveis

### Solução 1: Ajustar Verificação de Duplicatas
Se a verificação estiver muito restritiva, modificar em `src/stores/auth.ts`:

```typescript
// Opção A: Remover verificação de cidade
const duplicateCheck = existingRaces.find(race => 
  race.event_name === raceData.event_name && 
  race.start_date === raceData.start_date
);

// Opção B: Adicionar verificação de horário
const duplicateCheck = existingRaces.find(race => 
  race.event_name === raceData.event_name && 
  race.start_date === raceData.start_date &&
  race.city === raceData.city &&
  race.start_time === raceData.start_time
);

// Opção C: Remover verificação completamente (temporariamente)
// const duplicateCheck = null;
```

### Solução 2: Remover Constraints Problemáticas
Se houver constraints únicas problemáticas no banco:

```sql
-- Verificar constraints existentes
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'races';

-- Remover constraint específica (se necessário)
ALTER TABLE races DROP CONSTRAINT nome_da_constraint;
```

### Solução 3: Ajustar Políticas RLS
Se houver políticas RLS bloqueando:

```sql
-- Verificar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'races';

-- Recriar política de inserção (exemplo)
DROP POLICY IF EXISTS nome_da_politica ON races;
CREATE POLICY nome_da_politica ON races FOR INSERT 
WITH CHECK (auth.uid() = user_id);
```

### Solução 4: Forçar Atualização do Estado
Se o problema for de estado local, adicionar em `saveRace`:

```typescript
// Após salvar com sucesso
await get().fetchRaces(); // Recarregar do banco
```

## Comandos para Executar

1. **Verificar logs**: Abrir console do navegador e tentar salvar prova
2. **Executar SQL**: `teste_salvar_multiplas_provas.sql` no Supabase
3. **Testar inserção manual**: Comandos INSERT no Supabase
4. **Verificar estado**: `useAuthStore.getState().races` no console

## Próximos Passos

1. Execute os testes acima
2. Me informe os resultados dos logs do console
3. Me informe os resultados do script SQL
4. Me informe se consegue inserir provas manualmente no banco

Com essas informações, poderei identificar exatamente onde está o problema e implementar a correção adequada.
