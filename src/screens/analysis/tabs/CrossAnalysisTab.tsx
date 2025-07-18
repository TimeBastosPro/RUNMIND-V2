import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { BarChart } from 'react-native-gifted-charts';

// Dados de exemplo (mock data) para o gráfico de barras
const crossAnalysisData = [
  { value: 320, label: 'Seg' },
  { value: 450, label: 'Ter' },
  { value: 380, label: 'Qua' },
  { value: 500, label: 'Qui' },
  { value: 600, label: 'Sex' },
  { value: 420, label: 'Sáb' },
  { value: 300, label: 'Dom' },
];

export default function CrossAnalysisTab() {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.chartTitle}>Carga de Treino Semanal</Text>
          <BarChart
            data={crossAnalysisData}
            barWidth={32}
            barBorderRadius={8}
            frontColor="#1976d2"
            yAxisTextStyle={{ color: 'gray', fontSize: 12 }}
            height={220}
            noOfSections={5}
            spacing={24}
          />
          <View style={styles.legendContainer}>
            <View style={styles.legendBar} />
            <Text style={styles.legendText}>Carga de Treino (Volume x PSE)</Text>
          </View>
        </Card.Content>
      </Card>
      <Text style={styles.explanation}>
        Este gráfico mostra a carga de treino diária (Volume x PSE) ao longo da semana. Picos elevados podem indicar necessidade de atenção à recuperação. Busque manter uma distribuição equilibrada para evitar sobrecarga e reduzir risco de lesão.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  card: {
    marginBottom: 16,
  },
  chartTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  legendBar: {
    width: 24,
    height: 10,
    backgroundColor: '#1976d2',
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#222',
  },
  explanation: {
    fontSize: 14,
    color: '#444',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
}); 