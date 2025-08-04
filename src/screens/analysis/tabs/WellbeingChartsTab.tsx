import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';
import PeriodSelector, { PeriodType } from '../../../components/ui/PeriodSelector';
import { filterDataByPeriod, getPeriodLabel } from '../../../utils/periodFilter';

const METRICS = [
  { 
    label: 'Qualidade do Sono', 
    value: 'sleep_quality',
    icon: 'sleep',
    color: '#4CAF50',
    field: 'sleep_quality_score',
  },
  { 
    label: 'Dores Musculares', 
    value: 'soreness',
    icon: 'human-handsup',
    color: '#FF5722',
    field: 'soreness_score',
  },
  { 
    label: 'Motivação', 
    value: 'motivation',
    icon: 'lightning-bolt',
    color: '#FFC107',
    field: 'mood_score',
  },
  { 
    label: 'Confiança', 
    value: 'confidence',
    icon: 'target',
    color: '#9C27B0',
    field: 'confidence_score',
  },
  { 
    label: 'Foco', 
    value: 'focus',
    icon: 'eye',
    color: '#2196F3',
    field: 'focus_score',
  },
  { 
    label: 'Energia', 
    value: 'energy',
    icon: 'heart',
    color: '#E91E63',
    field: 'energy_score',
  },
];

export default function WellbeingChartsTab() {
  const [selectedMetric, setSelectedMetric] = useState('sleep_quality');
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
  const { recentCheckins, loadRecentCheckins } = useCheckinStore();

  useEffect(() => {
    console.log('🔍 DEBUG - WellbeingChartsTab montada, carregando checkins...');
    loadRecentCheckins(30);
  }, [loadRecentCheckins]);

  // Log quando os dados mudarem
  useEffect(() => {
    console.log('🔍 DEBUG - recentCheckins atualizado:', {
      total: recentCheckins.length,
      sample: recentCheckins.slice(0, 3).map(c => ({
        date: c.date,
        sleep_quality: c.sleep_quality_score,
        mood: c.mood_score,
        energy: c.energy_score
      }))
    });
  }, [recentCheckins]);

  const selectedMetricInfo = METRICS.find(m => m.value === selectedMetric);

  const handleCustomDateChange = (startDate: Date, endDate: Date) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  // Processar dados reais dos checkins
  const getMetricData = () => {
    console.log('🔍 DEBUG - Wellbeing getMetricData:', {
      recentCheckins: recentCheckins?.length || 0,
      selectedMetric: selectedMetric,
      selectedMetricInfo: selectedMetricInfo,
      field: selectedMetricInfo?.field
    });

    if (!recentCheckins || recentCheckins.length === 0) {
      console.log('🔍 DEBUG - Nenhum checkin encontrado');
      return [];
    }

    const field = selectedMetricInfo?.field;
    if (!field) {
      console.log('🔍 DEBUG - Campo não encontrado para métrica:', selectedMetric);
      return [];
    }

    // Filtrar dados por período
    const filteredCheckins = filterDataByPeriod(recentCheckins, selectedPeriod, customStartDate, customEndDate);
    
    console.log('🔍 DEBUG - Checkins filtrados:', {
      total: filteredCheckins.length,
      sampleData: filteredCheckins.slice(0, 3).map(c => ({
        date: c.date,
        [field]: c[field as keyof typeof c]
      }))
    });

    return filteredCheckins
      .map(checkin => {
        const value = checkin[field as keyof typeof checkin];
        if (value === undefined || value === null) return null;
        
        return {
          date: checkin.date,
          value: typeof value === 'number' ? value : parseFloat(value as string) || 0,
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime());
  };

  const metricData = getMetricData();
  const maxValue = Math.max(...metricData.map(d => d.value), 1);

  // Calcular estatísticas
  const getStatistics = () => {
    if (metricData.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
      };
    }

    const values = metricData.map(d => d.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calcular tendência (últimos 3 dias vs 3 dias anteriores)
    const recentValues = values.slice(-3);
    const previousValues = values.slice(-6, -3);
    
    let trend = 'stable';
    if (recentValues.length >= 2 && previousValues.length >= 2) {
      const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
      const previousAvg = previousValues.reduce((sum, val) => sum + val, 0) / previousValues.length;
      
      if (recentAvg > previousAvg + 0.5) trend = 'increasing';
      else if (recentAvg < previousAvg - 0.5) trend = 'decreasing';
    }

    return {
      average: average.toFixed(1),
      min: min.toFixed(1),
      max: max.toFixed(1),
      trend,
    };
  };

  const statistics = getStatistics();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Seletor de Período */}
      <PeriodSelector
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={handleCustomDateChange}
      />
      
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
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialCommunityIcons name="chart-line" size={48} color="#ccc" />
                <Text style={styles.noDataText}>Nenhum dado disponível</Text>
                <Text style={styles.noDataSubtext}>
                  Faça alguns check-ins para ver seus dados de bem-estar
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Estatísticas */}
      {metricData.length > 0 && (
        <Card style={styles.statsCard}>
                  <Card.Content>
          <Text style={styles.statsTitle}>Estatísticas - {getPeriodLabel(selectedPeriod, customStartDate, customEndDate)}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Média</Text>
                <Text style={styles.statValue}>{statistics.average}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Mínimo</Text>
                <Text style={styles.statValue}>{statistics.min}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Máximo</Text>
                <Text style={styles.statValue}>{statistics.max}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tendência</Text>
                <Text style={[
                  styles.statValue,
                  { 
                    color: statistics.trend === 'increasing' ? '#4CAF50' : 
                           statistics.trend === 'decreasing' ? '#F44336' : '#666'
                  }
                ]}>
                  {statistics.trend === 'increasing' ? '↗️' : 
                   statistics.trend === 'decreasing' ? '↘️' : '→'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Status */}
      <Card style={styles.statusCard}>
        <Card.Content>
          <Text style={styles.statusTitle}>Status da Análise</Text>
          <Text style={styles.statusText}>
            {metricData.length > 0 
              ? `Analisando ${metricData.length} registros de bem-estar do período selecionado.`
              : 'Nenhum dado de bem-estar encontrado. Faça check-ins diários para ver suas análises.'
            }
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
  statsCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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