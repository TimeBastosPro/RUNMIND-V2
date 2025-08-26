// Teste simples da lógica de duplicatas
console.log('=== TESTE SIMPLES DE DUPLICATAS ===');

const existingRaces = [
  {
    event_name: 'Maratona de São Paulo',
    city: 'São Paulo',
    start_date: '2025-02-15'
  }
];

function checkDuplicate(raceData) {
  const duplicateCheck = existingRaces.find(race => 
    race.event_name === raceData.event_name && 
    race.start_date === raceData.start_date &&
    race.city === raceData.city
  );
  
  return !!duplicateCheck;
}

// Teste 1: Prova diferente
const prova1 = {
  event_name: 'Meia Maratona do Rio',
  city: 'Rio de Janeiro',
  start_date: '2025-03-20'
};
console.log('Prova 1 (diferente):', checkDuplicate(prova1) ? 'DUPLICATA' : 'OK');

// Teste 2: Prova idêntica
const prova2 = {
  event_name: 'Maratona de São Paulo',
  city: 'São Paulo',
  start_date: '2025-02-15'
};
console.log('Prova 2 (idêntica):', checkDuplicate(prova2) ? 'DUPLICATA' : 'OK');

// Teste 3: Mesmo nome, cidade diferente
const prova3 = {
  event_name: 'Maratona de São Paulo',
  city: 'Rio de Janeiro',
  start_date: '2025-02-15'
};
console.log('Prova 3 (mesmo nome, cidade diferente):', checkDuplicate(prova3) ? 'DUPLICATA' : 'OK');

console.log('=== FIM DO TESTE ===');
