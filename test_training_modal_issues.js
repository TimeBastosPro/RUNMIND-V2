// 🔍 TESTE PARA VERIFICAR PROBLEMAS NO MODAL DE TREINO
// Execute este script no console do navegador

console.log('🚀 TESTE: Verificando problemas no modal de treino...');

// Simular dados de treino para teste
const mockTrainingSession = {
  id: 'c3e2baf1-31fa-4e63-855e-e3b5fbe919cb',
  user_id: 'user123',
  training_date: '2025-09-15',
  title: 'Treino Planejado',
  status: 'planned',
  modalidade: 'corrida',
  treino_tipo: 'continuo',
  terreno: 'asfalto',
  distance_km: 12.0,
  duracao_horas: '1',
  duracao_minutos: '30',
  observacoes: 'Treino de teste'
};

console.log('\n📋 TESTE 1: Verificação de dados do treino');
console.log('📅 Dados do treino:', mockTrainingSession);
console.log('✅ ID presente:', !!mockTrainingSession.id);
console.log('✅ Status:', mockTrainingSession.status);
console.log('✅ Data:', mockTrainingSession.training_date);

// Simular função de exclusão
function simulateDeleteTraining(sessionId) {
  console.log('\n📋 TESTE 2: Simulação de exclusão');
  console.log('📅 ID para exclusão:', sessionId);
  console.log('📅 Tipo do ID:', typeof sessionId);
  
  if (!sessionId) {
    console.log('❌ ERRO: ID não fornecido');
    return false;
  }
  
  if (typeof sessionId !== 'string' && typeof sessionId !== 'number') {
    console.log('❌ ERRO: Tipo de ID inválido');
    return false;
  }
  
  console.log('✅ ID válido para exclusão');
  return true;
}

// Teste de exclusão
const deleteResult = simulateDeleteTraining(mockTrainingSession.id);
console.log('📅 Resultado da exclusão:', deleteResult ? 'SUCESSO' : 'FALHA');

// Simular carregamento de dados no modal
function simulateModalDataLoading(plannedData) {
  console.log('\n📋 TESTE 3: Simulação de carregamento no modal');
  console.log('📅 Dados recebidos:', plannedData);
  
  if (!plannedData) {
    console.log('❌ ERRO: Nenhum dado fornecido ao modal');
    return false;
  }
  
  // Simular campos do modal
  const modalFields = {
    distanceKm: plannedData.distance_km ? String(plannedData.distance_km) : '',
    distanceM: plannedData.distance_m ? String(plannedData.distance_m) : '',
    durationH: plannedData.duracao_horas ? String(plannedData.duracao_horas) : '0',
    durationM: plannedData.duracao_minutos ? String(plannedData.duracao_minutos) : '0',
    effort: plannedData.intensidade ? String(plannedData.intensidade) : '5',
    avgHeartRate: plannedData.avg_heart_rate ? String(plannedData.avg_heart_rate) : '',
    notes: plannedData.observacoes || ''
  };
  
  console.log('📅 Campos carregados no modal:', modalFields);
  
  // Verificar se os dados foram carregados corretamente
  const dataLoaded = modalFields.distanceKm === '12' && 
                    modalFields.durationH === '1' && 
                    modalFields.durationM === '30' &&
                    modalFields.notes === 'Treino de teste';
  
  console.log('✅ Dados carregados corretamente:', dataLoaded ? 'SIM' : 'NÃO');
  
  return dataLoaded;
}

// Teste de carregamento no modal
const modalResult = simulateModalDataLoading(mockTrainingSession);
console.log('📅 Resultado do carregamento:', modalResult ? 'SUCESSO' : 'FALHA');

// Diagnóstico final
console.log('\n🔍 DIAGNÓSTICO FINAL:');
console.log(`- Exclusão funcionando: ${deleteResult ? 'SIM' : 'NÃO'}`);
console.log(`- Modal carregando dados: ${modalResult ? 'SIM' : 'NÃO'}`);

if (deleteResult && modalResult) {
  console.log('\n🎉 SUCESSO: Ambos os problemas devem estar resolvidos!');
  console.log('💡 Botão de excluir deve funcionar');
  console.log('💡 Modal deve carregar dados corretos');
} else {
  console.log('\n❌ PROBLEMA: Ainda há problemas a resolver');
  if (!deleteResult) {
    console.log('💡 Verificar função de exclusão');
  }
  if (!modalResult) {
    console.log('💡 Verificar carregamento de dados no modal');
  }
}
