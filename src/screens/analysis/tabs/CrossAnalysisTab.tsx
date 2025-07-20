import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Card, Chip, Button } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';
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
      <Card style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>
          Análise Cruzada
        </Text>
        
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Text>Carregando dados...</Text>
          </View>
        ) : !hasData ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
            <Text style={{ fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 8 }}>
              Selecione até 4 métricas acima
            </Text>
            <Text style={{ fontSize: 14, textAlign: 'center', color: '#999' }}>
              para começar a cruzar os dados!
            </Text>
          </View>
        ) : (
          <>
            {/* Legenda Integrada */}
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap', 
              gap: 12, 
              marginBottom: 16, 
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0'
            }}>
              {selectedMetrics.map((metricValue, index) => {
                const metric = ALL_METRICS.find(m => m.value === metricValue);
                const color = metric?.color || '#666';
                const isLeftAxis = index < 2;
                
                return (
                  <View key={metricValue} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ 
                      width: 12, 
                      height: 12, 
                      backgroundColor: color, 
                      borderRadius: 6 
                    }} />
                    <Text style={{ fontSize: 12, color: '#333', fontWeight: '500' }}>
                      {metric?.label}
                    </Text>
                    <View style={{ 
                      paddingHorizontal: 6, 
                      paddingVertical: 2, 
                      backgroundColor: isLeftAxis ? '#e3f2fd' : '#fff3e0',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isLeftAxis ? '#1976d2' : '#ff9800'
                    }}>
                      <Text style={{ 
                        fontSize: 10, 
                        color: isLeftAxis ? '#1976d2' : '#ff9800',
                        fontWeight: 'bold'
                      }}>
                        {isLeftAxis ? 'Eixo Y Esquerdo' : 'Eixo Y Direito'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Gráfico com Eixo Y Secundário */}
            <LineChart
              data={chartData.data}
              data2={chartData.data2}
              data3={chartData.data3}
              data4={chartData.data4}
              color1={getMetricColor(0)}
              color2={getMetricColor(1)}
              color3={getMetricColor(2)}
              color4={getMetricColor(3)}
              height={220}
              width={undefined}
              yAxisLabelWidth={24}
              yAxisTextStyle={{ fontSize: 10 }}
              xAxisLabelTexts={chartData.data?.map((d: any) => d.label) || []}
              hideDataPoints={false}
              areaChart={false}
              dataPointsColor={getMetricColor(0)}
              dataPointsRadius={4}
              dataPointsShape="circle"
                             // Eixo Y principal
               yAxisColor={getMetricColor(0)}
              pointerConfig={{
                pointerStripHeight: 180,
                pointerStripColor: '#666',
                pointerStripWidth: 1,
                pointerColor: '#666',
                radius: 4,
                pointerLabelWidth: 120,
                pointerLabelHeight: 100,
                activatePointersOnLongPress: false,
                autoAdjustPointerLabelPosition: false,
                pointerLabelComponent: (items: any) => {
                  return (
                    <View
                      style={{
                        height: 100,
                        width: 120,
                        justifyContent: 'center',
                        marginTop: -40,
                        marginLeft: -50,
                      }}>
                      <Text style={{ color: '#666', fontSize: 12, marginBottom: 4, textAlign: 'center' }}>
                        {items[0]?.label || ''}
                      </Text>
                      <View style={{ gap: 2 }}>
                        {items.map((item: any, index: number) => (
                          <View
                            key={index}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 8,
                              backgroundColor: item.color || '#666',
                              marginBottom: 2,
                            }}>
                            <View style={{ width: 8, height: 8, backgroundColor: '#fff', borderRadius: 4, marginRight: 6 }} />
                            <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>
                              {item.value?.toFixed(1) || '0'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                },
              }}
            />
          </>
        )}
      </Card>
    </View>
  );
} 