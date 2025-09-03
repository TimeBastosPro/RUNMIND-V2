// 🔍 TESTE PARA DEBUGAR INSIGHT DO DIA 01/09
// Execute este script no console do navegador

console.log('🚀 TESTE: Debugando insight do dia 01/09 que não aparece no gráfico...');

// Simular verificação dos dados
console.log('\n📋 TESTE 1: Verificação do problema identificado');

const problem = {
  description: 'Insight do dia 01/09 existe mas não aparece no gráfico',
  location: 'Aba Análise > Bem-estar > Qualidade do Sono',
  impact: 'Dados incompletos no gráfico',
  console: 'Dia 01/09 mostra apenas "-" em vez de barra'
};

console.log('📅 Problema:', problem.description);
console.log('📅 Localização:', problem.location);
console.log('📅 Impacto:', problem.impact);
console.log('📅 Console:', problem.console);

// Simular verificação dos dados
console.log('\n📋 TESTE 2: Verificação dos dados disponíveis');

// Verificar se os dados estão sendo carregados corretamente
const checkDataLoading = () => {
  try {
    // Verificar se o store está funcionando
    const checkinStore = window.__RUNMIND_STORE__?.checkin;
    if (!checkinStore) {
      console.log('❌ Store não encontrado');
      return false;
    }

    console.log('✅ Store encontrado:', checkinStore);

    // Verificar recentCheckins
    const recentCheckins = checkinStore.recentCheckins;
    console.log('📊 recentCheckins:', recentCheckins);

    if (recentCheckins && recentCheckins.length > 0) {
      // Filtrar insights do dia 01/09
      const insights0109 = recentCheckins.filter(c => {
        const checkinDate = new Date(c.date).toISOString().split('T')[0];
        return checkinDate === '2025-09-01';
      });

      console.log('🔍 Insights do dia 01/09:', insights0109);

      if (insights0109.length > 0) {
        console.log('✅ Dados encontrados para 01/09:', insights0109);
        
        // Verificar se tem dados de qualidade do sono
        insights0109.forEach((insight, index) => {
          console.log(`📊 Insight ${index + 1}:`, {
            date: insight.date,
            sleep_quality: insight.sleep_quality,
            soreness: insight.soreness,
            motivation: insight.motivation,
            confidence: insight.confidence,
            focus: insight.focus,
            emocional: insight.emocional
          });
        });
      } else {
        console.log('❌ Nenhum insight encontrado para 01/09');
      }
    } else {
      console.log('❌ recentCheckins vazio ou não definido');
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
    return false;
  }
};

// Simular verificação da função de filtro
console.log('\n📋 TESTE 3: Verificação da função de filtro');

const checkFilterFunction = () => {
  try {
    // Verificar se a função filterDataByPeriod está funcionando
    if (typeof window.filterDataByPeriod === 'function') {
      console.log('✅ Função filterDataByPeriod encontrada');
      
      // Testar com dados de exemplo
      const testData = [
        { date: '2025-09-01', sleep_quality: 5 },
        { date: '2025-09-02', sleep_quality: 6 },
        { date: '2025-09-03', sleep_quality: 4 }
      ];

      const startDate = new Date('2025-09-01');
      const endDate = new Date('2025-09-07');

      const filtered = window.filterDataByPeriod(testData, 'custom', startDate, endDate);
      console.log('🔍 Teste de filtro:', {
        dadosOriginais: testData,
        datasFiltro: { startDate, endDate },
        dadosFiltrados: filtered
      });
    } else {
      console.log('❌ Função filterDataByPeriod não encontrada');
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar função de filtro:', error);
    return false;
  }
};

// Simular verificação do período atual
console.log('\n📋 TESTE 4: Verificação do período atual');

const checkCurrentPeriod = () => {
  try {
    // Verificar se a função getCurrentPeriod está funcionando
    if (typeof window.getCurrentPeriod === 'function') {
      console.log('✅ Função getCurrentPeriod encontrada');
      
      const currentPeriod = window.getCurrentPeriod();
      console.log('📅 Período atual:', currentPeriod);
      
      if (currentPeriod && currentPeriod.startDate && currentPeriod.endDate) {
        const startDate = new Date(currentPeriod.startDate);
        const endDate = new Date(currentPeriod.endDate);
        
        console.log('🔍 Datas do período:', {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          startDateDay: startDate.toLocaleDateString('pt-BR', { weekday: 'long' }),
          endDateDay: endDate.toLocaleDateString('pt-BR', { weekday: 'long' })
        });
        
        // Verificar se 01/09 está dentro do período
        const date0109 = new Date('2025-09-01');
        const isInRange = date0109 >= startDate && date0109 <= endDate;
        
        console.log('🔍 01/09 está no período?', isInRange);
      }
    } else {
      console.log('❌ Função getCurrentPeriod não encontrada');
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar período atual:', error);
    return false;
  }
};

// NOVO TESTE: Verificar dados diretamente no componente
console.log('\n📋 TESTE 5: Verificação direta dos dados do componente');

const checkComponentData = () => {
  try {
    // Tentar acessar dados diretamente do componente React
    const reactRoot = document.querySelector('#root') || document.querySelector('[data-reactroot]');
    if (reactRoot) {
      console.log('✅ Root React encontrado');
      
      // Verificar se há algum estado ou dados visíveis
      const chartElements = document.querySelectorAll('[data-testid], [class*="chart"], [class*="bar"]');
      console.log('🔍 Elementos de gráfico encontrados:', chartElements.length);
      
      // Verificar se há dados sendo exibidos
      const dataElements = document.querySelectorAll('[class*="value"], [class*="data"], [class*="metric"]');
      console.log('🔍 Elementos de dados encontrados:', dataElements.length);
      
    } else {
      console.log('❌ Root React não encontrado');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar dados do componente:', error);
    return false;
  }
};

// NOVO TESTE: Verificar se há problemas de timezone
console.log('\n📋 TESTE 6: Verificação de timezone e datas');

const checkTimezoneIssues = () => {
  try {
    console.log('🔍 Verificando problemas de timezone...');
    
    // Testar diferentes formatos de data
    const testDates = [
      '2025-09-01',
      '2025-09-01T00:00:00.000Z',
      '2025-09-01T00:00:00.000-03:00',
      new Date('2025-09-01').toISOString(),
      new Date('2025-09-01').toLocaleDateString('pt-BR')
    ];
    
    console.log('📅 Formatos de data testados:', testDates);
    
    // Verificar se há diferença entre datas
    const date1 = new Date('2025-09-01');
    const date2 = new Date('2025-09-01T00:00:00.000Z');
    const date3 = new Date(2025, 8, 1); // Mês 8 = Setembro (0-indexed)
    
    console.log('🔍 Comparação de datas:', {
      date1: date1.toISOString(),
      date2: date2.toISOString(),
      date3: date3.toISOString(),
      date1Local: date1.toLocaleDateString('pt-BR'),
      date2Local: date2.toLocaleDateString('pt-BR'),
      date3Local: date3.toLocaleDateString('pt-BR')
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar timezone:', error);
    return false;
  }
};

// Executar todos os testes
console.log('\n🚀 EXECUTANDO TESTES...');

const results = {
  dataLoading: checkDataLoading(),
  filterFunction: checkFilterFunction(),
  currentPeriod: checkCurrentPeriod(),
  componentData: checkComponentData(),
  timezoneIssues: checkTimezoneIssues()
};

console.log('\n📊 RESULTADOS DOS TESTES:', results);

// Resumo final
console.log('\n🎯 RESUMO DO PROBLEMA:');
console.log('O insight do dia 01/09 existe no banco de dados, mas não está sendo exibido no gráfico.');
console.log('Possíveis causas:');
console.log('1. Problema na função de filtro por período');
console.log('2. Problema na comparação de datas');
console.log('3. Problema na renderização do gráfico');
console.log('4. Problema no carregamento dos dados do store');
console.log('5. Problema de timezone ou formato de data');

console.log('\n💡 PRÓXIMOS PASSOS:');
console.log('1. Verificar se os dados estão sendo filtrados corretamente');
console.log('2. Verificar se o período está sendo calculado corretamente');
console.log('3. Verificar se a renderização está funcionando');
console.log('4. Verificar se há problemas de timezone');
console.log('5. Implementar correção baseada nos resultados dos testes');

// NOVO: Tentar acessar dados diretamente do store global
console.log('\n🔍 TENTATIVA DE ACESSO DIRETO AO STORE:');

try {
  // Tentar diferentes formas de acessar o store
  const possibleStores = [
    window.__RUNMIND_STORE__,
    window.store,
    window.checkinStore,
    window.useCheckinStore,
    window.React?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
  ];
  
  console.log('🔍 Possíveis stores encontrados:', possibleStores.map((store, index) => ({
    index,
    exists: !!store,
    type: typeof store
  })));
  
  // Verificar se há algum estado global
  if (window.__RUNMIND_STORE__) {
    console.log('✅ Store global encontrado:', window.__RUNMIND_STORE__);
  } else {
    console.log('❌ Store global não encontrado');
  }
  
} catch (error) {
  console.error('❌ Erro ao tentar acessar store:', error);
}
