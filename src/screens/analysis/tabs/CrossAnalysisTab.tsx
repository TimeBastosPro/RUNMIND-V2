import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';

const CORRELATION_METRICS = [
  { 
    label: 'Sono vs Performance', 
    value: 'sleep_performance',
    icon: 'sleep',
    color: '#4CAF50',
    description: 'Como a qualidade do sono afeta seus treinos',
  },
  { 
    label: 'Motivação vs Distância', 
    value: 'motivation_distance',
    icon: 'lightning-bolt',
    color: '#FFC107',
    description: 'Relação entre motivação e distância percorrida',
  },
  { 
    label: 'Dores vs Intensidade', 
    value: 'soreness_intensity',
    icon: 'human-handsup',
    color: '#FF5722',
    description: 'Impacto das dores na intensidade dos treinos',
  },
  { 
    label: 'Foco vs Satisfação', 
    value: 'focus_satisfaction',
    icon: 'eye',
    color: '#2196F3',
    description: 'Correlação entre foco e satisfação com treinos',
  },
];

export default function CrossAnalysisTab() {
  const [selectedCorrelation, setSelectedCorrelation] = useState('sleep_performance');
  const { recentCheckins, loadRecentCheckins } = useCheckinStore();

  useEffect(() => {
    loadRecentCheckins(30);
  }, [loadRecentCheckins]);

  const selectedCorrelationInfo = CORRELATION_METRICS.find(m => m.value === selectedCorrelation);
  
  // Dados de exemplo para correlação
  const correlationData = [
    { sleep: 8, performance: 9, date: '2024-01-01' },
    { sleep: 6, performance: 6, date: '2024-01-02' },
    { sleep: 7, performance: 8, date: '2024-01-03' },
    { sleep: 5, performance: 5, date: '2024-01-04' },
    { sleep: 9, performance: 9, date: '2024-01-05' },
  ];

  const calculateCorrelation = () => {
    // Cálculo simples de correlação (exemplo)
    const n = correlationData.length;
    const sumX = correlationData.reduce((sum, d) => sum + d.sleep, 0);
    const sumY = correlationData.reduce((sum, d) => sum + d.performance, 0);
    const sumXY = correlationData.reduce((sum, d) => sum + (d.sleep * d.performance), 0);
    const sumX2 = correlationData.reduce((sum, d) => sum + (d.sleep * d.sleep), 0);
    const sumY2 = correlationData.reduce((sum, d) => sum + (d.performance * d.performance), 0);
    
    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return correlation.toFixed(2);
  };

  const correlationValue = calculateCorrelation();
  const correlationStrength = Math.abs(parseFloat(correlationValue));
  
  let strengthText = '';
  let strengthColor = '';
  
  if (correlationStrength >= 0.7) {
    strengthText = 'Forte';
    strengthColor = '#4CAF50';
  } else if (correlationStrength >= 0.4) {
    strengthText = 'Moderada';
    strengthColor = '#FF9800';
  } else {
    strengthText = 'Fraca';
    strengthColor = '#F44336';
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Seleção de Correlações */}
      <Card style={styles.correlationCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Análise de Correlação:</Text>
          <View style={styles.correlationGrid}>
            {CORRELATION_METRICS.map((correlation) => (
              <Chip
                key={correlation.value}
                selected={selectedCorrelation === correlation.value}
                onPress={() => setSelectedCorrelation(correlation.value)}
                style={[
                  styles.correlationChip,
                  selectedCorrelation === correlation.value && { backgroundColor: correlation.color + '20' }
                ]}
                textStyle={[
                  styles.correlationChipText,
                  selectedCorrelation === correlation.value && { color: correlation.color, fontWeight: 'bold' }
                ]}
                icon={correlation.icon}
              >
                {correlation.label}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Descrição da Correlação */}
      <Card style={styles.descriptionCard}>
        <Card.Content>
          <View style={styles.descriptionHeader}>
            <MaterialCommunityIcons 
              name={selectedCorrelationInfo?.icon as any} 
              size={24} 
              color={selectedCorrelationInfo?.color} 
            />
            <Text style={styles.descriptionTitle}>{selectedCorrelationInfo?.label}</Text>
          </View>
          <Text style={styles.descriptionText}>{selectedCorrelationInfo?.description}</Text>
        </Card.Content>
      </Card>

      {/* Resultado da Correlação */}
      <Card style={styles.resultCard}>
        <Card.Content>
          <Text style={styles.resultTitle}>Resultado da Análise</Text>
          <View style={styles.resultGrid}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Coeficiente de Correlação</Text>
              <Text style={styles.resultValue}>{correlationValue}</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Força da Correlação</Text>
              <Text style={[styles.resultValue, { color: strengthColor }]}>{strengthText}</Text>
            </View>
          </View>
          
          <View style={styles.interpretationContainer}>
            <Text style={styles.interpretationTitle}>Interpretação:</Text>
            <Text style={styles.interpretationText}>
              {parseFloat(correlationValue) > 0 
                ? 'Correlação positiva: quando uma variável aumenta, a outra também tende a aumentar.'
                : 'Correlação negativa: quando uma variável aumenta, a outra tende a diminuir.'
              }
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Gráfico de Dispersão Simples */}
      <Card style={styles.scatterCard}>
        <Card.Content>
          <Text style={styles.scatterTitle}>Gráfico de Dispersão</Text>
          <View style={styles.scatterContainer}>
            <View style={styles.scatterPlot}>
              {correlationData.map((point, index) => (
                <View
                  key={index}
                  style={[
                    styles.scatterPoint,
                    {
                      left: (point.sleep / 10) * 200,
                      bottom: (point.performance / 10) * 150,
                      backgroundColor: selectedCorrelationInfo?.color,
                    }
                  ]}
                />
              ))}
            </View>
            <View style={styles.axisLabels}>
              <Text style={styles.axisLabel}>Qualidade do Sono (1-10)</Text>
              <Text style={styles.axisLabelVertical}>Performance (1-10)</Text>
            </View>
          </View>
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
  correlationCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  correlationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  correlationChip: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  correlationChipText: {
    color: '#333',
  },
  descriptionCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  resultCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  resultGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  resultLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  interpretationContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
  },
  interpretationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  interpretationText: {
    fontSize: 13,
    color: '#1976d2',
    lineHeight: 18,
  },
  scatterCard: {
    borderRadius: 12,
  },
  scatterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  scatterContainer: {
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    position: 'relative',
  },
  scatterPlot: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  scatterPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  axisLabels: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  axisLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  axisLabelVertical: {
    fontSize: 10,
    color: '#666',
    transform: [{ rotate: '-90deg' }],
    position: 'absolute',
    left: -40,
    top: 80,
  },
}); 