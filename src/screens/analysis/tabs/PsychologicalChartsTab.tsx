// src/screens/analysis/tabs/PsychologicalChartsTab.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text } from 'react-native';
import { Card, SegmentedButtons, Button } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';
import { Picker } from '@react-native-picker/picker';
import { useCheckinStore } from '../../../stores/checkin';

const TRAINING_METRICS = [
  { label: 'Distância (km)', value: 'distance_km' },
  { label: 'Duração (min)', value: 'duration_minutes' },
  { label: 'Altimetria (m)', value: 'elevation_gain_meters' },
  { label: 'Percepção de Esforço (PSE)', value: 'perceived_effort' },
] as const;

type TrainingMetricKey = typeof TRAINING_METRICS[number]['value'];
type ChartDatum = { value: number; label: string; date?: string };
type TrainingSession = {
  training_date: string;
  distance_km?: number;
  duration_minutes?: number;
  elevation_gain_meters?: number;
  perceived_effort?: number;
  status?: 'completed' | 'planned';
  planned_distance_km?: number;
  planned_duration_minutes?: number;
  planned_elevation_gain_meters?: number;
  planned_perceived_effort?: number;
  [key: string]: any;
};
function formatDateLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
function getPeriodRange(center: Date, days: number) {
  const start = new Date(center);
  start.setDate(center.getDate() - days);
  const end = new Date(center);
  end.setDate(center.getDate() + days);
  return { start, end };
}
export default function PsychologicalChartsTab() {
  // Métricas planejadas e realizadas
  const plannedMetrics = [
    { label: 'Modalidade', value: 'planned_modality' },
    { label: 'Esforço', value: 'planned_effort' },
    { label: 'Percurso', value: 'planned_route' },
    { label: 'Terreno', value: 'planned_terrain' },
    { label: 'Tipo de Treino', value: 'planned_type' },
    { label: 'Duração', value: 'planned_duration_min' },
    { label: 'Zona de Treino', value: 'planned_training_zone' },
  ];
  const realizedMetrics = [
    { label: 'Duração', value: 'realized_duration_min' },
    { label: 'Altimetria', value: 'realized_elevation_m' },
    { label: 'FC Média', value: 'realized_avg_hr' },
    { label: 'PSE', value: 'realized_pse' },
    { label: 'Satisfação', value: 'realized_satisfaction' },
    { label: 'Sensação Geral', value: 'realized_general_feeling' },
    { label: 'Clima', value: 'realized_weather' },
  ];

  const [dataType, setDataType] = useState<'realizado' | 'planejado'>('realizado');
  const [selectedMetric, setSelectedMetric] = useState<string>(realizedMetrics[0].value);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { trainingSessions, fetchTrainingSessions, calculateWeeklyAverages, isLoading } = useCheckinStore();

  // Atualiza o selectedMetric ao trocar dataType
  useEffect(() => {
    setSelectedMetric(dataType === 'planejado' ? plannedMetrics[0].value : realizedMetrics[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataType]);

  useEffect(() => {
    fetchTrainingSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navegação de período
  const daysRange = 6; // 6 dias antes e 6 depois (13 dias)
  const { start, end } = getPeriodRange(currentDate, daysRange);
  const periodLabel = `${formatDateLabel(start.toISOString())} a ${formatDateLabel(end.toISOString())}`;

  // Mapear métricas para colunas do banco
  const metricColumnMap: Record<string, string> = {
    // Planejado
    planned_modality: 'planned_modality',
    planned_effort: 'planned_effort',
    planned_route: 'planned_route',
    planned_terrain: 'planned_terrain',
    planned_type: 'planned_type',
    planned_duration_min: 'planned_duration_min',
    planned_training_zone: 'planned_training_zone',
    // Realizado
    realized_duration_min: 'duration_minutes',
    realized_elevation_m: 'elevation_gain_meters',
    realized_avg_hr: 'avg_heart_rate',
    realized_pse: 'perceived_effort',
    realized_satisfaction: 'satisfaction',
    realized_general_feeling: 'general_feeling',
    realized_weather: 'weather',
  };

  // Lógica do gráfico dinâmico (memoizada)
  const chartData = useMemo(() => {
    if (isLoading) return [];
    const metricKey = metricColumnMap[selectedMetric];
    let data: ChartDatum[] = (trainingSessions as TrainingSession[])
      .filter((s) =>
        s.training_date &&
        s[metricKey] !== undefined &&
        s[metricKey] !== null &&
        (dataType === 'realizado' ? s.status === 'completed' : s.status === 'planned')
      )
      .map((s) => ({
        value: Number(s[metricKey]),
        label: formatDateLabel(s.training_date),
        date: s.training_date,
      }));
    if (viewMode === 'weekly') {
      data = calculateWeeklyAverages(data.filter((d): d is ChartDatum & { date: string } => !!d.date));
    } else {
      data = data.filter((d) => {
        if (!d.date) return false;
        const dDate = new Date(d.date);
        return dDate >= start && dDate <= end;
      });
    }
    data = data.filter((d) => typeof d.value === 'number' && !isNaN(d.value));
    return data;
  }, [selectedMetric, isLoading, trainingSessions, viewMode, currentDate, calculateWeeklyAverages, start, end, dataType]);

  const optionsToShow = dataType === 'planejado' ? plannedMetrics : realizedMetrics;
  const selectedLabel = optionsToShow.find((m) => m.value === selectedMetric)?.label || '';

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#F5F5F5' }}>
      {/* Navegação de período e visualização */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
        <Button mode="outlined" onPress={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))}>{'< Anterior'}</Button>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginHorizontal: 8 }}>{periodLabel}</Text>
        <Button mode="outlined" onPress={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))}>{'Próximo >'}</Button>
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            { value: 'daily', label: 'Diário' },
            { value: 'weekly', label: 'Semanal' },
          ]}
          style={{ marginLeft: 'auto' }}
        />
      </View>
      {/* Seletor Planejado vs Realizado */}
      <Card style={{ marginBottom: 12, padding: 8 }}>
        <SegmentedButtons
          value={dataType}
          onValueChange={setDataType}
          buttons={[
            { value: 'realizado', label: 'Realizado' },
            { value: 'planejado', label: 'Planejado' },
          ]}
        />
      </Card>
      {/* Card do seletor de métrica de treino */}
      <Card style={{ marginBottom: 24, padding: 8 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Selecione a Métrica de Treino</Text>
        <Picker
          selectedValue={selectedMetric}
          onValueChange={setSelectedMetric}
          style={{ backgroundColor: '#fff' }}
        >
          {optionsToShow.map((m) => (
            <Picker.Item key={m.value} label={m.label} value={m.value} />
          ))}
        </Picker>
      </Card>
      {/* Card do gráfico */}
      <Card style={{ flex: 1, paddingVertical: 8 }}>
        <Card.Content style={{ paddingHorizontal: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
            Evolução da {selectedLabel} ({dataType === 'realizado' ? 'Realizado' : 'Planejado'})
          </Text>
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <Text>Carregando dados...</Text>
            </View>
          ) : chartData.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 32 }}>Sem dados para exibir.</Text>
          ) : (
            <LineChart
              data={chartData}
              width={undefined}
              height={200}
              color1="#1976d2"
              yAxisLabelWidth={24}
              yAxisTextStyle={{ fontSize: 10 }}
              xAxisLabelTexts={chartData.map((d) => viewMode === 'weekly' ? d.label : d.label)}
              hideDataPoints={false}
              areaChart
              startFillColor="#1976d2"
              endFillColor="#fff"
              startOpacity={0.5}
              endOpacity={0.1}
            />
          )}
        </Card.Content>
      </Card>
    </View>
  );
} 