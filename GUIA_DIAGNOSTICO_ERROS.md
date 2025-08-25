# 🔍 GUIA DE DIAGNÓSTICO DE ERROS

## 🎯 **IDENTIFICANDO OS ERROS ESPECÍFICOS**

Você mencionou que está encontrando erros após as correções implementadas. Para ajudá-lo a resolver esses problemas, precisamos identificar exatamente quais são esses erros.

### 📋 **PASSO A PASSO PARA DIAGNÓSTICO**

#### **1. Execute o Script de Diagnóstico**
```sql
-- Execute o arquivo: diagnostico_erros_cadastro.sql
-- No Supabase SQL Editor
```

#### **2. Verifique o Console do Navegador**
1. Abra o DevTools (F12)
2. Vá para a aba "Console"
3. Tente fazer um cadastro de treinador
4. Anote TODOS os erros que aparecem

#### **3. Verifique o Console do Metro/React Native**
Se estiver usando React Native:
1. Abra o terminal onde o Metro está rodando
2. Tente fazer um cadastro
3. Anote os erros que aparecem

#### **4. Teste os Cenários Específicos**

##### **Cenário A: Cadastro de Treinador**
1. Acesse a tela de cadastro
2. Clique em "👨‍💼 Criar conta de Treinador"
3. Preencha:
   - Nome: "Teste Treinador"
   - Email: "treinador@teste.com"
   - Senha: "Teste123!"
   - CREF: "123456-SP"
4. Clique em "Criar Conta"
5. Anote qualquer erro que apareça

##### **Cenário B: Cadastro de Atleta**
1. Acesse a tela de cadastro
2. Clique em "👤 Criar conta de Atleta"
3. Preencha:
   - Nome: "Teste Atleta"
   - Email: "atleta@teste.com"
   - Senha: "Teste123!"
4. Clique em "Criar Conta"
5. Anote qualquer erro que apareça

### 🔍 **TIPOS DE ERROS COMUNS**

#### **1. Erros de Validação**
- **Sintoma**: Mensagens de erro no formulário
- **Possíveis causas**:
  - Campo CREF vazio ou formato inválido
  - Email já cadastrado
  - Senha muito fraca
  - Nome vazio

#### **2. Erros de Banco de Dados**
- **Sintoma**: Erro no console relacionado ao Supabase
- **Possíveis causas**:
  - Tabela não existe
  - Constraint violado
  - RLS policy bloqueando
  - Coluna não existe

#### **3. Erros de Navegação**
- **Sintoma**: App trava ou não navega corretamente
- **Possíveis causas**:
  - Stack de navegação incorreto
  - Rota não existe
  - Estado inconsistente

#### **4. Erros de Tipo (TypeScript)**
- **Sintoma**: Erros de compilação
- **Possíveis causas**:
  - Interface não atualizada
  - Propriedade não existe
  - Tipo incorreto

### 📝 **FORMATO PARA REPORTAR ERROS**

Quando encontrar um erro, forneça:

```
**Cenário Testado**: [Cadastro de Treinador/Atleta]
**Passos Reproduzidos**: [Lista dos passos]
**Erro Encontrado**: [Mensagem exata do erro]
**Local do Erro**: [Console/Formulário/Tela]
**Screenshot**: [Se possível]
```

### 🛠️ **CORREÇÕES RÁPIDAS**

#### **Se o erro for "Campo CREF não existe"**
```sql
-- Execute no Supabase SQL Editor
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS cref TEXT;
```

#### **Se o erro for "user_type não existe"**
```sql
-- Execute no Supabase SQL Editor
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'athlete';
```

#### **Se o erro for "Tabela coaches não existe"**
```sql
-- Execute no Supabase SQL Editor
CREATE TABLE IF NOT EXISTS coaches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    cref TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 🚨 **ERROS CRÍTICOS CONHECIDOS**

#### **1. "Object literal may only specify known properties"**
- **Causa**: TypeScript não reconhece a propriedade `cref`
- **Solução**: Verificar se `src/types/database.ts` foi atualizado

#### **2. "Column 'user_type' does not exist"**
- **Causa**: Script SQL não foi executado
- **Solução**: Executar `correcao_cadastro_treinador.sql`

#### **3. "RLS policy violation"**
- **Causa**: Políticas de segurança bloqueando
- **Solução**: Verificar RLS policies no Supabase

### 📞 **PRÓXIMOS PASSOS**

1. **Execute o script de diagnóstico**
2. **Teste os cenários específicos**
3. **Cole aqui os erros encontrados**
4. **Forneça screenshots se possível**

Com essas informações, poderei identificar e corrigir os problemas específicos que você está enfrentando.
