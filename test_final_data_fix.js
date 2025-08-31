// 🔍 TESTE FINAL PARA VERIFICAR CORREÇÃO DE PROCESSAMENTO DE DADOS
// Execute este script no console do navegador

console.log('🚀 TESTE FINAL: Verificando correção de processamento de dados...');

// Simular a função corrigida
function filterTrainingSessionsByPeriodFixed(sessions, startDate, endDate) {
  return sessions.filter(session => {
    if (!session.training_date) return false;
    
    // ✅ CORREÇÃO CRÍTICA: Usar timezone local para evitar problemas
    const sessionDateStr = session.training_date.split('T')[0];
    const [year, month, day] = sessionDateStr.split('-').map(Number);
    const sessionDate = new Date(year, month - 1, day);
    
    return sessionDate >= startDate && sessionDate <= endDate;
  });
}

// Simular a função antiga (com problema)
function filterTrainingSessionsByPeriodOld(sessions, startDate, endDate) {
  return sessions.filter(session => {
    if (!session.training_date) return false;
    
    const sessionDateStr = session.training_date.split('T')[0];
    const sessionDate = new Date(sessionDateStr + 'T00:00:00.000Z');
    
    return sessionDate >= startDate && sessionDate <= endDate;
  });
}

// Dados de teste
const mockSessions = [
  {
    id: '1',
    training_date: '2025-09-01',
    status: 'planned',
    distance_km: 12.0
  },
  {
    id: '2',
    training_date: '2025-09-02',
    status: 'planned',
    distance_km: 8.0
  }
];

// Período de teste
const startDate = new Date('2025-09-01T00:00:00.000Z');
const endDate = new Date('2025-09-07T23:59:59.999Z');

console.log('\n📋 TESTE: Comparação de funções');

// Teste com função antiga
console.log('\n📅 Função ANTIGA (com problema):');
const oldResult = filterTrainingSessionsByPeriodOld(mockSessions, startDate, endDate);
console.log('📊 Resultado:', oldResult.length, 'sessões');
console.log('📊 Segunda-feira:', oldResult.find(s => s.training_date === '2025-09-01'));

// Teste com função corrigida
console.log('\n📅 Função CORRIGIDA:');
const newResult = filterTrainingSessionsByPeriodFixed(mockSessions, startDate, endDate);
console.log('📊 Resultado:', newResult.length, 'sessões');
console.log('📊 Segunda-feira:', newResult.find(s => s.training_date === '2025-09-01'));

// Verificar diferença
console.log('\n📅 COMPARAÇÃO:');
console.log('📊 Função antiga encontrou segunda-feira:', !!oldResult.find(s => s.training_date === '2025-09-01'));
console.log('📊 Função corrigida encontrou segunda-feira:', !!newResult.find(s => s.training_date === '2025-09-01'));

// Teste específico de timezone
console.log('\n📅 TESTE DE TIMEZONE:');
const mondayStr = '2025-09-01';

// Método antigo (problemático)
const oldDate = new Date(mondayStr + 'T00:00:00.000Z');
console.log('📅 Método antigo:', {
  input: mondayStr,
  output: oldDate.toISOString().split('T')[0],
  timezone: 'UTC'
});

// Método novo (corrigido)
const [year, month, day] = mondayStr.split('-').map(Number);
const newDate = new Date(year, month - 1, day);
console.log('📅 Método novo:', {
  input: mondayStr,
  output: newDate.toISOString().split('T')[0],
  timezone: 'Local'
});

// Diagnóstico final
console.log('\n🔍 DIAGNÓSTICO FINAL:');
const mondayFound = !!newResult.find(s => s.training_date === '2025-09-01');
const mondayValue = newResult.find(s => s.training_date === '2025-09-01')?.distance_km || 0;

console.log(`- Segunda-feira encontrada: ${mondayFound ? 'SIM' : 'NÃO'}`);
console.log(`- Valor de segunda-feira: ${mondayValue}`);
console.log(`- Correção aplicada: ${mondayFound && mondayValue > 0 ? 'SIM' : 'NÃO'}`);

if (mondayFound && mondayValue > 0) {
  console.log('\n🎉 SUCESSO: A correção de processamento funcionou!');
  console.log('💡 Segunda-feira agora deve aparecer no gráfico!');
} else {
  console.log('\n❌ PROBLEMA: A correção não funcionou completamente');
  console.log('💡 Verificar se há outros problemas no processamento');
}
