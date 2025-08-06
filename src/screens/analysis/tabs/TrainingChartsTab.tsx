import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';

const TRAINING_METRICS = [
  { 
    label: 'Distância', 
    value: 'distance',
    icon: 'map-marker-distance',
    color: '#4CAF50',
    unit: 'km',
  },
  { 
    label: 'Duração', 
    value: 'duration',
    icon: 'clock-outline',
    color: '#2196F3',
    unit: 'min',
  },
  { 
    label: 'Esforço', 
    value: 'effort_level',
    icon: 'gauge',
    color: '#FF9800',
    unit: 'muito leve - muito forte',
  },
  { 
    label: 'Intensidade', 
    value: 'intensity',
    icon: 'speedometer',
    color: '#F44336',
    unit: 'Z1-Z5',
  },
];

const ANALYSIS_TYPES = [
  { label: 'Realizados', value: 'completed', color: '#4CAF50' },
  { label: 'Planejados', value: 'planned', color: '#2196F3' },
  { label: 'Comparação', value: 'comparison', color: '#FF9800' },
];

export default function TrainingChartsTab() {
  const [selectedMetric, setSelectedMetric] = useState('distance');
  const [selectedAnalysis, setSelectedAnalysis] = useState('completed');
  
  // Datas fixas para teste - semana 28/07 a 03/08
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date('2025-07-28'));
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date('2025-08-03'));
  
  const { trainingSessions, fetchTrainingSessions } = useCheckinStore();

  useEffect(() => {
    fetchTrainingSessions();
  }, [fetchTrainingSessions]);

  // Função para navegar entre semanas
  const navigateWeek = (direction: 'prev' | 'next') => {
    const currentStart = new Date(customStartDate);
    if (direction === 'prev') {
      currentStart.setDate(currentStart.getDate() - 7);
    } else {
      currentStart.setDate(currentStart.getDate() + 7);
    }
    
    const newEnd = new Date(currentStart);
    newEnd.setDate(currentStart.getDate() + 6);
    
    setCustomStartDate(currentStart);
    setCustomEndDate(newEnd);
  };

  const selectedMetricInfo = TRAINING_METRICS.find(m => m.value === selectedMetric);

  // FUNÇÃO SIMPLES: Filtrar dados por período
  const getFilteredSessions = () => {
    if (!trainingSessions || trainingSessions.length === 0) return [];
    
    return trainingSessions.filter(session => {
      if (!session.training_date) return false;
      
      const sessionDate = new Date(session.training_date);
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      
      // Comparar apenas data (sem hora)
      const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      return sessionDateOnly >= startDateOnly && sessionDateOnly <= endDateOnly;
    });
  };

  // FUNÇÃO SIMPLES: Calcular dados do gráfico
  const getMetricData = () => {
    const filteredSessions = getFilteredSessions();
    
    console.log('🔍 DEBUG - Dados filtrados:', {
      totalSessions: trainingSessions.length,
      filteredSessions: filteredSessions.length,
      selectedAnalysis,
      selectedMetric,
      sessions: filteredSessions.map(s => ({
        id: s.id,
        status: s.status,
        date: s.training_date,
        distance_km: s.distance_km
      }))
    });

    // Separar por tipo de análise
    let sessionsToShow = [];
    if (selectedAnalysis === 'completed') {
      sessionsToShow = filteredSessions.filter(s => s.status === 'completed');
    } else if (selectedAnalysis === 'planned') {
      sessionsToShow = filteredSessions.filter(s => s.status === 'planned');
    } else {
      sessionsToShow = filteredSessions; // Comparação: mostrar todos
    }

    // Criar dados para 7 dias (segunda a domingo)
    const weekDays = [];
    const startDate = new Date(customStartDate);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dateStr = currentDate.toISOString().split('T')[0];
      const sessionForDay = sessionsToShow.find(s => s.training_date === dateStr);
      
      let value = 0;
      if (sessionForDay) {
        switch (selectedMetric) {
          case 'distance':
            value = sessionForDay.distance_km || 0;
            break;
          case 'duration':
            const hours = parseInt(sessionForDay.duracao_horas || '0') || 0;
            const minutes = parseInt(sessionForDay.duracao_minutos || '0') || 0;
            value = hours * 60 + minutes;
            break;
          case 'effort_level':
            value = selectedAnalysis === 'planned' ? 
              (parseInt(sessionForDay.esforco || '0') || 0) : 
              (sessionForDay.effort_level || 0);
            break;
          case 'intensity':
            if (sessionForDay.intensidade) {
              const intensityStr = sessionForDay.intensidade.toString().toUpperCase();
              if (intensityStr.startsWith('Z')) {
                const zoneNumber = parseInt(intensityStr.substring(1));
                value = zoneNumber >= 1 && zoneNumber <= 5 ? zoneNumber : 0;
              } else {
                value = parseInt(intensityStr) || 0;
              }
            }
            break;
          default:
            value = 0;
        }
      }
      
      weekDays.push({
        date: dateStr,
        value: value,
      });
    }
    
    return weekDays;
  };

  const metricData = getMetricData();
  const maxValue = Math.max(...metricData.map(d => d.value), 1);

  // FUNÇÃO SIMPLES: Calcular resumo
  const getSummary = () => {
    const filteredSessions = getFilteredSessions();
    
    const completedSessions = filteredSessions.filter(s => s.status === 'completed');
    const plannedSessions = filteredSessions.filter(s => s.status === 'planned');
    
    const totalDistance = completedSessions.reduce((sum, session) => sum + (session.distance_km || 0), 0);
    const totalDuration = completedSessions.reduce((sum, session) => {
      const hours = parseInt(session.duracao_horas || '0') || 0;
      const minutes = parseInt(session.duracao_minutos || '0') || 0;
      return sum + hours + (minutes / 60);
    }, 0);
    
    const avgIntensity = completedSessions.length > 0 ? 
      completedSessions.reduce((sum, s) => sum + (s.perceived_effort || 0), 0) / completedSessions.length : 0;
    
    const completionRate = plannedSessions.length > 0 ? 
      (completedSessions.length / plannedSessions.length) * 100 : 0;
    
    return {
      totalSessions: completedSessions.length,
      totalPlanned: plannedSessions.length,
      totalDistance: totalDistance.toFixed(1),
      totalDuration: totalDuration.toFixed(1),
      avgIntensity: avgIntensity.toFixed(1),
      completionRate: completionRate.toFixed(1)
    };
  };

  const summary = getSummary();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Navegação Semanal */}
      <Card style={styles.navigationCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Período de Análise:</Text>
          <View style={styles.navigationContainer}>
            <Button
              mode="outlined"
              onPress={() => navigateWeek('prev')}
              icon="chevron-left"
              style={styles.navButton}
            >
              Semana Anterior
            </Button>
            <View style={styles.weekInfo}>
              <Text style={styles.weekLabel}>
                {customStartDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {customEndDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </Text>
            </View>
            <Button
              mode="outlined"
              onPress={() => navigateWeek('next')}
              icon="chevron-right"
              style={styles.navButton}
            >
              Próxima Semana
            </Button>
          </View>
        </Card.Content>
      </Card>
      
      {/* Tipo de Análise */}
      <Card style={styles.analysisCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Tipo de Análise:</Text>
          <View style={styles.analysisGrid}>
            {ANALYSIS_TYPES.map((type) => (
              <Chip
                key={type.value}
                selected={selectedAnalysis === type.value}
                onPress={() => setSelectedAnalysis(type.value)}
                style={[
                  styles.analysisChip,
                  selectedAnalysis === type.value && { backgroundColor: type.color + '20' }
                ]}
                textStyle={[
                  styles.analysisChipText,
                  selectedAnalysis === type.value && { color: type.color, fontWeight: 'bold' }
                ]}
              >
                {type.label}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Seleção de Métricas */}
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Métricas:</Text>
          <View style={styles.metricsGrid}>
            {TRAINING_METRICS.map((metric) => (
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

      {/* Gráfico */}
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
            <Text style={styles.unitText}>{selectedMetricInfo?.unit}</Text>
          </View>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {metricData.map((item, index) => (
                <View key={index} style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar,
                      {
                        height: ((item.value || 0) / maxValue) * 100,
                        backgroundColor: selectedMetricInfo?.color
                      }
                    ]}
                  />
                  <Text style={styles.barLabel}>
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][index]}
                  </Text>
                  <Text style={styles.barValue}>
                    {(item.value || 0).toFixed(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Resumo */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text style={styles.summaryTitle}>
            Resumo - {customStartDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a {customEndDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Treinos Realizados</Text>
              <Text style={styles.summaryValue}>{summary.totalSessions}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Treinos Planejados</Text>
              <Text style={styles.summaryValue}>{summary.totalPlanned}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Taxa de Conclusão</Text>
              <Text style={styles.summaryValue}>{summary.completionRate}%</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Distância Total</Text>
              <Text style={styles.summaryValue}>{summary.totalDistance} km</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tempo Total</Text>
              <Text style={styles.summaryValue}>{summary.totalDuration}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Média Intensidade</Text>
              <Text style={styles.summaryValue}>{summary.avgIntensity}/10</Text>
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
  analysisCard: {
    marginBottom: 16,
    borderRadius: 12,
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
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  analysisChip: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  analysisChipText: {
    color: '#333',
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
  unitText: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  chartContainer: {
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 5,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 55,
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
    fontSize: 7,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
    textAlign: 'center',
    flexWrap: 'nowrap',
    maxWidth: 50,
  },
  summaryCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  navigationCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  navButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  weekInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  weekLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
}); 