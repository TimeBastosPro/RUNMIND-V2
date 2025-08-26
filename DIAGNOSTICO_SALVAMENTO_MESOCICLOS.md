# Diagnóstico: Mesociclos e Microciclos Não Salvando no Banco

## Problema Reportado
- Mesociclos e microciclos não estão sendo salvos no banco de dados
- Interface mostra sucesso, mas dados não aparecem na aplicação

## Passos para Diagnóstico

### 1. Verificar Console do Navegador
Abra o console do navegador (F12) e verifique:
- Se há erros de JavaScript
- Se há logs de debug do salvamento
- Se há erros de rede (falhas na API)

**Logs importantes a procurar:**
```
🔄 Store: Iniciando criação do mesociclo
✅ Store: Mesociclo criado no banco
❌ Store: Erro ao criar mesociclo
```

### 2. Verificar Banco de Dados
Execute o script `testar_salvamento_mesociclos.sql` no Supabase SQL Editor:

#### **Verificar Estrutura das Tabelas:**
```sql
-- Verificar estrutura da tabela mesociclos
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'mesociclos';

-- Verificar estrutura da tabela microciclos  
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'microciclos';
```

#### **Verificar Políticas RLS:**
```sql
-- Verificar políticas da tabela mesociclos
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'mesociclos';

-- Verificar políticas da tabela microciclos
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'microciclos';
```

### 3. Possíveis Causas do Problema

#### **A. Problemas de Autenticação:**
- Usuário não autenticado
- Token de autenticação expirado
- Problemas com RLS (Row Level Security)

#### **B. Problemas de Dados:**
- Campos obrigatórios não preenchidos
- Formato de data incorreto
- Valores inválidos para constraints

#### **C. Problemas de Permissões:**
- Políticas RLS bloqueando inserção
- Usuário sem permissão para inserir
- Problemas com foreign keys

#### **D. Problemas de Rede:**
- Falha na conexão com Supabase
- Timeout na requisição
- Erro de CORS

### 4. Testes Específicos

#### **Teste 1: Verificar Autenticação**
```sql
-- Verificar se o usuário está autenticado
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
```

#### **Teste 2: Verificar Macrociclos Existentes**
```sql
-- Verificar se há macrociclos para referenciar
SELECT id, name, user_id FROM public.macrociclos ORDER BY created_at DESC LIMIT 5;
```

#### **Teste 3: Testar Inserção Manual**
```sql
-- Testar inserção de mesociclo (substitua os valores)
INSERT INTO public.mesociclos (
    user_id,
    macrociclo_id,
    name,
    start_date,
    end_date,
    focus,
    mesociclo_type,
    intensity_level,
    volume_level
) VALUES (
    'SEU_USER_ID',
    'SEU_MACROCICLO_ID',
    'Teste Manual',
    '2024-01-01',
    '2024-01-28',
    'base',
    'base',
    'moderada',
    'moderado'
);
```

### 5. Verificações no Código

#### **A. Função convertDateToISO:**
- Verificar se está convertendo datas corretamente
- Verificar se não está lançando erros

#### **B. Função createMesociclo no Store:**
- Verificar se está capturando erros
- Verificar se está atualizando o estado local

#### **C. Validação de Dados:**
- Verificar se todos os campos obrigatórios estão preenchidos
- Verificar se os tipos de dados estão corretos

### 6. Soluções Comuns

#### **Solução 1: Recarregar Dados**
```typescript
// Após criar mesociclo, recarregar dados
await fetchMesociclos();
```

#### **Solução 2: Verificar RLS**
```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('mesociclos', 'microciclos');
```

#### **Solução 3: Verificar Foreign Keys**
```sql
-- Verificar constraints de foreign key
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('mesociclos', 'microciclos');
```

### 7. Próximos Passos

1. **Execute o script de diagnóstico** no Supabase
2. **Verifique o console** do navegador para erros
3. **Teste inserção manual** no banco
4. **Verifique políticas RLS** se necessário
5. **Reporte os resultados** para análise adicional

### 8. Informações para Debug

**Dados necessários:**
- Logs do console do navegador
- Resultado do script de diagnóstico
- Erro específico (se houver)
- Dados que estão sendo enviados para o banco
