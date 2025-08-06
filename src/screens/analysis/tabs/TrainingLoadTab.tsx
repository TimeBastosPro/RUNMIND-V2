import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, Chip, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useCheckinStore } from '../../../stores/checkin';
import { 
  calculateWorkloadMetrics, 
  calculateDailyWorkloads,
  calculateWeeklyWorkloads,
  WorkloadMetrics,
  DailyWorkload 
} from '../../../utils/sportsCalculations';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

const RISK_ZONE_COLORS = {
  'detraining': '#FF9800',
  'safety': '#4CAF50',
  'risk': '#FF5722',
  'high-risk': '#D32F2F'
};

const RISK_ZONE_LABELS = {
  'detraining': 'Destreino',
  'safety': 'Segurança',
  'risk': 'Risco',
  'high-risk': 'Alto Risco'
};

export default function TrainingLoadTab() {
  const { trainingSessions } = useCheckinStore();
  const [workloadMetrics, setWorkloadMetrics] = useState<WorkloadMetrics | null>(null);
  const [dailyWorkloads, setDailyWorkloads] = useState<DailyWorkload[]>([]);
  const [weeklyWorkloads, setWeeklyWorkloads] = useState<any[]>([]);

  useEffect(() => {
    if (trainingSessions.length > 0) {
      const metrics = calculateWorkloadMetrics(trainingSessions);
      const daily = calculateDailyWorkloads(trainingSessions);
      const weekly = calculateWeeklyWorkloads(trainingSessions);
      
      setWorkloadMetrics(metrics);
      setDailyWorkloads(daily);
      setWeeklyWorkloads(weekly);
    }
  }, [trainingSessions]);

  const getRiskZoneColor = (zone: string) => {
    return RISK_ZONE_COLORS[zone as keyof typeof RISK_ZONE_COLORS] || '#666';
  };

  const getRiskZoneLabel = (zone: string) => {
    return RISK_ZONE_LABELS[zone as keyof typeof RISK_ZONE_LABELS] || 'Desconhecido';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'trending-up';
      case 'decreasing': return 'trending-down';
      default: return 'trending-neutral';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return '#FF5722';
      case 'decreasing': return '#4CAF50';
      default: return '#666';
    }
  };

  if (!workloadMetrics) {
    return (
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.noDataContainer}>
              <MaterialCommunityIcons name="chart-line" size={isMobile ? 36 : 48} color="#ccc" />
              <Text style={styles.noDataText}>Nenhum dado de treino disponível</Text>
              <Text style={styles.noDataSubtext}>
                Faça alguns treinos para ver sua análise de carga
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  // Dados para o gráfico de carga diária
  const dailyChartData = {
    labels: dailyWorkloads.slice(-7).map(item => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: dailyWorkloads.slice(-7).map(item => item.workload),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Dados para o gráfico semanal
  const weeklyChartData = {
    labels: weeklyWorkloads.slice(-4).map(item => {
      const date = new Date(item.weekStart);
      return `Sem ${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: weeklyWorkloads.slice(-4).map(item => item.totalWorkload),
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      {/* Card Principal - ACWR e Zona de Risco */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialCommunityIcons 
              name="shield-alert" 
              size={isMobile ? 20 : 24} 
              color={getRiskZoneColor(workloadMetrics.riskZone)} 
            />
            <Text style={styles.title}>Monitoramento de Carga</Text>
          </View>
          
          <View style={styles.acwrContainer}>
            <Text style={styles.acwrLabel}>ACWR (Acute:Chronic Workload Ratio)</Text>
            <Text style={styles.acwrValue}>{workloadMetrics.acwr.toFixed(2)}</Text>
            
            <View style={styles.riskZoneContainer}>
              <Chip
                mode="outlined"
                style={[
                  styles.riskChip,
                  { borderColor: getRiskZoneColor(workloadMetrics.riskZone) }
                ]}
                textStyle={[
                  styles.riskChipText,
                  { color: getRiskZoneColor(workloadMetrics.riskZone) }
                ]}
                compact={isMobile}
              >
                {getRiskZoneLabel(workloadMetrics.riskZone)}
              </Chip>
              
              {workloadMetrics.riskPercentage > 0 && (
                <View style={styles.riskBarContainer}>
                  <Text style={styles.riskPercentage}>
                    Risco de Lesão: {workloadMetrics.riskPercentage}%
                  </Text>
                  <ProgressBar
                    progress={workloadMetrics.riskPercentage / 100}
                    color={getRiskZoneColor(workloadMetrics.riskZone)}
                    style={styles.riskBar}
                  />
                </View>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Card de Métricas Detalhadas */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Métricas Detalhadas</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Carga Aguda (7 dias)</Text>
              <Text style={styles.metricValue}>
                {Math.round(workloadMetrics.acuteLoad)}
              </Text>
              <Text style={styles.metricUnit}>unidades</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Carga Crônica (28 dias)</Text>
              <Text style={styles.metricValue}>
                {Math.round(workloadMetrics.chronicLoad)}
              </Text>
              <Text style={styles.metricUnit}>unidades</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Tendência</Text>
              <View style={styles.trendContainer}>
                <MaterialCommunityIcons 
                  name={getTrendIcon(workloadMetrics.trend) as any}
                  size={isMobile ? 16 : 20}
                  color={getTrendColor(workloadMetrics.trend)}
                />
                <Text style={[
                  styles.trendText,
                  { color: getTrendColor(workloadMetrics.trend) }
                ]}>
                  {workloadMetrics.trend === 'increasing' ? 'Aumentando' :
                   workloadMetrics.trend === 'decreasing' ? 'Diminuindo' : 'Estável'}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Card de Recomendações */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Recomendações</Text>
          
          {workloadMetrics.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <MaterialCommunityIcons 
                name="lightbulb-outline" 
                size={isMobile ? 14 : 16} 
                color="#FFC107" 
              />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Gráfico de Carga Diária */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Carga Diária (Últimos 7 dias)</Text>
          <LineChart
            data={dailyChartData}
            width={screenWidth - (isMobile ? 40 : 60)}
            height={isMobile ? 180 : 220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              labelColor: (opacity = 1) => '#333',
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: isMobile ? '4' : '6',
                strokeWidth: '2',
                stroke: '#4CAF50',
              },
            }}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Gráfico de Carga Semanal */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Carga Semanal (Últimas 4 semanas)</Text>
          <BarChart
            data={weeklyChartData}
            width={screenWidth - (isMobile ? 40 : 60)}
            height={isMobile ? 180 : 220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              labelColor: (opacity = 1) => '#333',
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Informações sobre ACWR */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Sobre o ACWR</Text>
          <Text style={styles.infoText}>
            O ACWR (Acute:Chronic Workload Ratio) é um indicador cientificamente validado 
            para prever o risco de lesões. Ele compara sua carga de treino dos últimos 7 dias 
            com a média dos últimos 28 dias.
          </Text>
          
          <View style={styles.acwrInfoGrid}>
            <View style={styles.acwrInfoItem}>
              <Text style={[styles.acwrInfoValue, { color: '#FF9800' }]}>{"< 0.8"}</Text>
              <Text style={styles.acwrInfoLabel}>Destreino</Text>
            </View>
            <View style={styles.acwrInfoItem}>
              <Text style={[styles.acwrInfoValue, { color: '#4CAF50' }]}>0.8 - 1.3</Text>
              <Text style={styles.acwrInfoLabel}>Segurança</Text>
            </View>
            <View style={styles.acwrInfoItem}>
              <Text style={[styles.acwrInfoValue, { color: '#FF5722' }]}>1.3 - 1.5</Text>
              <Text style={styles.acwrInfoLabel}>Risco</Text>
            </View>
            <View style={styles.acwrInfoItem}>
              <Text style={[styles.acwrInfoValue, { color: '#D32F2F' }]}>{"> 1.5"}</Text>
              <Text style={styles.acwrInfoLabel}>Alto Risco</Text>
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
    backgroundColor: '#f5f5f5',
    padding: isMobile ? 12 : 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  acwrContainer: {
    alignItems: 'center',
  },
  acwrLabel: {
    fontSize: isMobile ? 12 : 14,
    color: '#666',
    marginBottom: 8,
  },
  acwrValue: {
    fontSize: isMobile ? 28 : 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  riskZoneContainer: {
    alignItems: 'center',
  },
  riskChip: {
    marginBottom: 12,
  },
  riskChipText: {
    fontWeight: 'bold',
    fontSize: isMobile ? 12 : 14,
  },
  riskBarContainer: {
    width: '100%',
  },
  riskPercentage: {
    fontSize: isMobile ? 10 : 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  riskBar: {
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: isMobile ? '48%' : '48%',
    backgroundColor: '#f8f9fa',
    padding: isMobile ? 10 : 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: isMobile ? 10 : 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
  },
  metricUnit: {
    fontSize: isMobile ? 8 : 10,
    color: '#999',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: isMobile ? 10 : 12,
    marginLeft: 4,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: isMobile ? 12 : 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
    lineHeight: isMobile ? 16 : 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  infoText: {
    fontSize: isMobile ? 12 : 14,
    color: '#666',
    lineHeight: isMobile ? 16 : 20,
    marginBottom: 16,
  },
  acwrInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  acwrInfoItem: {
    width: isMobile ? '48%' : '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  acwrInfoValue: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  acwrInfoLabel: {
    fontSize: isMobile ? 10 : 12,
    color: '#666',
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