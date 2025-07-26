import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent, ScrollView } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useCheckinStore } from '../../../stores/checkin';

const TRAINING_METRICS = [
  { label: 'Percepção de Esforço (PSE)', value: 'perceived_effort' },
  { label: 'Distância (km)', value: 'distance_km' },
  { label: 'Duração (min)', value: 'duration_minutes' },
  { label: 'Altimetria (m)', value: 'elevation_gain_meters' },
];

type MetricKey = typeof TRAINING_METRICS[number]['value'];

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function PsychologicalChartsTab() {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('perceived_effort');
  const { trainingSessions, fetchTrainingSessions, isLoading } = useCheckinStore();

  useEffect(() => {
    fetchTrainingSessions();
  }, [fetchTrainingSessions]);

  const chartData = useMemo(() => {
    const realized = (trainingSessions || [])
      .filter(s => s.status === 'completed' && s[selectedMetric] != null)
      .map(s => ({
        x: formatDateLabel(s.training_date),
        y: Number(s[selectedMetric]),
        originalValue: s[selectedMetric]
      }));

    const plannedKey = `planned_${selectedMetric}`;
    const planned = (trainingSessions || [])
      .filter(s => s.status === 'planned' && s[plannedKey] != null)
      .map(s => ({
        x: formatDateLabel(s.training_date),
        y: Number(s[plannedKey]),
        originalValue: s[plannedKey]
      }));
      
    return { realized, planned };
  }, [selectedMetric, trainingSessions]);

  const renderSimpleChart = () => {
    if (chartData.realized.length === 0 && chartData.planned.length === 0) {
      return <Text style={styles.placeholder}>Sem dados suficientes para exibir.</Text>;
    }

    const allData = [...chartData.realized, ...chartData.planned];
    const maxY = Math.max(...allData.map(d => d.y), 10);
    const minY = Math.min(...allData.map(d => d.y), 0);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{TRAINING_METRICS.find(m => m.value === selectedMetric)?.label}: Planejado vs. Realizado</Text>
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
            
            {/* Data lines */}
            {chartData.realized.length > 0 && (
              <View style={styles.lineContainer}>
                {chartData.realized.map((point, index) => {
                  if (index === 0) return null;
                  const prevPoint = chartData.realized[index - 1];
                  const x1 = (index - 1) / (chartData.realized.length - 1) * 100;
                  const y1 = 100 - ((prevPoint.y - minY) / (maxY - minY)) * 100;
                  const x2 = index / (chartData.realized.length - 1) * 100;
                  const y2 = 100 - ((point.y - minY) / (maxY - minY)) * 100;
                  
                  return (
                    <View
                      key={`realized-${index}`}
                      style={[
                        styles.line,
                        {
                          backgroundColor: '#c43a31',
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
            )}
            
            {chartData.planned.length > 0 && (
              <View style={styles.lineContainer}>
                {chartData.planned.map((point, index) => {
                  if (index === 0) return null;
                  const prevPoint = chartData.planned[index - 1];
                  const x1 = (index - 1) / (chartData.planned.length - 1) * 100;
                  const y1 = 100 - ((prevPoint.y - minY) / (maxY - minY)) * 100;
                  const x2 = index / (chartData.planned.length - 1) * 100;
                  const y2 = 100 - ((point.y - minY) / (maxY - minY)) * 100;
                  
                  return (
                    <View
                      key={`planned-${index}`}
                      style={[
                        styles.line,
                        {
                          backgroundColor: '#455A64',
                          left: `${x1}%`,
                          top: `${y1}%`,
                          width: `${x2 - x1}%`,
                          height: 2,
                          borderStyle: 'dashed',
                          transform: [{ rotate: `${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI}deg` }]
                        }
                      ]}
                    />
                  );
                })}
              </View>
            )}
          </View>
          
          {/* X-axis labels */}
          <View style={styles.xAxis}>
            {[...new Set([...chartData.realized.map(d => d.x), ...chartData.planned.map(d => d.x)])].map((date, index) => (
              <Text key={index} style={styles.xAxisLabel}>{date}</Text>
            ))}
          </View>
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          {chartData.realized.length > 0 && (
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#c43a31' }]} />
              <Text style={styles.legendText}>Realizado</Text>
            </View>
          )}
          {chartData.planned.length > 0 && (
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#455A64' }]} />
              <Text style={styles.legendText}>Planejado</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const selectedLabel = TRAINING_METRICS.find(m => m.value === selectedMetric)?.label || '';

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Selecione a Métrica de Treino</Text>
          <Picker
            selectedValue={selectedMetric}
            onValueChange={(itemValue) => setSelectedMetric(itemValue as MetricKey)}
          >
            {TRAINING_METRICS.map((m) => (
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
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  legendColor: { width: 12, height: 12, marginRight: 5, borderRadius: 2 },
  legendText: { fontSize: 12, color: '#333' },
}); 