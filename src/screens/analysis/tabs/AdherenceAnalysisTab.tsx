import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, Chip, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';
import { useAuthStore } from '../../../stores/auth';
import { navigatePeriod, filterDataByPeriod } from '../../../utils/periodFilter';
import LoadingState from '../../../components/ui/LoadingState';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

// Tipos de período
const PERIOD_TYPES = [
  { label: 'Semana', value: 'week' },
  { label: 'Mês', value: 'month' },
];

// Classificações de aderência
const ADHERENCE_LEVELS = {
  excellent: { label: 'Excelente', color: '#4CAF50', threshold: 5 },
  good: { label: 'Boa', color: '#8BC34A', threshold: 15 },
  moderate: { label: 'Moderada', color: '#FF9800', threshold: 30 },
  poor: { label: 'Baixa', color: '#F44336', threshold: 100 },
};

export default function AdherenceAnalysisTab() {
  const [periodType, setPeriodType] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  const { trainingSessions, fetchTrainingSessions, calculateAnalytics, isLoading } = useCheckinStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchTrainingSessions();
    }
  }, [fetchTrainingSessions, isAuthenticated, user?.id]);

  const getCurrentPeriod = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    
    if (periodType === 'week') {
      const startOfWeek = new Date(year, month, day);
      const dayOfWeek = startOfWeek.getDay();
      
      let diff = 1 - dayOfWeek;
      if (dayOfWeek === 0) diff = -6;
      
      startOfWeek.setDate(startOfWeek.getDate() + diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return { startDate: startOfWeek, endDate: endOfWeek };
    } else {
      const startOfMonth = new Date(year, month, 1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date(year, month + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      return { startDate: startOfMonth, endDate: endOfMonth };
    }
  };

  const handleNavigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = navigatePeriod(currentDate, periodType, direction);
    setCurrentDate(newDate);
  };

  const getAdherenceAnalysis = () => {
    if (!isAuthenticated || !user?.id) {
      return { data: [], summary: null };
    }
    
    const { startDate, endDate } = getCurrentPeriod();
    const analytics = calculateAnalytics();
    
    if (!analytics || !analytics.plannedVsCompleted) {
      return { data: [], summary: null };
    }

    // Filtrar dados por período
    const filteredData = analytics.plannedVsCompleted.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });

    // Calcular resumo
    const summary = {
      totalPlanned: filteredData.length,
      totalExecuted: filteredData.filter(item => item.actualDistance > 0).length,
      executionRate: filteredData.length > 0 ? 
        (filteredData.filter(item => item.actualDistance > 0).length / filteredData.length) * 100 : 0,
      avgDistanceVariance: filteredData.length > 0 ? 
        filteredData.reduce((sum, item) => sum + Math.abs(item.distanceVariance), 0) / filteredData.length : 0,
      avgDurationVariance: filteredData.length > 0 ? 
        filteredData.reduce((sum, item) => sum + Math.abs(item.durationVariance), 0) / filteredData.length : 0,
      adherenceDistribution: {
        excellent: filteredData.filter(item => item.adherenceLevel === 'excellent').length,
        good: filteredData.filter(item => item.adherenceLevel === 'good').length,
        moderate: filteredData.filter(item => item.adherenceLevel === 'moderate').length,
        poor: filteredData.filter(item => item.adherenceLevel === 'poor').length,
      }
    };

    return { data: filteredData, summary };
  };

  const analysis = getAdherenceAnalysis();

  const getAdherenceColor = (level: string) => {
    return ADHERENCE_LEVELS[level as keyof typeof ADHERENCE_LEVELS]?.color || '#666';
  };

  const getAdherenceLabel = (level: string) => {
    return ADHERENCE_LEVELS[level as keyof typeof ADHERENCE_LEVELS]?.label || 'Desconhecido';
  };

  if (isLoading) {
    return <LoadingState message="Carregando análise de aderência..." icon="target" />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Card de Controles */}
      <Card style={styles.controlsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Análise de Aderência ao Planejamento</Text>
          
          {/* Tipo de Período */}
          <View style={styles.controlSection}>
            <Text style={styles.controlLabel}>Período:</Text>
            <View style={styles.periodTypeGrid}>
              {PERIOD_TYPES.map((type) => (
                <Chip
                  key={type.value}
                  selected={periodType === type.value}
                  onPress={() => setPeriodType(type.value as 'week' | 'month')}
                  style={styles.periodChip}
                  compact={isMobile}
                >
                  {type.label}
                </Chip>
              ))}
            </View>
          </View>

          {/* Navegação de Período */}
          <View style={styles.periodNavigation}>
            <Chip
              mode="outlined"
              onPress={() => handleNavigatePeriod('prev')}
              icon="chevron-left"
              style={styles.navChip}
              compact={isMobile}
            >
              Anterior
            </Chip>
            
            <View style={styles.currentPeriodContainer}>
              <Text style={styles.currentPeriodText}>
                {periodType === 'week' ? 
                  `Semana de ${getCurrentPeriod().startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} a ${getCurrentPeriod().endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}` :
                  `Mês de ${getCurrentPeriod().startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
                }
              </Text>
            </View>
            
            <Chip
              mode="outlined"
              onPress={() => handleNavigatePeriod('next')}
              icon="chevron-right"
              style={styles.navChip}
              compact={isMobile}
            >
              Próximo
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Card de Resumo */}
      {analysis.summary && (
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryHeader}>
              <MaterialCommunityIcons name="chart-line" size={24} color="#2196F3" />
              <Text style={styles.summaryTitle}>Resumo de Aderência</Text>
            </View>
            
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Taxa de Execução</Text>
                <Text style={styles.summaryValue}>
                  {analysis.summary.executionRate.toFixed(1)}%
                </Text>
                <ProgressBar
                  progress={analysis.summary.executionRate / 100}
                  color="#4CAF50"
                  style={styles.progressBar}
                />
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Variância Média (Distância)</Text>
                <Text style={styles.summaryValue}>
                  {analysis.summary.avgDistanceVariance.toFixed(1)}%
                </Text>
                <Text style={styles.summaryDescription}>
                  {analysis.summary.avgDistanceVariance <= 10 ? 'Excelente precisão' :
                   analysis.summary.avgDistanceVariance <= 25 ? 'Boa precisão' :
                   analysis.summary.avgDistanceVariance <= 50 ? 'Precisão moderada' : 'Precisão baixa'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Card de Distribuição de Aderência */}
      {analysis.summary && (
        <Card style={styles.distributionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Distribuição de Aderência</Text>
            
            <View style={styles.distributionGrid}>
              {Object.entries(analysis.summary.adherenceDistribution).map(([level, count]) => (
                <View key={level} style={styles.distributionItem}>
                  <View style={[styles.distributionIndicator, { backgroundColor: getAdherenceColor(level) }]} />
                  <Text style={styles.distributionLabel}>{getAdherenceLabel(level)}</Text>
                  <Text style={styles.distributionValue}>{count}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Card de Detalhes dos Treinos */}
      <Card style={styles.detailsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Detalhes dos Treinos</Text>
          
          {analysis.data.length > 0 ? (
            <View style={styles.detailsList}>
              {analysis.data.map((item, index) => (
                <View key={index} style={styles.detailItem}>
                  <View style={styles.detailHeader}>
                    <Text style={styles.detailDate}>
                      {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </Text>
                    <Chip
                      mode="outlined"
                      style={[styles.adherenceChip, { borderColor: getAdherenceColor(item.adherenceLevel) }]}
                      textStyle={{ color: getAdherenceColor(item.adherenceLevel) }}
                      compact={isMobile}
                    >
                      {getAdherenceLabel(item.adherenceLevel)}
                    </Chip>
                  </View>
                  
                  <View style={styles.detailMetrics}>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Distância:</Text>
                      <Text style={styles.metricValue}>
                        {item.plannedDistance}km → {item.actualDistance}km
                        {item.distanceVariance !== 0 && (
                          <Text style={[styles.varianceText, { 
                            color: item.distanceVariance > 0 ? '#4CAF50' : '#F44336' 
                          }]}>
                            ({item.distanceVariance > 0 ? '+' : ''}{item.distanceVariance.toFixed(1)}%)
                          </Text>
                        )}
                      </Text>
                    </View>
                    
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Duração:</Text>
                      <Text style={styles.metricValue}>
                        {Math.floor(item.plannedDuration / 60)}h{item.plannedDuration % 60}m → 
                        {Math.floor(item.actualDuration / 60)}h{item.actualDuration % 60}m
                        {item.durationVariance !== 0 && (
                          <Text style={[styles.varianceText, { 
                            color: item.durationVariance > 0 ? '#4CAF50' : '#F44336' 
                          }]}>
                            ({item.durationVariance > 0 ? '+' : ''}{item.durationVariance.toFixed(1)}%)
                          </Text>
                        )}
                      </Text>
                    </View>
                    
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Esforço:</Text>
                      <Text style={styles.metricValue}>
                        {item.plannedEffort}/5 → {item.actualEffort}/10
                        {item.effortVariance !== 0 && (
                          <Text style={[styles.varianceText, { 
                            color: item.effortVariance > 0 ? '#F44336' : '#4CAF50' 
                          }]}>
                            ({item.effortVariance > 0 ? '+' : ''}{item.effortVariance})
                          </Text>
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons name="target" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>Nenhum treino planejado</Text>
              <Text style={styles.emptyStateMessage}>
                Não há treinos planejados neste período para análise de aderência.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  controlsCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  summaryCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  distributionCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  detailsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  controlSection: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  periodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  periodNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navChip: {
    minWidth: 80,
  },
  currentPeriodContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  currentPeriodText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  summaryGrid: {
    gap: 16,
  },
  summaryItem: {
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  summaryDescription: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  distributionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  distributionItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  distributionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  distributionLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  distributionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsList: {
    gap: 12,
  },
  detailItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  adherenceChip: {
    height: 28,
  },
  detailMetrics: {
    gap: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  varianceText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
