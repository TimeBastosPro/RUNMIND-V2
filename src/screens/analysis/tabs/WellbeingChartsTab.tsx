import React, { useEffect, useMemo } from 'react';
import { ScrollView, View, Dimensions } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';
import { useCheckinStore } from '../../../stores/checkin';
import type { UserAnalytics } from '../../../types/database';

const screenWidth = Dimensions.get('window').width;

// Adicione o tipo para weeklyWellbeing
interface WeeklyWellbeing {
  week: string;
  sono: number;
  fadiga: number;
  stress: number;
  dores: number;
}

export default function WellbeingChartsTab() {
  const analytics = useMemo(() => useCheckinStore.getState().calculateAnalytics() as (UserAnalytics & { weeklyWellbeing?: WeeklyWellbeing[] }), []);
  const weekly: WeeklyWellbeing[] = analytics?.weeklyWellbeing || [];

  useEffect(() => {
    // fetchTrainingSessions(); // This line was removed from the original file, so it's removed here.
  }, []);

  // Dados reais agregados
  // const weekly = analytics?.weeklyWellbeing || []; // This line is now redundant as weekly is declared above.

  // Montar dados para os gráficos
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const lastWeek = weekly.length ? weekly[weekly.length - 1] : null;
  const chartSeries = [
    {
      data: weekly.map((w: WeeklyWellbeing, i: number) => ({ value: w.sono, label: `Sem ${i + 1}` })),
      color: '#1976d2',
      label: 'Qualidade do Sono',
    },
    {
      data: weekly.map((w: WeeklyWellbeing, i: number) => ({ value: w.fadiga, label: `Sem ${i + 1}` })),
      color: '#FFD600',
      label: 'Fadiga',
    },
    {
      data: weekly.map((w: WeeklyWellbeing, i: number) => ({ value: w.stress, label: `Sem ${i + 1}` })),
      color: '#FF7043',
      label: 'Stress',
    },
    {
      data: weekly.map((w: WeeklyWellbeing, i: number) => ({ value: w.dores, label: `Sem ${i + 1}` })),
      color: '#8BC34A',
      label: 'Dores Musculares',
    },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card style={{ marginBottom: 24 }}>
        <Card.Title title="Componentes do Bem-Estar" />
        <Card.Content>
          <View>
            {chartSeries.map((serie, idx) => (
              <View key={serie.label} style={{ marginBottom: 16 }}>
                <Text style={{ color: serie.color, fontWeight: 'bold', marginBottom: 4 }}>{serie.label}</Text>
                <LineChart
                  data={serie.data}
                  width={screenWidth - 48}
                  height={120}
                  color={serie.color}
                  yAxisLabelWidth={24}
                  yAxisTextStyle={{ fontSize: 10 }}
                  xAxisLabelTexts={serie.data.map((d) => d.label)}
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
      {/* Exemplo de gráfico de prontidão pode ser adaptado para usar outros dados reais se necessário */}
      {/* O bloco abaixo foi removido pois 'data' não é uma propriedade válida para LineChart */}
      {/*
      <LineChart
        data={[
          {
            label: 'Sono',
            data: weekly.map((w: WeeklyWellbeing, i: number) => ({ value: w.sono, label: `Sem ${i + 1}` })),
          },
          {
            label: 'Fadiga',
            data: weekly.map((w: WeeklyWellbeing, i: number) => ({ value: w.fadiga, label: `Sem ${i + 1}` })),
          },
          {
            label: 'Estresse',
            data: weekly.map((w: WeeklyWellbeing, i: number) => ({ value: w.stress, label: `Sem ${i + 1}` })),
          },
          {
            label: 'Dores',
            data: weekly.map((w: WeeklyWellbeing, i: number) => ({ value: w.dores, label: `Sem ${i + 1}` })),
          },
        ]}
        xAxisLabelTexts={weekly.map((w: WeeklyWellbeing, i: number) => `Sem ${i + 1}`)}
      />
      */}
    </ScrollView>
  );
} 