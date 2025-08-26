# Correção: Login de Treinador e Atleta

## Problemas Identificados

### 1. **Erro ao Fazer Login como Treinador**
- Treinadores conseguiam fazer cadastro, mas não conseguiam fazer login após sair
- Erro: "Usuário não cadastrado no sistema. Crie uma conta primeiro."

### 2. **Logout Automático de Treinadores**
- Treinadores conseguiam fazer login, mas eram automaticamente deslogados
- Problema: Validação crítica verificava apenas a tabela `profiles`, mas treinadores não têm registro lá

### 3. **Erro ao Fazer Login como Atleta**
- Atletas conseguiam fazer cadastro, mas não conseguiam fazer login após sair
- Erro: "Usuário não cadastrado no sistema. Crie uma conta primeiro."

### 4. **CREF Não Estava Sendo Salvo**
- O CREF estava sendo coletado no cadastro, mas não estava sendo salvo no banco
- Campo `cref` ficava `NULL` na tabela `coaches`

## Causas dos Problemas

### 1. **Problema de Login (Treinadores e Atletas)**
A função `validateUserBeforeLogin` estava sendo muito restritiva e verificando se o usuário existia nas tabelas **antes** de tentar fazer login no Supabase Auth.

### 2. **Problema de Logout Automático de Treinadores**
A validação crítica estava verificando **apenas** a tabela `profiles`, mas treinadores não têm registro na tabela `profiles` - eles têm apenas na tabela `coaches`.

**Código Problemático (ANTES):**
```typescript
// ❌ Validação crítica só verificava profiles
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('id, email, full_name, user_type, onboarding_completed')
  .eq('id', data.user.id)
  .single();
```

## Correções Implementadas

### 1. **Remoção da Validação Pré-Login Restritiva** (`src/stores/auth.ts`)

**Código Corrigido (DEPOIS):**
```typescript
// ✅ REMOVIDO: Validação pré-login que estava causando problemas
// A validação será feita após o login bem-sucedido

// ✅ MELHORADO: Login direto no Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: sanitizedEmail,
  password,
});
```

### 2. **Correção da Validação Crítica para Treinadores** (`src/stores/auth.ts`)

**Código Corrigido (DEPOIS):**
```typescript
// ✅ CORRIGIDO: 1. Verificar primeiro se existe na tabela coaches (treinadores)
const { data: coachData, error: coachError } = await supabase
  .from('coaches')
  .select('id, user_id, full_name, email, cref')
  .eq('user_id', data.user.id)
  .single();

if (!coachError && coachData) {
  console.log('✅ VALIDAÇÃO CRÍTICA: Treinador encontrado em coaches');
  // Validar treinador...
} else {
  // ✅ CORRIGIDO: 2. Se não for treinador, verificar na tabela profiles (atletas)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, user_type, onboarding_completed')
    .eq('id', data.user.id)
    .single();
  // Validar atleta...
}
```

### 3. **Correção da Função validateSession** (`src/stores/auth.ts`)

A função `validateSession` também foi corrigida para verificar primeiro treinadores na tabela `coaches`.

### 4. **Verificação do CREF**
O CREF já estava sendo passado corretamente no cadastro:

```typescript
// ✅ JÁ CORRETO: CREF sendo passado no signUp
await signUp(data.email, data.password, data.fullName, { 
  isCoach: isCoachSignUp,
  cref: isCoachSignUp ? data.cref.trim() : undefined
});

// ✅ JÁ CORRETO: CREF sendo salvo na tabela coaches
const { error: coachInsertError } = await supabase
  .from('coaches')
  .insert([{ 
    user_id: data.user.id, 
    full_name: sanitizedName || sanitizedEmail, 
    email: sanitizedEmail,
    cref: options.cref // ✅ CREF sendo incluído
  }]);
```

## Scripts de Verificação e Correção

### 1. **Verificar CREF dos Treinadores**
Execute o arquivo `verificar_cref_treinadores.sql` no Supabase SQL Editor para:
- Verificar quais treinadores têm CREF
- Identificar treinadores sem CREF
- Corrigir CREFs ausentes

### 2. **Verificar Problemas com Atletas**
Execute o arquivo `verificar_atletas_problema.sql` no Supabase SQL Editor para:
- Verificar atletas existentes
- Identificar atletas sem `user_type` definido
- Corrigir problemas de perfil

### 3. **Verificar Problemas com Treinadores**
Execute o arquivo `verificar_treinadores_login.sql` no Supabase SQL Editor para:
- Verificar treinadores existentes
- Identificar inconsistências entre `coaches` e `auth.users`
- Corrigir problemas de login de treinadores

### 4. **Limpeza Completa (Se Necessário)**
Execute o arquivo `limpeza_completa_banco.sql` para limpar todos os dados e testar do zero.

## Como Testar

### 1. **Teste de Cadastro de Treinador**
1. Crie uma nova conta de treinador
2. Verifique se o CREF está sendo salvo no banco
3. Faça logout

### 2. **Teste de Login de Treinador**
1. Tente fazer login com a conta de treinador criada
2. Verifique se consegue acessar a área do treinador
3. Verifique se **NÃO** há logout automático
4. Verifique se não há erros no console

### 3. **Teste de Cadastro de Atleta**
1. Crie uma nova conta de atleta
2. Verifique se o perfil está sendo criado corretamente
3. Faça logout

### 4. **Teste de Login de Atleta**
1. Tente fazer login com a conta de atleta criada
2. Verifique se consegue acessar a área do atleta
3. Verifique se não há erros no console

### 5. **Verificação no Banco**
1. Execute os scripts de verificação
2. Confirme que os dados estão corretos
3. Verifique se não há registros duplicados

## Resultado Esperado

Após as correções:
- ✅ Treinadores conseguem fazer login normalmente
- ✅ Treinadores **NÃO** são mais deslogados automaticamente
- ✅ Atletas conseguem fazer login normalmente
- ✅ CREF é salvo corretamente no cadastro
- ✅ Não há mais erros de "Usuário não cadastrado"
- ✅ Sistema diferencia corretamente entre atletas e treinadores

## Arquivos Modificados

- `src/stores/auth.ts` - Correção da validação crítica e função validateSession
- `verificar_cref_treinadores.sql` - Script de verificação e correção de CREF
- `verificar_atletas_problema.sql` - Script de verificação e correção de atletas
- `verificar_treinadores_login.sql` - Script de verificação de problemas de login de treinadores
- `CORRECAO_LOGIN_TREINADOR.md` - Este documento

## Próximos Passos

1. **Execute os scripts de verificação** para confirmar o status dos dados
2. **Teste o cadastro e login** de treinadores e atletas
3. **Verifique se não há mais logout automático** de treinadores
4. **Verifique se não há mais erros** no console
5. **Confirme que o sistema funciona** corretamente para ambos os tipos de usuário
