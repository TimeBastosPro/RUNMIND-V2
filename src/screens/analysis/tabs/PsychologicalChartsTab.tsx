// src/screens/analysis/tabs/PsychologicalChartsTab.tsx

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Card } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';
import { Picker } from '@react-native-picker/picker';
import { useCheckinStore } from '../../../stores/checkin';

const TRAINING_METRICS = [
  { label: 'Distância (km)', value: 'distance_km' },
  { label: 'Duração (min)', value: 'duration_minutes' },
  { label: 'Altimetria (m)', value: 'elevation_gain_meters' },
  { label: 'Percepção de Esforço (PSE)', value: 'perceived_effort' },
  { label: 'Frequência Cardíaca Média', value: 'avg_heart_rate' },
] as const;

type TrainingMetricKey = typeof TRAINING_METRICS[number]['value'];
type ChartDatum = { value: number; label: string };
type TrainingSession = {
  training_date: string;
  distance_km?: number;
  duration_minutes?: number;
  elevation_gain_meters?: number;
  perceived_effort?: number;
  avg_heart_rate?: number;
  [key: string]: any;
};
function formatDateLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
export default function PsychologicalChartsTab() {
  const [selectedTrainingMetric, setSelectedTrainingMetric] = useState<TrainingMetricKey>('distance_km');
  const [chartData, setChartData] = useState<ChartDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const { trainingSessions, fetchTrainingSessions } = useCheckinStore();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      await fetchTrainingSessions();
      setLoading(false);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    let data: ChartDatum[] = (trainingSessions as TrainingSession[])
      .filter((s) => s.training_date && s[selectedTrainingMetric] !== undefined && s[selectedTrainingMetric] !== null)
      .map((s) => ({
        value: Number(s[selectedTrainingMetric]),
        label: formatDateLabel(s.training_date),
      }));
    data = data.filter((d) => typeof d.value === 'number' && !isNaN(d.value));
    setChartData(data);
  }, [selectedTrainingMetric, loading, trainingSessions]);

  const selectedLabel = TRAINING_METRICS.find((m) => m.value === selectedTrainingMetric)?.label || '';

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#F5F5F5' }}>
      {/* Card do seletor de métrica de treino */}
      <Card style={{ marginBottom: 24, padding: 8 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Selecione a Métrica de Treino</Text>
        <Picker
          selectedValue={selectedTrainingMetric}
          onValueChange={setSelectedTrainingMetric}
          style={{ backgroundColor: '#fff' }}
        >
          {TRAINING_METRICS.map((m) => (
            <Picker.Item key={m.value} label={m.label} value={m.value} />
          ))}
        </Picker>
      </Card>
      {/* Card do gráfico */}
      <Card style={{ flex: 1, padding: 8 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
          Evolução da {selectedLabel}
        </Text>
        {loading ? (
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
            xAxisLabelTexts={chartData.map((d) => d.label)}
            hideDataPoints={false}
            areaChart
            startFillColor="#1976d2"
            endFillColor="#fff"
            startOpacity={0.5}
            endOpacity={0.1}
          />
        )}
      </Card>
    </View>
  );
} 