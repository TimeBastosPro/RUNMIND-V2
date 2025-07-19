import React, { useState, useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import { Card } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-gifted-charts';
import { useCheckinStore } from '../../../stores/checkin';

// Todas as métricas disponíveis (bem-estar, treino, reflexão semanal)
const ALL_METRICS = [
  // Bem-estar (check-in)
  { label: 'Qualidade do Sono', value: 'sleep_quality', min: 1, max: 7, source: 'checkin' },
  { label: 'Dores Musculares', value: 'soreness', min: 1, max: 7, source: 'checkin' },
  { label: 'Motivação', value: 'motivation', min: 1, max: 5, source: 'checkin' },
  { label: 'Confiança', value: 'confidence', min: 1, max: 5, source: 'checkin' },
  { label: 'Foco', value: 'focus', min: 1, max: 5, source: 'checkin' },
  { label: 'Emocional', value: 'emocional', min: 1, max: 5, source: 'checkin' },
  // Reflexão semanal
  { label: 'Prazer/Diversão (Semanal)', value: 'enjoyment', min: 1, max: 10, source: 'weekly' },
  { label: 'Progresso Percebido (Semanal)', value: 'progress', min: 1, max: 10, source: 'weekly' },
  { label: 'Confiança Semanal', value: 'confidence_weekly', min: 1, max: 10, source: 'weekly' },
  // Treino realizado
  { label: 'Distância Realizada (km)', value: 'distance_km', min: 0, max: 42, source: 'training' },
  { label: 'Duração Realizada (min)', value: 'duration_minutes', min: 0, max: 300, source: 'training' },
  { label: 'Altimetria Realizada (m)', value: 'elevation_gain_meters', min: 0, max: 2000, source: 'training' },
  { label: 'PSE Realizado', value: 'perceived_effort', min: 1, max: 10, source: 'training' },
  // Treino planejado
  { label: 'Distância Planejada (km)', value: 'planned_distance_km', min: 0, max: 42, source: 'training' },
  { label: 'Duração Planejada (min)', value: 'planned_duration_minutes', min: 0, max: 300, source: 'training' },
  { label: 'Altimetria Planejada (m)', value: 'planned_elevation_gain_meters', min: 0, max: 2000, source: 'training' },
  { label: 'PSE Planejado', value: 'planned_perceived_effort', min: 1, max: 10, source: 'training' },
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

  // 4 métricas selecionadas, iniciando com as 4 primeiras
  const [selectedMetric1, setSelectedMetric1] = useState<string>(ALL_METRICS[0].value);
  const [selectedMetric2, setSelectedMetric2] = useState<string>(ALL_METRICS[1].value);
  const [selectedMetric3, setSelectedMetric3] = useState<string>(ALL_METRICS[2].value);
  const [selectedMetric4, setSelectedMetric4] = useState<string>(ALL_METRICS[3].value);

  useEffect(() => {
    loadRecentCheckins(90);
    loadWeeklyReflections();
    fetchTrainingSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const data1 = useMemo(() => getSeries(selectedMetric1), [selectedMetric1, recentCheckins, weeklyReflections, trainingSessions]);
  const data2 = useMemo(() => getSeries(selectedMetric2), [selectedMetric2, recentCheckins, weeklyReflections, trainingSessions]);
  const data3 = useMemo(() => getSeries(selectedMetric3), [selectedMetric3, recentCheckins, weeklyReflections, trainingSessions]);
  const data4 = useMemo(() => getSeries(selectedMetric4), [selectedMetric4, recentCheckins, weeklyReflections, trainingSessions]);

  const color1 = '#1976d2';
  const color2 = '#d32f2f';
  const color3 = '#388e3c';
  const color4 = '#fbc02d';

  // Legenda amigável
  function getLabel(val: string) {
    return ALL_METRICS.find((m) => m.value === val)?.label || val;
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#F5F5F5' }}>
      {/* 4 caixas de seleção de métricas */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, minWidth: 120 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Métrica 1</Text>
          <Picker selectedValue={selectedMetric1} onValueChange={setSelectedMetric1} style={{ backgroundColor: '#fff' }}>
            {ALL_METRICS.map((m) => (
              <Picker.Item key={m.value} label={m.label} value={m.value} />
            ))}
          </Picker>
        </View>
        <View style={{ flex: 1, minWidth: 120 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Métrica 2</Text>
          <Picker selectedValue={selectedMetric2} onValueChange={setSelectedMetric2} style={{ backgroundColor: '#fff' }}>
            {ALL_METRICS.map((m) => (
              <Picker.Item key={m.value} label={m.label} value={m.value} />
            ))}
          </Picker>
        </View>
        <View style={{ flex: 1, minWidth: 120 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Métrica 3</Text>
          <Picker selectedValue={selectedMetric3} onValueChange={setSelectedMetric3} style={{ backgroundColor: '#fff' }}>
            {ALL_METRICS.map((m) => (
              <Picker.Item key={m.value} label={m.label} value={m.value} />
            ))}
          </Picker>
        </View>
        <View style={{ flex: 1, minWidth: 120 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Métrica 4</Text>
          <Picker selectedValue={selectedMetric4} onValueChange={setSelectedMetric4} style={{ backgroundColor: '#fff' }}>
            {ALL_METRICS.map((m) => (
              <Picker.Item key={m.value} label={m.label} value={m.value} />
            ))}
          </Picker>
        </View>
      </View>
      {/* Card do gráfico multi-série */}
      <Card style={{ flex: 1, paddingVertical: 8 }}>
        <Card.Content style={{ paddingHorizontal: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
            Análise Cruzada
          </Text>
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <Text>Carregando dados...</Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 12, height: 12, backgroundColor: color1, borderRadius: 6, marginRight: 4 }} /><Text style={{ fontSize: 12 }}>{getLabel(selectedMetric1)}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 12, height: 12, backgroundColor: color2, borderRadius: 6, marginRight: 4 }} /><Text style={{ fontSize: 12 }}>{getLabel(selectedMetric2)}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 12, height: 12, backgroundColor: color3, borderRadius: 6, marginRight: 4 }} /><Text style={{ fontSize: 12 }}>{getLabel(selectedMetric3)}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 12, height: 12, backgroundColor: color4, borderRadius: 6, marginRight: 4 }} /><Text style={{ fontSize: 12 }}>{getLabel(selectedMetric4)}</Text></View>
              </View>
              <LineChart
                data={data1}
                data2={data2}
                data3={data3}
                data4={data4}
                color1={color1}
                color2={color2}
                color3={color3}
                color4={color4}
                height={220}
                width={undefined}
                yAxisLabelWidth={24}
                yAxisTextStyle={{ fontSize: 10 }}
                xAxisLabelTexts={data1?.map((d: any) => d.label) || []}
                hideDataPoints={false}
                areaChart={false}
                startFillColor={color1}
                endFillColor="#fff"
                startOpacity={0.2}
                endOpacity={0.05}
              />
            </>
          )}
        </Card.Content>
      </Card>
    </View>
  );
} 