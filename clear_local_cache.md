# 🧹 LIMPEZA LOCAL - DADOS EM CACHE

## 1. 🌐 LIMPEZA DO NAVEGADOR (Chrome/Edge)

### Método 1: DevTools
1. Abra o DevTools (F12)
2. Vá na aba "Application" ou "Aplicativo"
3. No menu lateral, clique em:
   - **Storage** → **Clear storage** → **Clear site data**
   - **Local Storage** → Delete all
   - **Session Storage** → Delete all
   - **Cookies** → Delete all

### Método 2: Configurações do Navegador
1. Vá em Configurações → Privacidade e segurança
2. Clique em "Limpar dados de navegação"
3. Selecione:
   - ✅ Cookies e outros dados do site
   - ✅ Imagens e arquivos em cache
   - ✅ Dados de aplicativos hospedados
4. Clique em "Limpar dados"

## 2. 📱 LIMPEZA DO APLICATIVO (Expo/React Native)

### Método 1: Reset do Expo
```bash
# Parar o servidor
Ctrl + C

# Limpar cache do Expo
npx expo start --clear

# Ou limpar cache completo
npx expo r -c
```

### Método 2: Limpeza Manual
```bash
# Limpar cache do npm/yarn
npm cache clean --force
# ou
yarn cache clean

# Limpar node_modules (se necessário)
rm -rf node_modules
npm install
```

## 3. 🔄 LIMPEZA PROGRAMÁTICA (Código)

### Adicionar ao código de logout:
```typescript
// Limpar AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const clearAllLocalData = async () => {
  try {
    // Limpar todas as chaves do AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys);
    
    // Limpar Zustand stores
    useAuthStore.getState().logout();
    useCheckinStore.getState().clearData();
    
    console.log('✅ Dados locais limpos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar dados locais:', error);
  }
};
```

## 4. 🧪 TESTE APÓS LIMPEZA

1. **Feche completamente o navegador**
2. **Reabra o navegador**
3. **Acesse localhost:8081**
4. **Verifique se não há dados em cache**
5. **Teste o login com novo usuário**

## 5. ⚠️ DADOS QUE PODEM PERSISTIR

- **Service Workers** (se houver)
- **IndexedDB** (dados do banco local)
- **WebSQL** (dados SQL locais)
- **Cache do sistema operacional**

## 6. 🔍 VERIFICAÇÃO

Após a limpeza, verifique no DevTools:
- **Application** → **Storage** → deve estar vazio
- **Console** → não deve haver erros de cache
- **Network** → requisições devem ser novas (não cached)
