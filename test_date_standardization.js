// 🔍 TESTE PARA VERIFICAR PADRONIZAÇÃO DE DATAS
// Execute este script no console do navegador

console.log('🚀 TESTE: Verificando padronização de datas...');

// Simular as funções centralizadas
function formatDateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateKey(dateInput) {
  if (typeof dateInput === 'string') {
    if (dateInput.includes('-') && dateInput.length === 10) {
      return dateInput;
    }
    if (dateInput.includes('/')) {
      const [day, month, year] = dateInput.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    if (dateInput.includes('T')) {
      return dateInput.split('T')[0];
    }
    return dateInput;
  } else {
    return formatDateToISO(dateInput);
  }
}

// Teste 1: Verificar formatação consistente
console.log('\n📋 TESTE 1: Formatação consistente');
const testDate = new Date('2025-09-01T00:00:00.000Z');
const isoFormat = formatDateToISO(testDate);
const oldFormat = testDate.toISOString().split('T')[0];

console.log('📅 Data de teste:', testDate);
console.log('📅 Formato ISO (novo):', isoFormat);
console.log('📅 Formato ISO (antigo):', oldFormat);
console.log('✅ Formatos consistentes:', isoFormat === oldFormat ? 'SIM' : 'NÃO');

// Teste 2: Verificar getDateKey com diferentes inputs
console.log('\n📋 TESTE 2: getDateKey com diferentes inputs');
const testCases = [
  '2025-09-01',
  '01/09/2025',
  '2025-09-01T00:00:00.000Z',
  new Date('2025-09-01')
];

testCases.forEach((testCase, index) => {
  const result = getDateKey(testCase);
  console.log(`📅 Caso ${index + 1}:`, {
    input: testCase,
    output: result,
    type: typeof testCase
  });
});

// Teste 3: Verificar consistência entre abas
console.log('\n📋 TESTE 3: Consistência entre abas');
const mondayDate = new Date('2025-09-01T00:00:00.000Z');

// Simular formatação da aba de treinos
const trainingFormat = formatDateToISO(mondayDate);

// Simular formatação da aba de análise
const analysisFormat = formatDateToISO(mondayDate);

// Simular formatação do cálculo de semanas
const weekFormat = formatDateToISO(mondayDate);

console.log('📅 Aba de treinos:', trainingFormat);
console.log('📅 Aba de análise:', analysisFormat);
console.log('📅 Cálculo de semanas:', weekFormat);
console.log('✅ Todas as abas consistentes:', 
  trainingFormat === analysisFormat && analysisFormat === weekFormat ? 'SIM' : 'NÃO');

// Teste 4: Verificar problema específico de segunda-feira
console.log('\n📋 TESTE 4: Problema específico de segunda-feira');
const mondayStr = '2025-09-01';
const mondayDateObj = new Date(mondayStr + 'T00:00:00.000Z');

const keyFromString = getDateKey(mondayStr);
const keyFromDate = getDateKey(mondayDateObj);
const keyFromISO = getDateKey(mondayDateObj.toISOString());

console.log('📅 String original:', mondayStr);
console.log('📅 Chave de string:', keyFromString);
console.log('📅 Chave de Date:', keyFromDate);
console.log('📅 Chave de ISO:', keyFromISO);
console.log('✅ Todas as chaves iguais:', 
  keyFromString === keyFromDate && keyFromDate === keyFromISO ? 'SIM' : 'NÃO');

// Diagnóstico final
console.log('\n🔍 DIAGNÓSTICO FINAL:');
const allConsistent = isoFormat === oldFormat && 
  trainingFormat === analysisFormat && 
  analysisFormat === weekFormat &&
  keyFromString === keyFromDate && 
  keyFromDate === keyFromISO;

if (allConsistent) {
  console.log('🎉 SUCESSO: Padronização de datas funcionou!');
  console.log('💡 Todas as abas agora usam o mesmo formato de data');
  console.log('💡 O problema de segunda-feira deve estar resolvido');
} else {
  console.log('❌ PROBLEMA: Ainda há inconsistências de formato');
  console.log('💡 Verificar se todas as funções foram atualizadas');
}
