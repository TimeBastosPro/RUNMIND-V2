// 🔍 TESTE ESPECÍFICO PARA DEBUGGING DE PROCESSAMENTO DE DADOS
// Execute este script no console do navegador

console.log('🚀 TESTE: Debugging de processamento de dados...');

// Simular dados de treino (como vêm do banco)
const mockTrainingSessions = [
  {
    id: '1',
    training_date: '2025-09-01',
    status: 'planned',
    distance_km: 12.0,
    title: 'Treino de Segunda'
  },
  {
    id: '2',
    training_date: '2025-09-02',
    status: 'planned',
    distance_km: 8.0,
    title: 'Treino de Terça'
  },
  {
    id: '3',
    training_date: '2025-09-03',
    status: 'planned',
    distance_km: 10.0,
    title: 'Treino de Quarta'
  },
  {
    id: '4',
    training_date: '2025-09-04',
    status: 'planned',
    distance_km: 10.0,
    title: 'Treino de Quinta'
  },
  {
    id: '5',
    training_date: '2025-09-05',
    status: 'planned',
    distance_km: 14.0,
    title: 'Treino de Sexta'
  },
  {
    id: '6',
    training_date: '2025-09-06',
    status: 'planned',
    distance_km: 13.0,
    title: 'Treino de Sábado'
  }
];

// Simular funções de processamento
function formatDateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateKey(dateString) {
  return dateString.split('T')[0];
}

function filterTrainingSessionsByPeriod(sessions, startDate, endDate) {
  return sessions.filter(session => {
    if (!session.training_date) return false;
    
    const sessionDateStr = session.training_date.split('T')[0];
    const sessionDate = new Date(sessionDateStr + 'T00:00:00.000Z');
    
    return sessionDate >= startDate && sessionDate <= endDate;
  });
}

function getPlannedTrainingSessions(sessions) {
  return sessions.filter(s => s.status === 'planned');
}

function getTrainingSessionsByDate(sessions) {
  const map = {};
  
  sessions.forEach(session => {
    const dateKey = getDateKey(session.training_date);
    map[dateKey] = session;
  });
  
  return map;
}

// Teste principal
console.log('\n📋 TESTE PRINCIPAL: Processamento de dados');

// 1. Dados de entrada
console.log('\n📅 ETAPA 1: Dados de entrada');
console.log('📊 Total de sessões:', mockTrainingSessions.length);
console.log('📊 Sessões de segunda-feira:', mockTrainingSessions.filter(s => s.training_date === '2025-09-01'));

// 2. Filtrar por período
console.log('\n📅 ETAPA 2: Filtrar por período');
const startDate = new Date('2025-09-01T00:00:00.000Z');
const endDate = new Date('2025-09-07T23:59:59.999Z');

console.log('📅 Período:', {
  startDate: formatDateToISO(startDate),
  endDate: formatDateToISO(endDate)
});

const filteredSessions = filterTrainingSessionsByPeriod(mockTrainingSessions, startDate, endDate);
console.log('📊 Sessões filtradas:', filteredSessions.length);
console.log('📊 Segunda-feira filtrada:', filteredSessions.find(s => s.training_date === '2025-09-01'));

// 3. Filtrar por tipo (planned)
console.log('\n📅 ETAPA 3: Filtrar por tipo (planned)');
const plannedSessions = getPlannedTrainingSessions(filteredSessions);
console.log('📊 Sessões planejadas:', plannedSessions.length);
console.log('📊 Segunda-feira planejada:', plannedSessions.find(s => s.training_date === '2025-09-01'));

// 4. Organizar por data
console.log('\n📅 ETAPA 4: Organizar por data');
const sessionsByDate = getTrainingSessionsByDate(plannedSessions);
console.log('📊 Chaves de data:', Object.keys(sessionsByDate));
console.log('📊 Segunda-feira por data:', sessionsByDate['2025-09-01']);

// 5. Processar cada data
console.log('\n📅 ETAPA 5: Processar cada data');
const dates = [];
const current = new Date(startDate);
while (current <= endDate) {
  dates.push(new Date(current));
  current.setDate(current.getDate() + 1);
}

dates.forEach(dateObj => {
  const dateStr = formatDateToISO(dateObj);
  const session = sessionsByDate[dateStr];
  
  if (dateObj.getDay() === 1) { // Segunda-feira
    console.log('🔍 DEBUG - Processando segunda-feira:', {
      dateStr,
      hasSession: !!session,
      sessionData: session ? {
        id: session.id,
        training_date: session.training_date,
        status: session.status,
        distance_km: session.distance_km
      } : null,
      sessionsByDateKeys: Object.keys(sessionsByDate)
    });
  }
});

// Diagnóstico final
console.log('\n🔍 DIAGNÓSTICO FINAL:');
const mondaySession = sessionsByDate['2025-09-01'];
const hasMondayData = !!mondaySession && mondaySession.distance_km > 0;

console.log(`- Segunda-feira tem sessão: ${!!mondaySession ? 'SIM' : 'NÃO'}`);
console.log(`- Segunda-feira tem dados: ${hasMondayData ? 'SIM' : 'NÃO'}`);
console.log(`- Valor de segunda-feira: ${mondaySession ? mondaySession.distance_km : 'N/A'}`);

if (hasMondayData) {
  console.log('\n🎉 SUCESSO: Dados de segunda-feira estão corretos!');
  console.log('💡 O problema pode estar na renderização do gráfico');
} else {
  console.log('\n❌ PROBLEMA: Dados de segunda-feira não estão sendo processados corretamente');
  console.log('💡 Verificar se há problemas no filtro ou organização de dados');
}
