// 🔍 TESTE ESPECÍFICO PARA VERIFICAR CORREÇÃO DE ALTURA
// Execute este script no console do navegador

console.log('🚀 TESTE ESPECÍFICO: Verificando correção de altura...');

// Simular a lógica de altura corrigida
function testBarHeight() {
  console.log('🔧 DEBUG - Testando altura da barra...');
  
  // Dados de segunda-feira
  const mondayData = {
    date: '2025-09-01',
    value: 12.0,
    hasData: true
  };
  
  // Valores do gráfico
  const maxValue = 14; // Valor máximo do gráfico
  const displayValue = mondayData.value;
  
  // Lógica de altura ANTES da correção
  const oldBarHeight = Math.max((displayValue / maxValue) * 100, 2);
  
  // Lógica de altura DEPOIS da correção
  const newBarHeight = Math.max((displayValue / maxValue) * 100, 10);
  
  console.log('📊 Comparação de alturas:');
  console.log(`- Altura ANTES da correção: ${oldBarHeight.toFixed(1)}%`);
  console.log(`- Altura DEPOIS da correção: ${newBarHeight.toFixed(1)}%`);
  console.log(`- Diferença: ${(newBarHeight - oldBarHeight).toFixed(1)}%`);
  
  // Verificar se a correção é significativa
  const isSignificant = newBarHeight > oldBarHeight;
  console.log(`- Correção significativa: ${isSignificant ? 'SIM' : 'NÃO'}`);
  
  // Verificar se a barra deve ser visível
  const shouldBeVisible = newBarHeight >= 10;
  console.log(`- Barra deve ser visível: ${shouldBeVisible ? 'SIM' : 'NÃO'}`);
  
  // Simular renderização
  console.log('\n🎨 Simulação de renderização:');
  console.log(`- Altura da barra: ${newBarHeight.toFixed(1)}%`);
  console.log(`- Cor da barra: #4CAF50`);
  console.log(`- Largura da barra: 20px`);
  console.log(`- Border radius: 2px`);
  
  // Diagnóstico final
  console.log('\n🔍 DIAGNÓSTICO FINAL:');
  console.log(`- Altura mínima aplicada: ${newBarHeight >= 10 ? 'SIM' : 'NÃO'}`);
  console.log(`- Barra deve ser visível: ${shouldBeVisible ? 'SIM' : 'NÃO'}`);
  console.log(`- Correção aplicada: ${isSignificant ? 'SIM' : 'NÃO'}`);
  
  if (shouldBeVisible && isSignificant) {
    console.log('\n🎉 SUCESSO: A correção de altura deve funcionar!');
    console.log('💡 A barra de segunda-feira agora deve ser visível!');
  } else {
    console.log('\n❌ PROBLEMA: A correção de altura não é suficiente');
    console.log('💡 Verificar se há outros problemas de CSS');
  }
  
  return {
    oldHeight: oldBarHeight,
    newHeight: newBarHeight,
    isSignificant,
    shouldBeVisible
  };
}

// Executar teste
const result = testBarHeight();

// Teste adicional: verificar se há problemas de CSS
console.log('\n🔍 TESTE ADICIONAL: Verificar problemas de CSS');
console.log('💡 Se a barra ainda não aparecer, pode ser:');
console.log('- Problema de z-index');
console.log('- Problema de overflow');
console.log('- Problema de posicionamento');
console.log('- Problema de cor de fundo');
