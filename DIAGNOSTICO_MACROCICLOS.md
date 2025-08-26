# Diagnóstico: Macrociclos Não Aparecendo

## Problema Reportado
- Macrociclo criado não aparece na interface
- Não é possível criar novos macrociclos
- Interface mostra "Nenhum macrociclo criado ainda"

## Passos para Diagnóstico

### 1. Verificar Console do Navegador
Abra o console do navegador (F12) e verifique:
- Se há erros de JavaScript
- Se há logs de debug dos macrociclos
- Se há erros de rede (falhas na API)

### 2. Verificar Banco de Dados
Execute o script `verificar_macrociclos.sql` no Supabase SQL Editor:

```sql
-- Verificar se há macrociclos no banco
SELECT COUNT(*) as total_macrociclos FROM public.macrociclos;

-- Verificar macrociclos por usuário
SELECT 
    id,
    user_id,
    name,
    created_at
FROM public.macrociclos
ORDER BY created_at DESC;
```

### 3. Verificar Políticas RLS
Execute no Supabase SQL Editor:

```sql
-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'macrociclos';
```

### 4. Testar Criação Direta
Execute o script `testar_criacao_macrociclo.sql` no Supabase SQL Editor para testar a criação direta.

### 5. Verificar Autenticação
No console do navegador, execute:

```javascript
// Verificar se o usuário está autenticado
const { data: { user } } = await supabase.auth.getUser();
console.log('Usuário:', user);

// Verificar se consegue buscar macrociclos
const { data, error } = await supabase
  .from('macrociclos')
  .select('*')
  .eq('user_id', user.id);
console.log('Macrociclos:', data);
console.log('Erro:', error);
```

## Possíveis Causas

### 1. Problema de Autenticação
- Usuário não está autenticado
- Token de autenticação expirado
- Problema com RLS (Row Level Security)

### 2. Problema de RLS (Row Level Security)
- Políticas RLS não configuradas corretamente
- Usuário não tem permissão para acessar os dados

### 3. Problema de Carregamento
- Dados não estão sendo carregados do store
- Problema na função `fetchMacrociclos`
- Problema na sincronização do estado

### 4. Problema de Interface
- Dados estão carregados mas não aparecem na UI
- Problema no componente CyclesOverview
- Problema de renderização

## Logs de Debug Adicionados

### No CyclesOverview.tsx:
```typescript
// Debug dos macrociclos
useEffect(() => {
  console.log('🔄 CyclesOverview: Macrociclos atualizados:', macrociclos.length);
  console.log('🔄 CyclesOverview: Macrociclos:', macrociclos);
}, [macrociclos]);

// Carregamento inicial
useEffect(() => {
  console.log('🔄 CyclesOverview: Carregando dados iniciais...');
  fetchMacrociclos();
  fetchMesociclos();
}, [fetchMacrociclos, fetchMesociclos]);
```

### No Store (cycles.ts):
```typescript
fetchMacrociclos: async () => {
  set({ isLoading: true });
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('macrociclos')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true });

    if (error) throw error;
    set({ macrociclos: data || [] });
  } catch (error) {
    console.error('Erro ao buscar macrociclos:', error);
  } finally {
    set({ isLoading: false });
  }
}
```

## Soluções Possíveis

### 1. Se o problema for RLS:
```sql
-- Criar política RLS para macrociclos
CREATE POLICY "Users can view own macrociclos" ON public.macrociclos
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own macrociclos" ON public.macrociclos
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own macrociclos" ON public.macrociclos
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own macrociclos" ON public.macrociclos
FOR DELETE USING (auth.uid() = user_id);
```

### 2. Se o problema for carregamento:
- Verificar se `fetchMacrociclos` está sendo chamada
- Verificar se o usuário está autenticado
- Verificar se há erros no console

### 3. Se o problema for interface:
- Verificar se os dados estão chegando no componente
- Verificar se há problemas de renderização
- Verificar se há erros de linter

## Próximos Passos

1. **Execute os scripts SQL** para verificar o banco
2. **Verifique o console** do navegador para erros
3. **Teste a criação** direta no banco
4. **Reporte os resultados** para análise adicional

## Status do Diagnóstico

- [ ] Console verificado
- [ ] Banco de dados verificado
- [ ] RLS verificado
- [ ] Criação direta testada
- [ ] Autenticação verificada
- [ ] Problema identificado
- [ ] Solução implementada
