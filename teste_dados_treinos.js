// Teste para verificar dados de treinos
console.log('🔍 TESTE - Verificando dados de treinos...');

// Simular dados de treinos para teste
const mockTrainingSessions = [
  {
    id: 1,
    user_id: 'test-user',
    training_date: '2025-08-25',
    status: 'completed',
    distance_km: 8.5,
    duracao_horas: 1,
    duracao_minutos: 30,
    perceived_effort: 7,
    session_satisfaction: 4
  },
  {
    id: 2,
    user_id: 'test-user',
    training_date: '2025-08-26',
    status: 'completed',
    distance_km: 8.0,
    duracao_horas: 1,
    duracao_minutos: 15,
    perceived_effort: 6,
    session_satisfaction: 5
  },
  {
    id: 3,
    user_id: 'test-user',
    training_date: '2025-08-27',
    status: 'planned',
    distance_km: 10.0,
    duracao_horas: 1,
    duracao_minutos: 45,
    perceived_effort: 8,
    session_satisfaction: null
  }
];

// Testar cálculo da semana
const getCurrentPeriod = (currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const day = currentDate.getDate();
  
  // Início da semana (segunda-feira)
  const startOfWeek = new Date(year, month, day);
  const dayOfWeek = startOfWeek.getDay(); // 0 = domingo, 1 = segunda, etc.
  
  // Calcular diferença para segunda-feira
  let diff = 1 - dayOfWeek; // Para segunda-feira
  if (dayOfWeek === 0) diff = -6; // Se for domingo, voltar 6 dias
  
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Fim da semana (domingo)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return { startDate: startOfWeek, endDate: endOfWeek };
};

// Testar com data atual
const testDate = new Date('2025-08-29'); // Quinta-feira
const period = getCurrentPeriod(testDate);

console.log('🔍 TESTE - Cálculo da Semana:', {
  testDate: testDate.toISOString().split('T')[0],
  startOfWeek: period.startDate.toISOString().split('T')[0],
  endOfWeek: period.endDate.toISOString().split('T')[0],
  startWeekday: period.startDate.toLocaleDateString('pt-BR', { weekday: 'long' }),
  endWeekday: period.endDate.toLocaleDateString('pt-BR', { weekday: 'long' })
});

// Testar filtragem de dados
const filteredSessions = mockTrainingSessions.filter(session => {
  if (!session.training_date) return false;
  const sessionDate = new Date(session.training_date);
  return sessionDate >= period.startDate && sessionDate <= period.endDate;
});

console.log('🔍 TESTE - Sessões Filtradas:', {
  totalSessions: mockTrainingSessions.length,
  filteredSessions: filteredSessions.length,
  sessions: filteredSessions.map(s => ({
    date: s.training_date,
    status: s.status,
    distance: s.distance_km
  }))
});

// Testar separação por status
const completedSessions = filteredSessions.filter(s => s.status === 'completed');
const plannedSessions = filteredSessions.filter(s => s.status === 'planned');

console.log('🔍 TESTE - Separação por Status:', {
  completed: completedSessions.length,
  planned: plannedSessions.length,
  completedSessions: completedSessions.map(s => ({
    date: s.training_date,
    distance: s.distance_km
  })),
  plannedSessions: plannedSessions.map(s => ({
    date: s.training_date,
    distance: s.distance_km
  }))
});

// Testar cálculo da média
const distanceValues = completedSessions.map(s => s.distance_km || 0).filter(v => v > 0);
const averageDistance = distanceValues.length > 0 ? 
  distanceValues.reduce((sum, val) => sum + val, 0) / distanceValues.length : 0;

console.log('🔍 TESTE - Cálculo da Média:', {
  allDistanceValues: completedSessions.map(s => s.distance_km || 0),
  validDistanceValues: distanceValues,
  average: averageDistance,
  sum: distanceValues.reduce((sum, val) => sum + val, 0),
  count: distanceValues.length
});

console.log('✅ TESTE - Concluído!');
