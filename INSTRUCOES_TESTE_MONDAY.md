# 🔍 Instruções para Testar Problema de Segunda-feira

## Problema Identificado
Os dados de segunda-feira (01/09/2025) não estão sendo exibidos no gráfico de análise de treinos, mesmo que existam dados no banco e na aba de treinos.

## Testes Disponíveis

### 1. **`simple_monday_test.js`** - TESTE PRINCIPAL
**Objetivo**: Teste simples e direto que verifica toda a lógica
- ✅ Funciona sem depender do objeto `supabase`
- ✅ Testa cálculo de período da semana
- ✅ Testa geração de datas
- ✅ Testa processamento de dados
- ✅ Identifica exatamente onde o problema ocorre

### 2. **`test_getCurrentPeriod_issue.js`** - TESTE ESPECÍFICO
**Objetivo**: Testa especificamente a função `getCurrentPeriod`
- ✅ Testa diferentes cenários de data atual
- ✅ Verifica se o problema está na data atual da aplicação
- ✅ Identifica se o período calculado está correto

### 3. **`test_monday_issue_in_app.js`** - TESTE COMPLETO
**Objetivo**: Teste completo que simula a aplicação real
- ✅ Tenta acessar dados reais da aplicação
- ✅ Fallback para dados simulados
- ✅ Testa todo o fluxo de processamento

## Como Executar os Testes

### Passo 1: Executar Teste Principal
```javascript
// No console do navegador (F12 > Console)
// Cole o conteúdo do arquivo simple_monday_test.js
```

### Passo 2: Analisar Resultados
O teste vai mostrar:
- ✅ Se 01/09/2025 é segunda-feira
- ✅ Se o período da semana está sendo calculado corretamente
- ✅ Se 01/09 está no período calculado
- ✅ Se segunda-feira está sendo gerada nas datas
- ✅ Se segunda-feira tem dados no gráfico

### Passo 3: Executar Teste Específico (se necessário)
```javascript
// Se o problema não for identificado no teste principal
// Cole o conteúdo do arquivo test_getCurrentPeriod_issue.js
```

## Resultados Esperados

### ✅ **Se tudo estiver funcionando:**
```
✅ 01/09/2025 é segunda-feira: SIM
✅ Período calculado corretamente: SIM
✅ 01/09 está no período: SIM
✅ Segunda-feira nas datas geradas: SIM
✅ 01/09 nas datas geradas: SIM
✅ Segunda-feira tem dados no gráfico: SIM
```

### ❌ **Se houver problema:**
```
❌ PROBLEMA: Segunda-feira não tem dados!
🔍 Não há sessão para segunda-feira
💡 Verificar se há dados no banco para 01/09/2025
```

## Possíveis Causas do Problema

### 1. **Dados não existem no banco**
- Não há registros para 01/09/2025
- Status não é 'planned'
- Campo distance_km está null/undefined

### 2. **Problema na função getCurrentPeriod**
- A função está usando uma data incorreta
- O período calculado não inclui 01/09/2025
- Problema na data atual da aplicação

### 3. **Problema na geração de datas**
- `generateWeekDates()` não está gerando 01/09
- `getWeekStart()` calculando período incorreto
- Problema de timezone

### 4. **Problema no processamento**
- Filtro por período muito restritivo
- Filtro por tipo (planned) excluindo dados
- Problema na comparação de datas

## Soluções Baseadas nos Resultados

### Se não há dados no banco:
```sql
-- Inserir dados de teste para 01/09/2025
INSERT INTO training_sessions (
    user_id,
    training_date,
    status,
    title,
    distance_km,
    esforco,
    intensidade,
    modalidade,
    treino_tipo,
    duracao_horas,
    duracao_minutos,
    created_at,
    updated_at
) VALUES (
    'SEU_USER_ID',
    '2025-09-01T00:00:00.000Z',
    'planned',
    'Treino de Segunda-feira',
    10.0,
    3,
    'Z2',
    'corrida',
    'continuo',
    1,
    0,
    NOW(),
    NOW()
);
```

### Se o problema é na função getCurrentPeriod:
- Verificar se a data atual da aplicação está correta
- Verificar se o período calculado inclui 01/09/2025
- Ajustar a lógica de cálculo do período

### Se o problema é na geração de datas:
- Verificar função `generateWeekDates`
- Verificar função `getWeekStart`
- Verificar função `getWeekEnd`

### Se o problema é no processamento:
- Ajustar lógica de filtro por período
- Ajustar lógica de filtro por tipo
- Verificar comparação de datas

## Próximos Passos

1. **Execute o teste principal** (`simple_monday_test.js`)
2. **Analise os resultados** e identifique onde o problema ocorre
3. **Execute o teste específico** se necessário (`test_getCurrentPeriod_issue.js`)
4. **Aplique a solução** baseada no diagnóstico
5. **Teste novamente** para confirmar a correção

## Contato

Se os testes não identificarem o problema, forneça os resultados dos testes para análise mais detalhada.
