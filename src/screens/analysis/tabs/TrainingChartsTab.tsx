import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';
import PeriodSelector, { PeriodType } from '../../../components/ui/PeriodSelector';
import { filterDataByPeriod, getPeriodLabel } from '../../../utils/periodFilter';

const TRAINING_METRICS = [
  // Métricas Básicas (comuns a planejado e realizado)
  { 
    label: 'Distância', 
    value: 'distance',
    icon: 'map-marker-distance',
    color: '#4CAF50',
    unit: 'km',
    planned: 'planned_distance_km',
    completed: 'distance_km',
  },
  { 
    label: 'Duração', 
    value: 'duration',
    icon: 'clock-outline',
    color: '#2196F3',
    unit: 'min',
    planned: 'planned_duration',
    completed: 'duration',
  },
  { 
    label: 'Elevação Positiva', 
    value: 'elevation_gain',
    icon: 'elevation-rise',
    color: '#795548',
    unit: 'm',
    planned: null, // Removido do planejado
    completed: 'elevation_gain_meters',
  },
  { 
    label: 'Elevação Negativa', 
    value: 'elevation_loss',
    icon: 'trending-down',
    color: '#8D6E63',
    unit: 'm',
    planned: null, // Removido do planejado
    completed: 'elevation_loss_meters',
  },
  { 
    label: 'Frequência Cardíaca', 
    value: 'avg_heart_rate',
    icon: 'heart-pulse',
    color: '#E91E63',
    unit: 'bpm',
    planned: null, // Removido do planejado
    completed: 'avg_heart_rate',
  },
  
  // Métricas de Esforço
  { 
    label: 'Esforço Percebido', 
    value: 'perceived_effort',
    icon: 'lightning-bolt',
    color: '#FF5722',
    unit: '/10',
    planned: null, // Removido do planejado
    completed: 'perceived_effort',
  },
  { 
    label: 'Esforço', 
    value: 'effort_level',
    icon: 'gauge',
    color: '#FF9800',
    unit: '1-5',
    planned: 'esforco',
    completed: 'effort_level',
  },
  { 
    label: 'Intensidade', 
    value: 'intensity',
    icon: 'speedometer',
    color: '#F44336',
    unit: 'Z1-Z5',
    planned: 'intensidade',
    completed: null, // Não existe no realizado
  },
  
  // Métricas de Satisfação e Qualidade (apenas realizado)
  { 
    label: 'Satisfação', 
    value: 'session_satisfaction',
    icon: 'heart',
    color: '#E91E63',
    unit: '/5',
    planned: null, // Não existe no planejado
    completed: 'session_satisfaction',
  },
  { 
    label: 'Clima', 
    value: 'max_heart_rate',
    icon: 'weather-partly-cloudy',
    color: '#D32F2F',
    unit: 'condições',
    planned: null, // Não existe no planejado
    completed: 'max_heart_rate',
  },
  
  // Métricas de Frequência
  { 
    label: 'Frequência Semanal', 
    value: 'frequency',
    icon: 'calendar-week',
    color: '#9C27B0',
    unit: 'x/sem',
    planned: null, // Calculado
    completed: null, // Calculado
  },
  
  // Métricas de Características (apenas planejado)
  { 
    label: 'Modalidade', 
    value: 'modalidade',
    icon: 'run',
    color: '#4CAF50',
    unit: 'tipo',
    planned: 'modalidade',
    completed: null, // Não existe no realizado
  },
  { 
    label: 'Tipo de Treino', 
    value: 'treino_tipo',
    icon: 'format-list-bulleted',
    color: '#2196F3',
    unit: 'tipo',
    planned: 'treino_tipo',
    completed: null, // Não existe no realizado
  },
  { 
    label: 'Terreno', 
    value: 'terreno',
    icon: 'terrain',
    color: '#795548',
    unit: 'tipo',
    planned: 'terreno',
    completed: null, // Não existe no realizado
  },
  { 
    label: 'Percurso', 
    value: 'percurso',
    icon: 'map',
    color: '#607D8B',
    unit: 'tipo',
    planned: 'percurso',
    completed: null, // Não existe no realizado
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
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('custom');
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const { trainingSessions, fetchTrainingSessions, calculateAnalytics } = useCheckinStore();

  useEffect(() => {
    fetchTrainingSessions();
  }, [fetchTrainingSessions]);

  // Logs de debug
  useEffect(() => {
    console.log('🔍 TrainingChartsTab - trainingSessions:', trainingSessions);
    console.log('🔍 TrainingChartsTab - selectedAnalysis:', selectedAnalysis);
    console.log('🔍 TrainingChartsTab - customStartDate:', customStartDate);
    console.log('🔍 TrainingChartsTab - customEndDate:', customEndDate);
    console.log('🔍 TrainingChartsTab - data atual:', new Date());
    console.log('🔍 TrainingChartsTab - completedSessions:', trainingSessions.filter(t => t.status === 'completed'));
    console.log('🔍 TrainingChartsTab - plannedSessions:', trainingSessions.filter(t => t.status === 'planned'));
  }, [trainingSessions, selectedAnalysis, customStartDate, customEndDate]);

  const selectedMetricInfo = TRAINING_METRICS.find(m => m.value === selectedMetric);
  const analytics = calculateAnalytics();
  
  const handleCustomDateChange = (startDate: Date, endDate: Date) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };
  
  // Separar dados por status
  const completedSessions = trainingSessions.filter(t => t.status === 'completed');
  const plannedSessions = trainingSessions.filter(t => t.status === 'planned');

  // Filtrar métricas disponíveis baseado no tipo de análise
  const getAvailableMetrics = () => {
    switch (selectedAnalysis) {
      case 'completed':
        return TRAINING_METRICS.filter(metric => metric.completed !== null);
      case 'planned':
        return TRAINING_METRICS.filter(metric => metric.planned !== null);
      case 'comparison':
        return TRAINING_METRICS.filter(metric => metric.planned !== null && metric.completed !== null);
      default:
        return TRAINING_METRICS;
    }
  };

  const availableMetrics = getAvailableMetrics();

  // Atualizar métrica selecionada se não estiver disponível no novo tipo de análise
  useEffect(() => {
    const isCurrentMetricAvailable = availableMetrics.some(m => m.value === selectedMetric);
    if (!isCurrentMetricAvailable && availableMetrics.length > 0) {
      setSelectedMetric(availableMetrics[0].value);
    }
  }, [selectedAnalysis, availableMetrics, selectedMetric]);

  // Calcular dados para a métrica selecionada
  const getMetricData = () => {
    const sessions = selectedAnalysis === 'completed' ? completedSessions : 
                   selectedAnalysis === 'planned' ? plannedSessions : 
                   completedSessions; // Para comparação, usar realizados como base

    console.log('🔍 getMetricData - sessions antes do filtro:', sessions);
    console.log('🔍 getMetricData - selectedPeriod:', selectedPeriod);
    console.log('🔍 getMetricData - customStartDate:', customStartDate);
    console.log('🔍 getMetricData - customEndDate:', customEndDate);

    // Filtrar dados por período
    const filteredSessions = filterDataByPeriod(sessions, selectedPeriod, customStartDate, customEndDate);

    console.log('🔍 getMetricData - filteredSessions:', filteredSessions);

    return filteredSessions.map(session => {
      let value = 0;
      let plannedValue = null;
      let actualValue = null;
      
      // Verificar se a métrica está disponível para o tipo de análise
      const metricInfo = selectedMetricInfo;
      if (!metricInfo) return null;
      
      if (selectedAnalysis === 'planned' && !metricInfo.planned) return null;
      if (selectedAnalysis === 'completed' && !metricInfo.completed) return null;
      
      switch (selectedMetric) {
        case 'distance':
          value = selectedAnalysis === 'planned' ? 
            (session.planned_distance_km || 0) : 
            (session.distance_km || 0);
          if (selectedAnalysis === 'comparison') {
            plannedValue = session.planned_distance_km || 0;
            actualValue = session.distance_km || 0;
          }
          break;
          
        case 'duration':
          if (selectedAnalysis === 'planned') {
            const plannedHours = session.planned_duration_hours ? parseInt(session.planned_duration_hours) : 0;
            const plannedMinutes = session.planned_duration_minutes ? parseInt(session.planned_duration_minutes) : 0;
            value = plannedHours * 60 + plannedMinutes;
          } else {
            const hours = session.duration_hours ? parseInt(session.duration_hours) : 0;
            const minutes = session.duration_minutes ? parseInt(session.duration_minutes) : 0;
            value = hours * 60 + minutes;
          }
          if (selectedAnalysis === 'comparison') {
            const plannedHours = session.planned_duration_hours ? parseInt(session.planned_duration_hours) : 0;
            const plannedMinutes = session.planned_duration_minutes ? parseInt(session.planned_duration_minutes) : 0;
            plannedValue = plannedHours * 60 + plannedMinutes;
            const hours = session.duration_hours ? parseInt(session.duration_hours) : 0;
            const minutes = session.duration_minutes ? parseInt(session.duration_minutes) : 0;
            actualValue = hours * 60 + minutes;
          }
          break;
          
        case 'elevation_gain':
          value = selectedAnalysis === 'planned' ? 
            (session.planned_elevation_gain_meters || 0) : 
            (session.elevation_gain_meters || 0);
          if (selectedAnalysis === 'comparison') {
            plannedValue = session.planned_elevation_gain_meters || 0;
            actualValue = session.elevation_gain_meters || 0;
          }
          break;
          
        case 'elevation_loss':
          value = selectedAnalysis === 'planned' ? 
            (session.planned_elevation_loss_meters || 0) : 
            (session.elevation_loss_meters || 0);
          if (selectedAnalysis === 'comparison') {
            plannedValue = session.planned_elevation_loss_meters || 0;
            actualValue = session.elevation_loss_meters || 0;
          }
          break;
          
        case 'avg_heart_rate':
          value = selectedAnalysis === 'planned' ? 
            (session.planned_avg_heart_rate || 0) : 
            (session.avg_heart_rate || 0);
          if (selectedAnalysis === 'comparison') {
            plannedValue = session.planned_avg_heart_rate || 0;
            actualValue = session.avg_heart_rate || 0;
          }
          break;
          
        case 'perceived_effort':
          value = selectedAnalysis === 'planned' ? 
            (session.planned_perceived_effort || 0) : 
            (session.perceived_effort || 0);
          if (selectedAnalysis === 'comparison') {
            plannedValue = session.planned_perceived_effort || 0;
            actualValue = session.perceived_effort || 0;
          }
          break;
          
        case 'effort_level':
          value = selectedAnalysis === 'planned' ? 
            (parseInt(session.esforco || '0') || 0) : 
            (session.effort_level || 0);
          if (selectedAnalysis === 'comparison') {
            plannedValue = parseInt(session.esforco || '0') || 0;
            actualValue = session.effort_level || 0;
          }
          break;
          
        case 'intensity':
          value = selectedAnalysis === 'planned' ? 
            (parseInt(session.intensidade as string) || 0) : 0;
          break;
          
        case 'session_satisfaction':
          value = session.session_satisfaction || 0;
          break;
          
        case 'max_heart_rate':
          value = session.max_heart_rate || 0;
          break;
          
        case 'modalidade':
          value = session.modalidade ? 1 : 0; // Contar se existe
          break;
          
        case 'treino_tipo':
          value = session.treino_tipo ? 1 : 0; // Contar se existe
          break;
          
        case 'terreno':
          value = session.terreno ? 1 : 0; // Contar se existe
          break;
          
        case 'percurso':
          value = session.percurso ? 1 : 0; // Contar se existe
          break;
          
        case 'frequency':
          // Contar treinos por semana
          const weekStart = new Date(session.training_date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          const weekSessions = sessions.filter(s => {
            const sWeekStart = new Date(s.training_date);
            sWeekStart.setDate(sWeekStart.getDate() - sWeekStart.getDay());
            return sWeekStart.toISOString().split('T')[0] === weekKey;
          });
          value = weekSessions.length;
          break;
      }
      
      return {
        date: session.training_date,
        value: value,
        plannedValue: plannedValue,
        actualValue: actualValue,
      };
    }).filter(item => item && item.value > 0);
  };

  const metricData = getMetricData();
  const maxValue = Math.max(...metricData.map(d => d?.value || 0), 1);

  // Calcular resumo
  const getSummary = () => {
    // Filtrar dados por período para o resumo
    const filteredCompletedSessions = filterDataByPeriod(completedSessions, selectedPeriod, customStartDate, customEndDate);
    const filteredPlannedSessions = filterDataByPeriod(plannedSessions, selectedPeriod, customStartDate, customEndDate);
    
    const totalSessions = filteredCompletedSessions.length;
    const totalPlanned = filteredPlannedSessions.length;
    const totalDistance = filteredCompletedSessions.reduce((sum, s) => sum + (s.distance_km || 0), 0);
    const totalDuration = filteredCompletedSessions.reduce((sum, s) => {
      const hours = s.duration_hours ? parseInt(s.duration_hours) : 0;
      const minutes = s.duration_minutes ? parseInt(s.duration_minutes) : 0;
      return sum + hours * 60 + minutes;
    }, 0);
    const avgIntensity = filteredCompletedSessions.length > 0 ? 
      filteredCompletedSessions.reduce((sum, s) => sum + (s.perceived_effort || 0), 0) / filteredCompletedSessions.length : 0;
    const completionRate = totalPlanned > 0 ? (totalSessions / totalPlanned) * 100 : 0;

    return {
      totalSessions,
      totalPlanned,
      totalDistance: totalDistance.toFixed(1),
      totalDuration: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`,
      avgIntensity: avgIntensity.toFixed(1),
      completionRate: completionRate.toFixed(1),
    };
  };

  const summary = getSummary();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Seletor de Período */}
      <PeriodSelector
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        onCustomDateChange={handleCustomDateChange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
      />
      
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
          <Text style={styles.sectionTitle}>
            {selectedAnalysis === 'completed' ? 'Métricas de Treinos Realizados:' :
             selectedAnalysis === 'planned' ? 'Métricas de Treinos Planejados:' :
             'Métricas para Comparação (Planejado vs Realizado):'}
          </Text>
          <View style={styles.metricsGrid}>
            {availableMetrics.map((metric) => (
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
              {selectedAnalysis === 'comparison' && (
                <Text style={styles.comparisonText}> (Planejado vs Realizado)</Text>
              )}
            </View>
            <Text style={styles.unitText}>{selectedMetricInfo?.unit}</Text>
          </View>
          
          <View style={styles.chartContainer}>
            {metricData.length > 0 ? (
              <View style={styles.chartBars}>
                {metricData.slice(-7).map((item, index) => (
                  <View key={index} style={styles.barWrapper}>
                    {selectedAnalysis === 'comparison' ? (
                      <>
                        {/* Barra planejada */}
                        <View 
                          style={[
                            styles.bar,
                            styles.plannedBar,
                            {
                              height: ((item?.plannedValue || 0) / maxValue) * 100,
                            }
                          ]}
                        />
                        {/* Barra realizada */}
                        <View 
                          style={[
                            styles.bar,
                            styles.completedBar,
                            {
                              height: ((item?.actualValue || 0) / maxValue) * 100,
                            }
                          ]}
                        />
                      </>
                    ) : (
                      <View 
                        style={[
                          styles.bar,
                          {
                            height: ((item?.value || 0) / maxValue) * 100,
                            backgroundColor: selectedMetricInfo?.color
                          }
                        ]}
                      />
                    )}
                    <Text style={styles.barLabel}>
                      {new Date(item?.date || '').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </Text>
                    <Text style={styles.barValue}>
                      {selectedAnalysis === 'comparison' ? 
                        `${item?.actualValue || 0}/${item?.plannedValue || 0}` : 
                        (item?.value || 0).toFixed(1)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialCommunityIcons name="chart-line" size={48} color="#ccc" />
                <Text style={styles.noDataText}>Nenhum dado disponível</Text>
                <Text style={styles.noDataSubtext}>
                  {selectedAnalysis === 'completed' ? 'Complete alguns treinos para ver os dados' :
                   selectedAnalysis === 'planned' ? 'Planeje alguns treinos para ver os dados' :
                   'Complete e planeje treinos para ver a comparação'}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Resumo Detalhado */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text style={styles.summaryTitle}>Resumo - {getPeriodLabel(selectedPeriod, customStartDate, customEndDate)}</Text>
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

      {/* Análise por Modalidade */}
      {analytics?.metricsByModality && (
        <Card style={styles.modalityCard}>
          <Card.Content>
            <Text style={styles.summaryTitle}>Análise por Modalidade</Text>
            {Object.entries(analytics.metricsByModality).map(([modality, data]) => (
              <View key={modality} style={styles.modalityItem}>
                <Text style={styles.modalityName}>{modality.charAt(0).toUpperCase() + modality.slice(1)}</Text>
                <View style={styles.modalityStats}>
                  <Text style={styles.modalityStat}>Treinos: {data.count}</Text>
                  <Text style={styles.modalityStat}>Distância: {data.totalDistance.toFixed(1)}km</Text>
                  <Text style={styles.modalityStat}>Esforço: {data.avgEffort.toFixed(1)}/10</Text>
                  <Text style={styles.modalityStat}>Satisfação: {data.avgSatisfaction.toFixed(1)}/5</Text>
                </View>
              </View>
            ))}
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
  comparisonText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
  plannedBar: {
    backgroundColor: '#2196F3',
    marginBottom: 2,
  },
  completedBar: {
    backgroundColor: '#4CAF50',
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  barValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
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
  modalityCard: {
    borderRadius: 12,
  },
  modalityItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalityName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalityStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modalityStat: {
    fontSize: 12,
    color: '#666',
    width: '48%',
    marginBottom: 4,
  },
}); 