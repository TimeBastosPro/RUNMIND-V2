# Correção: Cadastro de Treinador Criando Conta de Atleta Simultânea

## Problema Identificado

Ao criar uma conta de treinador, estava sendo criado **simultaneamente**:
1. Um perfil na tabela `profiles` (conta de atleta)
2. Um registro na tabela `coaches` (conta de treinador)

Isso causava confusão no sistema, pois treinadores tinham acesso tanto às funcionalidades de atleta quanto de treinador.

## Causa Raiz

No arquivo `src/stores/auth.ts`, na função `signUp`, o código estava criando dois registros para treinadores:

  ```typescript
// ❌ CÓDIGO PROBLEMÁTICO (ANTES)
  if (options?.isCoach) {
  // 1. Criar perfil básico em profiles (conta de atleta)
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user.id,
      email: sanitizedEmail,
      full_name: sanitizedName,
      experience_level: 'beginner',
      main_goal: 'health',
      context_type: 'solo',
      onboarding_completed: false,
      user_type: 'coach', // ❌ Isso criava uma conta de atleta
    });
  
  // 2. Criar registro em coaches (conta de treinador)
  const { error: coachInsertError } = await supabase
    .from('coaches')
    .insert([{ 
      user_id: data.user.id, 
      full_name: sanitizedName,
      email: sanitizedEmail,
      cref: options.cref
    }]);
}
```

## Solução Implementada

### 1. Correção no Cadastro de Treinador

**Arquivo:** `src/stores/auth.ts`

**Mudança:** Treinadores agora criam **apenas** registro na tabela `coaches`, não na tabela `profiles`.

  ```typescript
// ✅ CÓDIGO CORRIGIDO (DEPOIS)
if (options?.isCoach) {
  console.log('🔍 Cadastro como TREINADOR. Criando perfil de treinador...');
  
  // ✅ CORRIGIDO: Para treinador, criar APENAS registro em coaches (não em profiles)
  try {
    // Criar registro em coaches com CREF
    const { error: coachInsertError } = await supabase
      .from('coaches')
      .insert([{ 
        user_id: data.user.id, 
        full_name: sanitizedName || sanitizedEmail, 
        email: sanitizedEmail,
        cref: options.cref
      }]);
      
    if (coachInsertError) {
      console.error('🔍 Erro ao criar registro de coach:', coachInsertError);
      throw new Error('Erro ao criar registro de treinador. Tente novamente.');
    }
    
    console.log('🔍 Perfil de treinador criado com sucesso');
  } catch (error) {
    console.error('🔍 Erro na criação do perfil de treinador:', error);
    throw error;
    }
  }
  ```

### 2. Proteção na Função updateProfile

**Arquivo:** `src/stores/auth.ts`

**Mudança:** Adicionada verificação para impedir que treinadores tentem atualizar perfis de atleta.

```typescript
// ✅ NOVO: Verificar se o usuário é treinador primeiro
const { data: coachData } = await supabase
  .from('coaches')
  .select('*')
  .eq('user_id', user.id)
  .single();

if (coachData) {
  console.log('🔍 Usuário é treinador, não atualizando perfil de atleta');
  throw new Error('Treinadores não possuem perfil de atleta para atualizar');
}
```

### 3. Verificações de Segurança

As funções `loadProfile` e `loadProfileSafely` já estavam corretas, verificando se o usuário é treinador antes de carregar perfis de atleta:

```typescript
// ✅ JÁ CORRETO: Verificar se o usuário é treinador primeiro
const { data: coachData } = await supabase
  .from('coaches')
  .select('*')
  .eq('user_id', user.id)
  .single();

if (coachData) {
  console.log('🔍 Usuário é treinador, não carregando perfil de atleta');
  set({ profile: null });
  return;
}
```

## Script de Limpeza

Criado o arquivo `limpar_perfis_atleta_treinadores.sql` para remover perfis de atleta que foram criados incorretamente para treinadores existentes.

## Resultado

✅ **Treinadores agora criam apenas conta de treinador**  
✅ **Atletas criam apenas conta de atleta**  
✅ **Não há mais criação simultânea de contas**  
✅ **Sistema de navegação funciona corretamente**  
✅ **Proteções contra tentativas de atualizar perfis incorretos**

## Testes Recomendados

1. **Cadastro de novo treinador:** Verificar se cria apenas registro na tabela `coaches`
2. **Cadastro de novo atleta:** Verificar se cria apenas registro na tabela `profiles`
3. **Login de treinador:** Verificar se acessa apenas funcionalidades de treinador
4. **Login de atleta:** Verificar se acessa apenas funcionalidades de atleta
5. **Executar script de limpeza:** Para remover perfis incorretos existentes

## Arquivos Modificados

- `src/stores/auth.ts` - Correção na função `signUp` e `updateProfile`
- `limpar_perfis_atleta_treinadores.sql` - Script de limpeza (novo arquivo)
- `CORRECAO_CADASTRO_TREINADOR.md` - Documentação (novo arquivo)
