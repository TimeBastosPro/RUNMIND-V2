// 🔍 TESTE ESPECÍFICO PARA VERIFICAR FUNÇÃO getWeekPeriod
// Execute este script no console do navegador

console.log('🚀 TESTE ESPECÍFICO: Verificando função getWeekPeriod...');

// Simular a função getWeekStart
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
  
  console.log('🔧 DEBUG - getWeekStart:', {
    inputDate: date.toISOString().split('T')[0],
    dayOfWeek: dayOfWeek,
    dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek],
    daysToMonday: daysToMonday,
    weekStart: weekStart.toISOString().split('T')[0]
  });
  
  return weekStart;
}

// Simular a função getWeekEnd
function getWeekEnd(date) {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  console.log('🔧 DEBUG - getWeekEnd:', {
    inputDate: date.toISOString().split('T')[0],
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0]
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

// Teste 1: Verificar se 01/09/2025 é segunda-feira
console.log('📋 TESTE 1: Verificar se 01/09/2025 é segunda-feira');
const testDate = new Date(2025, 8, 1); // 01/09/2025
console.log('📅 Data de teste:', {
  date: testDate.toISOString().split('T')[0],
  day: testDate.getDay(),
  dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][testDate.getDay()],
  isMonday: testDate.getDay() === 1
});

// Teste 2: Verificar getWeekStart com 01/09/2025
console.log('\n📋 TESTE 2: Verificar getWeekStart com 01/09/2025');
const weekStart = getWeekStart(testDate);
console.log('📅 Resultado getWeekStart:', {
  weekStart: weekStart.toISOString().split('T')[0],
  day: weekStart.getDay(),
  dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][weekStart.getDay()],
  isMonday: weekStart.getDay() === 1
});

// Teste 3: Verificar getWeekEnd com 01/09/2025
console.log('\n📋 TESTE 3: Verificar getWeekEnd com 01/09/2025');
const weekEnd = getWeekEnd(testDate);
console.log('📅 Resultado getWeekEnd:', {
  weekEnd: weekEnd.toISOString().split('T')[0],
  day: weekEnd.getDay(),
  dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][weekEnd.getDay()],
  isSunday: weekEnd.getDay() === 0
});

// Teste 4: Verificar getWeekPeriod com 01/09/2025
console.log('\n📋 TESTE 4: Verificar getWeekPeriod com 01/09/2025');
const period = getWeekPeriod(testDate);
console.log('📅 Resultado getWeekPeriod:', {
  startDate: period.startDate.toISOString().split('T')[0],
  endDate: period.endDate.toISOString().split('T')[0],
  startDay: period.startDate.getDay(),
  endDay: period.endDate.getDay(),
  startDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period.startDate.getDay()],
  endDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period.endDate.getDay()]
});

// Teste 5: Verificar se 01/09 está no período
console.log('\n📋 TESTE 5: Verificar se 01/09 está no período');
const isInPeriod = testDate >= period.startDate && testDate <= period.endDate;
console.log('📅 01/09/2025 está no período:', isInPeriod);

// Teste 6: Verificar geração de datas da semana
console.log('\n📋 TESTE 6: Verificar geração de datas da semana');
function generateWeekDates(weekStart) {
  const dates = [];
  const start = new Date(weekStart);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

const weekDates = generateWeekDates(period.startDate);
console.log('📅 Datas geradas para a semana:');
weekDates.forEach((d, index) => {
  const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][d.getDay()];
  console.log(`  ${index + 1}. ${d.toISOString().split('T')[0]} (${dayName})`);
});

// Verificar se segunda-feira está presente
const monday = weekDates.find(d => d.getDay() === 1);
console.log('✅ Segunda-feira encontrada:', monday ? monday.toISOString().split('T')[0] : 'NÃO ENCONTRADA');

// Verificar se 01/09 está nas datas geradas
const is01SeptInGenerated = weekDates.some(d => d.toISOString().split('T')[0] === '2025-09-01');
console.log('✅ 01/09 está nas datas geradas:', is01SeptInGenerated);

// Diagnóstico final
console.log('\n🔍 DIAGNÓSTICO FINAL:');
console.log(`- 01/09/2025 é segunda-feira: ${testDate.getDay() === 1 ? 'SIM' : 'NÃO'}`);
console.log(`- Período calculado corretamente: ${period.startDate.getDay() === 1 && period.endDate.getDay() === 0 ? 'SIM' : 'NÃO'}`);
console.log(`- 01/09 está no período: ${isInPeriod ? 'SIM' : 'NÃO'}`);
console.log(`- Segunda-feira nas datas geradas: ${monday ? 'SIM' : 'NÃO'}`);
console.log(`- 01/09 nas datas geradas: ${is01SeptInGenerated ? 'SIM' : 'NÃO'}`);

if (is01SeptInGenerated) {
  console.log('\n🎉 SUCESSO: 01/09 está sendo gerado corretamente!');
  console.log('💡 A função getWeekPeriod está funcionando corretamente');
} else {
  console.log('\n❌ PROBLEMA: 01/09 não está sendo gerado!');
  console.log('💡 O problema está na função getWeekPeriod ou getWeekStart');
}
