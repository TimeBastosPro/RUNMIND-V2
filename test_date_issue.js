// 🔍 TESTE PARA VERIFICAR PROBLEMA DE DATA
// Testar se 2025-09-08 é realmente segunda-feira

console.log('🔍 TESTE DE DATA:');

// Teste 1: Criar data diretamente
const date1 = new Date('2025-09-08');
console.log('Data 1 (2025-09-08):', {
  date: date1.toISOString().split('T')[0],
  dayOfWeek: date1.getDay(),
  dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][date1.getDay()]
});

// Teste 2: Criar data com timezone explícito
const date2 = new Date('2025-09-08T00:00:00.000Z');
console.log('Data 2 (2025-09-08T00:00:00.000Z):', {
  date: date2.toISOString().split('T')[0],
  dayOfWeek: date2.getDay(),
  dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][date2.getDay()]
});

// Teste 3: Criar data local
const date3 = new Date(2025, 8, 8); // Mês é 0-indexed (8 = setembro)
console.log('Data 3 (new Date(2025, 8, 8)):', {
  date: date3.toISOString().split('T')[0],
  dayOfWeek: date3.getDay(),
  dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][date3.getDay()]
});

// Teste 4: Verificar se 2025-09-08 é realmente segunda-feira
console.log('🔍 VERIFICAÇÃO: 2025-09-08 é segunda-feira?');
console.log('Dia da semana esperado: 1 (Segunda)');
console.log('Dia da semana atual:', date1.getDay());
console.log('É segunda-feira?', date1.getDay() === 1);
