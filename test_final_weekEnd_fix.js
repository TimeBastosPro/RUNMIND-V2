// 🔍 TESTE FINAL PARA VERIFICAR CORREÇÃO DEFINITIVA DA FUNÇÃO getWeekEnd
// Execute este script no console do navegador

console.log('🚀 TESTE FINAL: Verificando correção definitiva da função getWeekEnd...');

// Simular a função getWeekStart corrigida
function getWeekStart(date) {
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = weekStart.getDay();
  
  let daysToMonday;
  if (dayOfWeek === 0) {
    daysToMonday = 6;
  } else {
    daysToMonday = dayOfWeek - 1;
  }
  
  weekStart.setDate(weekStart.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  return weekStart;
}

// Simular a função getWeekEnd corrigida com UTC
function getWeekEnd(date) {
  const weekStart = getWeekStart(date);
  
  // ✅ SOLUÇÃO DEFINITIVA: Calcular domingo usando UTC para evitar problemas de timezone
  const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000)); // Adicionar 6 dias em milissegundos
  weekEnd.setHours(23, 59, 59, 999);
  
  // ✅ VERIFICAÇÃO: Garantir que o resultado é realmente domingo
  const dayOfWeek = weekEnd.getDay();
  if (dayOfWeek !== 0) {
    console.error('❌ ERRO CRÍTICO: getWeekEnd não retornou domingo!', {
      inputDate: date.toISOString().split('T')[0],
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      dayOfWeek: dayOfWeek,
      dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek]
    });
    
    // ✅ CORREÇÃO DE EMERGÊNCIA: Forçar domingo usando cálculo direto
    const correctedWeekEnd = new Date(weekStart);
    correctedWeekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    correctedWeekEnd.setHours(23, 59, 59, 999);
    
    console.log('🔧 CORREÇÃO APLICADA:', {
      originalWeekEnd: weekEnd.toISOString().split('T')[0],
      correctedWeekEnd: correctedWeekEnd.toISOString().split('T')[0],
      correctedDayOfWeek: correctedWeekEnd.getDay()
    });
    
    return correctedWeekEnd;
  }
  
  console.log('🔧 DEBUG - getWeekEnd DEFINITIVO:', {
    inputDate: date.toISOString().split('T')[0],
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    dayOfWeek: dayOfWeek,
    dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek],
    daysDifference: Math.floor((weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24))
  });
  
  return weekEnd;
}

// Simular a função getWeekPeriod
function getWeekPeriod(date) {
  return {
    startDate: getWeekStart(date),
    endDate: getWeekEnd(date)
  };
}

// Teste 1: Verificar semana de 25/08/2025
console.log('📋 TESTE 1: Verificar semana de 25/08/2025');
const testDate1 = new Date(2025, 7, 25); // 25/08/2025 (segunda-feira)
const period1 = getWeekPeriod(testDate1);

console.log('📅 Período calculado para 25/08/2025:', {
  startDate: period1.startDate.toISOString().split('T')[0],
  endDate: period1.endDate.toISOString().split('T')[0],
  startDay: period1.startDate.getDay(),
  endDay: period1.endDate.getDay(),
  startDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period1.startDate.getDay()],
  endDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period1.endDate.getDay()]
});

// Teste 2: Verificar semana de 01/09/2025
console.log('\n📋 TESTE 2: Verificar semana de 01/09/2025');
const testDate2 = new Date(2025, 8, 1); // 01/09/2025 (segunda-feira)
const period2 = getWeekPeriod(testDate2);

console.log('📅 Período calculado para 01/09/2025:', {
  startDate: period2.startDate.toISOString().split('T')[0],
  endDate: period2.endDate.toISOString().split('T')[0],
  startDay: period2.startDate.getDay(),
  endDay: period2.endDate.getDay(),
  startDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period2.startDate.getDay()],
  endDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period2.endDate.getDay()]
});

// Teste 3: Verificar semana de 08/09/2025
console.log('\n📋 TESTE 3: Verificar semana de 08/09/2025');
const testDate3 = new Date(2025, 8, 8); // 08/09/2025 (segunda-feira)
const period3 = getWeekPeriod(testDate3);

console.log('📅 Período calculado para 08/09/2025:', {
  startDate: period3.startDate.toISOString().split('T')[0],
  endDate: period3.endDate.toISOString().split('T')[0],
  startDay: period3.startDate.getDay(),
  endDay: period3.endDate.getDay(),
  startDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period3.startDate.getDay()],
  endDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period3.endDate.getDay()]
});

// Teste 4: Verificar diferentes dias da semana
console.log('\n📋 TESTE 4: Verificar diferentes dias da semana');
const testDates = [
  new Date(2025, 7, 25), // 25/08/2025 (segunda)
  new Date(2025, 7, 26), // 26/08/2025 (terça)
  new Date(2025, 7, 27), // 27/08/2025 (quarta)
  new Date(2025, 7, 28), // 28/08/2025 (quinta)
  new Date(2025, 7, 29), // 29/08/2025 (sexta)
  new Date(2025, 7, 30), // 30/08/2025 (sábado)
  new Date(2025, 7, 31), // 31/08/2025 (domingo)
];

testDates.forEach((date, index) => {
  const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][date.getDay()];
  const period = getWeekPeriod(date);
  
  console.log(`  ${index + 1}. ${date.toISOString().split('T')[0]} (${dayName}):`, {
    startDate: period.startDate.toISOString().split('T')[0],
    endDate: period.endDate.toISOString().split('T')[0],
    startDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period.startDate.getDay()],
    endDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period.endDate.getDay()]
  });
});

// Diagnóstico final
console.log('\n🔍 DIAGNÓSTICO FINAL:');

// Verificar se 25/08 a 31/08 está correto
const is25to31Correct = period1.startDate.toISOString().split('T')[0] === '2025-08-25' && 
                       period1.endDate.toISOString().split('T')[0] === '2025-08-31';
console.log(`- Semana 25/08 a 31/08: ${is25to31Correct ? 'CORRETO' : 'INCORRETO'}`);

// Verificar se 01/09 a 07/09 está correto
const is01to07Correct = period2.startDate.toISOString().split('T')[0] === '2025-09-01' && 
                       period2.endDate.toISOString().split('T')[0] === '2025-09-07';
console.log(`- Semana 01/09 a 07/09: ${is01to07Correct ? 'CORRETO' : 'INCORRETO'}`);

// Verificar se 08/09 a 14/09 está correto
const is08to14Correct = period3.startDate.toISOString().split('T')[0] === '2025-09-08' && 
                       period3.endDate.toISOString().split('T')[0] === '2025-09-14';
console.log(`- Semana 08/09 a 14/09: ${is08to14Correct ? 'CORRETO' : 'INCORRETO'}`);

// Verificar se todos os períodos começam na segunda e terminam no domingo
const allStartOnMonday = [period1, period2, period3].every(p => p.startDate.getDay() === 1);
const allEndOnSunday = [period1, period2, period3].every(p => p.endDate.getDay() === 0);

console.log(`- Todos começam na segunda: ${allStartOnMonday ? 'SIM' : 'NÃO'}`);
console.log(`- Todos terminam no domingo: ${allEndOnSunday ? 'SIM' : 'NÃO'}`);

if (is25to31Correct && is01to07Correct && is08to14Correct && allStartOnMonday && allEndOnSunday) {
  console.log('\n🎉 SUCESSO: A correção definitiva da função getWeekEnd funcionou!');
  console.log('💡 Agora todos os períodos estão corretos (segunda a domingo)');
  console.log('💡 Os dados de segunda-feira devem aparecer no gráfico!');
} else {
  console.log('\n❌ PROBLEMA: A correção ainda não funcionou completamente');
  console.log('💡 Verificar se há problemas na função getWeekEnd');
}
