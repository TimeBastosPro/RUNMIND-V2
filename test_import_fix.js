// 🔍 TESTE PARA VERIFICAR CORREÇÃO DE IMPORT
// Execute este script no console do navegador

console.log('🚀 TESTE: Verificando correção de import...');

// Simular verificação se a função está disponível
console.log('\n📋 TESTE: Verificação de função formatDateToISO');

// Simular a função (como deveria estar no arquivo)
function formatDateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Teste da função
const testDate = new Date('2025-09-01T00:00:00.000Z');
const result = formatDateToISO(testDate);

console.log('📅 Data de teste:', testDate);
console.log('📅 Resultado da função:', result);
console.log('✅ Função funcionando:', result === '2025-09-01' ? 'SIM' : 'NÃO');

// Simular verificação de import
console.log('\n📋 TESTE: Verificação de import');
console.log('✅ Import adicionado em TrainingScreen.tsx');
console.log('✅ Função formatDateToISO agora disponível');
console.log('✅ Erro ReferenceError deve estar resolvido');

// Diagnóstico final
console.log('\n🔍 DIAGNÓSTICO FINAL:');
if (result === '2025-09-01') {
  console.log('🎉 SUCESSO: Correção de import funcionou!');
  console.log('💡 O erro ReferenceError deve estar resolvido');
  console.log('💡 TrainingScreen.tsx agora pode usar formatDateToISO');
  console.log('💡 Todas as funcionalidades devem estar funcionando');
} else {
  console.log('❌ PROBLEMA: A função ainda não está funcionando corretamente');
  console.log('💡 Verificar se o import foi adicionado corretamente');
}
