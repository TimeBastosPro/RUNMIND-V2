import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';
import PeriodSelector, { PeriodType } from '../../../components/ui/PeriodSelector';
import { filterDataByPeriod, getPeriodLabel } from '../../../utils/periodFilter';
import LoadingState from '../../../components/ui/LoadingState';
import { validateNumericValue, validateDuration, logValidationErrors } from '../../../utils/dataValidation';

const TRAINING_METRICS = [
  { 
    label: 'Distância', 
    value: 'distance',
    icon: 'map-marker-distance',
    color: '#4CAF50',
    unit: 'km',
    field: 'distance_km',
  },
  { 
    label: 'Duração', 
    value: 'duration',
    icon: 'clock-outline',
    color: '#2196F3',
    unit: 'min',
    field: 'duration_minutes',
  },
  { 
    label: 'Esforço Percebido', 
    value: 'perceived_effort',
    icon: 'lightning-bolt',
    color: '#FF5722',
    unit: '/10',
    field: 'perceived_effort',
  },
  { 
    label: 'Satisfação', 
    value: 'satisfaction',
    icon: 'heart',
    color: '#E91E63',
    unit: '/5',
    field: 'session_satisfaction',
  },
];

export default function PsychologicalChartsTab() {
  const [selectedMetric, setSelectedMetric] = useState('confidence');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('custom');
  
  // Calcular datas padrão: 5 semanas antes e 5 semanas depois da semana atual
  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay()); // Início da semana atual (domingo)
  
  const defaultStartDate = new Date(currentWeekStart);
  defaultStartDate.setDate(currentWeekStart.getDate() - (5 * 7)); // 5 semanas antes
  
  const defaultEndDate = new Date(currentWeekStart);
  defaultEndDate.setDate(currentWeekStart.getDate() + (5 * 7) + 6); // 5 semanas depois (incluindo o domingo)
  
  const [customStartDate, setCustomStartDate] = useState<Date>(defaultStartDate);
  const [customEndDate, setCustomEndDate] = useState<Date>(defaultEndDate);
  const { trainingSessions, fetchTrainingSessions, isLoading } = useCheckinStore();

  useEffect(() => {
    fetchTrainingSessions();
  }, [fetchTrainingSessions]);

  const selectedMetricInfo = TRAINING_METRICS.find(m => m.value === selectedMetric);

  const handleCustomDateChange = (startDate: Date, endDate: Date) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  // Processar dados reais das sessões de treino
  const getMetricData = () => {
    if (!trainingSessions || trainingSessions.length === 0) {
      return [];
    }

    const field = selectedMetricInfo?.field;
    if (!field) return [];

    // Filtrar apenas treinos completados
    // ✅ CORRIGIDO: Incluir treinos sem status definido como 'completed' se tiverem dados
    const completedSessions = trainingSessions.filter(session => {
      if (session.status === 'completed') return true;
      // Se não tem status definido mas tem dados de execução, considerar como completed
      if (!session.status && (session.distance_km || session.perceived_effort || session.session_satisfaction || session.avg_heart_rate)) {
        return true;
      }
      return false;
    });
    
    // Filtrar dados por período
    const filteredSessions = filterDataByPeriod(completedSessions, selectedPeriod, customStartDate, customEndDate);
    
    const validationErrors: string[] = [];
    
    const processedData = filteredSessions
      .map(session => {
        const value = session[field as keyof typeof session];
        
        let validationResult;
        if (field === 'duration_minutes') {
          // Validar duração usando função especializada
          validationResult = validateDuration(
            session.duracao_horas, 
            session.duracao_minutos, 
            'duration'
          );
        } else {
          // Validar outros campos numéricos
          validationResult = validateNumericValue(value, field as string, 0);
        }
        
        if (!validationResult.isValid) {
          validationErrors.push(validationResult.error || 'Erro de validação');
          return null;
        }
        
        return {
          date: session.training_date,
          value: validationResult.value,
        };
      })
      .filter(item => item !== null && item!.value > 0)
      .sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime());
    
    // Log de erros de validação
    logValidationErrors(validationErrors);
    
    return processedData;
  };

  const rawMetricData = getMetricData();
  
  // Agrupar dados por semana se há muitos dados (>14 pontos)
  const getProcessedMetricData = () => {
    if (rawMetricData.length <= 14) {
      return rawMetricData; // Mostrar todos os dados se são poucos
    }
    
    // Agrupar por semana para períodos longos
    const weeklyData = new Map<string, { total: number; count: number; date: string }>();
    
    rawMetricData.forEach(item => {
      const date = new Date(item.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Domingo da semana
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { total: 0, count: 0, date: weekKey });
      }
      
      const weekData = weeklyData.get(weekKey)!;
      weekData.total += item.value;
      weekData.count += 1;
    });
    
    // Converter para array e calcular médias
    return Array.from(weeklyData.values())
      .map(week => ({
        date: week.date,
        value: week.total / week.count // Média da semana
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  const metricData = getProcessedMetricData();
  const maxValue = Math.max(...metricData.map(d => d?.value || 0), 1);

  // Calcular estatísticas
  const getStatistics = () => {
    if (metricData.length === 0) {
      return {
        totalSessions: 0,
        totalDistance: 0,
        totalDuration: 0,
        avgEffort: 0,
      };
    }

    const values = metricData.map(d => d?.value || 0);
    const totalSessions = metricData.length;
    
    let totalDistance = 0;
    let totalDuration = 0;
    let avgEffort = 0;

    if (selectedMetric === 'distance') {
      totalDistance = values.reduce((sum, val) => sum + val, 0);
    } else if (selectedMetric === 'duration') {
      totalDuration = values.reduce((sum, val) => sum + val, 0);
    } else if (selectedMetric === 'perceived_effort') {
      avgEffort = values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    return {
      totalSessions,
      totalDistance: totalDistance.toFixed(1),
      totalDuration: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`,
      avgEffort: avgEffort.toFixed(1),
    };
  };

  const statistics = getStatistics();

  // Mostrar loading enquanto os dados estão sendo carregados
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingState 
          message="Carregando dados de treinos..." 
          icon="chart-line"
        />
      </View>
    );
  }

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
      
      {/* Seleção de Métricas de Treino */}
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Métricas de Treino:</Text>
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

      {/* Gráfico de Treinos */}
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
            {metricData.length > 0 ? (
              <View style={styles.chartBars}>
                {metricData.map((item, index) => (
                  <View key={index} style={styles.barWrapper}>
                    <View 
                      style={[
                        styles.bar,
                        {
                          height: ((item?.value || 0) / maxValue) * 100,
                          backgroundColor: selectedMetricInfo?.color
                        }
                      ]}
                    />
                    <Text style={styles.barLabel}>
                      {new Date(item?.date || '').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </Text>
                    <Text style={styles.barValue}>
                      {selectedMetric === 'duration' 
                        ? `${Math.floor((item?.value || 0) / 60)}:${((item?.value || 0) % 60).toString().padStart(2, '0')}`
                        : (item?.value || 0).toFixed(1)
                      }
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialCommunityIcons name="run" size={48} color="#ccc" />
                <Text style={styles.noDataText}>Nenhum treino encontrado</Text>
                <Text style={styles.noDataSubtext}>
                  Complete alguns treinos para ver suas análises
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Resumo de Treinos */}
      <Card style={styles.summaryCard}>
        <Card.Content>
                      <Text style={styles.summaryTitle}>Resumo - {getPeriodLabel(selectedPeriod, customStartDate, customEndDate)}</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total de Treinos</Text>
              <Text style={styles.summaryValue}>{statistics.totalSessions}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Distância Total</Text>
              <Text style={styles.summaryValue}>{statistics.totalDistance} km</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tempo Total</Text>
              <Text style={styles.summaryValue}>{statistics.totalDuration}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Média Esforço</Text>
              <Text style={styles.summaryValue}>{statistics.avgEffort}/10</Text>
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
}); 