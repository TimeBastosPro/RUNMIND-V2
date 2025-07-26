// src/screens/analysis/tabs/CrossAnalysisTab.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Card, Chip, Text, ActivityIndicator } from 'react-native-paper';
import { useCheckinStore } from '../../../stores/checkin';

const ALL_METRICS = [
  { label: 'Qualidade do Sono', value: 'sleep_quality', min: 1, max: 7, source: 'checkin', color: '#1976d2' },
  { label: 'Dores Musculares', value: 'soreness', min: 1, max: 7, source: 'checkin', color: '#d32f2f' },
  { label: 'Motivação', value: 'motivation', min: 1, max: 5, source: 'checkin', color: '#388e3c' },
  { label: 'PSE Realizado', value: 'perceived_effort', min: 1, max: 10, source: 'training', color: '#607d8b' },
];

function formatDateLabel(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function CrossAnalysisTab() {
  const { recentCheckins, trainingSessions, isLoading, loadRecentCheckins, fetchTrainingSessions } = useCheckinStore();
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  useEffect(() => {
    loadRecentCheckins(90);
    fetchTrainingSessions();
  }, [loadRecentCheckins, fetchTrainingSessions]);

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

  const chartData = useMemo(() => {
    if (selectedMetrics.length === 0) return [];
    
    const normalize = (val: number, min: number, max: number) => {
      if (max === min) return 50;
      return ((val - min) / (max - min)) * 100;
    };
    
    return selectedMetrics.map(metricValue => {
      const metric = ALL_METRICS.find(m => m.value === metricValue);
      if (!metric) return { metric: metricValue, data: [], label: '' };

      let rawData: { value: any; date: string }[] = [];
      if (metric.source === 'checkin') {
        const key = metric.value as keyof typeof recentCheckins[0];
        rawData = (recentCheckins || [])
          .filter(c => c.date && c[key] != null)
          .map(c => ({ value: c[key], date: c.date }));
      } else if (metric.source === 'training') {
        const key = metric.value as keyof typeof trainingSessions[0];
        rawData = (trainingSessions || [])
          .filter(t => t.training_date && t[key] != null)
          .map(t => ({ value: t[key], date: t.training_date }));
      }

      const normalizedData = rawData
        .filter(d => typeof d.value === 'number' && !isNaN(d.value))
        .map(d => ({
          x: formatDateLabel(d.date),
          y: normalize(d.value, metric.min, metric.max),
          originalValue: d.value
        }));
      
      return { metric: metricValue, data: normalizedData, label: metric.label, color: metric.color };
    });
  }, [selectedMetrics, recentCheckins, trainingSessions]);

  const renderSimpleChart = () => {
    if (chartData.length === 0) {
      return <Text style={styles.placeholder}>Selecione uma métrica para começar.</Text>;
    }

    const allDates = Array.from(new Set(chartData.flatMap(series => series.data.map(d => d.x)))).sort();
    const maxY = Math.max(...chartData.flatMap(series => series.data.map(d => d.y)), 100);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Análise Cruzada (Normalizado 0-100%)</Text>
        </View>
        
        <View style={styles.chartArea}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {[100, 75, 50, 25, 0].map(value => (
              <Text key={value} style={styles.yAxisLabel}>{value}%</Text>
            ))}
          </View>
          
          {/* Chart content */}
          <View style={styles.chartContent}>
            {/* Grid lines */}
            {[100, 75, 50, 25, 0].map(value => (
              <View
                key={value}
                style={[
                  styles.gridLine,
                  { top: `${100 - (value / maxY) * 100}%` }
                ]}
              />
            ))}
            
            {/* Data lines */}
            {chartData.map(series => (
              <View key={series.metric} style={styles.lineContainer}>
                {series.data.map((point, index) => {
                  if (index === 0) return null;
                  const prevPoint = series.data[index - 1];
                  const x1 = (allDates.indexOf(prevPoint.x) / (allDates.length - 1)) * 100;
                  const y1 = 100 - (prevPoint.y / maxY) * 100;
                  const x2 = (allDates.indexOf(point.x) / (allDates.length - 1)) * 100;
                  const y2 = 100 - (point.y / maxY) * 100;
                  
                  return (
                    <View
                      key={`${series.metric}-${index}`}
                      style={[
                        styles.line,
                        {
                          backgroundColor: series.color,
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
            ))}
          </View>
          
          {/* X-axis labels */}
          <View style={styles.xAxis}>
            {allDates.map((date, index) => (
              <Text key={date} style={styles.xAxisLabel}>{date}</Text>
            ))}
          </View>
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          {chartData.map(series => (
            <View key={series.metric} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: series.color }]} />
              <Text style={styles.legendText}>{series.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Selecione até 4 métricas ({selectedMetrics.length}/4)</Text>
          <View style={styles.chipContainer}>
            {ALL_METRICS.map((metric) => (
              <Chip
                key={metric.value}
                selected={selectedMetrics.includes(metric.value)}
                onPress={() => toggleMetric(metric.value)}
                style={[
                  styles.chip,
                  { 
                    backgroundColor: selectedMetrics.includes(metric.value) ? metric.color : '#f0f0f0',
                    borderColor: metric.color
                  }
                ]}
                textStyle={{ color: selectedMetrics.includes(metric.value) ? '#fff' : '#333' }}
              >
                {metric.label}
              </Chip>
            ))}
          </View>
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
  cardTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 12 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1 },
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
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginVertical: 5 },
  legendColor: { width: 12, height: 12, marginRight: 5, borderRadius: 2 },
  legendText: { fontSize: 12, color: '#333' },
}); 