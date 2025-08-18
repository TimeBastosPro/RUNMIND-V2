import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import { useCyclesStore } from '../../stores/cycles';

export default function TestMesociclosScreen() {
  const { 
    macrociclos, 
    mesociclos, 
    fetchMacrociclos, 
    fetchMesociclos 
  } = useCyclesStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 TEST - Carregando dados...');
      await fetchMacrociclos();
      await fetchMesociclos();
      
      // Aguardar um pouco para garantir que os dados foram carregados
      setTimeout(() => {
        analyzeData();
      }, 500);
    } catch (error) {
      console.error('❌ TEST - Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Falha ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeData = () => {
    console.log('🧪 TEST - Analisando dados...');
    
    // Agrupar mesociclos por macrociclo
    const mesociclosByMacrociclo: Record<string, any[]> = {};
    
    macrociclos.forEach(macrociclo => {
      const mesociclosDoMacrociclo = mesociclos.filter(m => m.macrociclo_id === macrociclo.id);
      mesociclosByMacrociclo[macrociclo.id] = mesociclosDoMacrociclo;
    });

    const results = {
      totalMacrociclos: macrociclos.length,
      totalMesociclos: mesociclos.length,
      macrociclos: macrociclos.map(m => ({
        id: m.id,
        name: m.name,
        start_date: m.start_date,
        end_date: m.end_date
      })),
      mesociclos: mesociclos.map(m => ({
        id: m.id,
        name: m.name,
        type: m.mesociclo_type,
        start_date: m.start_date,
        end_date: m.end_date,
        macrociclo_id: m.macrociclo_id
      })),
      agrupamento: Object.keys(mesociclosByMacrociclo).map(macrocicloId => ({
        macrocicloId,
        macrocicloName: macrociclos.find(m => m.id === macrocicloId)?.name,
        mesociclosCount: mesociclosByMacrociclo[macrocicloId].length,
        mesociclos: mesociclosByMacrociclo[macrocicloId].map(m => ({
          id: m.id,
          name: m.name,
          type: m.mesociclo_type
        }))
      })),
      problemas: []
    };

    // Verificar problemas
    if (mesociclos.length === 0) {
      results.problemas.push('Nenhum mesociclo encontrado');
    }

    const mesociclosSemMacrociclo = mesociclos.filter(m => !m.macrociclo_id);
    if (mesociclosSemMacrociclo.length > 0) {
      results.problemas.push(`${mesociclosSemMacrociclo.length} mesociclos sem macrociclo_id`);
    }

    const macrociclosSemMesociclos = macrociclos.filter(m => !mesociclosByMacrociclo[m.id] || mesociclosByMacrociclo[m.id].length === 0);
    if (macrociclosSemMesociclos.length > 0) {
      results.problemas.push(`${macrociclosSemMesociclos.length} macrociclos sem mesociclos`);
    }

    setTestResults(results);
    console.log('🧪 TEST - Resultados da análise:', results);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 Teste - Mesociclos</Text>
      
      <Button 
        mode="contained" 
        onPress={loadData} 
        loading={isLoading}
        style={styles.button}
      >
        🔄 Recarregar Dados
      </Button>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>📊 Resumo</Text>
          <Text>Total Macrociclos: {testResults.totalMacrociclos || 0}</Text>
          <Text>Total Mesociclos: {testResults.totalMesociclos || 0}</Text>
          
          {testResults.problemas && testResults.problemas.length > 0 && (
            <View style={styles.problemsContainer}>
              <Text style={styles.problemsTitle}>⚠️ Problemas Encontrados:</Text>
              {testResults.problemas.map((problema: string, index: number) => (
                <Text key={index} style={styles.problemText}>• {problema}</Text>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>📅 Macrociclos</Text>
          {testResults.macrociclos?.map((m: any, index: number) => (
            <View key={m.id} style={styles.item}>
              <Text style={styles.itemTitle}>{index + 1}. {m.name}</Text>
              <Text style={styles.itemSubtitle}>ID: {m.id}</Text>
              <Text style={styles.itemSubtitle}>{m.start_date} a {m.end_date}</Text>
            </View>
          )) || <Text>Nenhum macrociclo encontrado</Text>}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>📆 Mesociclos</Text>
          {testResults.mesociclos?.map((m: any, index: number) => (
            <View key={m.id} style={styles.item}>
              <Text style={styles.itemTitle}>{index + 1}. {m.name}</Text>
              <Text style={styles.itemSubtitle}>Tipo: {m.type}</Text>
              <Text style={styles.itemSubtitle}>Macrociclo ID: {m.macrociclo_id || 'N/A'}</Text>
              <Text style={styles.itemSubtitle}>{m.start_date} a {m.end_date}</Text>
            </View>
          )) || <Text>Nenhum mesociclo encontrado</Text>}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>🔗 Agrupamento</Text>
          {testResults.agrupamento?.map((agrup: any, index: number) => (
            <View key={agrup.macrocicloId} style={styles.item}>
              <Text style={styles.itemTitle}>{index + 1}. {agrup.macrocicloName}</Text>
              <Chip style={styles.chip}>
                {agrup.mesociclosCount} mesociclo{agrup.mesociclosCount > 1 ? 's' : ''}
              </Chip>
              {agrup.mesociclos.map((m: any, mIndex: number) => (
                <Text key={m.id} style={styles.itemSubsubtitle}>
                  • {m.name} ({m.type})
                </Text>
              ))}
            </View>
          )) || <Text>Nenhum agrupamento encontrado</Text>}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  item: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemSubsubtitle: {
    fontSize: 11,
    color: '#888',
    marginLeft: 8,
    marginTop: 1,
  },
  problemsContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
  },
  problemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  problemText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});
