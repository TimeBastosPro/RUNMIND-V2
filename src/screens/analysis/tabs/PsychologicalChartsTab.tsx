// src/screens/analysis/tabs/PsychologicalChartsTab.tsx

import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { LineChart, PieChart } from 'react-native-gifted-charts'; // Usaremos PieChart para simular o Radar, que é mais complexo

// --- Dados de Exemplo (Mock Data) ---

const weeklyProfileData = [
  { value: 80, label: 'Confiança', color: '#673AB7' },
  { value: 70, label: 'Motivação', color: '#3F51B5' },
  { value: 60, label: 'Equilíbrio', color: '#2196F3' },
  { value: 40, label: 'Stress (inv)', color: '#00BCD4' }, // Stress invertido
];

const confidenceEvolution = [
  { value: 65, label: 'Sem 1' },
  { value: 70, label: 'Sem 2' },
  { value: 68, label: 'Sem 3' },
  { value: 80, label: 'Sem 4' },
];

const motivationEvolution = [
  { value: 75, label: 'Sem 1' },
  { value: 72, label: 'Sem 2' },
  { value: 78, label: 'Sem 3' },
  { value: 70, label: 'Sem 4' },
];


// --- Componente da Aba ---

export default function PsychologicalChartsTab() {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.chartTitle}>Perfil Psicológico Semanal</Text>
          {/* O Radar Chart não é nativo em muitas bibliotecas. Usamos um PieChart como um substituto visual eficaz. */}
          <View style={{ alignItems: 'center' }}>
            <PieChart
              data={weeklyProfileData}
              donut
              innerRadius={50}
              radius={100}
              showText
              textColor="black"
              textSize={12}
            />
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.chartTitle}>Evolução da Confiança e Motivação</Text>
          <LineChart
            data={confidenceEvolution}
            data2={motivationEvolution}
            height={200}
            color1="#673AB7"
            color2="#3F51B5"
            dataPointsColor1="#673AB7"
            dataPointsColor2="#3F51B5"
            yAxisTextStyle={{ color: 'gray' }}
          />
           <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#673AB7' }]} />
              <Text>Confiança</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#3F51B5' }]} />
              <Text>Motivação</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
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
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
}); 