// Script para testar a lógica de verificação de duplicatas
// Autor: Assistente
// Data: 2025-01-27

// Simular o estado atual de provas
const existingRaces = [
  {
    id: '1',
    event_name: 'Maratona de São Paulo',
    city: 'São Paulo',
    start_date: '2025-02-15',
    start_time: '08:00',
    distance_km: 42.2
  }
];

// Função de verificação de duplicatas (cópia da implementação atual)
function checkDuplicate(raceData, existingRaces) {
  console.log('=== TESTE DE VERIFICAÇÃO DE DUPLICATAS ===');
  console.log('Provas existentes:', existingRaces);
  console.log('Nova prova a ser salva:', raceData);
  
  const duplicateCheck = existingRaces.find(race => 
    race.event_name === raceData.event_name && 
    race.start_date === raceData.start_date &&
    race.city === raceData.city
  );
  
  if (duplicateCheck) {
    console.log('❌ DUPLICATA DETECTADA:', duplicateCheck);
    return true;
  } else {
    console.log('✅ NÃO É DUPLICATA - Pode salvar');
    return false;
  }
}

// Teste 1: Prova com dados diferentes (deve permitir)
console.log('\n--- TESTE 1: Prova com dados diferentes ---');
const novaProva1 = {
  event_name: 'Meia Maratona do Rio',
  city: 'Rio de Janeiro',
  start_date: '2025-03-20',
  start_time: '07:30',
  distance_km: 21.1
};
checkDuplicate(novaProva1, existingRaces);

// Teste 2: Prova com mesmo nome mas cidade diferente (deve permitir)
console.log('\n--- TESTE 2: Mesmo nome, cidade diferente ---');
const novaProva2 = {
  event_name: 'Maratona de São Paulo',
  city: 'Rio de Janeiro',
  start_date: '2025-02-15',
  start_time: '08:00',
  distance_km: 42.2
};
checkDuplicate(novaProva2, existingRaces);

// Teste 3: Prova com mesmo nome e cidade mas data diferente (deve permitir)
console.log('\n--- TESTE 3: Mesmo nome e cidade, data diferente ---');
const novaProva3 = {
  event_name: 'Maratona de São Paulo',
  city: 'São Paulo',
  start_date: '2025-04-15',
  start_time: '08:00',
  distance_km: 42.2
};
checkDuplicate(novaProva3, existingRaces);

// Teste 4: Prova idêntica (deve bloquear)
console.log('\n--- TESTE 4: Prova idêntica (deve bloquear) ---');
const novaProva4 = {
  event_name: 'Maratona de São Paulo',
  city: 'São Paulo',
  start_date: '2025-02-15',
  start_time: '08:00',
  distance_km: 42.2
};
checkDuplicate(novaProva4, existingRaces);

// Teste 5: Prova com diferenças mínimas (deve permitir)
console.log('\n--- TESTE 5: Diferenças mínimas ---');
const novaProva5 = {
  event_name: 'Maratona de São Paulo',
  city: 'São Paulo',
  start_date: '2025-02-15',
  start_time: '09:00', // Hora diferente
  distance_km: 42.2
};
checkDuplicate(novaProva5, existingRaces);

// Teste 6: Prova com nome ligeiramente diferente
console.log('\n--- TESTE 6: Nome ligeiramente diferente ---');
const novaProva6 = {
  event_name: 'Maratona Internacional de São Paulo',
  city: 'São Paulo',
  start_date: '2025-02-15',
  start_time: '08:00',
  distance_km: 42.2
};
checkDuplicate(novaProva6, existingRaces);

console.log('\n=== ANÁLISE DO PROBLEMA ===');
console.log('Se o problema é que não consegue salvar mais de uma prova:');
console.log('1. Verifique se a verificação de duplicatas está muito restritiva');
console.log('2. Verifique se há constraints únicas no banco de dados');
console.log('3. Verifique se há políticas RLS bloqueando inserções');
console.log('4. Verifique se há triggers interferindo');
console.log('5. Verifique se há problemas de permissão');

console.log('\n=== SUGESTÕES DE CORREÇÃO ===');
console.log('1. Se a verificação de duplicatas estiver muito restritiva, considere:');
console.log('   - Remover a verificação de cidade');
console.log('   - Adicionar tolerância de tempo (ex: mesma prova em horários diferentes)');
console.log('   - Permitir múltiplas provas com mesmo nome em datas diferentes');

console.log('2. Se for problema de banco de dados:');
console.log('   - Verificar constraints únicas');
console.log('   - Verificar políticas RLS');
console.log('   - Verificar triggers');

console.log('3. Para debug:');
console.log('   - Adicionar mais logs na função saveRace');
console.log('   - Verificar se o erro vem do Supabase ou da verificação local');
console.log('   - Testar inserção direta no banco de dados');
