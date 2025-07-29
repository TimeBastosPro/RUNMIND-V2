import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';

const METRICS = [
  { 
    label: 'Qualidade do Sono', 
    value: 'sleep_quality',
    icon: 'sleep',
    color: '#4CAF50',
  },
  { 
    label: 'Dores Musculares', 
    value: 'soreness',
    icon: 'human-handsup',
    color: '#FF5722',
  },
  { 
    label: 'Motivação', 
    value: 'motivation',
    icon: 'lightning-bolt',
    color: '#FFC107',
  },
  { 
    label: 'Confiança', 
    value: 'confidence',
    icon: 'target',
    color: '#9C27B0',
  },
  { 
    label: 'Foco', 
    value: 'focus',
    icon: 'eye',
    color: '#2196F3',
  },
  { 
    label: 'Emocional', 
    value: 'emocional',
    icon: 'heart',
    color: '#E91E63',
  },
];

export default function WellbeingChartsTab() {
  const [selectedMetric, setSelectedMetric] = useState('sleep_quality');
  const { recentCheckins, loadRecentCheckins } = useCheckinStore();

  useEffect(() => {
    loadRecentCheckins(30);
  }, [loadRecentCheckins]);

  const selectedMetricInfo = METRICS.find(m => m.value === selectedMetric);
  
  // Dados de exemplo para teste
  const exampleData = [
    { date: '2024-01-01', value: 7 },
    { date: '2024-01-02', value: 6 },
    { date: '2024-01-03', value: 8 },
    { date: '2024-01-04', value: 5 },
    { date: '2024-01-05', value: 9 },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Seleção de Métricas */}
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Selecione uma métrica:</Text>
          <View style={styles.metricsGrid}>
            {METRICS.map((metric) => (
              <Chip
                key={metric.value}
                selected={selectedMetric === metric.value}
                onPress={() => setSelectedMetric(metric.value)}
                style={[
                  styles.metricChip,
                  selectedMetric === metric.value && { backgroundColor: metric.color + '20' }
                ]}
                textStyle={[
                  styles.metricChipText,
                  selectedMetric === metric.value && { color: metric.color, fontWeight: 'bold' }
                ]}
                icon={metric.icon}
              >
                {metric.label}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Gráfico Simples */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <MaterialCommunityIcons 
                name={selectedMetricInfo?.icon as any} 
                size={24} 
                color={selectedMetricInfo?.color} 
              />
              <Text style={styles.chartTitle}>{selectedMetricInfo?.label}</Text>
            </View>
          </View>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {exampleData.map((item, index) => (
                <View key={index} style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar,
                      {
                        height: (item.value / 10) * 100,
                        backgroundColor: selectedMetricInfo?.color
                      }
                    ]}
                  />
                  <Text style={styles.barLabel}>
                    {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </Text>
                  <Text style={styles.barValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Status */}
      <Card style={styles.statusCard}>
        <Card.Content>
          <Text style={styles.statusTitle}>Status da Análise</Text>
          <Text style={styles.statusText}>
            Gráfico básico funcionando! Dados de exemplo sendo exibidos.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  metricsCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricChip: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  metricChipText: {
    color: '#333',
  },
  chartCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  chartContainer: {
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 40,
    height: '100%',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 10,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  statusCard: {
    borderRadius: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 