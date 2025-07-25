import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import { Card, SegmentedButtons, Button } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';
import { Picker } from '@react-native-picker/picker';
import { useCheckinStore } from '../../../stores/checkin';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme } from 'victory';

const METRICS = [
  { label: 'Qualidade do Sono', value: 'sleep_quality' },
  { label: 'Dores Musculares', value: 'soreness' },
  { label: 'Motivação', value: 'motivation' },
  { label: 'Confiança', value: 'confidence' },
  { label: 'Foco', value: 'focus' },
  { label: 'Emocional', value: 'emocional' },
  // Reflexão semanal:
  { label: 'Prazer/Diversão (Semanal)', value: 'enjoyment' },
  { label: 'Progresso Percebido (Semanal)', value: 'progress' },
  { label: 'Confiança Semanal', value: 'confidence_weekly' },
] as const;

type MetricKey = typeof METRICS[number]['value'];
type ChartDatum = { value: number; label: string; date?: string };
type RecentCheckin = {
  date: string;
  sleep_quality?: number;
  soreness?: number;
  motivation?: number;
  confidence?: number;
  focus?: number;
  emocional?: number;
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
function safeData(dataArray: any[]) {
  return (dataArray || []).filter(
    d => d && typeof d.value === 'number' && typeof d.label === 'string'
  );
}
export default function WellbeingChartsTab() {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('sleep_quality');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const {
    recentCheckins,
    loadRecentCheckins,
    weeklyReflections,
    loadWeeklyReflections,
    calculateWeeklyAverages,
    isLoading,
  } = useCheckinStore();

  useEffect(() => {
    loadRecentCheckins(90);
    loadWeeklyReflections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navegação de período
  const daysRange = 6; // 6 dias antes e 6 depois (13 dias)
  const { start, end } = getPeriodRange(currentDate, daysRange);
  const periodLabel = `${formatDateLabel(start.toISOString())} a ${formatDateLabel(end.toISOString())}`;

  // Lógica do gráfico dinâmico (memoizada)
  const chartData = useMemo(() => {
    if (isLoading) return [];
    let data: ChartDatum[] = [];
    if (selectedMetric === 'enjoyment' || selectedMetric === 'progress' || selectedMetric === 'confidence_weekly') {
      data = (weeklyReflections || [])
        .filter((r) => {
          if (selectedMetric === 'confidence_weekly') return r.confidence !== undefined && r.confidence !== null;
          return r[selectedMetric] !== undefined && r[selectedMetric] !== null;
        })
        .map((r) => ({
          value: selectedMetric === 'confidence_weekly' ? Number(r.confidence) : Number(r[selectedMetric]),
          label: r.week_start ? formatDateLabel(r.week_start) : '',
          date: r.week_start,
        }));
    } else {
      // Mapear corretamente cada métrica para o campo correspondente
      const metricFieldMap: Record<string, string> = {
        sleep_quality: 'sleep_quality',
        soreness: 'soreness',
        motivation: 'motivation',
        confidence: 'confidence',
        focus: 'focus',
        emocional: 'emocional',
        notes: 'notes',
      };
      const field = metricFieldMap[selectedMetric] || selectedMetric;
      const filtered = (recentCheckins as RecentCheckin[])
        .filter((c) => c.date && c[field] !== undefined && c[field] !== null)
        .map((c) => ({
          value: Number(c[field]),
          label: c.date ? formatDateLabel(c.date) : '',
          date: c.date,
        }));
      data = filtered;
      if (viewMode === 'weekly') {
        data = calculateWeeklyAverages(data.filter(d => !!d.date).map(d => ({ ...d, date: String(d.date) })));
      } else {
        data = data.filter((d) => {
          if (!d.date) return false;
          const dDate = new Date(d.date);
          return dDate >= start && dDate <= end;
        });
      }
      data = data.filter((d) => typeof d.value === 'number' && !isNaN(d.value));
    }
    console.log('chartData MAPPED', data);
    return data;
  }, [selectedMetric, isLoading, recentCheckins, weeklyReflections, viewMode, currentDate, calculateWeeklyAverages, start, end]);

  console.log('chartData', chartData);
  console.log('chartData FINAL', chartData);

  const selectedLabel = METRICS.find((m) => m.value === selectedMetric)?.label || '';

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
        {/* Título fora do gráfico */}
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
          Evolução da {selectedLabel}
        </Text>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Text>Carregando dados...</Text>
          </View>
        ) : (chartData && chartData.length > 0) ? (
          <VictoryChart
            theme={VictoryTheme.material}
            domain={{ y: [0, 10] }}
            height={220}
            padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
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
              tickValues={chartData.map((d) => d.label)}
              style={{
                axis: { stroke: '#ccc' },
                ticks: { stroke: '#ccc', size: 5 },
                tickLabels: { fontSize: 12, fill: '#333', angle: 0, padding: 10 },
                grid: { stroke: 'none' },
              }}
            />
            <VictoryLine
              data={safeData(chartData)}
              x="label"
              y="value"
              style={{
                data: { stroke: '#1976d2', strokeWidth: 2, fill: 'rgba(25, 118, 210, 0.1)' },
              }}
              interpolation="monotoneX"
            />
          </VictoryChart>
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 32 }}>Sem dados para exibir.</Text>
        )}
      </Card>
    </View>
  );
} 