import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, Chip, Button, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

// Métricas de Treino com descrições detalhadas
const TRAINING_METRICS = [
  { 
    label: 'Distância', 
    value: 'distance',
    icon: 'map-marker-distance',
    color: '#4CAF50',
    unit: 'km',
    field: 'distance_km',
    description: 'Distância total percorrida no treino',
  },
  { 
    label: 'Duração', 
    value: 'duration',
    icon: 'clock-outline',
    color: '#2196F3',
    unit: 'min',
    field: 'duration_minutes',
    description: 'Tempo total de duração do treino',
  },
  { 
    label: 'Esforço Percebido', 
    value: 'perceived_effort',
    icon: 'gauge',
    color: '#FF9800',
    unit: '1-10',
    field: 'perceived_effort',
    description: 'Nível de esforço percebido durante o treino',
  },
  { 
    label: 'Satisfação', 
    value: 'satisfaction',
    icon: 'heart-outline',
    color: '#E91E63',
    unit: '1-10',
    field: 'session_satisfaction',
    description: 'Nível de satisfação com o treino realizado',
  },
];

// Períodos de análise
const ANALYSIS_PERIODS = [
  { label: 'Última Semana', value: 'week', days: 7 },
  { label: 'Últimas 2 Semanas', value: 'two_weeks', days: 14 },
  { label: 'Último Mês', value: 'month', days: 30 },
  { label: 'Últimos 3 Meses', value: 'three_months', days: 90 },
];

// Tipos de análise
const ANALYSIS_TYPES = [
  { 
    label: 'Treinos Realizados', 
    value: 'completed', 
    color: '#4CAF50',
    icon: 'check-circle',
    description: 'Análise dos treinos que foram efetivamente realizados'
  },
  { 
    label: 'Treinos Planejados', 
    value: 'planned', 
    color: '#2196F3',
    icon: 'calendar-clock',
    description: 'Análise dos treinos que foram planejados'
  },
  { 
    label: 'Comparação P vs R', 
    value: 'comparison', 
    color: '#FF9800',
    icon: 'compare-horizontal',
    description: 'Comparação entre treinos planejados e realizados'
  },
];

// Tipos de visualização
const VIEW_TYPES = [
  { label: 'Gráfico', value: 'chart', icon: 'chart-bar' },
  { label: 'Estatísticas', value: 'stats', icon: 'chart-pie' },
  { label: 'Evolução', value: 'evolution', icon: 'trending-up' },
];

export default function TrainingChartsTab() {
  const [selectedMetric, setSelectedMetric] = useState('distance');
  const [selectedAnalysis, setSelectedAnalysis] = useState('completed');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedViewType, setSelectedViewType] = useState('chart');
  
  const { trainingSessions, fetchTrainingSessions } = useCheckinStore();

  useEffect(() => {
    fetchTrainingSessions();
  }, [fetchTrainingSessions]);

  const selectedMetricInfo = TRAINING_METRICS.find(m => m.value === selectedMetric);
  const selectedAnalysisInfo = ANALYSIS_TYPES.find(a => a.value === selectedAnalysis);
  const selectedPeriodInfo = ANALYSIS_PERIODS.find(p => p.value === selectedPeriod);

  // Filtrar treinos por período selecionado
  const getFilteredSessions = () => {
    if (!trainingSessions || trainingSessions.length === 0) return [];
    
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - (selectedPeriodInfo?.days || 7));
    
    return trainingSessions.filter(session => {
      if (!session.training_date) return false;
      const sessionDate = new Date(session.training_date);
      return sessionDate >= startDate && sessionDate <= today;
    }).sort((a, b) => new Date(a.training_date).getTime() - new Date(b.training_date).getTime());
  };

  // Processar dados de treinos para análise
  const getTrainingAnalysis = () => {
    const filteredSessions = getFilteredSessions();
    
    if (filteredSessions.length === 0) {
      return {
        completedSessions: [],
        plannedSessions: [],
        completionRate: 0,
        averageMetrics: {},
        weeklyData: [],
        comparisonData: []
      };
    }

    // Separar treinos por status
    const completedSessions = filteredSessions.filter(s => s.status === 'completed');
    const plannedSessions = filteredSessions.filter(s => s.status === 'planned');

    // Calcular taxa de conclusão
    const completionRate = plannedSessions.length > 0 ? 
      (completedSessions.length / plannedSessions.length) * 100 : 0;

    // Calcular métricas médias para treinos realizados
    const averageMetrics = TRAINING_METRICS.reduce((acc, metric) => {
      const values = completedSessions.map(session => {
        switch (metric.value) {
          case 'distance':
            return session.distance_km || 0;
          case 'duration':
            const hours = parseInt(String(session.duracao_horas)) || 0;
            const minutes = parseInt(String(session.duracao_minutos)) || 0;
            return hours * 60 + minutes;
          case 'perceived_effort':
            return session.perceived_effort || 0;
          case 'satisfaction':
            return session.session_satisfaction || 0;
          default:
            return 0;
        }
      }).filter(v => v > 0);

      acc[metric.value] = values.length > 0 ? 
        values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      
      return acc;
    }, {} as Record<string, number>);

    // Dados semanais para evolução
    const weeklyMap = new Map();
    completedSessions.forEach(session => {
      const date = new Date(session.training_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // Segunda-feira
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, []);
      }
      weeklyMap.get(weekKey).push(session);
    });

    const weeklyData = Array.from(weeklyMap.entries()).map(([weekStart, sessions]) => {
      const weekMetrics = TRAINING_METRICS.reduce((acc, metric) => {
        const values = sessions.map((session: any) => {
          switch (metric.value) {
            case 'distance':
              return session.distance_km || 0;
            case 'duration':
              const hours = parseInt(String(session.duracao_horas)) || 0;
              const minutes = parseInt(String(session.duracao_minutos)) || 0;
              return hours * 60 + minutes;
            case 'perceived_effort':
              return session.perceived_effort || 0;
            case 'satisfaction':
              return session.session_satisfaction || 0;
            default:
              return 0;
          }
        }).filter((v: number) => v > 0);

        acc[metric.value] = values.length > 0 ? 
          values.reduce((sum: number, val: number) => sum + val, 0) / values.length : 0;
        
        return acc;
      }, {} as Record<string, number>);

      return {
        weekStart,
        sessionCount: sessions.length,
        metrics: weekMetrics
      };
    }).sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

    // Dados de comparação (últimos 7 dias)
    const comparisonData: Array<{
      date: string;
      planned: number;
      completed: number;
      plannedMetric: number;
      completedMetric: number;
    }> = [];
    const last7Days: string[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    last7Days.forEach(dateStr => {
      const plannedForDay = plannedSessions.filter(s => s.training_date === dateStr);
      const completedForDay = completedSessions.filter(s => s.training_date === dateStr);
      
      comparisonData.push({
        date: dateStr,
        planned: plannedForDay.length,
        completed: completedForDay.length,
        plannedMetric: plannedForDay.length > 0 ? 
          getMetricValue(plannedForDay[0], selectedMetric) : 0,
        completedMetric: completedForDay.length > 0 ? 
          getMetricValue(completedForDay[0], selectedMetric) : 0,
      });
    });

    return {
      completedSessions,
      plannedSessions,
      completionRate,
      averageMetrics,
      weeklyData,
      comparisonData
    };
  };

  // Função auxiliar para extrair valor da métrica
  const getMetricValue = (session: any, metric: string) => {
    switch (metric) {
      case 'distance':
        return session.distance_km || 0;
      case 'duration':
        const hours = parseInt(String(session.duracao_horas)) || 0;
        const minutes = parseInt(String(session.duracao_minutos)) || 0;
        return hours * 60 + minutes;
      case 'perceived_effort':
        return session.perceived_effort || 0;
      case 'satisfaction':
        return session.session_satisfaction || 0;
      default:
        return 0;
    }
  };

  const analysis = getTrainingAnalysis();

  // Funções de renderização para diferentes tipos de visualização
  const renderVisualization = () => {
    if (analysis.completedSessions.length === 0 && analysis.plannedSessions.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.noDataContainer}>
              <MaterialCommunityIcons name="run" size={isMobile ? 36 : 48} color="#ccc" />
              <Text style={styles.noDataText}>Nenhum dado de treino disponível</Text>
              <Text style={styles.noDataSubtext}>
                Cadastre alguns treinos para ver as análises
              </Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    switch (selectedViewType) {
      case 'chart':
        return renderChartView();
      case 'stats':
        return renderStatsView();
      case 'evolution':
        return renderEvolutionView();
      default:
        return renderChartView();
    }
  };

  const renderChartView = () => {
    const data = selectedAnalysis === 'comparison' ? 
      analysis.comparisonData : 
      analysis.comparisonData.map(d => ({
        ...d,
        value: selectedAnalysis === 'planned' ? d.plannedMetric : d.completedMetric
      }));

    const maxValue = Math.max(...data.map(d => 
      selectedAnalysis === 'comparison' ? 
        Math.max(d.plannedMetric, d.completedMetric) : 
        d.value || 0
    ), 1);

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <MaterialCommunityIcons 
                name={selectedMetricInfo?.icon as any} 
                size={isMobile ? 20 : 24} 
                color={selectedMetricInfo?.color} 
              />
              <Text style={styles.chartTitle}>
                {selectedMetricInfo?.label} - {selectedAnalysisInfo?.label}
              </Text>
            </View>
            <Text style={styles.unitText}>{selectedMetricInfo?.unit}</Text>
          </View>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {data.slice(-7).map((item, index) => (
                <View key={index} style={styles.barWrapper}>
                  {selectedAnalysis === 'comparison' ? (
                    <View style={styles.comparisonBars}>
                      <View 
                        style={[
                          styles.bar,
                          styles.plannedBar,
                          { height: (item.plannedMetric / maxValue) * 80 }
                        ]}
                      />
                      <View 
                        style={[
                          styles.bar,
                          styles.completedBar,
                          { height: (item.completedMetric / maxValue) * 80 }
                        ]}
                      />
                    </View>
                  ) : (
                    <View 
                      style={[
                        styles.bar,
                        {
                          height: ((item.value || 0) / maxValue) * 100,
                          backgroundColor: selectedAnalysisInfo?.color
                        }
                      ]}
                    />
                  )}
                  <Text style={styles.barLabel}>
                    {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </Text>
                  {selectedAnalysis !== 'comparison' && (
                    <Text style={styles.barValue}>
                      {(item.value || 0).toFixed(1)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {selectedAnalysis === 'comparison' && (
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
                <Text style={styles.legendText}>Planejado</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Realizado</Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderStatsView = () => {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Estatísticas Detalhadas</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Taxa de Conclusão</Text>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {analysis.completionRate.toFixed(1)}%
              </Text>
              <ProgressBar 
                progress={analysis.completionRate / 100} 
                color="#4CAF50"
                style={styles.progressBar}
              />
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Treinos Realizados</Text>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {analysis.completedSessions.length}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Treinos Planejados</Text>
              <Text style={[styles.statValue, { color: '#2196F3' }]}>
                {analysis.plannedSessions.length}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Média {selectedMetricInfo?.label}</Text>
              <Text style={[styles.statValue, { color: selectedMetricInfo?.color }]}>
                {(analysis.averageMetrics[selectedMetric] || 0).toFixed(1)} {selectedMetricInfo?.unit}
              </Text>
            </View>
          </View>

          <View style={styles.metricsOverview}>
            <Text style={styles.overviewTitle}>Médias Gerais (Treinos Realizados)</Text>
            {TRAINING_METRICS.map((metric) => (
              <View key={metric.value} style={styles.overviewItem}>
                <View style={styles.overviewHeader}>
                  <MaterialCommunityIcons 
                    name={metric.icon as any} 
                    size={16} 
                    color={metric.color} 
                  />
                  <Text style={styles.overviewLabel}>{metric.label}</Text>
                </View>
                <Text style={[styles.overviewValue, { color: metric.color }]}>
                  {(analysis.averageMetrics[metric.value] || 0).toFixed(1)} {metric.unit}
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEvolutionView = () => {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Evolução Semanal</Text>
          
          {analysis.weeklyData.length > 0 ? (
            <View style={styles.evolutionContainer}>
              {analysis.weeklyData.map((week, index) => (
                <View key={index} style={styles.weekItem}>
                  <View style={styles.weekHeader}>
                    <Text style={styles.weekLabel}>
                      Semana {new Date(week.weekStart).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </Text>
                    <Text style={styles.weekCount}>{week.sessionCount} treinos</Text>
                  </View>
                  
                  <View style={styles.weekMetrics}>
                    <Text style={styles.weekAverage}>
                      {(week.metrics[selectedMetric] || 0).toFixed(1)} {selectedMetricInfo?.unit}
                    </Text>
                    <ProgressBar 
                      progress={Math.min(week.metrics[selectedMetric] / 
                        Math.max(...analysis.weeklyData.map(w => w.metrics[selectedMetric]), 1), 1)} 
                      color={selectedMetricInfo?.color}
                      style={styles.weekProgressBar}
                    />
                  </View>
                  
                  {index > 0 && (
                    <View style={styles.weekTrend}>
                      {week.metrics[selectedMetric] > analysis.weeklyData[index - 1].metrics[selectedMetric] ? (
                        <MaterialCommunityIcons name="trending-up" size={16} color="#4CAF50" />
                      ) : week.metrics[selectedMetric] < analysis.weeklyData[index - 1].metrics[selectedMetric] ? (
                        <MaterialCommunityIcons name="trending-down" size={16} color="#F44336" />
                      ) : (
                        <MaterialCommunityIcons name="trending-neutral" size={16} color="#666" />
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>Dados insuficientes para análise semanal</Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Controles Principais */}
      <Card style={styles.controlsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Análise de Treinos</Text>
          
          {/* Seleção de Período */}
          <View style={styles.controlSection}>
            <Text style={styles.controlLabel}>Período de Análise:</Text>
            <View style={styles.periodGrid}>
              {ANALYSIS_PERIODS.map((period) => (
                <Chip
                  key={period.value}
                  selected={selectedPeriod === period.value}
                  onPress={() => setSelectedPeriod(period.value)}
                  style={[
                    styles.controlChip,
                    selectedPeriod === period.value && { backgroundColor: '#2196F3' + '20' }
                  ]}
                  textStyle={[
                    styles.controlChipText,
                    selectedPeriod === period.value && { color: '#2196F3', fontWeight: 'bold' }
                  ]}
                  compact={isMobile}
                >
                  {period.label}
                </Chip>
              ))}
            </View>
          </View>

          {/* Tipo de Análise */}
          <View style={styles.controlSection}>
            <Text style={styles.controlLabel}>Tipo de Análise:</Text>
            <View style={styles.analysisGrid}>
              {ANALYSIS_TYPES.map((type) => (
                <Chip
                  key={type.value}
                  selected={selectedAnalysis === type.value}
                  onPress={() => setSelectedAnalysis(type.value)}
                  style={[
                    styles.controlChip,
                    selectedAnalysis === type.value && { backgroundColor: type.color + '20' }
                  ]}
                  textStyle={[
                    styles.controlChipText,
                    selectedAnalysis === type.value && { color: type.color, fontWeight: 'bold' }
                  ]}
                  icon={type.icon}
                  compact={isMobile}
                >
                  {isMobile ? type.label.split(' ')[0] : type.label}
                </Chip>
              ))}
            </View>
          </View>

          {/* Tipo de Visualização */}
          <View style={styles.controlSection}>
            <Text style={styles.controlLabel}>Visualização:</Text>
            <View style={styles.viewTypeGrid}>
              {VIEW_TYPES.map((type) => (
                <Chip
                  key={type.value}
                  selected={selectedViewType === type.value}
                  onPress={() => setSelectedViewType(type.value)}
                  style={[
                    styles.controlChip,
                    selectedViewType === type.value && { backgroundColor: '#4CAF50' + '20' }
                  ]}
                  textStyle={[
                    styles.controlChipText,
                    selectedViewType === type.value && { color: '#4CAF50', fontWeight: 'bold' }
                  ]}
                  icon={type.icon}
                  compact={isMobile}
                >
                  {type.label}
                </Chip>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* Seleção de Métrica */}
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Métrica de Treino:</Text>
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
                compact={isMobile}
              >
                {isMobile ? metric.label.split(' ')[0] : metric.label}
              </Chip>
            ))}
          </View>
          
          {/* Descrição da Métrica Selecionada */}
          {selectedMetricInfo && (
            <View style={styles.metricDescription}>
              <Text style={styles.descriptionText}>{selectedMetricInfo.description}</Text>
              <Text style={styles.unitText}>Unidade: {selectedMetricInfo.unit}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Resumo Geral */}
      {(analysis.completedSessions.length > 0 || analysis.plannedSessions.length > 0) && (
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryHeader}>
              <MaterialCommunityIcons 
                name="chart-timeline-variant" 
                size={isMobile ? 18 : 20} 
                color="#666" 
              />
              <Text style={styles.summaryTitle}>Resumo - {selectedPeriodInfo?.label}</Text>
            </View>
            
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Taxa de Conclusão</Text>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                  {analysis.completionRate.toFixed(1)}%
                </Text>
                <ProgressBar 
                  progress={analysis.completionRate / 100} 
                  color="#4CAF50"
                  style={styles.progressBar}
                />
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Realizados</Text>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                  {analysis.completedSessions.length}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Planejados</Text>
                <Text style={[styles.summaryValue, { color: '#2196F3' }]}>
                  {analysis.plannedSessions.length}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Média {selectedMetricInfo?.label}</Text>
                <Text style={[styles.summaryValue, { color: selectedMetricInfo?.color }]}>
                  {(analysis.averageMetrics[selectedMetric] || 0).toFixed(1)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Visualização Principal */}
      {renderVisualization()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: isMobile ? 12 : 16,
  },
  controlsCard: {
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
  controlSection: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isMobile ? 6 : 8,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isMobile ? 6 : 8,
  },
  viewTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isMobile ? 6 : 8,
  },
  controlChip: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  controlChipText: {
    color: '#333',
    fontSize: isMobile ? 11 : 12,
  },
  metricsCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isMobile ? 6 : 8,
  },
  metricChip: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  metricChipText: {
    color: '#333',
    fontSize: isMobile ? 11 : 12,
  },
  metricDescription: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  descriptionText: {
    fontSize: isMobile ? 12 : 14,
    color: '#333',
    marginBottom: 4,
  },
  unitText: {
    fontSize: isMobile ? 10 : 12,
    color: '#666',
    fontStyle: 'italic',
  },
  summaryCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: isMobile ? 10 : 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: isMobile ? 10 : 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chartTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  chartContainer: {
    height: isMobile ? 160 : 200,
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
    width: isMobile ? 32 : 40,
    height: '100%',
  },
  bar: {
    borderRadius: 4,
    minHeight: 10,
  },
  comparisonBars: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: '100%',
    height: '100%',
    gap: 2,
  },
  plannedBar: {
    backgroundColor: '#2196F3',
    width: '45%',
  },
  completedBar: {
    backgroundColor: '#4CAF50',
    width: '45%',
  },
  barLabel: {
    fontSize: isMobile ? 8 : 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  barValue: {
    fontSize: isMobile ? 10 : 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: isMobile ? 12 : 14,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: isMobile ? 10 : 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: isMobile ? 10 : 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  metricsOverview: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  overviewTitle: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  overviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: isMobile ? 12 : 14,
    color: '#333',
    marginLeft: 8,
  },
  overviewValue: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: 'bold',
  },
  evolutionContainer: {
    gap: 12,
  },
  weekItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    position: 'relative',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekLabel: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: 'bold',
    color: '#333',
  },
  weekCount: {
    fontSize: isMobile ? 10 : 12,
    color: '#666',
  },
  weekMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weekAverage: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 60,
  },
  weekProgressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  weekTrend: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: isMobile ? 30 : 40,
  },
  noDataText: {
    fontSize: isMobile ? 14 : 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: isMobile ? 10 : 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
}); 