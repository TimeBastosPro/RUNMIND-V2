import React, { useEffect, useState, useMemo } from 'react';
import { View, Text } from 'react-native';
import { Card, SegmentedButtons, Button } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';
import { Picker } from '@react-native-picker/picker';
import { useCheckinStore } from '../../../stores/checkin';

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
    // Reflexão semanal
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
      if (viewMode === 'weekly') {
        // Já está agrupado por semana
        data = data.filter((d) => typeof d.value === 'number' && !isNaN(d.value));
      } else {
        // Diário: mostrar cada reflexão semanal como um ponto
        data = data.filter((d) => typeof d.value === 'number' && !isNaN(d.value) && d.date && d.date >= start.toISOString() && d.date <= end.toISOString());
      }
    } else {
      // Demais métricas vêm dos check-ins
      const filtered = (recentCheckins as RecentCheckin[])
        .filter((c) => c.date && c[selectedMetric] !== undefined && c[selectedMetric] !== null)
        .map((c) => ({
          value: Number(c[selectedMetric]),
          label: formatDateLabel(c.date),
          date: c.date,
        }));
      if (viewMode === 'weekly') {
        data = calculateWeeklyAverages(filtered);
      } else {
        data = filtered.filter((d) => {
          if (!d.date) return false;
          const dDate = new Date(d.date!);
          return dDate >= start && dDate <= end;
        });
      }
      data = data.filter((d) => typeof d.value === 'number' && !isNaN(d.value));
    }
    return data;
  }, [selectedMetric, isLoading, recentCheckins, weeklyReflections, viewMode, currentDate, calculateWeeklyAverages, start, end]);

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
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
          Evolução da {selectedLabel}
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
      </Card>
    </View>
  );
} 