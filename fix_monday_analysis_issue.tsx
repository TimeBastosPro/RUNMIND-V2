// CORREÇÃO PARA O PROBLEMA DA SEGUNDA-FEIRA NA ANÁLISE
// Este arquivo contém as correções necessárias para o TrainingChartsTab.tsx

// PROBLEMA IDENTIFICADO:
// A segunda-feira (01/09) não está aparecendo no gráfico de análise
// Possíveis causas:
// 1. Problema na lógica de filtro de dados
// 2. Problema na comparação de datas
// 3. Problema na geração das datas da semana

// CORREÇÕES NECESSÁRIAS:

// 1. CORRIGIR A LÓGICA DE FILTRO DE DADOS
// No arquivo src/screens/analysis/tabs/TrainingChartsTab.tsx, linha ~270

// ANTES (PROBLEMÁTICO):
const filteredSessions = filterDataByPeriod(trainingSessions, periodType, startDate, endDate);

// DEPOIS (CORRIGIDO):
const filteredSessions = trainingSessions.filter(session => {
  if (!session.training_date) return false;
  
  const sessionDate = new Date(session.training_date);
  if (isNaN(sessionDate.getTime())) return false;
  
  // Normalizar datas para comparação (remover horas)
  const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
  const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  
  return sessionDateOnly >= startDateOnly && sessionDateOnly <= endDateOnly;
});

// 2. ADICIONAR DEBUG ESPECÍFICO PARA SEGUNDA-FEIRA
// Adicionar após a linha ~320 no TrainingChartsTab.tsx

// Debug específico para segunda-feira
if (selectedAnalysis === 'planned') {
  console.log('🔍 DEBUG - Verificando segunda-feira (01/09):');
  
  // Verificar se há dados para 01/09
  const mondaySessions = trainingSessions.filter(s => {
    const sessionDate = new Date(s.training_date);
    const sessionDateStr = sessionDate.toISOString().split('T')[0];
    return sessionDateStr === '2025-09-01';
  });
  
  console.log('🔍 DEBUG - Sessões encontradas para 01/09:', mondaySessions.length);
  mondaySessions.forEach(s => {
    console.log(`  - Sessão ${s.id}: ${s.title} (${s.status}) - Distância: ${s.distance_km}km`);
  });
  
  // Verificar se as sessões passaram pelo filtro
  const mondayFilteredSessions = filteredSessions.filter(s => {
    const sessionDate = new Date(s.training_date);
    const sessionDateStr = sessionDate.toISOString().split('T')[0];
    return sessionDateStr === '2025-09-01';
  });
  
  console.log('🔍 DEBUG - Sessões filtradas para 01/09:', mondayFilteredSessions.length);
  
  // Verificar as datas de início e fim do período
  console.log('🔍 DEBUG - Período calculado:', {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    startDateDay: startDate.getDay(), // 0=domingo, 1=segunda, etc.
    endDateDay: endDate.getDay()
  });
}

// 3. CORRIGIR A LÓGICA DE GERAÇÃO DE DATAS DA SEMANA
// Verificar se a função generateWeekDates está funcionando corretamente

// Adicionar debug na linha ~330:
console.log('🔍 DEBUG - Datas geradas para a semana:', allDatesInPeriod.map(d => ({
  date: d.toISOString().split('T')[0],
  day: d.getDay(),
  dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][d.getDay()]
})));

// 4. CORRIGIR A LÓGICA DE COMPARAÇÃO DE DATAS
// Na linha ~370, verificar se a comparação está funcionando:

// ANTES (PODE ESTAR PROBLEMÁTICO):
const sessionsForDay = filteredSessions.filter(s => {
  const sessionDateStr = dateToISOString(new Date(s.training_date));
  return sessionDateStr === dateStr;
});

// DEPOIS (MAIS ROBUSTO):
const sessionsForDay = filteredSessions.filter(s => {
  if (!s.training_date) return false;
  
  const sessionDate = new Date(s.training_date);
  if (isNaN(sessionDate.getTime())) return false;
  
  const sessionDateStr = dateToISOString(sessionDate);
  const isMatch = sessionDateStr === dateStr;
  
  // Debug específico para segunda-feira
  if (dateStr === '2025-09-01') {
    console.log(`🔍 DEBUG - Comparando datas para 01/09:`, {
      dateStr,
      sessionDateStr,
      isMatch,
      sessionId: s.id,
      sessionTrainingDate: s.training_date,
      sessionStatus: s.status,
      distance_km: s.distance_km
    });
  }
  
  return isMatch;
});

// 5. VERIFICAR SE O PROBLEMA ESTÁ NA FUNÇÃO dateToISOString
// Adicionar debug na função dateToISOString:

export function dateToISOString(date: Date): string {
  const result = date.toISOString().split('T')[0];
  
  // Debug para segunda-feira
  if (result === '2025-09-01') {
    console.log('🔍 DEBUG - dateToISOString para 01/09:', {
      inputDate: date,
      result: result,
      dayOfWeek: date.getDay()
    });
  }
  
  return result;
}

// 6. VERIFICAR SE O PROBLEMA ESTÁ NA FUNÇÃO getWeekStart
// Adicionar debug na função getWeekStart:

export function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  const dayOfWeek = weekStart.getDay();
  
  let daysToMonday: number;
  if (dayOfWeek === 0) {
    daysToMonday = 6;
  } else {
    daysToMonday = dayOfWeek - 1;
  }
  
  weekStart.setDate(weekStart.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  // Debug para segunda-feira
  if (weekStart.toISOString().split('T')[0] === '2025-09-01') {
    console.log('🔍 DEBUG - getWeekStart calculou 01/09:', {
      inputDate: date,
      dayOfWeek: dayOfWeek,
      daysToMonday: daysToMonday,
      result: weekStart.toISOString().split('T')[0]
    });
  }
  
  return weekStart;
}

// 7. VERIFICAR SE HÁ PROBLEMA NO STORE DE DADOS
// Adicionar debug no useCheckinStore para verificar se os dados estão sendo carregados corretamente:

// No arquivo src/stores/checkin.ts, na função fetchTrainingSessions:
console.log('🔍 DEBUG - Dados carregados do banco:', {
  totalSessions: data?.length || 0,
  sessionsForWeek: data?.filter(s => {
    const sessionDate = new Date(s.training_date);
    return sessionDate >= new Date('2025-09-01') && sessionDate <= new Date('2025-09-07');
  }).length || 0,
  mondaySessions: data?.filter(s => {
    const sessionDate = new Date(s.training_date);
    return sessionDate.toISOString().split('T')[0] === '2025-09-01';
  }).length || 0
});

// 8. VERIFICAR SE HÁ PROBLEMA NO RLS (ROW LEVEL SECURITY)
// Verificar se as políticas de RLS estão bloqueando o acesso aos dados de segunda-feira

// Executar no Supabase:
// SELECT * FROM training_sessions WHERE training_date = '2025-09-01';
// Verificar se retorna dados quando executado diretamente no banco

// 9. SOLUÇÃO TEMPORÁRIA
// Se o problema persistir, adicionar uma verificação manual:

// Adicionar após a linha ~520 no TrainingChartsTab.tsx:
// Verificação manual para segunda-feira
const mondayData = metricData.find(d => d.date.toISOString().split('T')[0] === '2025-09-01');
if (!mondayData || mondayData.value === 0) {
  console.log('🚨 ALERTA - Segunda-feira não tem dados no gráfico!');
  
  // Tentar encontrar dados manualmente
  const mondaySessions = trainingSessions.filter(s => {
    const sessionDate = new Date(s.training_date);
    return sessionDate.toISOString().split('T')[0] === '2025-09-01';
  });
  
  if (mondaySessions.length > 0) {
    console.log('🚨 ALERTA - Encontrados dados para segunda-feira no store, mas não no gráfico!');
    console.log('🚨 ALERTA - Dados encontrados:', mondaySessions);
  }
}
