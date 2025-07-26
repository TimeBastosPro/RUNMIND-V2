// Arquivo de teste para verificar se a IA está funcionando
import { generateInsight } from '../services/gemini';

export async function testInsightGeneration() {
  try {
    console.log('🧪 Testando geração de insight...');
    
    // Dados de teste
    const testData = {
      context_type: 'solo',
      last_checkin: {
        sleep_quality: 6,
        soreness: 3,
        motivation: 4,
        confidence: 4,
        focus: 3,
        emocional: 4
      },
      planned_training: {
        training_type: 'Rodagem',
        distance_km: 10,
        duration_minutes: 60
      },
      recent_checkins: [
        { motivation: 4, soreness: 3 },
        { motivation: 5, soreness: 2 },
        { motivation: 3, soreness: 4 }
      ],
      recent_trainings: [
        { training_type: 'Rodagem', distance_km: 8, duration_minutes: 45 },
        { training_type: 'Intervalado', distance_km: 5, duration_minutes: 30 }
      ]
    };

    console.log('📊 Dados de teste:', JSON.stringify(testData, null, 2));
    
    const insight = await generateInsight(testData);
    
    console.log('✅ Insight gerado com sucesso!');
    console.log('💡 Insight:', insight);
    
    return insight;
  } catch (error) {
    console.error('❌ Erro ao testar geração de insight:', error);
    throw error;
  }
}

// Função para testar diferentes cenários
export async function testMultipleScenarios() {
  const scenarios = [
    {
      name: 'Atleta bem recuperado',
      data: {
        context_type: 'solo',
        last_checkin: {
          sleep_quality: 8,
          soreness: 2,
          motivation: 5,
          confidence: 5,
          focus: 4,
          emocional: 5
        },
        planned_training: {
          training_type: 'Intervalado',
          distance_km: 8,
          duration_minutes: 45
        }
      }
    },
    {
      name: 'Atleta fadigado',
      data: {
        context_type: 'solo',
        last_checkin: {
          sleep_quality: 5,
          soreness: 6,
          motivation: 2,
          confidence: 3,
          focus: 2,
          emocional: 3
        },
        planned_training: {
          training_type: 'Regenerativo',
          distance_km: 5,
          duration_minutes: 30
        }
      }
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n🧪 Testando cenário: ${scenario.name}`);
    try {
      const insight = await generateInsight(scenario.data);
      console.log(`✅ ${scenario.name}:`, insight);
    } catch (error) {
      console.error(`❌ Erro no cenário ${scenario.name}:`, error);
    }
  }
} 