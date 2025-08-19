# Correção do Problema de Perfis Duplicados

## Problema Identificado

O usuário estava enfrentando um problema onde:
1. **Login inicial**: Carregava o perfil correto com dados salvos
2. **Após refresh**: Carregava um perfil diferente/incorreto
3. **Causa**: Existiam múltiplos perfis para o mesmo email

### Sintomas
- Dados diferentes entre login e refresh
- Perfil "Aline Cabral" vs perfil "aline@gmail.com"
- Informações de treinos e check-ins inconsistentes

## Causa Raiz

O problema estava na lógica de carregamento de perfis que:
1. **Não verificava se o usuário era treinador** antes de carregar perfil de atleta
2. **Carregava perfis em paralelo** causando conflitos
3. **Permitia múltiplos perfis** para o mesmo email

## Soluções Implementadas

### 1. **Melhoria na Função `loadProfile`**
- **Arquivo**: `src/stores/auth.ts`
- **Mudança**: Verificar se o usuário é treinador antes de carregar perfil de atleta
- **Benefício**: Evita carregar perfil de atleta para treinadores

```typescript
// ✅ MELHORADO: Verificar se o usuário é treinador primeiro
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

### 2. **Correção na Inicialização do AppNavigator**
- **Arquivo**: `src/navigation/AppNavigator.tsx`
- **Mudança**: Carregar perfis em sequência, não em paralelo
- **Benefício**: Evita conflitos entre carregamento de perfis

```typescript
// ✅ MELHORADO: Carregar perfis em sequência para evitar conflitos
try {
  await loadCoachProfile();
} catch (e) {
  console.log('Perfil de treinador ausente');
}

// Só carregar perfil de atleta se não for treinador
if (!useCoachStore.getState().currentCoach) {
  try { 
    await loadProfile(); 
  } catch (e) { 
    console.log('Perfil de atleta ausente'); 
  }
}
```

### 3. **Script de Diagnóstico e Correção**
- **Arquivo**: `fix_duplicate_profiles.sql`
- **Função**: Identificar e corrigir perfis duplicados no banco
- **Benefício**: Limpa dados inconsistentes

## Como Aplicar a Correção

### Passo 1: Executar o Script de Diagnóstico
```sql
-- Executar as consultas 1-4 do script para identificar duplicatas
-- Verificar se há múltiplos perfis para o mesmo email
```

### Passo 2: Limpar Perfis Duplicados (se necessário)
```sql
-- Executar as consultas 5-7 do script para limpar duplicatas
-- Manter apenas o perfil mais recente para cada email
```

### Passo 3: Verificar Resultado
```sql
-- Executar a consulta 8 para confirmar que não há mais duplicatas
```

## Resultados Esperados

✅ **Login consistente**: Mesmo perfil carregado após refresh
✅ **Dados corretos**: Informações de treinos e check-ins consistentes
✅ **Navegação adequada**: Treinadores vão para tela de treinador, atletas para tela de atleta
✅ **Sem conflitos**: Não há mais carregamento de perfis incorretos

## Monitoramento

Para verificar se a correção funcionou:
1. **Fazer login** com o email problemático
2. **Verificar dados** na tela inicial
3. **Fazer refresh** da página
4. **Confirmar** que os dados permanecem os mesmos

## Prevenção Futura

1. **Validação única**: Garantir que cada email tenha apenas um perfil
2. **Verificação de tipo**: Sempre verificar se o usuário é treinador antes de carregar perfil de atleta
3. **Carregamento sequencial**: Evitar carregar perfis em paralelo
4. **Logs detalhados**: Manter logs para identificar problemas futuros
