// =====================================================
// SCRIPT DE LIMPEZA LOCAL AGRESSIVA
// =====================================================
// Execute este script no console do Metro/Browser
// para limpar TODOS os dados locais do app
// =====================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/services/supabase';

// Função principal de limpeza
export async function limpezaCompletaLocal() {
    console.log('🚀 INICIANDO LIMPEZA LOCAL COMPLETA...');
    
    try {
        // 1. Logout do Supabase
        console.log('📤 Fazendo logout do Supabase...');
        await supabase.auth.signOut({ scope: 'global' });
        
        // 2. Limpar AsyncStorage completamente
        console.log('🗑️ Limpando AsyncStorage...');
        await AsyncStorage.clear();
        
        // 3. Limpar dados específicos do Supabase
        console.log('🔧 Limpando dados específicos do Supabase...');
        await limparDadosSupabase();
        
        // 4. Limpar dados do Zustand
        console.log('🧹 Limpando stores Zustand...');
        await limparStoresZustand();
        
        console.log('✅ LIMPEZA LOCAL CONCLUÍDA COM SUCESSO!');
        console.log('🔄 Reinicie o app para aplicar as mudanças.');
        
        return true;
    } catch (error) {
        console.error('❌ ERRO durante limpeza local:', error);
        return false;
    }
}

// Limpar dados específicos do Supabase
async function limparDadosSupabase() {
    const chavesSupabase = [
        'supabase.auth.token',
        'supabase.auth.refreshToken',
        'supabase.auth.expiresAt',
        'supabase.auth.user',
        'supabase.auth.session',
        'supabase.auth.expires_at',
        'supabase.auth.access_token',
        'supabase.auth.refresh_token',
        'supabase.auth.provider_token',
        'supabase.auth.provider_refresh_token',
        'supabase.auth.user.id',
        'supabase.auth.user.email',
        'supabase.auth.user.phone',
        'supabase.auth.user.app_metadata',
        'supabase.auth.user.user_metadata',
        'supabase.auth.user.aud',
        'supabase.auth.user.role',
        'supabase.auth.user.email_confirmed_at',
        'supabase.auth.user.phone_confirmed_at',
        'supabase.auth.user.confirmed_at',
        'supabase.auth.user.last_sign_in_at',
        'supabase.auth.user.created_at',
        'supabase.auth.user.updated_at',
        'supabase.auth.user.banned_until',
        'supabase.auth.user.reauthentication_sent_at',
        'supabase.auth.user.recovery_sent_at',
        'supabase.auth.user.email_change_sent_at',
        'supabase.auth.user.phone_change_sent_at',
        'supabase.auth.user.confirmation_sent_at',
        'supabase.auth.user.invited_at',
        'supabase.auth.user.action_link',
        'supabase.auth.user.email_change_confirm_status',
        'supabase.auth.user.phone_change_confirm_status',
        'supabase.auth.user.reauthentication_confirm_status',
        'supabase.auth.user.recovery_confirm_status',
        'supabase.auth.user.email_change_token_hash',
        'supabase.auth.user.phone_change_token_hash',
        'supabase.auth.user.reauthentication_token_hash',
        'supabase.auth.user.recovery_token_hash'
    ];
    
    for (const chave of chavesSupabase) {
        try {
            await AsyncStorage.removeItem(chave);
        } catch (error) {
            // Ignorar erros de chaves que não existem
        }
    }
}

// Limpar stores Zustand
async function limparStoresZustand() {
    const chavesZustand = [
        'auth-store',
        'checkin-store',
        'coach-store',
        'cycles-store',
        'notifications-store',
        'view-store',
        'auth',
        'checkin',
        'coach',
        'cycles',
        'notifications',
        'view',
        'user',
        'profile',
        'session',
        'token',
        'refreshToken',
        'expiresAt',
        'userData',
        'profileData',
        'sessionData',
        'authData',
        'loginData',
        'signupData',
        'userType',
        'isCoach',
        'isAthlete',
        'onboardingCompleted',
        'cref',
        'fullName',
        'phone',
        'dateOfBirth',
        'email',
        'password',
        'confirmPassword'
    ];
    
    for (const chave of chavesZustand) {
        try {
            await AsyncStorage.removeItem(chave);
        } catch (error) {
            // Ignorar erros de chaves que não existem
        }
    }
}

// Função para verificar dados locais
export async function verificarDadosLocais() {
    console.log('🔍 VERIFICANDO DADOS LOCAIS...');
    
    try {
        const todasChaves = await AsyncStorage.getAllKeys();
        console.log('📋 Total de chaves no AsyncStorage:', todasChaves.length);
        
        if (todasChaves.length > 0) {
            console.log('📝 Chaves encontradas:');
            todasChaves.forEach(chave => {
                console.log(`  - ${chave}`);
            });
            
            // Verificar dados específicos
            const dadosImportantes = await AsyncStorage.multiGet([
                'supabase.auth.token',
                'auth-store',
                'user',
                'profile',
                'session'
            ]);
            
            console.log('🔑 Dados importantes:');
            dadosImportantes.forEach(([chave, valor]) => {
                console.log(`  ${chave}: ${valor ? 'EXISTE' : 'NÃO EXISTE'}`);
            });
        } else {
            console.log('✅ AsyncStorage está vazio!');
        }
        
        return todasChaves;
    } catch (error) {
        console.error('❌ Erro ao verificar dados locais:', error);
        return [];
    }
}

// Função para limpeza seletiva
export async function limpezaSeletiva(tipos: string[]) {
    console.log('🎯 INICIANDO LIMPEZA SELETIVA...');
    
    const limpezas = {
        'auth': async () => {
            await supabase.auth.signOut({ scope: 'global' });
            const chavesAuth = ['supabase.auth', 'auth-store', 'user', 'profile', 'session'];
            for (const chave of chavesAuth) {
                await AsyncStorage.removeItem(chave);
            }
            console.log('✅ Dados de autenticação limpos');
        },
        
        'checkin': async () => {
            const chavesCheckin = ['checkin-store', 'daily-checkin', 'checkin-data'];
            for (const chave of chavesCheckin) {
                await AsyncStorage.removeItem(chave);
            }
            console.log('✅ Dados de check-in limpos');
        },
        
        'coach': async () => {
            const chavesCoach = ['coach-store', 'coach-data', 'athlete-relationships'];
            for (const chave of chavesCoach) {
                await AsyncStorage.removeItem(chave);
            }
            console.log('✅ Dados de treinador limpos');
        },
        
        'cycles': async () => {
            const chavesCycles = ['cycles-store', 'training-cycles', 'mesociclos', 'macrociclos'];
            for (const chave of chavesCycles) {
                await AsyncStorage.removeItem(chave);
            }
            console.log('✅ Dados de ciclos limpos');
        },
        
        'insights': async () => {
            const chavesInsights = ['insights-data', 'ai-insights', 'generated-insights'];
            for (const chave of chavesInsights) {
                await AsyncStorage.removeItem(chave);
            }
            console.log('✅ Dados de insights limpos');
        }
    };
    
    for (const tipo of tipos) {
        if (limpezas[tipo as keyof typeof limpezas]) {
            await limpezas[tipo as keyof typeof limpezas]();
        } else {
            console.log(`⚠️ Tipo de limpeza '${tipo}' não reconhecido`);
        }
    }
    
    console.log('✅ LIMPEZA SELETIVA CONCLUÍDA!');
}

// Função para forçar reload do app
export async function forcarReload() {
    console.log('🔄 FORÇANDO RELOAD DO APP...');
    
    try {
        // Limpeza completa
        await limpezaCompletaLocal();
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Tentar recarregar (funciona no browser)
        if (typeof window !== 'undefined') {
            window.location.reload();
        } else {
            console.log('📱 No React Native, reinicie o app manualmente');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao forçar reload:', error);
        return false;
    }
}

// Função para testar se a limpeza funcionou
export async function testarLimpeza() {
    console.log('🧪 TESTANDO SE A LIMPEZA FUNCIONOU...');
    
    try {
        // Verificar se ainda há dados
        const chavesRestantes = await AsyncStorage.getAllKeys();
        
        if (chavesRestantes.length === 0) {
            console.log('✅ TESTE PASSOU: AsyncStorage está completamente vazio!');
            return true;
        } else {
            console.log('❌ TESTE FALHOU: Ainda há dados no AsyncStorage:');
            chavesRestantes.forEach(chave => console.log(`  - ${chave}`));
            return false;
        }
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        return false;
    }
}

// =====================================================
// INSTRUÇÕES DE USO:
// =====================================================
// 1. No console do Metro/Browser, execute:
//    await limpezaCompletaLocal()
//
// 2. Para verificar dados locais:
//    await verificarDadosLocais()
//
// 3. Para limpeza seletiva:
//    await limpezaSeletiva(['auth', 'checkin'])
//
// 4. Para forçar reload:
//    await forcarReload()
//
// 5. Para testar se funcionou:
//    await testarLimpeza()
// =====================================================

// Exportar funções para uso global
if (typeof global !== 'undefined') {
    (global as any).limpezaCompletaLocal = limpezaCompletaLocal;
    (global as any).verificarDadosLocais = verificarDadosLocais;
    (global as any).limpezaSeletiva = limpezaSeletiva;
    (global as any).forcarReload = forcarReload;
    (global as any).testarLimpeza = testarLimpeza;
}

console.log('📦 Script de limpeza local carregado!');
console.log('💡 Use: await limpezaCompletaLocal() para limpar tudo');
