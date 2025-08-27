import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, Chip, Button, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';
import { filterDataByPeriod, getPeriodLabel } from '../../../utils/periodFilter';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

// Métricas do Check-in Diário
const DAILY_METRICS = [
  { 
    label: 'Qualidade do Sono', 
    value: 'sleep_quality',
    icon: 'sleep',
    color: '#4CAF50',
    field: 'sleep_quality',
    description: 'Como você avalia a qualidade do seu sono?',
    scale: '1 (Muito ruim) - 10 (Excelente)'
  },
  { 
    label: 'Dores Musculares', 
    value: 'soreness',
    icon: 'human-handsup',
    color: '#FF5722',
    field: 'soreness',
    description: 'Nível de dores ou desconforto muscular',
    scale: '1 (Sem dor) - 10 (Dor extrema)'
  },
  { 
    label: 'Motivação', 
    value: 'motivation',
    icon: 'lightning-bolt',
    color: '#FFC107',
    field: 'motivation',
    description: 'Seu nível de motivação para treinar',
    scale: '1 (Desmotivado) - 10 (Muito motivado)'
  },
  { 
    label: 'Confiança', 
    value: 'confidence',
    icon: 'target',
    color: '#9C27B0',
    field: 'confidence',
    description: 'Confiança na sua capacidade de performance',
    scale: '1 (Sem confiança) - 10 (Muito confiante)'
  },
  { 
    label: 'Foco', 
    value: 'focus',
    icon: 'eye',
    color: '#2196F3',
    field: 'focus',
    description: 'Capacidade de concentração e foco',
    scale: '1 (Disperso) - 10 (Muito focado)'
  },
  { 
    label: 'Energia', 
    value: 'energy',
    icon: 'heart',
    color: '#E91E63',
    field: 'emocional',
    description: 'Nível de energia física e mental',
    scale: '1 (Sem energia) - 10 (Muita energia)'
  },
];

// Períodos de análise
const ANALYSIS_PERIODS = [
  { label: 'Última Semana', value: 'week', days: 7 },
  { label: 'Últimas 2 Semanas', value: 'two_weeks', days: 14 },
  { label: 'Último Mês', value: 'month', days: 30 },
  { label: 'Últimos 3 Meses', value: 'three_months', days: 90 },
];

// Tipos de visualização
const VIEW_TYPES = [
  { label: 'Gráfico', value: 'chart', icon: 'chart-line' },
  { label: 'Comparação', value: 'comparison', icon: 'compare' },
  { label: 'Evolução', value: 'evolution', icon: 'trending-up' },
];

export default function WellbeingChartsTab() {
  const [selectedMetric, setSelectedMetric] = useState('sleep_quality');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedViewType, setSelectedViewType] = useState('chart');
  
  const { recentCheckins, loadRecentCheckins } = useCheckinStore();

  useEffect(() => {
    loadRecentCheckins();
  }, [loadRecentCheckins]);

  const selectedMetricInfo = DAILY_METRICS.find(m => m.value === selectedMetric);
  const selectedPeriodInfo = ANALYSIS_PERIODS.find(p => p.value === selectedPeriod);

  // Filtrar dados por período selecionado
  const getFilteredCheckins = () => {
    if (!recentCheckins || recentCheckins.length === 0) return [];
    
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - (selectedPeriodInfo?.days || 7));
    
    return recentCheckins.filter(checkin => {
      const checkinDate = new Date(checkin.date);
      return checkinDate >= startDate && checkinDate <= today;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Processar dados da métrica selecionada
  const getMetricAnalysis = () => {
    const filteredCheckins = getFilteredCheckins();
    
    if (filteredCheckins.length === 0) {
      return {
        data: [],
        average: 0,
        trend: 'stable',
        consistency: 0,
        bestDay: null,
        worstDay: null,
        weeklyAverages: []
      };
    }

    // Extrair valores da métrica
    const metricData = filteredCheckins.map(checkin => {
      const field = selectedMetricInfo?.field as keyof typeof checkin;
      const value = checkin[field];
      return {
        date: checkin.date,
        value: typeof value === 'number' ? value : 0,
      };
    }).filter(item => item.value > 0);

    if (metricData.length === 0) {
      return {
        data: [],
        average: 0,
        trend: 'stable',
        consistency: 0,
        bestDay: null,
        worstDay: null,
        weeklyAverages: []
      };
    }

    // Calcular estatísticas
    const values = metricData.map(d => d.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calcular tendência (primeira metade vs segunda metade)
    const midPoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midPoint);
    const secondHalf = values.slice(midPoint);
    
    let trend = 'stable';
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 0.5) trend = 'improving';
      else if (secondAvg < firstAvg - 0.5) trend = 'declining';
    }

    // Calcular consistência (inverso do desvio padrão normalizado)
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - ((stdDev / average) * 100));

    // Encontrar melhor e pior dia
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const bestDay = metricData.find(d => d.value === maxValue);
    const worstDay = metricData.find(d => d.value === minValue);

    // Calcular médias semanais
    const weeklyMap = new Map();
    metricData.forEach(item => {
      const date = new Date(item.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // Segunda-feira
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, []);
      }
      weeklyMap.get(weekKey).push(item.value);
    });

    const weeklyAverages = Array.from(weeklyMap.entries()).map(([weekStart, values]) => ({
      weekStart,
      average: values.reduce((sum: number, val: number) => sum + val, 0) / values.length,
      count: values.length
    })).sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

    return {
      data: metricData,
      average,
      trend,
      consistency,
      bestDay,
      worstDay,
      weeklyAverages
    };
  };

  const analysis = getMetricAnalysis();

  // Função para renderizar diferentes tipos de visualização
  const renderVisualization = () => {
    if (analysis.data.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.noDataContainer}>
              <MaterialCommunityIcons name="chart-line" size={isMobile ? 36 : 48} color="#ccc" />
              <Text style={styles.noDataText}>Nenhum dado disponível</Text>
              <Text style={styles.noDataSubtext}>
                Faça alguns check-ins para ver análises de bem-estar
              </Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    switch (selectedViewType) {
      case 'chart':
        return renderChartView();
      case 'comparison':
        return renderComparisonView();
      case 'evolution':
        return renderEvolutionView();
      default:
        return renderChartView();
    }
  };

  const renderChartView = () => {
    const maxValue = Math.max(...analysis.data.map(d => d.value), 1);
    
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
              <Text style={styles.chartTitle}>{selectedMetricInfo?.label}</Text>
            </View>
            <Text style={styles.scaleInfo}>{selectedMetricInfo?.scale}</Text>
          </View>
          
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {analysis.data.slice(-7).map((item, index) => (
                <View key={index} style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar,
                      {
                        height: (item.value / maxValue) * 100,
                        backgroundColor: selectedMetricInfo?.color
                      }
                    ]}
                  />
                  <Text style={styles.barLabel}>
                    {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </Text>
                  <Text style={styles.barValue}>{item.value.toFixed(1)}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderComparisonView = () => {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Comparação Detalhada</Text>
          
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Média Geral</Text>
              <Text style={styles.comparisonValue}>{analysis.average.toFixed(1)}</Text>
              <ProgressBar 
                progress={analysis.average / 10} 
                color={selectedMetricInfo?.color}
                style={styles.progressBar}
              />
            </View>
            
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Consistência</Text>
              <Text style={styles.comparisonValue}>{analysis.consistency.toFixed(0)}%</Text>
              <ProgressBar 
                progress={analysis.consistency / 100} 
                color={analysis.consistency > 70 ? '#4CAF50' : analysis.consistency > 40 ? '#FF9800' : '#F44336'}
                style={styles.progressBar}
              />
            </View>
            
            {analysis.bestDay && (
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Melhor Dia</Text>
                <Text style={styles.comparisonValue}>{analysis.bestDay.value.toFixed(1)}</Text>
                <Text style={styles.comparisonDate}>
                  {new Date(analysis.bestDay.date).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            )}
            
            {analysis.worstDay && (
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Pior Dia</Text>
                <Text style={styles.comparisonValue}>{analysis.worstDay.value.toFixed(1)}</Text>
                <Text style={styles.comparisonDate}>
                  {new Date(analysis.worstDay.date).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEvolutionView = () => {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Evolução por Semana</Text>
          
          {analysis.weeklyAverages.length > 0 ? (
            <View style={styles.evolutionContainer}>
              {analysis.weeklyAverages.map((week, index) => (
                <View key={index} style={styles.weekItem}>
                  <View style={styles.weekHeader}>
                    <Text style={styles.weekLabel}>
                      Semana {new Date(week.weekStart).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </Text>
                    <Text style={styles.weekCount}>{week.count} check-ins</Text>
                  </View>
                  
                  <View style={styles.weekMetrics}>
                    <Text style={styles.weekAverage}>{week.average.toFixed(1)}</Text>
                    <ProgressBar 
                      progress={week.average / 10} 
                      color={selectedMetricInfo?.color}
                      style={styles.weekProgressBar}
                    />
                  </View>
                  
                  {index > 0 && (
                    <View style={styles.weekTrend}>
                      {week.average > analysis.weeklyAverages[index - 1].average ? (
                        <MaterialCommunityIcons name="trending-up" size={16} color="#4CAF50" />
                      ) : week.average < analysis.weeklyAverages[index - 1].average ? (
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
      {/* Controles de Período e Visualização */}
      <Card style={styles.controlsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Análise de Bem-estar</Text>
          
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

          {/* Tipo de Visualização */}
          <View style={styles.controlSection}>
            <Text style={styles.controlLabel}>Tipo de Visualização:</Text>
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
          <Text style={styles.sectionTitle}>Métrica de Bem-estar:</Text>
          <View style={styles.metricsGrid}>
            {DAILY_METRICS.map((metric) => (
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
              <Text style={styles.scaleText}>{selectedMetricInfo.scale}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Resumo de Tendência */}
      {analysis.data.length > 0 && (
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
                <Text style={styles.summaryLabel}>Média</Text>
                <Text style={[styles.summaryValue, { color: selectedMetricInfo?.color }]}>
                  {analysis.average.toFixed(1)}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Tendência</Text>
                <View style={styles.trendContainer}>
                  <MaterialCommunityIcons 
                    name={
                      analysis.trend === 'improving' ? 'trending-up' :
                      analysis.trend === 'declining' ? 'trending-down' : 'trending-neutral'
                    }
                    size={isMobile ? 16 : 18}
                    color={
                      analysis.trend === 'improving' ? '#4CAF50' :
                      analysis.trend === 'declining' ? '#F44336' : '#666'
                    }
                  />
                  <Text style={[
                    styles.trendText,
                    { 
                      color: analysis.trend === 'improving' ? '#4CAF50' :
                             analysis.trend === 'declining' ? '#F44336' : '#666'
                    }
                  ]}>
                    {analysis.trend === 'improving' ? 'Melhorando' :
                     analysis.trend === 'declining' ? 'Piorando' : 'Estável'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Check-ins</Text>
                <Text style={styles.summaryValue}>{analysis.data.length}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Consistência</Text>
                <Text style={[
                  styles.summaryValue,
                  { 
                    color: analysis.consistency > 70 ? '#4CAF50' : 
                           analysis.consistency > 40 ? '#FF9800' : '#F44336'
                  }
                ]}>
                  {analysis.consistency.toFixed(0)}%
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
  scaleText: {
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
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendText: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: 'bold',
    marginLeft: 4,
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
  scaleInfo: {
    fontSize: isMobile ? 10 : 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'right',
    flex: 1,
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
    width: '100%',
    borderRadius: 4,
    minHeight: 10,
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
  comparisonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  comparisonItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: isMobile ? 10 : 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: isMobile ? 10 : 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  comparisonValue: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  comparisonDate: {
    fontSize: isMobile ? 9 : 10,
    color: '#999',
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    marginTop: 8,
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
    minWidth: 40,
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