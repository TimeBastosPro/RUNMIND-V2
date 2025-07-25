import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { Card, Chip, Button } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme, VictoryVoronoiContainer, VictoryTooltip } from 'victory';
import { useCheckinStore } from '../../../stores/checkin';

// Todas as métricas disponíveis (bem-estar, treino, reflexão semanal)
const ALL_METRICS = [
  // Bem-estar (check-in)
  { label: 'Qualidade do Sono', value: 'sleep_quality', min: 1, max: 7, source: 'checkin', color: '#1976d2' },
  { label: 'Dores Musculares', value: 'soreness', min: 1, max: 7, source: 'checkin', color: '#d32f2f' },
  { label: 'Motivação', value: 'motivation', min: 1, max: 5, source: 'checkin', color: '#388e3c' },
  { label: 'Confiança', value: 'confidence', min: 1, max: 5, source: 'checkin', color: '#fbc02d' },
  { label: 'Foco', value: 'focus', min: 1, max: 5, source: 'checkin', color: '#7b1fa2' },
  { label: 'Emocional', value: 'emocional', min: 1, max: 5, source: 'checkin', color: '#ff6f00' },
  // Reflexão semanal
  { label: 'Prazer/Diversão (Semanal)', value: 'enjoyment', min: 1, max: 10, source: 'weekly', color: '#0097a7' },
  { label: 'Progresso Percebido (Semanal)', value: 'progress', min: 1, max: 10, source: 'weekly', color: '#689f38' },
  { label: 'Confiança Semanal', value: 'confidence_weekly', min: 1, max: 10, source: 'weekly', color: '#ff8f00' },
  // Treino realizado
  { label: 'Distância Realizada (km)', value: 'distance_km', min: 0, max: 42, source: 'training', color: '#e91e63' },
  { label: 'Duração Realizada (min)', value: 'duration_minutes', min: 0, max: 300, source: 'training', color: '#3f51b5' },
  { label: 'Altimetria Realizada (m)', value: 'elevation_gain_meters', min: 0, max: 2000, source: 'training', color: '#795548' },
  { label: 'PSE Realizado', value: 'perceived_effort', min: 1, max: 10, source: 'training', color: '#607d8b' },
  // Treino planejado
  { label: 'Distância Planejada (km)', value: 'planned_distance_km', min: 0, max: 42, source: 'training', color: '#9c27b0' },
  { label: 'Duração Planejada (min)', value: 'planned_duration_minutes', min: 0, max: 300, source: 'training', color: '#ff5722' },
  { label: 'Altimetria Planejada (m)', value: 'planned_elevation_gain_meters', min: 0, max: 2000, source: 'training', color: '#4caf50' },
  { label: 'PSE Planejado', value: 'planned_perceived_effort', min: 1, max: 10, source: 'training', color: '#8bc34a' },
];

function formatDateLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function safeData(dataArray: any[]) {
  return (dataArray || []).filter(
    d => d && typeof d.value === 'number' && typeof d.label === 'string'
  );
}

export default function CrossAnalysisTab() {
  const {
    recentCheckins,
    weeklyReflections,
    trainingSessions,
    isLoading,
    loadRecentCheckins,
    loadWeeklyReflections,
    fetchTrainingSessions,
  } = useCheckinStore();

  // Estado para métricas selecionadas (máximo 4)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  useEffect(() => {
    loadRecentCheckins(90);
    loadWeeklyReflections();
    fetchTrainingSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função para alternar seleção de métrica
  const toggleMetric = (metricValue: string) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricValue)) {
        return prev.filter(m => m !== metricValue);
      } else if (prev.length < 4) {
        return [...prev, metricValue];
      }
      return prev;
    });
  };

  // Função para buscar e normalizar os dados de cada métrica
  function getSeries(metricValue: string) {
    const metric = ALL_METRICS.find((m) => m.value === metricValue);
    if (!metric) return [];
    let rawData: { value: number; date: string }[] = [];
    if (metric.source === 'checkin') {
      rawData = (recentCheckins || [])
        .filter((c) => c.date && (c as any)[metric.value] !== undefined && (c as any)[metric.value] !== null)
        .map((c) => ({ value: Number((c as any)[metric.value]), date: c.date }));
    } else if (metric.source === 'weekly') {
      rawData = (weeklyReflections || [])
        .filter((r) => r.week_start && ((r as any)[metric.value.replace('_weekly', '')] !== undefined && (r as any)[metric.value.replace('_weekly', '')] !== null))
        .map((r) => ({ value: Number((r as any)[metric.value.replace('_weekly', '')] ?? (r as any)[metric.value]), date: r.week_start }));
    } else if (metric.source === 'training') {
      rawData = (trainingSessions || [])
        .filter((t) => t.training_date && (t as any)[metric.value] !== undefined && (t as any)[metric.value] !== null)
        .map((t) => ({ value: Number((t as any)[metric.value]), date: t.training_date }));
    }
    // Normalizar para 0-100
    return rawData.map((d) => ({
      value: ((d.value - metric.min) / (metric.max - metric.min)) * 100,
      label: formatDateLabel(d.date),
      raw: d.value,
      date: d.date,
    }));
  }

  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    if (selectedMetrics.length === 0) return { data: [], data2: [], data3: [], data4: [] };
    
    const data1 = selectedMetrics[0] ? getSeries(selectedMetrics[0]) : [];
    const data2 = selectedMetrics[1] ? getSeries(selectedMetrics[1]) : [];
    const data3 = selectedMetrics[2] ? getSeries(selectedMetrics[2]) : [];
    const data4 = selectedMetrics[3] ? getSeries(selectedMetrics[3]) : [];
    
    return { data: data1, data2, data3, data4 };
  }, [selectedMetrics, recentCheckins, weeklyReflections, trainingSessions]);

  // Obter cores das métricas selecionadas
  const getMetricColor = (index: number) => {
    const metricValue = selectedMetrics[index];
    return ALL_METRICS.find(m => m.value === metricValue)?.color || '#666';
  };

  // Verificar se há dados para exibir
  const hasData = selectedMetrics.length > 0 && (
    chartData.data.length > 0 || 
    chartData.data2.length > 0 || 
    chartData.data3.length > 0 || 
    chartData.data4.length > 0
  );

  console.log('chartData', chartData);
  console.log('data', chartData.data);
  console.log('data2', chartData.data2);
  console.log('data3', chartData.data3);
  console.log('data4', chartData.data4);
  console.log('chartData.data FINAL', chartData.data);
  console.log('chartData.data2 FINAL', chartData.data2);
  console.log('chartData.data3 FINAL', chartData.data3);
  console.log('chartData.data4 FINAL', chartData.data4);
  console.log('recentCheckins RAW', recentCheckins);
  console.log('weeklyReflections RAW', weeklyReflections);
  console.log('trainingSessions RAW', trainingSessions);

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#F5F5F5' }}>
      {/* Painel de Seleção com Chips */}
      <Card style={{ marginBottom: 16, padding: 16 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>
          Selecione até 4 métricas ({selectedMetrics.length}/4)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ALL_METRICS.map((metric) => (
              <Chip
                key={metric.value}
                selected={selectedMetrics.includes(metric.value)}
                onPress={() => toggleMetric(metric.value)}
                style={{
                  backgroundColor: selectedMetrics.includes(metric.value) ? metric.color : '#f0f0f0',
                  borderColor: metric.color,
                  borderWidth: 1,
                }}
                textStyle={{
                  color: selectedMetrics.includes(metric.value) ? '#fff' : '#333',
                  fontSize: 12,
                }}
              >
                {metric.label}
              </Chip>
            ))}
          </View>
        </ScrollView>
      </Card>

      {/* Card do gráfico */}
      <Card style={{ flex: 1, padding: 8 }}>
        {/* Título fora do gráfico */}
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
          Análise Cruzada
        </Text>
        {(chartData && (chartData.data.length > 0 || chartData.data2.length > 0 || chartData.data3.length > 0 || chartData.data4.length > 0)) ? (
          <VictoryChart
            theme={VictoryTheme.material}
            domain={{ y: [0, 10] }}
            height={220}
            padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
            containerComponent={
              <VictoryVoronoiContainer
                labels={({ datum }) => `${datum.label}\n${datum.value}`}
                labelComponent={<VictoryTooltip cornerRadius={4} flyoutStyle={{ fill: '#fff' }} />}
              />
            }
          >
            <VictoryAxis
              dependentAxis
              tickValues={[0, 2, 4, 6, 8, 10]}
              style={{
                axis: { stroke: '#ccc' },
                ticks: { stroke: '#ccc', size: 5 },
                tickLabels: { fontSize: 12, fill: '#333' },
                grid: { stroke: '#eee' },
              }}
            />
            <VictoryAxis
              tickValues={chartData.data.map((d) => d.label)}
              style={{
                axis: { stroke: '#ccc' },
                ticks: { stroke: '#ccc', size: 5 },
                tickLabels: { fontSize: 12, fill: '#333', angle: 0, padding: 10 },
                grid: { stroke: 'none' },
              }}
            />
            {/* Renderizar até 4 linhas, cada uma com sua cor */}
            {['data', 'data2', 'data3', 'data4'].map((key, idx) =>
              chartData[key].length > 0 ? (
                <VictoryLine
                  key={key}
                  data={safeData(chartData[key])}
                  x="label"
                  y="value"
                  style={{
                    data: { stroke: getMetricColor(idx), strokeWidth: 2 },
                  }}
                  interpolation="monotoneX"
                />
              ) : null
            )}
          </VictoryChart>
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 32 }}>Sem dados para exibir.</Text>
        )}
      </Card>
    </View>
  );
} 