import React from 'react';
import { ScrollView, View, Dimensions } from 'react-native';
import { Card, Text } from 'react-native-paper';
// import { useAnalyticsStore } from '../../../stores/analytics'; // Supondo que será usado futuramente
import { LineChart } from 'react-native-gifted-charts';

const screenWidth = Dimensions.get('window').width;

// Mock data para o gráfico de área empilhada
const wellbeingData = [
  { dia: 'Seg', sono: 7, fadiga: 2, stress: 3, dores: 1 },
  { dia: 'Ter', sono: 6, fadiga: 3, stress: 2, dores: 2 },
  { dia: 'Qua', sono: 8, fadiga: 1, stress: 2, dores: 1 },
  { dia: 'Qui', sono: 7, fadiga: 2, stress: 4, dores: 2 },
  { dia: 'Sex', sono: 6, fadiga: 3, stress: 3, dores: 3 },
  { dia: 'Sáb', sono: 7, fadiga: 2, stress: 2, dores: 1 },
  { dia: 'Dom', sono: 8, fadiga: 1, stress: 1, dores: 1 },
];

const areaChartData = [
  {
    data: wellbeingData.map((d, i) => ({ value: d.sono, label: wellbeingData[i].dia })),
    color: '#1976d2',
    label: 'Qualidade do Sono',
  },
  {
    data: wellbeingData.map((d, i) => ({ value: d.fadiga, label: wellbeingData[i].dia })),
    color: '#FFD600',
    label: 'Fadiga',
  },
  {
    data: wellbeingData.map((d, i) => ({ value: d.stress, label: wellbeingData[i].dia })),
    color: '#FF7043',
    label: 'Stress',
  },
  {
    data: wellbeingData.map((d, i) => ({ value: d.dores, label: wellbeingData[i].dia })),
    color: '#8BC34A',
    label: 'Dores Musculares',
  },
];

// Mock data para o gráfico de linha
const readinessData = [
  { value: 80, label: 'Seg' },
  { value: 72, label: 'Ter' },
  { value: 65, label: 'Qua' },
  { value: 90, label: 'Qui' },
  { value: 60, label: 'Sex' },
  { value: 55, label: 'Sáb' },
  { value: 40, label: 'Dom' },
];

function WellbeingChartsTab() {
  // const analytics = useAnalyticsStore(); // Para uso futuro
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card style={{ marginBottom: 24 }}>
        <Card.Title title="Componentes do Bem-Estar" />
        <Card.Content>
          <View>
            {areaChartData.map((serie, idx) => (
              <View key={serie.label} style={{ marginBottom: 16 }}>
                <Text style={{ color: serie.color, fontWeight: 'bold', marginBottom: 4 }}>{serie.label}</Text>
                <LineChart
                  data={serie.data}
                  width={screenWidth - 48}
                  height={120}
                  color={serie.color}
                  yAxisLabelWidth={24}
                  yAxisTextStyle={{ fontSize: 10 }}
                  xAxisLabelTexts={wellbeingData.map((d) => d.dia)}
                  hideDataPoints={false}
                  areaChart
                  startFillColor={serie.color}
                  endFillColor="#fff"
                  startOpacity={0.5}
                  endOpacity={0.1}
                />
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
      <Card>
        <Card.Title title="Índice de Prontidão RunMind" />
        <Card.Content>
          <View style={{ position: 'relative', width: screenWidth - 48, height: 220 }}>
            {/* Zonas coloridas de fundo */}
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} pointerEvents="none">
              <View style={{ flex: 1, backgroundColor: '#E8F5E9', opacity: 0.7 }} /> {/* Verde >75 */}
              <View style={{ position: 'absolute', left: 0, right: 0, top: '33%', bottom: '33%', backgroundColor: '#FFF9C4', opacity: 0.7 }} /> {/* Amarelo 50-75 */}
              <View style={{ position: 'absolute', left: 0, right: 0, top: '66%', bottom: 0, backgroundColor: '#FFEBEE', opacity: 0.7 }} /> {/* Vermelho <50 */}
            </View>
            <LineChart
              data={readinessData}
              width={screenWidth - 48}
              height={220}
              color="#1976d2"
              thickness={3}
              hideDataPoints={false}
              xAxisLabelTexts={readinessData.map((d) => d.label)}
              yAxisLabelWidth={24}
              yAxisTextStyle={{ fontSize: 10 }}
              areaChart
              startFillColor="#1976d2"
              endFillColor="#fff"
              startOpacity={0.1}
              endOpacity={0.01}
            />
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

export default WellbeingChartsTab; 