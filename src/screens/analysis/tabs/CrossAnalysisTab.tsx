import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';
import { filterDataByPeriod, getPeriodLabel } from '../../../utils/periodFilter';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

// Métricas de Bem-estar (campos reais do banco)
const WELLBEING_METRICS = [
  { 
    label: 'Qualidade do Sono', 
    value: 'sleep_quality',
    icon: 'sleep',
    color: '#4CAF50',
    field: 'sleep_quality',
  },
  { 
    label: 'Dores Musculares', 
    value: 'soreness',
    icon: 'human-handsup',
    color: '#FF5722',
    field: 'soreness',
  },
  { 
    label: 'Motivação', 
    value: 'motivation',
    icon: 'lightning-bolt',
    color: '#FFC107',
    field: 'motivation',
  },
  { 
    label: 'Confiança', 
    value: 'confidence',
    icon: 'target',
    color: '#9C27B0',
    field: 'confidence',
  },
  { 
    label: 'Foco', 
    value: 'focus',
    icon: 'eye',
    color: '#2196F3',
    field: 'focus',
  },
  { 
    label: 'Energia', 
    value: 'energy',
    icon: 'heart',
    color: '#E91E63',
    field: 'emocional',
  },
];

// Métricas de Treino (campos reais do banco)
const TRAINING_METRICS = [
  { 
    label: 'Distância (km)', 
    value: 'distance',
    icon: 'map-marker-distance',
    color: '#4CAF50',
    field: 'distance_km',
  },
  { 
    label: 'Duração (min)', 
    value: 'duration',
    icon: 'clock-outline',
    color: '#2196F3',
    field: 'duration_minutes',
  },
  { 
    label: 'Esforço Percebido', 
    value: 'perceived_effort',
    icon: 'gauge',
    color: '#FF9800',
    field: 'perceived_effort',
  },
  { 
    label: 'Satisfação', 
    value: 'satisfaction',
    icon: 'heart',
    color: '#E91E63',
    field: 'session_satisfaction',
  },
];

export default function CrossAnalysisTab() {
  const [selectedWellbeingMetric, setSelectedWellbeingMetric] = useState('sleep_quality');
  const [selectedTrainingMetric, setSelectedTrainingMetric] = useState('distance');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'custom'>('month');
  
  const { recentCheckins, trainingSessions, loadRecentCheckins } = useCheckinStore();

  useEffect(() => {
    loadRecentCheckins();
  }, [loadRecentCheckins]);

  const selectedWellbeingInfo = WELLBEING_METRICS.find(m => m.value === selectedWellbeingMetric);
  const selectedTrainingInfo = TRAINING_METRICS.find(m => m.value === selectedTrainingMetric);

  // Processar dados para correlação
  const getCorrelationData = () => {
    if (!recentCheckins || !trainingSessions || recentCheckins.length === 0 || trainingSessions.length === 0) {
      return [];
    }

    // Filtrar check-ins por período
    let filteredCheckins = recentCheckins;
    if (selectedPeriod === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredCheckins = recentCheckins.filter(checkin => new Date(checkin.date) >= weekAgo);
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filteredCheckins = recentCheckins.filter(checkin => new Date(checkin.date) >= monthAgo);
    }

    // Filtrar treinos por período
    let filteredSessions = trainingSessions.filter(session => session.status === 'completed');
    if (selectedPeriod === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredSessions = filteredSessions.filter(session => new Date(session.training_date) >= weekAgo);
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filteredSessions = filteredSessions.filter(session => new Date(session.training_date) >= monthAgo);
    }

    // Obter dados de bem-estar
    const wellbeingData = filteredCheckins
      .map(checkin => {
        const field = selectedWellbeingInfo?.field as keyof typeof checkin;
        const value = checkin[field];
        
        return {
          date: checkin.date,
          wellbeing: typeof value === 'number' ? value : 0,
        };
      })
      .filter(item => item.wellbeing > 0);

    // Obter dados de treino
    const trainingData = filteredSessions
      .map(session => {
        let value = 0;
        
        if (selectedTrainingInfo?.field === 'distance_km') {
          value = session.distance_km || 0;
        } else if (selectedTrainingInfo?.field === 'duration_minutes') {
          const hours = session.duracao_horas ? parseInt(String(session.duracao_horas)) : 0;
          const minutes = session.duracao_minutos ? parseInt(String(session.duracao_minutos)) : 0;
          value = hours * 60 + minutes;
        } else if (selectedTrainingInfo?.field === 'perceived_effort') {
          value = session.perceived_effort || 0;
        } else if (selectedTrainingInfo?.field === 'session_satisfaction') {
          value = session.session_satisfaction || 0;
        }
        
        return {
          date: session.training_date,
          training: value,
        };
      })
      .filter(item => item.training > 0);

    // Combinar dados por data
    const combinedData: Array<{date: string, wellbeing: number, training: number}> = [];
    const dateMap = new Map();

    // Adicionar dados de bem-estar
    wellbeingData.forEach(item => {
      dateMap.set(item.date, { ...dateMap.get(item.date), wellbeing: item.wellbeing });
    });

    // Adicionar dados de treino
    trainingData.forEach(item => {
      dateMap.set(item.date, { ...dateMap.get(item.date), training: item.training });
    });

    // Converter para array e filtrar apenas datas com ambos os dados
    dateMap.forEach((value, date) => {
      if (value.wellbeing && value.training) {
        combinedData.push({
          date,
          wellbeing: value.wellbeing,
          training: value.training,
        });
      }
    });

    return combinedData
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10); // Últimos 10 dias com dados
  };

  const correlationData = getCorrelationData();

  const calculateCorrelation = () => {
    if (correlationData.length < 2) {
      return { value: 0, strength: 'Insuficiente', interpretation: 'Nenhum dado' };
    }

    // Cálculo de correlação de Pearson
    const n = correlationData.length;
    const sumX = correlationData.reduce((sum, d) => sum + d.wellbeing, 0);
    const sumY = correlationData.reduce((sum, d) => sum + d.training, 0);
    const sumXY = correlationData.reduce((sum, d) => sum + (d.wellbeing * d.training), 0);
    const sumX2 = correlationData.reduce((sum, d) => sum + (d.wellbeing * d.wellbeing), 0);
    const sumY2 = correlationData.reduce((sum, d) => sum + (d.training * d.training), 0);
    
    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    const absCorrelation = Math.abs(correlation);
    
    let strength = '';
    let strengthColor = '';
    
    if (absCorrelation >= 0.7) {
      strength = 'Forte';
      strengthColor = '#4CAF50';
    } else if (absCorrelation >= 0.4) {
      strength = 'Moderada';
      strengthColor = '#FF9800';
    } else if (absCorrelation >= 0.2) {
      strength = 'Fraca';
      strengthColor = '#F44336';
    } else {
      strength = 'Muito Fraca';
      strengthColor = '#9E9E9E';
    }

    let interpretation = '';
    if (correlation > 0.2) {
      interpretation = 'Correlação positiva: quando seu bem-estar melhora, seu treino tende a melhorar também.';
    } else if (correlation < -0.2) {
      interpretation = 'Correlação negativa: quando seu bem-estar piora, seu treino tende a melhorar.';
    } else {
      interpretation = 'Pouca correlação: seu bem-estar e treino não parecem estar relacionados.';
    }

    return {
      value: correlation.toFixed(2),
      strength,
      strengthColor,
      interpretation,
      dataPoints: correlationData.length
    };
  };

  const correlation = calculateCorrelation();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons name="chart-scatter-plot" size={isMobile ? 24 : 28} color="#2196F3" />
            <View style={styles.headerText}>
              <Text style={styles.mainTitle}>Análise de Correlação</Text>
              <Text style={styles.subtitle}>Compare dados de bem-estar com métricas de treino</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Seleção Rápida de Métricas */}
      <Card style={styles.quickSelectCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Comparar:</Text>
          
          {/* Bem-estar */}
          <View style={styles.quickMetricSection}>
            <Text style={styles.quickLabel}>Bem-estar:</Text>
            <View style={styles.quickGrid}>
              {WELLBEING_METRICS.slice(0, 3).map((metric) => (
                <Chip
                  key={metric.value}
                  selected={selectedWellbeingMetric === metric.value}
                  onPress={() => setSelectedWellbeingMetric(metric.value)}
                  style={[
                    styles.quickChip,
                    selectedWellbeingMetric === metric.value && { backgroundColor: metric.color + '20' }
                  ]}
                  textStyle={[
                    styles.quickChipText,
                    selectedWellbeingMetric === metric.value && { color: metric.color, fontWeight: 'bold' }
                  ]}
                  compact={isMobile}
                >
                  {metric.label}
                </Chip>
              ))}
            </View>
          </View>

          {/* Treino */}
          <View style={styles.quickMetricSection}>
            <Text style={styles.quickLabel}>Treino:</Text>
            <View style={styles.quickGrid}>
              {TRAINING_METRICS.slice(0, 3).map((metric) => (
                <Chip
                  key={metric.value}
                  selected={selectedTrainingMetric === metric.value}
                  onPress={() => setSelectedTrainingMetric(metric.value)}
                  style={[
                    styles.quickChip,
                    selectedTrainingMetric === metric.value && { backgroundColor: metric.color + '20' }
                  ]}
                  textStyle={[
                    styles.quickChipText,
                    selectedTrainingMetric === metric.value && { color: metric.color, fontWeight: 'bold' }
                  ]}
                  compact={isMobile}
                >
                  {metric.label}
                </Chip>
              ))}
            </View>
          </View>

          {/* Período */}
          <View style={styles.quickMetricSection}>
            <Text style={styles.quickLabel}>Período:</Text>
            <View style={styles.quickGrid}>
              <Chip
                selected={selectedPeriod === 'week'}
                onPress={() => setSelectedPeriod('week')}
                style={[
                  styles.quickChip,
                  selectedPeriod === 'week' && { backgroundColor: '#FF9800' + '20' }
                ]}
                textStyle={[
                  styles.quickChipText,
                  selectedPeriod === 'week' && { color: '#FF9800', fontWeight: 'bold' }
                ]}
                compact={isMobile}
              >
                7 dias
              </Chip>
              <Chip
                selected={selectedPeriod === 'month'}
                onPress={() => setSelectedPeriod('month')}
                style={[
                  styles.quickChip,
                  selectedPeriod === 'month' && { backgroundColor: '#FF9800' + '20' }
                ]}
                textStyle={[
                  styles.quickChipText,
                  selectedPeriod === 'month' && { color: '#FF9800', fontWeight: 'bold' }
                ]}
                compact={isMobile}
              >
                30 dias
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Resultado da Correlação */}
      <Card style={styles.resultCard}>
        <Card.Content>
          <View style={styles.resultHeader}>
            <MaterialCommunityIcons name="chart-scatter-plot" size={isMobile ? 20 : 24} color="#2196F3" />
            <Text style={styles.resultTitle}>Correlação: {selectedWellbeingInfo?.label} vs {selectedTrainingInfo?.label}</Text>
          </View>
          
          {correlationData.length > 0 ? (
            <>
              <View style={styles.correlationGrid}>
                <View style={styles.correlationItem}>
                  <Text style={styles.correlationLabel}>Coeficiente</Text>
                  <Text style={styles.correlationValue}>{correlation.value}</Text>
                </View>
                <View style={styles.correlationItem}>
                  <Text style={styles.correlationLabel}>Força</Text>
                  <Text style={[styles.correlationValue, { color: correlation.strengthColor }]}>
                    {correlation.strength}
                  </Text>
                </View>
                <View style={styles.correlationItem}>
                  <Text style={styles.correlationLabel}>Pontos</Text>
                  <Text style={styles.correlationValue}>{correlation.dataPoints}</Text>
                </View>
              </View>
              
              <View style={styles.interpretationContainer}>
                <Text style={styles.interpretationText}>{correlation.interpretation}</Text>
              </View>
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <MaterialCommunityIcons name="chart-line" size={isMobile ? 36 : 48} color="#ccc" />
              <Text style={styles.noDataText}>Nenhum dado para correlação</Text>
              <Text style={styles.noDataSubtext}>
                Faça check-ins e treinos no mesmo dia para ver correlações
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Gráfico de Dispersão */}
      {correlationData.length > 0 && (
        <Card style={styles.scatterCard}>
          <Card.Content>
            <Text style={styles.scatterTitle}>Visualização da Correlação</Text>
            <View style={styles.scatterContainer}>
              <View style={styles.scatterPlot}>
                {correlationData.map((point, index) => {
                  const maxWellbeing = Math.max(...correlationData.map(p => p.wellbeing), 1);
                  const maxTraining = Math.max(...correlationData.map(p => p.training), 1);
                  
                  return (
                    <View
                      key={index}
                      style={[
                        styles.scatterPoint,
                        {
                          left: (point.wellbeing / maxWellbeing) * 200,
                          bottom: (point.training / maxTraining) * 150,
                          backgroundColor: Number(correlation.value) > 0 ? '#4CAF50' : '#F44336',
                        }
                      ]}
                    />
                  );
                })}
              </View>
              <View style={styles.axisLabels}>
                <Text style={styles.axisLabel}>{selectedWellbeingInfo?.label}</Text>
                <Text style={styles.axisLabelVertical}>{selectedTrainingInfo?.label}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: isMobile ? 12 : 16,
  },
  headerCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  mainTitle: {
    fontSize: isMobile ? 18 : 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: isMobile ? 12 : 14,
    color: '#666',
  },
  quickSelectCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickMetricSection: {
    marginBottom: 16,
  },
  quickLabel: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isMobile ? 6 : 8,
  },
  quickChip: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickChipText: {
    color: '#333',
    fontSize: isMobile ? 11 : 12,
  },
  resultCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  correlationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  correlationItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: isMobile ? 10 : 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  correlationLabel: {
    fontSize: isMobile ? 10 : 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  correlationValue: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
  },
  interpretationContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
  },
  interpretationText: {
    fontSize: isMobile ? 12 : 14,
    color: '#1976d2',
    lineHeight: isMobile ? 16 : 18,
  },
  scatterCard: {
    borderRadius: 12,
  },
  scatterTitle: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  scatterContainer: {
    height: isMobile ? 160 : 200,
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
    width: isMobile ? 6 : 8,
    height: isMobile ? 6 : 8,
    borderRadius: isMobile ? 3 : 4,
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
    fontSize: isMobile ? 8 : 10,
    color: '#666',
    textAlign: 'center',
  },
  axisLabelVertical: {
    fontSize: isMobile ? 8 : 10,
    color: '#666',
    transform: [{ rotate: '-90deg' }],
    position: 'absolute',
    left: -40,
    top: 80,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: isMobile ? 30 : 40,
  },
  noDataText: {
    fontSize: isMobile ? 14 : 16,
    color: '#666',
    marginTop: 8,
  },
  noDataSubtext: {
    fontSize: isMobile ? 10 : 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
}); 