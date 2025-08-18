import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { useCyclesStore } from '../stores/cycles';

export default function DebugMesociclosDisplay() {
  const { 
    macrociclos, 
    mesociclos, 
    fetchMacrociclos, 
    fetchMesociclos 
  } = useCyclesStore();
  
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const loadData = async () => {
      console.log('🔍 DEBUG - DebugMesociclosDisplay: Carregando dados...');
      await fetchMacrociclos();
      await fetchMesociclos();
    };
    
    loadData();
  }, [fetchMacrociclos, fetchMesociclos]);

  useEffect(() => {
    // Agrupar mesociclos por macrociclo
    const mesociclosByMacrociclo: Record<string, any[]> = {};
    
    macrociclos.forEach(macrociclo => {
      const mesociclosDoMacrociclo = mesociclos.filter(m => m.macrociclo_id === macrociclo.id);
      mesociclosByMacrociclo[macrociclo.id] = mesociclosDoMacrociclo;
    });

    setDebugInfo({
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
      }))
    });
  }, [macrociclos, mesociclos]);

  const handleRefresh = async () => {
    console.log('🔄 DEBUG - DebugMesociclosDisplay: Recarregando dados...');
    await fetchMacrociclos();
    await fetchMesociclos();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Debug - Mesociclos Display</Text>
      
      <Button mode="contained" onPress={handleRefresh} style={styles.button}>
        🔄 Recarregar Dados
      </Button>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>📊 Resumo</Text>
          <Text>Total Macrociclos: {debugInfo.totalMacrociclos || 0}</Text>
          <Text>Total Mesociclos: {debugInfo.totalMesociclos || 0}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>📅 Macrociclos</Text>
          {debugInfo.macrociclos?.map((m: any, index: number) => (
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
          {debugInfo.mesociclos?.map((m: any, index: number) => (
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
          {debugInfo.agrupamento?.map((agrup: any, index: number) => (
            <View key={agrup.macrocicloId} style={styles.item}>
              <Text style={styles.itemTitle}>{index + 1}. {agrup.macrocicloName}</Text>
              <Text style={styles.itemSubtitle}>Mesociclos: {agrup.mesociclosCount}</Text>
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
});
