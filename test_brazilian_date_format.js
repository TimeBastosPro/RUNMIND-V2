// 🔍 TESTE PARA VERIFICAR FORMATO BRASILEIRO DE DATAS
// Execute este script no console do navegador

console.log('🚀 TESTE: Verificando formato brasileiro de datas...');

// Simular as funções de formatação
function formatDateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateToBrazilian(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function convertISOToBrazilian(dateString) {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function convertBrazilianToISO(dateString) {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Teste 1: Formatação básica
console.log('\n📋 TESTE 1: Formatação básica');
const testDate = new Date('2025-09-01T00:00:00.000Z');

console.log('📅 Data de teste:', testDate);
console.log('📅 Formato ISO:', formatDateToISO(testDate));
console.log('📅 Formato Brasileiro:', formatDateToBrazilian(testDate));

// Teste 2: Conversões
console.log('\n📋 TESTE 2: Conversões');
const isoDate = '2025-09-01';
const brazilianDate = '01/09/2025';

console.log('📅 ISO para Brasileiro:', convertISOToBrazilian(isoDate));
console.log('📅 Brasileiro para ISO:', convertBrazilianToISO(brazilianDate));

// Teste 3: Formato para exibição no gráfico
console.log('\n📋 TESTE 3: Formato para exibição no gráfico');
const chartDate = new Date('2025-09-01T00:00:00.000Z');
const displayFormat = formatDateToBrazilian(chartDate).substring(0, 5); // DD/MM

console.log('📅 Data completa:', formatDateToBrazilian(chartDate));
console.log('📅 Formato do gráfico (DD/MM):', displayFormat);

// Teste 4: Período de semana
console.log('\n📋 TESTE 4: Período de semana');
const startDate = new Date('2025-09-01T00:00:00.000Z');
const endDate = new Date('2025-09-07T00:00:00.000Z');

const startDisplay = formatDateToBrazilian(startDate).substring(0, 5);
const endDisplay = formatDateToBrazilian(endDate).substring(0, 5);
const periodDisplay = `${startDisplay} - ${endDisplay}`;

console.log('📅 Início da semana:', startDisplay);
console.log('📅 Fim da semana:', endDisplay);
console.log('📅 Período completo:', periodDisplay);

// Teste 5: Consistência com dados de segunda-feira
console.log('\n📋 TESTE 5: Consistência com dados de segunda-feira');
const mondayDate = new Date('2025-09-01T00:00:00.000Z');
const mondayISO = formatDateToISO(mondayDate);
const mondayBrazilian = formatDateToBrazilian(mondayDate);
const mondayDisplay = formatDateToBrazilian(mondayDate).substring(0, 5);

console.log('📅 Segunda-feira ISO:', mondayISO);
console.log('📅 Segunda-feira Brasileiro:', mondayBrazilian);
console.log('📅 Segunda-feira Display:', mondayDisplay);

// Verificar se as conversões são consistentes
const backToISO = convertBrazilianToISO(mondayBrazilian);
const backToBrazilian = convertISOToBrazilian(mondayISO);

console.log('📅 Conversão de volta para ISO:', backToISO);
console.log('📅 Conversão de volta para Brasileiro:', backToBrazilian);
console.log('✅ Conversões consistentes:', mondayISO === backToISO && mondayBrazilian === backToBrazilian ? 'SIM' : 'NÃO');

// Diagnóstico final
console.log('\n🔍 DIAGNÓSTICO FINAL:');
const allConsistent = mondayISO === backToISO && mondayBrazilian === backToBrazilian;

if (allConsistent) {
  console.log('🎉 SUCESSO: Formato brasileiro funcionando corretamente!');
  console.log('💡 Todas as datas agora usam DD/MM/AAAA para exibição');
  console.log('💡 Processamento interno continua usando YYYY-MM-DD');
  console.log('💡 O problema de segunda-feira deve estar resolvido');
} else {
  console.log('❌ PROBLEMA: Há inconsistências no formato brasileiro');
  console.log('💡 Verificar se todas as funções foram atualizadas');
}
