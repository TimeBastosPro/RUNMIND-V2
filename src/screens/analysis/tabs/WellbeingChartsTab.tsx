import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Card } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';
import { Picker } from '@react-native-picker/picker';
import { useCheckinStore } from '../../../stores/checkin';

const METRICS = [
  { label: 'Qualidade do Sono', value: 'sleep_quality' },
  { label: 'Dores Musculares', value: 'soreness' },
  { label: 'Motivação', value: 'motivation' },
  { label: 'Confiança', value: 'confidence' },
  { label: 'Foco', value: 'focus' },
  { label: 'Percepção de Esforço (PSE)', value: 'perceived_effort' },
  { label: 'Prazer/Diversão', value: 'enjoyment' },
  { label: 'Progresso Percebido', value: 'progress' },
  { label: 'Confiança Semanal', value: 'confidence_weekly' },
] as const;

type MetricKey = typeof METRICS[number]['value'];

type ChartDatum = { value: number; label: string };

type RecentCheckin = {
  date: string;
  sleep_quality?: number;
  soreness?: number;
  motivation?: number;
  confidence?: number;
  focus?: number;
  [key: string]: any;
};

type TrainingSession = {
  training_date: string;
  perceived_effort?: number;
  [key: string]: any;
};

function formatDateLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function WellbeingChartsTab() {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('sleep_quality');
  const [chartData, setChartData] = useState<ChartDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    recentCheckins,
    loadRecentCheckins,
    trainingSessions,
    fetchTrainingSessions,
    weeklyReflections,
    loadWeeklyReflections,
  } = useCheckinStore();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      await Promise.all([
        loadRecentCheckins(30),
        fetchTrainingSessions(),
        loadWeeklyReflections(),
      ]);
      setLoading(false);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    let data: ChartDatum[] = [];
    if (selectedMetric === 'perceived_effort') {
      // PSE vem dos treinos
      data = (trainingSessions as TrainingSession[])
        .filter((t) => t.training_date && t.perceived_effort !== undefined && t.perceived_effort !== null)
        .map((t) => ({
          value: Number(t.perceived_effort),
          label: formatDateLabel(t.training_date),
        }));
    } else if (selectedMetric === 'enjoyment' || selectedMetric === 'progress' || selectedMetric === 'confidence_weekly') {
      // Reflexão semanal
      data = (weeklyReflections || [])
        .filter((r) => {
          if (selectedMetric === 'confidence_weekly') return r.confidence !== undefined && r.confidence !== null;
          return r[selectedMetric] !== undefined && r[selectedMetric] !== null;
        })
        .map((r) => ({
          value: selectedMetric === 'progress' ? 0 : Number(selectedMetric === 'confidence_weekly' ? r.confidence : r[selectedMetric]),
          label: r.week_start ? formatDateLabel(r.week_start) : '',
        }));
    } else {
      // Demais métricas vêm dos check-ins
      data = (recentCheckins as RecentCheckin[])
        .filter((c) => c.date && c[selectedMetric] !== undefined && c[selectedMetric] !== null)
        .map((c) => ({
          value: Number(c[selectedMetric]),
          label: formatDateLabel(c.date),
        }));
    }
    data = data.filter((d) => typeof d.value === 'number' && !isNaN(d.value));
    setChartData(data);
  }, [selectedMetric, loading, recentCheckins, trainingSessions, weeklyReflections]);

  const selectedLabel = METRICS.find((m) => m.value === selectedMetric)?.label || '';

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#F5F5F5' }}>
      {/* Card do seletor de métrica */}
      <Card style={{ marginBottom: 24, padding: 8 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Selecione a Métrica</Text>
        <Picker
          selectedValue={selectedMetric}
          onValueChange={setSelectedMetric}
          style={{ backgroundColor: '#fff' }}
        >
          {METRICS.map((m) => (
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