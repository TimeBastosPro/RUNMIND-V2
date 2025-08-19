# Guia para Verificar Dados de Mesociclos no Supabase

## 📋 **Como Verificar os Dados de Mesociclos**

### **1. Acesse o SQL Editor do Supabase**

1. Vá para o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Clique em **"SQL Editor"** no menu lateral
4. Clique em **"New query"**

### **2. Execute os Scripts de Verificação**

#### **Script 1: Verificação Geral**
```sql
-- Execute o arquivo: verificar_dados_mesociclos_supabase.sql
-- Este script mostra todos os dados de mesociclos no banco
```

#### **Script 2: Verificação Específica da Aplicação**
```sql
-- Execute o arquivo: verificar_mesociclos_aplicacao.sql
-- Este script mostra exatamente o que a aplicação carrega
```

### **3. Verificações Específicas**

#### **Para verificar os dados da Aline:**
1. Execute primeiro:
```sql
SELECT 
    id as user_id,
    email,
    full_name
FROM profiles 
WHERE email = 'aline@gmail.com'
ORDER BY created_at DESC;
```

2. Use o `user_id` encontrado para verificar os mesociclos:
```sql
SELECT 
    m.id,
    m.user_id,
    m.macrociclo_id,
    m.name as nome,
    m.mesociclo_type as tipo,
    m.start_date as data_inicio,
    m.end_date as data_fim,
    m.created_at,
    m.updated_at,
    mc.name as macrociclo_nome
FROM mesociclos m
LEFT JOIN macrociclos mc ON m.macrociclo_id = mc.id
WHERE m.user_id = 'USER_ID_DA_ALINE'  -- Substitua pelo ID encontrado
ORDER BY m.start_date ASC;
```

### **4. O que Procurar**

#### **✅ Dados Corretos:**
- Mesociclos com `name` preenchido
- Datas válidas (`start_date` < `end_date`)
- Relacionamento correto com macrociclos
- `user_id` correspondente ao perfil correto

#### **❌ Problemas Comuns:**
- Mesociclos com `name` vazio ou NULL
- Datas inválidas (início > fim)
- Mesociclos órfãos (sem macrociclo)
- Dados duplicados
- RLS (Row Level Security) mal configurado

### **5. Verificações Específicas**

#### **Verificar Estrutura da Tabela:**
```sql
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
ORDER BY ordinal_position;
```

#### **Verificar RLS (Segurança):**
```sql
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'mesociclos'
ORDER BY policyname;
```

#### **Verificar Dados Problemáticos:**
```sql
SELECT 
    id,
    user_id,
    name as nome,
    start_date as data_inicio,
    end_date as data_fim,
    CASE 
        WHEN start_date IS NULL THEN 'Data início ausente'
        WHEN end_date IS NULL THEN 'Data fim ausente'
        WHEN name IS NULL OR name = '' THEN 'Nome ausente'
        WHEN start_date > end_date THEN 'Data início maior que fim'
        ELSE 'OK'
    END as problema
FROM mesociclos 
WHERE 
    start_date IS NULL 
    OR end_date IS NULL 
    OR name IS NULL 
    OR name = ''
    OR start_date > end_date
ORDER BY created_at DESC;
```

### **6. Como a Aplicação Carrega os Dados**

A aplicação carrega os mesociclos através da função `fetchMesociclos` no arquivo `src/stores/cycles.ts`:

```typescript
fetchMesociclos: async (macrocicloId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  let query = supabase
    .from('mesociclos')
    .select('*')
    .eq('user_id', user.id);

  if (macrocicloId) {
    query = query.eq('macrociclo_id', macrocicloId);
  }

  const { data, error } = await query.order('start_date', { ascending: true });
  
  set({ mesociclos: data || [] });
}
```

### **7. Campos que a Aplicação Usa**

A aplicação carrega estes campos da tabela `mesociclos`:
- `id`
- `user_id`
- `macrociclo_id`
- `name`
- `mesociclo_type`
- `start_date`
- `end_date`
- `created_at`
- `updated_at`

### **8. Troubleshooting**

#### **Se não encontrar dados:**
1. Verifique se o `user_id` está correto
2. Verifique se há dados na tabela `mesociclos`
3. Verifique se o RLS está permitindo acesso
4. Verifique se o usuário está autenticado

#### **Se encontrar dados incorretos:**
1. Verifique se há múltiplos perfis para o mesmo email
2. Verifique se há dados duplicados
3. Verifique se as datas estão corretas
4. Verifique se o relacionamento com macrociclos está correto

### **9. Logs da Aplicação**

Para ver os logs de carregamento na aplicação, abra o console do navegador e procure por:
- `🔍 DEBUG - Store: Buscando mesociclos`
- `✅ DEBUG - Store: Mesociclos carregados`
- `🔍 DEBUG - Store: TODOS os mesociclos carregados`

---

**💡 Dica:** Execute os scripts em ordem e compare os resultados com o que você vê na aplicação. Isso ajudará a identificar onde está o problema.
