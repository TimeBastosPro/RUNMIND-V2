// 🔍 TESTE COMPLETO PARA VERIFICAR SOLUÇÃO FINAL
// Execute este script no console do navegador

console.log('🚀 TESTE COMPLETO: Verificando solução final...');

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

// Simular a função processTrainingDataForChart
function processTrainingDataForChart(trainingSessions, startDate, endDate, analysisType, metricField) {
  // Filtrar treinos por período
  const filteredSessions = trainingSessions.filter(session => {
    if (!session.training_date) return false;
    
    const sessionDateStr = session.training_date.split('T')[0];
    const sessionDate = new Date(sessionDateStr + 'T00:00:00.000Z');
    
    return sessionDate >= startDate && sessionDate <= endDate;
  });

  // Filtrar por tipo de análise
  const sessionsByType = analysisType === 'planned' 
    ? filteredSessions.filter(t => t.status === 'planned')
    : filteredSessions.filter(t => t.status === 'completed');

  // Mapear por data
  const sessionsByDate = {};
  sessionsByType.forEach(t => {
    const dateKey = t.training_date.split('T')[0];
    sessionsByDate[dateKey] = t;
  });

  // Gerar datas do período
  const dates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Processar dados para cada data
  return dates.map(dateObj => {
    const dateStr = dateObj.toISOString().split('T')[0];
    const session = sessionsByDate[dateStr];
    
    let value = 0;
    let hasData = false;
    
    if (session) {
      const fieldValue = session[metricField];
      
      // Processar valor baseado no tipo de campo
      if (typeof fieldValue === 'number') {
        value = fieldValue;
        hasData = true;
      } else if (typeof fieldValue === 'string') {
        const numValue = parseFloat(fieldValue);
        if (!isNaN(numValue)) {
          value = numValue;
          hasData = true;
        }
      } else if (fieldValue !== null && fieldValue !== undefined) {
        hasData = true;
        value = 1; // Para campos não numéricos, usar 1 como indicador
      }
    }
    
    const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dateObj.getDay()];
    
    return {
      date: dateObj,
      dateStr,
      dayName,
      value,
      hasData,
      hasSession: !!session
    };
  });
}

// Simular a lógica de renderização
function simulateChartRendering(chartData) {
  console.log('🔧 DEBUG - Simulando renderização do gráfico...');
  
  const hasData = chartData.some(d => d.hasData);
  const dataLength = chartData.length;
  
  console.log('📊 Condições de renderização:', {
    dataLength,
    hasData,
    shouldRender: dataLength > 0 && hasData
  });
  
  if (!(dataLength > 0 && hasData)) {
    console.log('❌ Gráfico não deve renderizar');
    return false;
  }
  
  // Simular renderização de cada barra
  chartData.forEach((item, index) => {
    const valuesWithData = chartData.filter(d => d.hasData).map(d => d.value);
    const maxValue = valuesWithData.length > 0 ? Math.max(...valuesWithData) : 1;
    
    const shouldShowBar = item.hasData;
    const displayValue = item.value || 0;
    const barHeight = shouldShowBar ? Math.max((displayValue / maxValue) * 100, 2) : 2;
    
    console.log(`  ${index + 1}. ${item.dateStr} (${item.dayName}):`, {
      value: item.value,
      hasData: item.hasData,
      shouldShowBar,
      displayValue,
      barHeight: barHeight.toFixed(1) + '%'
    });
    
    // Debug específico para segundas-feiras
    if (item.date.getDay() === 1) {
      console.log('🔍 DEBUG - Segunda-feira na renderização:', {
        date: item.dateStr,
        value: item.value,
        hasData: item.hasData,
        shouldShowBar,
        displayValue,
        barHeight: barHeight.toFixed(1) + '%'
      });
    }
  });
  
  return true;
}

// Teste principal
console.log('📋 TESTE PRINCIPAL: Verificar solução completa');

// Dados de teste
const testDate = new Date(2025, 8, 1); // 01/09/2025
const mockTrainingSessions = [
  {
    id: 1,
    training_date: '2025-09-01T00:00:00.000Z',
    status: 'planned',
    title: 'Treino de Segunda',
    distance_km: 12.0,
    user_id: 'test-user'
  },
  {
    id: 2,
    training_date: '2025-09-02T00:00:00.000Z',
    status: 'planned',
    title: 'Treino de Terça',
    distance_km: 8.0,
    user_id: 'test-user'
  }
];

// 1. Testar getCurrentPeriod
console.log('\n📋 ETAPA 1: Testar getCurrentPeriod');
const period = getWeekPeriod(testDate);
console.log('📅 Período calculado:', {
  startDate: period.startDate.toISOString().split('T')[0],
  endDate: period.endDate.toISOString().split('T')[0],
  startDay: period.startDate.getDay(),
  endDay: period.endDate.getDay(),
  startDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period.startDate.getDay()],
  endDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][period.endDate.getDay()]
});

// 2. Testar processTrainingDataForChart
console.log('\n📋 ETAPA 2: Testar processTrainingDataForChart');
const chartData = processTrainingDataForChart(
  mockTrainingSessions,
  period.startDate,
  period.endDate,
  'planned',
  'distance_km'
);

console.log('📊 Dados processados para o gráfico:');
chartData.forEach(d => {
  console.log(`  - ${d.dateStr} (${d.dayName}): valor=${d.value}, hasData=${d.hasData}, hasSession=${d.hasSession}`);
});

// 3. Testar renderização
console.log('\n📋 ETAPA 3: Testar renderização');
const renderResult = simulateChartRendering(chartData);

// 4. Verificar segunda-feira
console.log('\n📋 ETAPA 4: Verificar segunda-feira');
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
console.log(`- 01/09 está no período: ${testDate >= period.startDate && testDate <= period.endDate ? 'SIM' : 'NÃO'}`);
console.log(`- Segunda-feira tem dados: ${mondayData && mondayData.hasData ? 'SIM' : 'NÃO'}`);
console.log(`- Gráfico deve renderizar: ${renderResult ? 'SIM' : 'NÃO'}`);

if (mondayData && mondayData.hasData && renderResult) {
  console.log('\n🎉 SUCESSO COMPLETO: A solução funcionou!');
  console.log('💡 Segunda-feira agora deve aparecer no gráfico!');
} else {
  console.log('\n❌ PROBLEMA: A solução não funcionou completamente');
  console.log('💡 Verificar se há dados no banco para 01/09/2025');
}
