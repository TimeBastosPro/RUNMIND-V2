import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';
import { filterDataByPeriod, getPeriodLabel } from '../../../utils/periodFilter';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

const METRICS = [
  { 
    label: 'Qualidade do Sono', 
    value: 'sleep_quality',
    icon: 'sleep',
    color: '#4CAF50',
    field: 'sleep_quality', // Campo correto do banco
  },
  { 
    label: 'Dores Musculares', 
    value: 'soreness',
    icon: 'human-handsup',
    color: '#FF5722',
    field: 'soreness', // Campo correto do banco
  },
  { 
    label: 'Motivação', 
    value: 'motivation',
    icon: 'lightning-bolt',
    color: '#FFC107',
    field: 'motivation', // Campo correto do banco
  },
  { 
    label: 'Confiança', 
    value: 'confidence',
    icon: 'target',
    color: '#9C27B0',
    field: 'confidence', // Campo correto do banco
  },
  { 
    label: 'Foco', 
    value: 'focus',
    icon: 'eye',
    color: '#2196F3',
    field: 'focus', // Campo correto do banco
  },
  { 
    label: 'Energia', 
    value: 'energy',
    icon: 'heart',
    color: '#E91E63',
    field: 'emocional', // Campo correto do banco (emocional = energia)
  },
];

export default function WellbeingChartsTab() {
  const [selectedMetric, setSelectedMetric] = useState('sleep_quality');
  
  // Calcular datas padrão: semana atual (segunda a domingo)
  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Segunda-feira da semana atual
  
  const defaultStartDate = new Date(currentWeekStart);
  const defaultEndDate = new Date(currentWeekStart);
  defaultEndDate.setDate(currentWeekStart.getDate() + 6); // Domingo da semana atual
  
  const [customStartDate, setCustomStartDate] = useState<Date>(defaultStartDate);
  const [customEndDate, setCustomEndDate] = useState<Date>(defaultEndDate);
  const { recentCheckins, loadRecentCheckins } = useCheckinStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadRecentCheckins();
      } catch (error) {
        console.error('❌ Erro ao carregar checkins:', error);
      }
    };
    
    loadData();
  }, [loadRecentCheckins]);

  // Efeito para ajustar automaticamente o período quando os dados são carregados
  useEffect(() => {
    if (recentCheckins.length > 0) {
      // Encontrar o período com mais dados nos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const checkinsInLast30Days = recentCheckins.filter(checkin => {
        const checkinDate = new Date(checkin.date);
        return checkinDate >= thirtyDaysAgo;
      });
      
      if (checkinsInLast30Days.length > 0) {
        // Encontrar a semana com mais check-ins
        const weekMap = new Map();
        
        checkinsInLast30Days.forEach(checkin => {
          const checkinDate = new Date(checkin.date);
          const weekStart = new Date(checkinDate);
          weekStart.setDate(checkinDate.getDate() - checkinDate.getDay() + 1); // Segunda-feira
          const weekKey = weekStart.toISOString().split('T')[0];
          
          if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, []);
          }
          weekMap.get(weekKey).push(checkin);
        });
        
        // Encontrar a semana com mais dados
        let bestWeek = null;
        let maxCheckins = 0;
        
        weekMap.forEach((checkins, weekKey) => {
          if (checkins.length > maxCheckins) {
            maxCheckins = checkins.length;
            bestWeek = weekKey;
          }
        });
        
        if (bestWeek) {
          const newStartDate = new Date(bestWeek);
          const newEndDate = new Date(bestWeek);
          newEndDate.setDate(newStartDate.getDate() + 6);
          
          setCustomStartDate(newStartDate);
          setCustomEndDate(newEndDate);
        }
      }
    }
  }, [recentCheckins]);

  const selectedMetricInfo = METRICS.find(m => m.value === selectedMetric);

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

  // Processar dados reais dos checkins
  const getMetricData = () => {
    // Filtrar check-ins por período selecionado
    const filteredCheckins = recentCheckins.filter(checkin => {
      const checkinDate = checkin.date;
      const startDate = customStartDate.toISOString().split('T')[0];
      const endDate = customEndDate.toISOString().split('T')[0];
      
      return checkinDate >= startDate && checkinDate <= endDate;
    });

    // Sempre retornar 7 dias (segunda a domingo) para consistência visual
    const weekStart = new Date(customStartDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Segunda-feira
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      
      const dateStr = currentDate.toISOString().split('T')[0];
      const checkinForDay = filteredCheckins.find(c => c.date === dateStr);
      
      let value = 0;
      if (checkinForDay && selectedMetricInfo?.field) {
        const fieldValue = checkinForDay[selectedMetricInfo.field as keyof typeof checkinForDay];
        value = typeof fieldValue === 'number' ? fieldValue : 0;
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
              compact={isMobile}
            >
              {isMobile ? 'Anterior' : 'Semana Anterior'}
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
              compact={isMobile}
            >
              {isMobile ? 'Próxima' : 'Próxima Semana'}
            </Button>
          </View>
        </Card.Content>
      </Card>
      
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
                compact={isMobile}
              >
                {isMobile ? metric.label.split(' ')[0] : metric.label}
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
                size={isMobile ? 20 : 24} 
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
                      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][index]}
                    </Text>
                    <Text style={styles.barValue}>{item.value.toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialCommunityIcons name="chart-line" size={isMobile ? 36 : 48} color="#ccc" />
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
            <Text style={styles.statsTitle}>Estatísticas - {getPeriodLabel('custom', customStartDate, customEndDate)}</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: isMobile ? 12 : 16,
  },
  navigationCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  navButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: isMobile ? 80 : 120,
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: isMobile ? 12 : 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  metricsCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  statsCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: isMobile ? 14 : 16,
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
    width: isMobile ? '48%' : '48%',
    backgroundColor: '#f8f9fa',
    padding: isMobile ? 10 : 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: isMobile ? 10 : 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: 'bold',
    color: '#333',
  },
}); 