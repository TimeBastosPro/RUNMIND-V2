// =====================================================
// SCRIPT DE LIMPEZA LOCAL FINAL
// =====================================================
// Execute este código diretamente no console do navegador
// SEM IMPORTS - funciona em qualquer contexto
// =====================================================

// Função principal de limpeza
async function limpezaCompletaLocal() {
    console.log('🚀 INICIANDO LIMPEZA LOCAL COMPLETA...');
    
    try {
        // 1. Limpar localStorage
        console.log('🗑️ Limpando localStorage...');
        localStorage.clear();
        
        // 2. Limpar sessionStorage
        console.log('🗑️ Limpando sessionStorage...');
        sessionStorage.clear();
        
        // 3. Limpar IndexedDB (se disponível)
        if ('indexedDB' in window) {
            console.log('🗑️ Limpando IndexedDB...');
            try {
                const databases = await indexedDB.databases();
                for (const db of databases) {
                    if (db.name) {
                        indexedDB.deleteDatabase(db.name);
                    }
                }
            } catch (error) {
                console.log('⚠️ Erro ao limpar IndexedDB:', error.message);
            }
        }
        
        // 4. Limpar cookies relacionados ao app
        console.log('🍪 Limpando cookies...');
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (name.includes('supabase') || name.includes('auth') || name.includes('session') || name.includes('token')) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
            }
        }
        
        // 5. Tentar logout do Supabase (se disponível)
        if (typeof window !== 'undefined' && window.supabase) {
            console.log('📤 Fazendo logout do Supabase...');
            try {
                await window.supabase.auth.signOut({ scope: 'global' });
            } catch (error) {
                console.log('⚠️ Erro no logout do Supabase:', error.message);
            }
        }
        
        // 6. Limpar dados específicos do React Native (se aplicável)
        console.log('📱 Limpando dados React Native...');
        try {
            // Tentar limpar AsyncStorage se disponível
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'CLEAR_STORAGE'
                }));
            }
        } catch (error) {
            console.log('⚠️ React Native não disponível');
        }
        
        console.log('✅ LIMPEZA LOCAL CONCLUÍDA COM SUCESSO!');
        console.log('🔄 Recarregue a página para aplicar as mudanças.');
        
        return true;
    } catch (error) {
        console.error('❌ ERRO durante limpeza local:', error);
        return false;
    }
}

// Função para verificar dados locais
async function verificarDadosLocais() {
    console.log('🔍 VERIFICANDO DADOS LOCAIS...');
    
    try {
        // Verificar localStorage
        const localStorageKeys = Object.keys(localStorage);
        console.log('📋 localStorage:', localStorageKeys.length, 'chaves');
        if (localStorageKeys.length > 0) {
            localStorageKeys.forEach(key => console.log(`  - ${key}`));
        }
        
        // Verificar sessionStorage
        const sessionStorageKeys = Object.keys(sessionStorage);
        console.log('📋 sessionStorage:', sessionStorageKeys.length, 'chaves');
        if (sessionStorageKeys.length > 0) {
            sessionStorageKeys.forEach(key => console.log(`  - ${key}`));
        }
        
        // Verificar cookies
        const cookies = document.cookie.split(';').filter(c => c.trim());
        console.log('🍪 Cookies:', cookies.length, 'cookies');
        if (cookies.length > 0) {
            cookies.forEach(cookie => console.log(`  - ${cookie.trim()}`));
        }
        
        // Verificar IndexedDB
        if ('indexedDB' in window) {
            try {
                const databases = await indexedDB.databases();
                console.log('🗄️ IndexedDB:', databases.length, 'bancos');
                databases.forEach(db => console.log(`  - ${db.name}`));
            } catch (error) {
                console.log('⚠️ Erro ao verificar IndexedDB:', error.message);
            }
        }
        
        return {
            localStorage: localStorageKeys,
            sessionStorage: sessionStorageKeys,
            cookies: cookies,
            indexedDB: 'indexedDB' in window ? await indexedDB.databases().catch(() => []) : []
        };
    } catch (error) {
        console.error('❌ Erro ao verificar dados locais:', error);
        return null;
    }
}

// Função para testar se a limpeza funcionou
async function testarLimpeza() {
    console.log('🧪 TESTANDO SE A LIMPEZA FUNCIONOU...');
    
    try {
        const dados = await verificarDadosLocais();
        
        const totalDados = dados.localStorage.length + 
                          dados.sessionStorage.length + 
                          dados.cookies.length + 
                          dados.indexedDB.length;
        
        if (totalDados === 0) {
            console.log('✅ TESTE PASSOU: Todos os dados locais foram removidos!');
            return true;
        } else {
            console.log('❌ TESTE FALHOU: Ainda há dados locais:');
            console.log(`  - localStorage: ${dados.localStorage.length}`);
            console.log(`  - sessionStorage: ${dados.sessionStorage.length}`);
            console.log(`  - cookies: ${dados.cookies.length}`);
            console.log(`  - IndexedDB: ${dados.indexedDB.length}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        return false;
    }
}

// Função para forçar reload
function forcarReload() {
    console.log('🔄 FORÇANDO RELOAD DA PÁGINA...');
    
    try {
        // Limpeza completa
        limpezaCompletaLocal().then(() => {
            // Aguardar um pouco
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao forçar reload:', error);
        return false;
    }
}

// Função para limpeza seletiva
async function limpezaSeletiva(tipos) {
    console.log('🎯 INICIANDO LIMPEZA SELETIVA...');
    
    const limpezas = {
        'auth': async () => {
            // Limpar dados de autenticação
            const authKeys = Object.keys(localStorage).filter(key => 
                key.includes('auth') || key.includes('user') || key.includes('session') || key.includes('token')
            );
            authKeys.forEach(key => localStorage.removeItem(key));
            
            const authSessionKeys = Object.keys(sessionStorage).filter(key => 
                key.includes('auth') || key.includes('user') || key.includes('session') || key.includes('token')
            );
            authSessionKeys.forEach(key => sessionStorage.removeItem(key));
            
            // Limpar cookies de auth
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
                const eqPos = cookie.indexOf('=');
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                if (name.includes('auth') || name.includes('session') || name.includes('token')) {
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                }
            }
            
            console.log('✅ Dados de autenticação limpos');
        },
        
        'supabase': async () => {
            // Limpar dados do Supabase
            const supabaseKeys = Object.keys(localStorage).filter(key => 
                key.includes('supabase') || key.includes('sb-')
            );
            supabaseKeys.forEach(key => localStorage.removeItem(key));
            
            const supabaseSessionKeys = Object.keys(sessionStorage).filter(key => 
                key.includes('supabase') || key.includes('sb-')
            );
            supabaseSessionKeys.forEach(key => sessionStorage.removeItem(key));
            
            console.log('✅ Dados do Supabase limpos');
        },
        
        'app': async () => {
            // Limpar dados do app
            const appKeys = Object.keys(localStorage).filter(key => 
                key.includes('runmind') || key.includes('checkin') || key.includes('coach') || key.includes('cycles')
            );
            appKeys.forEach(key => localStorage.removeItem(key));
            
            const appSessionKeys = Object.keys(sessionStorage).filter(key => 
                key.includes('runmind') || key.includes('checkin') || key.includes('coach') || key.includes('cycles')
            );
            appSessionKeys.forEach(key => sessionStorage.removeItem(key));
            
            console.log('✅ Dados do app limpos');
        }
    };
    
    for (const tipo of tipos) {
        if (limpezas[tipo]) {
            await limpezas[tipo]();
        } else {
            console.log(`⚠️ Tipo de limpeza '${tipo}' não reconhecido`);
        }
    }
    
    console.log('✅ LIMPEZA SELETIVA CONCLUÍDA!');
}

// =====================================================
// INSTRUÇÕES DE USO:
// =====================================================
// 1. Para limpeza completa:
//    await limpezaCompletaLocal()
//
// 2. Para verificar dados locais:
//    await verificarDadosLocais()
//
// 3. Para testar se funcionou:
//    await testarLimpeza()
//
// 4. Para forçar reload:
//    forcarReload()
//
// 5. Para limpeza seletiva:
//    await limpezaSeletiva(['auth', 'supabase', 'app'])
// =====================================================

// Executar automaticamente se estiver no console
if (typeof window !== 'undefined') {
    console.log('📦 Script de limpeza local carregado!');
    console.log('💡 Use: await limpezaCompletaLocal() para limpar tudo');
    console.log('🔍 Use: await verificarDadosLocais() para verificar dados');
    console.log('🧪 Use: await testarLimpeza() para testar limpeza');
    console.log('🔄 Use: forcarReload() para recarregar a página');
    console.log('🎯 Use: await limpezaSeletiva([\'auth\', \'supabase\', \'app\']) para limpeza seletiva');
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
    window.limpezaCompletaLocal = limpezaCompletaLocal;
    window.verificarDadosLocais = verificarDadosLocais;
    window.testarLimpeza = testarLimpeza;
    window.forcarReload = forcarReload;
    window.limpezaSeletiva = limpezaSeletiva;
}
