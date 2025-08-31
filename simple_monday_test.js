// 🔍 TESTE SIMPLES PARA VERIFICAR PROBLEMA DE SEGUNDA-FEIRA
// Execute este script no console do navegador

console.log('🚀 TESTE SIMPLES: Verificando problema de segunda-feira...');

// Teste 1: Verificar se 01/09/2025 é segunda-feira
console.log('📋 TESTE 1: Verificar se 01/09/2025 é segunda-feira');
const testDate = new Date('2025-09-01T00:00:00.000Z');
console.log('📅 Data de teste:', {
  date: testDate.toISOString().split('T')[0],
  day: testDate.getDay(),
  dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][testDate.getDay()],
  isMonday: testDate.getDay() === 1
});

// Teste 2: Verificar cálculo do período da semana
console.log('\n📋 TESTE 2: Verificar cálculo do período da semana');
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

const weekStart = getWeekStart(testDate);
const weekEnd = getWeekEnd(testDate);

console.log('📅 Período da semana calculado:', {
  startDate: weekStart.toISOString().split('T')[0],
  endDate: weekEnd.toISOString().split('T')[0],
  startDay: weekStart.getDay(),
  endDay: weekEnd.getDay(),
  startDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][weekStart.getDay()],
  endDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][weekEnd.getDay()]
});

// Teste 3: Verificar se 01/09 está no período
console.log('\n📋 TESTE 3: Verificar se 01/09 está no período');
const isInPeriod = testDate >= weekStart && testDate <= weekEnd;
console.log('📅 01/09/2025 está no período:', isInPeriod);

// Teste 4: Verificar geração de datas da semana
console.log('\n📋 TESTE 4: Verificar geração de datas da semana');
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

const weekDates = generateWeekDates(weekStart);

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

// Teste 5: Simular dados de treinos
console.log('\n📋 TESTE 5: Simular dados de treinos');
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

console.log('📊 Dados de treinos simulados:', mockTrainingSessions.length);
mockTrainingSessions.forEach(s => {
  const dateStr = s.training_date.split('T')[0];
  const date = new Date(dateStr + 'T00:00:00.000Z');
  const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][date.getDay()];
  console.log(`  - ${dateStr} (${dayName}): ${s.title} - Distância: ${s.distance_km}km`);
});

// Teste 6: Simular processamento para o gráfico
console.log('\n📋 TESTE 6: Simular processamento para o gráfico');

// Filtrar treinos por período
const filteredSessions = mockTrainingSessions.filter(s => {
  if (!s.training_date) return false;
  const sessionDateStr = s.training_date.split('T')[0];
  const sessionDate = new Date(sessionDateStr + 'T00:00:00.000Z');
  return sessionDate >= weekStart && sessionDate <= weekEnd;
});

console.log('📊 Sessões filtradas por período:', filteredSessions.length);

// Filtrar por tipo (planned)
const plannedSessions = filteredSessions.filter(s => s.status === 'planned');
console.log('📊 Treinos planejados:', plannedSessions.length);

// Mapear por data
const sessionsByDate = {};
plannedSessions.forEach(t => {
  const dateKey = t.training_date.split('T')[0];
  sessionsByDate[dateKey] = t;
});

console.log('📊 Mapeamento por data:');
Object.keys(sessionsByDate).forEach(dateKey => {
  const session = sessionsByDate[dateKey];
  const date = new Date(dateKey + 'T00:00:00.000Z');
  const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][date.getDay()];
  console.log(`  - ${dateKey} (${dayName}): ${session.title} - Distância: ${session.distance_km}km`);
});

// Processar dados para o gráfico
const chartData = weekDates.map(dateObj => {
  const dateStr = dateObj.toISOString().split('T')[0];
  const session = sessionsByDate[dateStr];
  
  let value = 0;
  let hasData = false;
  
  if (session) {
    const fieldValue = session.distance_km;
    
    if (typeof fieldValue === 'number') {
      value = fieldValue;
      hasData = true;
    } else if (typeof fieldValue === 'string') {
      const numValue = parseFloat(fieldValue);
      if (!isNaN(numValue)) {
        value = numValue;
        hasData = true;
      }
    }
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

console.log('📊 Dados finais para o gráfico:');
chartData.forEach(d => {
  console.log(`  - ${d.date} (${d.dayName}): valor=${d.value}, hasData=${d.hasData}, hasSession=${d.hasSession}`);
});

// Teste 7: Verificar segunda-feira
console.log('\n📋 TESTE 7: Verificar segunda-feira');
const mondayData = chartData.find(d => d.dayName === 'Segunda');

if (mondayData) {
  console.log('📅 Dados de segunda-feira:', mondayData);
  
  if (mondayData.hasData) {
    console.log('✅ SUCESSO: Segunda-feira tem dados corretamente!');
  } else {
    console.log('❌ PROBLEMA: Segunda-feira não tem dados!');
    
    if (mondayData.hasSession) {
      console.log('🔍 Há sessão mas não tem dados válidos');
      console.log('💡 Verificar se o campo distance_km está preenchido corretamente');
    } else {
      console.log('🔍 Não há sessão para segunda-feira');
      console.log('💡 Verificar se há dados no banco para 01/09/2025');
    }
  }
} else {
  console.log('❌ PROBLEMA CRÍTICO: Segunda-feira não encontrada nos dados do gráfico!');
}

// Diagnóstico final
console.log('\n🔍 DIAGNÓSTICO FINAL:');
console.log(`- 01/09/2025 é segunda-feira: ${testDate.getDay() === 1 ? 'SIM' : 'NÃO'}`);
console.log(`- Período calculado corretamente: ${weekStart.getDay() === 1 && weekEnd.getDay() === 0 ? 'SIM' : 'NÃO'}`);
console.log(`- 01/09 está no período: ${isInPeriod ? 'SIM' : 'NÃO'}`);
console.log(`- Segunda-feira nas datas geradas: ${monday ? 'SIM' : 'NÃO'}`);
console.log(`- 01/09 nas datas geradas: ${is01SeptInGenerated ? 'SIM' : 'NÃO'}`);
console.log(`- Segunda-feira tem dados no gráfico: ${mondayData && mondayData.hasData ? 'SIM' : 'NÃO'}`);

if (mondayData && mondayData.hasData) {
  console.log('\n🎉 SUCESSO: Segunda-feira tem dados corretamente!');
  console.log('💡 A lógica de processamento está funcionando corretamente');
} else {
  console.log('\n❌ PROBLEMA: Segunda-feira não tem dados!');
  console.log('💡 O problema está na lógica de processamento ou nos dados de entrada');
}
