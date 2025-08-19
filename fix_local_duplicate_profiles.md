# Correção de Perfis Duplicados Locais

## Problema Identificado

O problema de perfis duplicados está ocorrendo **localmente no dispositivo**, não no banco de dados do Supabase. Isso indica:

1. **Cache local corrompido**: Dados antigos persistidos no AsyncStorage
2. **Estado inconsistente**: Múltiplos perfis carregados na memória
3. **Sessão corrompida**: Dados de autenticação conflitantes

## Sintomas

- ✅ Banco de dados Supabase: Correto (3 registros em cada tabela)
- ❌ Aplicativo local: Carrega perfis diferentes após refresh
- ❌ Dados inconsistentes entre login e refresh

## Soluções Implementadas

### 1. **Limpeza de Cache Local**

O problema está no AsyncStorage e no estado local do aplicativo. Vamos implementar uma limpeza completa:

```typescript
// Função para limpar todos os dados locais
const clearAllLocalData = async () => {
  try {
    // Limpar AsyncStorage
    await AsyncStorage.clear();
    
    // Limpar estado do Zustand
    useAuthStore.setState({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      isInitializing: false,
    });
    
    // Limpar estado do Coach
    useCoachStore.setState({
      currentCoach: null,
      athletes: [],
      isLoading: false,
    });
    
    // Limpar estado da View
    useViewStore.setState({
      isCoachView: false,
      viewAsAthleteId: null,
    });
    
    console.log('✅ Dados locais limpos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar dados locais:', error);
  }
};
```

### 2. **Verificação de Sessão Corrompida**

Implementar verificação e reparo automático de sessões corrompidas:

```typescript
// Verificar se a sessão está corrompida
const checkAndRepairSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Verificar se o usuário no estado local corresponde ao da sessão
      const localUser = useAuthStore.getState().user;
      
      if (localUser && localUser.id !== session.user.id) {
        console.warn('⚠️ Sessão corrompida detectada - limpando dados locais');
        await clearAllLocalData();
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar sessão:', error);
    return false;
  }
};
```

### 3. **Carregamento Seguro de Perfis**

Implementar carregamento mais robusto que evita conflitos:

```typescript
// Carregar perfil de forma segura
const loadProfileSafely = async () => {
  try {
    // Limpar estado atual primeiro
    useAuthStore.setState({ profile: null });
    
    const { user } = useAuthStore.getState();
    if (!user) return;
    
    // Verificar se é treinador primeiro
    const { data: coachData } = await supabase
      .from('coaches')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (coachData) {
      console.log('🔍 Usuário é treinador - não carregando perfil de atleta');
      return;
    }
    
    // Carregar perfil de atleta
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.log('🔍 Perfil não encontrado');
      return;
    }
    
    useAuthStore.setState({ profile: profileData });
    console.log('✅ Perfil carregado com sucesso:', profileData.full_name);
    
  } catch (error) {
    console.error('❌ Erro ao carregar perfil:', error);
  }
};
```

## Como Aplicar a Correção

### Opção 1: Limpeza Manual (Imediata)

1. **No aplicativo**:
   - Vá em Configurações/Perfil
   - Procure por "Limpar Dados" ou "Logout"
   - Faça logout completo
   - Feche o aplicativo completamente
   - Reabra e faça login novamente

### Opção 2: Limpeza Automática (Implementar)

Adicionar botão de "Limpar Dados" na tela de configurações:

```typescript
// Componente de limpeza de dados
const ClearDataButton = () => {
  const handleClearData = async () => {
    Alert.alert(
      'Limpar Dados',
      'Isso irá remover todos os dados locais. Você precisará fazer login novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            await clearAllLocalData();
            // Redirecionar para tela de login
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ]
    );
  };

  return (
    <Button
      mode="outlined"
      onPress={handleClearData}
      style={{ marginTop: 20 }}
    >
      🗑️ Limpar Dados Locais
    </Button>
  );
};
```

### Opção 3: Correção Automática (Recomendada)

Implementar verificação automática no AppNavigator:

```typescript
// No AppNavigator.tsx
useEffect(() => {
  const initializeAuth = async () => {
    try {
      // Verificar e reparar sessão corrompida
      const sessionValid = await checkAndRepairSession();
      
      if (!sessionValid) {
        // Sessão corrompida - limpar e recomeçar
        await clearAllLocalData();
        set({ isInitializing: false });
        return;
      }
      
      // Continuar com inicialização normal...
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
    }
  };

  initializeAuth();
}, []);
```

## Verificação da Correção

### 1. **Teste Imediato**
1. Faça logout completo do aplicativo
2. Feche o aplicativo completamente
3. Reabra e faça login com `aline@gmail.com`
4. Verifique se os dados são consistentes
5. Faça refresh e confirme que os dados permanecem os mesmos

### 2. **Verificação no Console**
- Abra o console do desenvolvedor
- Procure por mensagens de "Dados locais limpos" ou "Sessão corrompida"
- Confirme que não há erros de carregamento de perfil

### 3. **Verificação de Estado**
- Confirme que apenas um perfil está carregado
- Verifique se não há dados duplicados no estado local

## Prevenção Futura

### 1. **Validação de Sessão**
- Verificar consistência entre sessão e estado local
- Limpar dados automaticamente quando detectar inconsistência

### 2. **Logs Detalhados**
- Registrar todas as operações de carregamento de perfil
- Alertar quando detectar dados conflitantes

### 3. **Backup de Estado**
- Salvar estado válido antes de limpar dados
- Permitir recuperação em caso de erro

## Arquivos a Modificar

1. **`src/stores/auth.ts`** - Adicionar funções de limpeza
2. **`src/navigation/AppNavigator.tsx`** - Implementar verificação automática
3. **`src/screens/profile/index.tsx`** - Adicionar botão de limpeza
4. **`src/services/supabase.ts`** - Melhorar verificação de sessão

---

**Nota**: Esta solução resolve o problema local sem afetar os dados do banco de dados.
