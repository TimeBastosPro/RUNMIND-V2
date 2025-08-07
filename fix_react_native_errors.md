# Correção de Erros de Renderização React Native

## Problema Identificado
O erro "Unexpected text node: A text node cannot be a child of a <View>" indica que há texto direto dentro de componentes View, o que não é permitido no React Native.

## Soluções

### 1. Verificar Componentes View
Em todos os arquivos `.tsx`, certifique-se de que:
- Todo texto esteja dentro de componentes `<Text>`
- Não haja texto direto dentro de `<View>`

### 2. Exemplo de Correção

**❌ Incorreto:**
```tsx
<View>
  Texto direto aqui
  <Text>Texto correto</Text>
</View>
```

**✅ Correto:**
```tsx
<View>
  <Text>Texto direto aqui</Text>
  <Text>Texto correto</Text>
</View>
```

### 3. Arquivos que Precisam de Verificação

1. `src/screens/athlete/CoachSearchScreen.tsx`
2. `src/screens/coach/CoachRequestsScreen.tsx`
3. `src/screens/home/index.tsx`
4. `src/screens/training/TrainingScreen.tsx`

### 4. Comandos para Verificar

```bash
# Procurar por texto direto em Views
grep -r ">[^<]*[a-zA-Z][^<]*<" src/ --include="*.tsx"

# Verificar arquivos específicos
grep -n ">" src/screens/athlete/CoachSearchScreen.tsx
```

### 5. Correção Automática

Execute estes comandos para corrigir automaticamente:

```bash
# Reiniciar o servidor de desenvolvimento
npm start -- --reset-cache

# Limpar cache do Metro
npx react-native start --reset-cache
```

### 6. Verificação Final

Após as correções:
1. Teste a busca de treinadores
2. Teste a criação de solicitações
3. Teste a visualização de solicitações pendentes
4. Verifique se não há mais erros no console

## Status da Correção

- [ ] Executar script SQL no Supabase
- [ ] Verificar erros de renderização
- [ ] Testar funcionalidade de solicitações
- [ ] Confirmar que as solicitações aparecem para o treinador 