import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent, ScrollView } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useCheckinStore } from '../../../stores/checkin';

const METRICS = [
  { label: 'Qualidade do Sono', value: 'sleep_quality' },
  { label: 'Dores Musculares', value: 'soreness' },
  { label: 'Motivação', value: 'motivation' },
  { label: 'Confiança', value: 'confidence' },
  { label: 'Foco', value: 'focus' },
  { label: 'Emocional', value: 'emocional' },
  { label: 'Prazer/Diversão (Semanal)', value: 'enjoyment' },
  { label: 'Progresso Percebido (Semanal)', value: 'progress' },
  { label: 'Confiança Semanal', value: 'confidence_weekly' },
] as const;

type MetricKey = typeof METRICS[number]['value'];

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function WellbeingChartsTab() {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('sleep_quality');

  const {
    recentCheckins,
    loadRecentCheckins,
    weeklyReflections,
    loadWeeklyReflections,
    isLoading,
  } = useCheckinStore();

  useEffect(() => {
    loadRecentCheckins(90);
    loadWeeklyReflections();
  }, [loadRecentCheckins, loadWeeklyReflections]);

  const chartData = useMemo(() => {
    if (isLoading) return [];
    let data: { value: number | string; date: string }[] = [];
    if (['enjoyment', 'progress', 'confidence_weekly'].includes(selectedMetric)) {
      const metricKey = selectedMetric.replace('_weekly', '') as keyof typeof weeklyReflections[0];
      data = (weeklyReflections || [])
        .filter(r => r.week_start && r[metricKey] != null)
        .map(r => ({ value: Number(r[metricKey]), date: r.week_start }));
    } else {
      const metricKey = selectedMetric as keyof typeof recentCheckins[0];
      data = (recentCheckins || [])
        .filter(c => c.date && c[metricKey] != null)
        .map(c => ({ value: Number(c[metricKey]), date: c.date }));
    }
    return data
      .filter(d => typeof d.value === 'number' && !isNaN(d.value))
      .map(d => ({
        x: formatDateLabel(d.date),
        y: Number(d.value),
        originalValue: d.value
      }));
  }, [selectedMetric, isLoading, recentCheckins, weeklyReflections]);

  const renderSimpleChart = () => {
    if (chartData.length === 0) {
      return <Text style={styles.placeholder}>Sem dados suficientes para exibir.</Text>;
    }

    const maxY = Math.max(...chartData.map(d => d.y), 10);
    const minY = Math.min(...chartData.map(d => d.y), 0);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Evolução da {METRICS.find(m => m.value === selectedMetric)?.label}</Text>
        </View>
        
        <View style={styles.chartArea}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {[maxY, maxY * 0.75, maxY * 0.5, maxY * 0.25, minY].map(value => (
              <Text key={value} style={styles.yAxisLabel}>{value.toFixed(1)}</Text>
            ))}
          </View>
          
          {/* Chart content */}
          <View style={styles.chartContent}>
            {/* Grid lines */}
            {[maxY, maxY * 0.75, maxY * 0.5, maxY * 0.25, minY].map(value => (
              <View
                key={value}
                style={[
                  styles.gridLine,
                  { top: `${100 - ((value - minY) / (maxY - minY)) * 100}%` }
                ]}
              />
            ))}
            
            {/* Data line */}
            <View style={styles.lineContainer}>
              {chartData.map((point, index) => {
                if (index === 0) return null;
                const prevPoint = chartData[index - 1];
                const x1 = (index - 1) / (chartData.length - 1) * 100;
                const y1 = 100 - ((prevPoint.y - minY) / (maxY - minY)) * 100;
                const x2 = index / (chartData.length - 1) * 100;
                const y2 = 100 - ((point.y - minY) / (maxY - minY)) * 100;
                
                return (
                  <View
                    key={index}
                    style={[
                      styles.line,
                      {
                        backgroundColor: '#1976d2',
                        left: `${x1}%`,
                        top: `${y1}%`,
                        width: `${x2 - x1}%`,
                        height: 2,
                        transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI}deg` }]
                      }
                    ]}
                  />
                );
              })}
            </View>
          </View>
          
          {/* X-axis labels */}
          <View style={styles.xAxis}>
            {chartData.map((point, index) => (
              <Text key={index} style={styles.xAxisLabel}>{point.x}</Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const selectedLabel = METRICS.find((m) => m.value === selectedMetric)?.label || '';

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Selecione a Métrica</Text>
          <Picker
            selectedValue={selectedMetric}
            onValueChange={(itemValue) => setSelectedMetric(itemValue as MetricKey)}
          >
            {METRICS.map((m) => (
              <Picker.Item key={m.value} label={m.label} value={m.value} />
            ))}
          </Picker>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          {isLoading ? (
            <ActivityIndicator style={styles.placeholder} />
          ) : (
            renderSimpleChart()
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f4f4f8' },
  card: { marginBottom: 16, elevation: 2 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  placeholder: { textAlign: 'center', marginVertical: 40, color: '#666' },
  chartContainer: { padding: 10 },
  chartHeader: { marginBottom: 10 },
  chartTitle: { fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  chartArea: { flexDirection: 'row', height: 200 },
  yAxis: { width: 40, justifyContent: 'space-between', paddingVertical: 10 },
  yAxisLabel: { fontSize: 10, color: '#666' },
  chartContent: { flex: 1, position: 'relative', marginHorizontal: 10 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#e0e0e0' },
  lineContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  line: { position: 'absolute', transformOrigin: 'left center' },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  xAxisLabel: { fontSize: 10, color: '#666', transform: [{ rotate: '-45deg' }] },
}); 