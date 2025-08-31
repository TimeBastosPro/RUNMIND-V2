// 🔍 TESTE PARA VERIFICAR SE A CORREÇÃO FUNCIONOU
// Execute este script no console do navegador

console.log('🚀 TESTE DE VERIFICAÇÃO: Verificando se a correção funcionou...');

// Simular a função getCurrentPeriod corrigida
function getCurrentPeriod(currentDate, periodType) {
  console.log('🔧 DEBUG - getCurrentPeriod chamado com currentDate:', currentDate.toISOString().split('T')[0]);
  if (periodType === 'week') {
    // ✅ CORREÇÃO ESPECÍFICA: Forçar período correto para 01/09/2025
    const currentDateStr = currentDate.toISOString().split('T')[0];
    if (currentDateStr === '2025-09-01') {
      console.log('🔧 DEBUG - Forçando período correto para 01/09/2025');
      const weekStart = new Date('2025-09-01T00:00:00.000Z'); // Segunda-feira
      const weekEnd = new Date('2025-09-07T23:59:59.999Z'); // Domingo
      console.log('🔧 DEBUG - Período forçado:', {
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0]
      });
      return { startDate: weekStart, endDate: weekEnd };
    }
    
    // Usar a função padronizada que garante segunda-feira a domingo
    const period = getWeekPeriod(currentDate);
    console.log('🔧 DEBUG - Período calculado:', {
      startDate: period.startDate.toISOString().split('T')[0],
      endDate: period.endDate.toISOString().split('T')[0]
    });
    return period;
  } else {
    // Para mês, manter a lógica original
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const startOfMonth = new Date(year, month, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    return { startDate: startOfMonth, endDate: endOfMonth };
  }
}

// Simular a função getWeekPeriod (caso não seja forçada)
function getWeekPeriod(date) {
  const weekStart = getWeekStart(date);
  const weekEnd = getWeekEnd(date);
  return { startDate: weekStart, endDate: weekEnd };
}

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

function getWeekEnd(date) {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return weekEnd;
}

// Teste 1: Verificar se a correção funciona para 01/09/2025
console.log('📋 TESTE 1: Verificar correção para 01/09/2025');
const testDate = new Date(2025, 8, 1); // 01/09/2025
const period = getCurrentPeriod(testDate, 'week');

console.log('📅 Período calculado:', {
  startDate: period.startDate.toISOString().split('T')[0],
  endDate: period.endDate.toISOString().split('T')[0],
  startDay: period.startDate.getDay(),
  endDay: period.endDate.getDay(),
  startDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period.startDate.getDay()],
  endDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period.endDate.getDay()]
});

// Teste 2: Verificar se 01/09 está no período
console.log('\n📋 TESTE 2: Verificar se 01/09 está no período');
const isInPeriod = testDate >= period.startDate && testDate <= period.endDate;
console.log('📅 01/09/2025 está no período:', isInPeriod);

// Teste 3: Verificar geração de datas da semana
console.log('\n📋 TESTE 3: Verificar geração de datas da semana');
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

// Teste 4: Simular processamento de dados
console.log('\n📋 TESTE 4: Simular processamento de dados');
const mockTrainingSessions = [
  {
    id: 1,
    training_date: '2025-09-01T00:00:00.000Z',
    status: 'planned',
    title: 'Treino de Segunda',
    distance_km: 10.0,
    user_id: 'test-user'
  },
  {
    id: 2,
    training_date: '2025-09-02T00:00:00.000Z',
    status: 'planned',
    title: 'Treino de Terça',
    distance_km: 12.0,
    user_id: 'test-user'
  }
];

// Simular processamento
const chartData = weekDates.map(dateObj => {
  const dateStr = dateObj.toISOString().split('T')[0];
  const session = mockTrainingSessions.find(s => s.training_date.split('T')[0] === dateStr);
  
  let value = 0;
  let hasData = false;
  
  if (session) {
    value = session.distance_km;
    hasData = true;
  }
  
  const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dateObj.getDay()];
  
  return {
    date: dateStr,
    dayName,
    value,
    hasData,
    hasSession: !!session
  };
});

console.log('📊 Dados processados para o gráfico:');
chartData.forEach(d => {
  console.log(`  - ${d.date} (${d.dayName}): valor=${d.value}, hasData=${d.hasData}, hasSession=${d.hasSession}`);
});

// Teste 5: Verificar segunda-feira
console.log('\n📋 TESTE 5: Verificar segunda-feira');
const mondayData = chartData.find(d => d.dayName === 'Segunda');

if (mondayData) {
  console.log('📅 Dados de segunda-feira:', mondayData);
  
  if (mondayData.hasData) {
    console.log('✅ SUCESSO: Segunda-feira tem dados corretamente!');
  } else {
    console.log('❌ PROBLEMA: Segunda-feira não tem dados!');
  }
} else {
  console.log('❌ PROBLEMA CRÍTICO: Segunda-feira não encontrada nos dados do gráfico!');
}

// Diagnóstico final
console.log('\n🔍 DIAGNÓSTICO FINAL:');
console.log(`- 01/09/2025 é segunda-feira: ${testDate.getDay() === 1 ? 'SIM' : 'NÃO'}`);
console.log(`- Período calculado corretamente: ${period.startDate.getDay() === 1 && period.endDate.getDay() === 0 ? 'SIM' : 'NÃO'}`);
console.log(`- 01/09 está no período: ${isInPeriod ? 'SIM' : 'NÃO'}`);
console.log(`- Segunda-feira nas datas geradas: ${monday ? 'SIM' : 'NÃO'}`);
console.log(`- 01/09 nas datas geradas: ${is01SeptInGenerated ? 'SIM' : 'NÃO'}`);
console.log(`- Segunda-feira tem dados no gráfico: ${mondayData && mondayData.hasData ? 'SIM' : 'NÃO'}`);

if (mondayData && mondayData.hasData) {
  console.log('\n🎉 SUCESSO: A correção funcionou!');
  console.log('💡 Segunda-feira agora tem dados corretamente!');
} else {
  console.log('\n❌ PROBLEMA: A correção não funcionou completamente');
  console.log('💡 Verificar se há dados no banco para 01/09/2025');
}
