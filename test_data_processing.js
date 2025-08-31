// 🔍 TESTE ESPECÍFICO PARA VERIFICAR PROCESSAMENTO DE DADOS
// Execute este script no console do navegador

console.log('🚀 TESTE ESPECÍFICO: Verificando processamento de dados...');

// Simular a função processTrainingDataForChart
function processTrainingDataForChart(trainingSessions, startDate, endDate, analysisType, metricField) {
  console.log('🔧 DEBUG - processTrainingDataForChart chamada com:', {
    sessionsCount: trainingSessions.length,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    analysisType,
    metricField
  });

  // Filtrar treinos por período
  const filteredSessions = trainingSessions.filter(session => {
    if (!session.training_date) return false;
    
    const sessionDateStr = session.training_date.split('T')[0];
    const sessionDate = new Date(sessionDateStr + 'T00:00:00.000Z');
    
    return sessionDate >= startDate && sessionDate <= endDate;
  });

  console.log('🔧 DEBUG - Sessões filtradas por período:', filteredSessions.length);

  // Filtrar por tipo de análise
  const sessionsByType = analysisType === 'planned' 
    ? filteredSessions.filter(t => t.status === 'planned')
    : filteredSessions.filter(t => t.status === 'completed');

  console.log('🔧 DEBUG - Sessões filtradas por tipo:', sessionsByType.length);

  // Mapear por data
  const sessionsByDate = {};
  sessionsByType.forEach(t => {
    const dateKey = t.training_date.split('T')[0];
    sessionsByDate[dateKey] = t;
  });

  console.log('🔧 DEBUG - Sessões mapeadas por data:', Object.keys(sessionsByDate));

  // Gerar datas do período
  const dates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  console.log('🔧 DEBUG - Datas geradas:', dates.map(d => d.toISOString().split('T')[0]));

  // Processar dados para cada data
  const result = dates.map(dateObj => {
    const dateStr = dateObj.toISOString().split('T')[0];
    const session = sessionsByDate[dateStr];
    
    let value = 0;
    let hasData = false;
    
    if (session) {
      const fieldValue = session[metricField];
      
      console.log('🔧 DEBUG - Processando sessão para', dateStr, ':', {
        fieldValue,
        fieldType: typeof fieldValue,
        isNumber: typeof fieldValue === 'number',
        isString: typeof fieldValue === 'string'
      });
      
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

  console.log('🔧 DEBUG - Resultado final:', result.map(r => ({
    date: r.dateStr,
    dayName: r.dayName,
    value: r.value,
    hasData: r.hasData,
    hasSession: r.hasSession
  })));

  return result;
}

// Teste 1: Simular dados reais
console.log('📋 TESTE 1: Simular dados reais');
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
  },
  {
    id: 3,
    training_date: '2025-09-03T00:00:00.000Z',
    status: 'planned',
    title: 'Treino de Quarta',
    distance_km: 10.0,
    user_id: 'test-user'
  }
];

// Teste 2: Simular período correto
console.log('\n📋 TESTE 2: Simular período correto');
const startDate = new Date('2025-09-01T00:00:00.000Z');
const endDate = new Date('2025-09-07T23:59:59.999Z');

console.log('📅 Período:', {
  startDate: startDate.toISOString().split('T')[0],
  endDate: endDate.toISOString().split('T')[0],
  startDay: startDate.getDay(),
  endDay: endDate.getDay(),
  startDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][startDate.getDay()],
  endDayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][endDate.getDay()]
});

// Teste 3: Processar dados
console.log('\n📋 TESTE 3: Processar dados');
const chartData = processTrainingDataForChart(
  mockTrainingSessions,
  startDate,
  endDate,
  'planned',
  'distance_km'
);

// Teste 4: Verificar segunda-feira
console.log('\n📋 TESTE 4: Verificar segunda-feira');
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

// Teste 5: Verificar renderização
console.log('\n📋 TESTE 5: Verificar renderização');
const hasData = chartData.some(d => d.hasData);
const dataLength = chartData.length;

console.log('📊 Condições de renderização:', {
  dataLength,
  hasData,
  shouldRender: dataLength > 0 && hasData
});

// Teste 6: Verificar cada item individualmente
console.log('\n📋 TESTE 6: Verificar cada item individualmente');
chartData.forEach((item, index) => {
  const shouldShowBar = item.hasData;
  const displayValue = item.value || 0;
  
  console.log(`  ${index + 1}. ${item.dateStr} (${item.dayName}):`, {
    value: item.value,
    hasData: item.hasData,
    hasSession: item.hasSession,
    shouldShowBar,
    displayValue
  });
  
  // Debug específico para segundas-feiras
  if (item.date.getDay() === 1) {
    console.log('🔍 DEBUG - Segunda-feira na renderização:', {
      date: item.dateStr,
      value: item.value,
      hasData: item.hasData,
      shouldShowBar,
      displayValue
    });
  }
});

// Diagnóstico final
console.log('\n🔍 DIAGNÓSTICO FINAL:');
console.log(`- Dados de treinos: ${mockTrainingSessions.length} registros`);
console.log(`- Datas geradas: ${chartData.length}`);
console.log(`- Segunda-feira tem dados: ${mondayData && mondayData.hasData ? 'SIM' : 'NÃO'}`);
console.log(`- Gráfico deve renderizar: ${hasData ? 'SIM' : 'NÃO'}`);

if (mondayData && mondayData.hasData) {
  console.log('\n🎉 SUCESSO: A função processTrainingDataForChart está funcionando!');
  console.log('💡 O problema pode estar na renderização do componente de gráfico');
} else {
  console.log('\n❌ PROBLEMA: A função processTrainingDataForChart não está funcionando');
  console.log('💡 Verificar se há dados no banco para 01/09/2025');
}
