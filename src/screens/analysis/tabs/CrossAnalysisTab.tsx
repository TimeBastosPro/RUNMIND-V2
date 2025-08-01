import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';
import PeriodSelector, { PeriodType } from '../../../components/ui/PeriodSelector';
import { filterDataByPeriod, getPeriodLabel } from '../../../utils/periodFilter';

// Métricas de Bem-estar
const WELLBEING_METRICS = [
  { 
    label: 'Qualidade do Sono', 
    value: 'sleep_quality',
    icon: 'sleep',
    color: '#4CAF50',
  },
  { 
    label: 'Dores Musculares', 
    value: 'soreness',
    icon: 'human-handsup',
    color: '#FF5722',
  },
  { 
    label: 'Motivação', 
    value: 'motivation',
    icon: 'lightning-bolt',
    color: '#FFC107',
  },
  { 
    label: 'Confiança', 
    value: 'confidence',
    icon: 'target',
    color: '#9C27B0',
  },
  { 
    label: 'Foco', 
    value: 'focus',
    icon: 'eye',
    color: '#2196F3',
  },
  { 
    label: 'Emocional', 
    value: 'emocional',
    icon: 'heart',
    color: '#E91E63',
  },
];

// Métricas de Treino Planejado
const PLANNED_TRAINING_METRICS = [
  { 
    label: 'Distância', 
    value: 'planned_distance',
    icon: 'map-marker-distance',
    color: '#4CAF50',
  },
  { 
    label: 'Duração', 
    value: 'planned_duration',
    icon: 'clock-outline',
    color: '#2196F3',
  },
  { 
    label: 'Esforço', 
    value: 'planned_effort',
    icon: 'gauge',
    color: '#FF9800',
  },
  { 
    label: 'Intensidade', 
    value: 'planned_intensity',
    icon: 'speedometer',
    color: '#F44336',
  },
  { 
    label: 'Modalidade', 
    value: 'planned_modality',
    icon: 'run',
    color: '#4CAF50',
  },
  { 
    label: 'Tipo de Treino', 
    value: 'planned_training_type',
    icon: 'format-list-bulleted',
    color: '#2196F3',
  },
  { 
    label: 'Terreno', 
    value: 'planned_terrain',
    icon: 'terrain',
    color: '#795548',
  },
  { 
    label: 'Percurso', 
    value: 'planned_route',
    icon: 'map',
    color: '#607D8B',
  },
];

// Métricas de Treino Realizado
const COMPLETED_TRAINING_METRICS = [
  { 
    label: 'Distância', 
    value: 'completed_distance',
    icon: 'map-marker-distance',
    color: '#4CAF50',
  },
  { 
    label: 'Duração', 
    value: 'completed_duration',
    icon: 'clock-outline',
    color: '#2196F3',
  },
  { 
    label: 'Elevação Positiva', 
    value: 'elevation_gain',
    icon: 'elevation-rise',
    color: '#795548',
  },
  { 
    label: 'Elevação Negativa', 
    value: 'elevation_loss',
    icon: 'trending-down',
    color: '#8D6E63',
  },
  { 
    label: 'Frequência Cardíaca', 
    value: 'avg_heart_rate',
    icon: 'heart-pulse',
    color: '#E91E63',
  },
  { 
    label: 'Esforço Percebido', 
    value: 'perceived_effort',
    icon: 'lightning-bolt',
    color: '#FF5722',
  },
  { 
    label: 'Sensação Geral', 
    value: 'effort_level',
    icon: 'gauge',
    color: '#FF9800',
  },
  { 
    label: 'Satisfação', 
    value: 'session_satisfaction',
    icon: 'heart',
    color: '#E91E63',
  },
  { 
    label: 'Clima', 
    value: 'max_heart_rate',
    icon: 'weather-partly-cloudy',
    color: '#D32F2F',
  },
];

export default function CrossAnalysisTab() {
  const [selectedWellbeingMetric, setSelectedWellbeingMetric] = useState('sleep_quality');
  const [selectedPlannedMetric, setSelectedPlannedMetric] = useState('planned_distance');
  const [selectedCompletedMetric, setSelectedCompletedMetric] = useState('completed_distance');
  
  // Estados para controlar as gavetas
  const [wellbeingDrawerOpen, setWellbeingDrawerOpen] = useState(false);
  const [plannedDrawerOpen, setPlannedDrawerOpen] = useState(false);
  const [completedDrawerOpen, setCompletedDrawerOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('custom');
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  
  const { recentCheckins, loadRecentCheckins, trainingSessions, fetchTrainingSessions } = useCheckinStore();

  useEffect(() => {
    loadRecentCheckins(30);
    fetchTrainingSessions();
  }, [loadRecentCheckins, fetchTrainingSessions]);

  const selectedWellbeingInfo = WELLBEING_METRICS.find(m => m.value === selectedWellbeingMetric);
  const selectedPlannedInfo = PLANNED_TRAINING_METRICS.find(m => m.value === selectedPlannedMetric);
  const selectedCompletedInfo = COMPLETED_TRAINING_METRICS.find(m => m.value === selectedCompletedMetric);

  const handleCustomDateChange = (startDate: Date, endDate: Date) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  // Processar dados reais para correlação
  const getCorrelationData = () => {
    if (!recentCheckins || !trainingSessions || recentCheckins.length === 0 || trainingSessions.length === 0) {
      return [];
    }

    // Filtrar dados por período
    const filteredCheckins = filterDataByPeriod(recentCheckins, selectedPeriod, customStartDate, customEndDate);
    const filteredSessions = filterDataByPeriod(trainingSessions, selectedPeriod, customStartDate, customEndDate);

    // Obter dados de bem-estar do período selecionado
    const wellbeingData = filteredCheckins
      .map(checkin => {
        const wellbeingValue = checkin[selectedWellbeingMetric === 'sleep_quality' ? 'sleep_quality_score' : 
                                     selectedWellbeingMetric === 'soreness' ? 'soreness_score' : 
                                     selectedWellbeingMetric === 'motivation' ? 'mood_score' : 
                                     selectedWellbeingMetric === 'confidence' ? 'confidence_score' : 
                                     selectedWellbeingMetric === 'focus' ? 'focus_score' : 
                                     'energy_score' as keyof typeof checkin];
        
        return {
          date: checkin.date,
          wellbeing: typeof wellbeingValue === 'number' ? wellbeingValue : 0,
        };
      })
      .filter(item => item.wellbeing > 0);

    // Obter dados de treino do período selecionado
    const trainingData = filteredSessions
      .filter(session => session.status === 'completed')
      .map(session => {
        let trainingValue = 0;
        
        if (selectedPlannedMetric === 'planned_distance' || selectedCompletedMetric === 'completed_distance') {
          trainingValue = session.distance_km || 0;
        } else if (selectedPlannedMetric === 'planned_duration' || selectedCompletedMetric === 'completed_duration') {
          const hours = session.duration_hours ? parseInt(session.duration_hours) : 0;
          const minutes = session.duration_minutes ? parseInt(session.duration_minutes) : 0;
          trainingValue = hours * 60 + minutes;
        } else if (selectedPlannedMetric === 'planned_effort' || selectedCompletedMetric === 'perceived_effort') {
          trainingValue = session.perceived_effort || 0;
        } else {
          trainingValue = session.session_satisfaction || 0;
        }
        
        return {
          date: session.training_date,
          training: trainingValue,
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
      .slice(-7); // Últimos 7 dias com dados
  };

  const correlationData = getCorrelationData();

  const calculateCorrelation = () => {
    if (correlationData.length < 2) {
      return '0.00';
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
    
    return correlation.toFixed(2);
  };

  const correlationValue = calculateCorrelation();
  const correlationStrength = Math.abs(parseFloat(correlationValue));
  
  let strengthText = '';
  let strengthColor = '';
  
  if (correlationStrength >= 0.7) {
    strengthText = 'Forte';
    strengthColor = '#4CAF50';
  } else if (correlationStrength >= 0.4) {
    strengthText = 'Moderada';
    strengthColor = '#FF9800';
  } else {
    strengthText = 'Fraca';
    strengthColor = '#F44336';
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
      
      {/* Card de Análise de Correlação com Três Gavetas */}
      <Card style={styles.correlationCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Análise de Correlação:</Text>
          
          {/* Gaveta 1: Bem-estar */}
          <View style={styles.drawerContainer}>
            <Button
              mode="outlined"
              onPress={() => setWellbeingDrawerOpen(!wellbeingDrawerOpen)}
              style={styles.drawerButton}
              contentStyle={styles.drawerButtonContent}
              labelStyle={styles.drawerButtonLabel}
              icon={({ size, color }) => (
                <MaterialCommunityIcons 
                  name={wellbeingDrawerOpen ? "chevron-up" : "chevron-down"} 
                  size={size} 
                  color={color} 
                />
              )}
            >
              <View style={styles.drawerButtonTextContainer}>
                <View style={styles.drawerButtonLeft}>
                  <MaterialCommunityIcons name="heart" size={24} color="#4CAF50" />
                  <Text style={styles.drawerButtonText}>Bem-estar</Text>
                </View>
                <View style={styles.drawerButtonRight}>
                  <Text style={styles.selectedMetricText}>
                    {selectedWellbeingInfo?.label}
                  </Text>
                </View>
              </View>
            </Button>
            
            {wellbeingDrawerOpen && (
              <View style={styles.drawerContent}>
                <View style={styles.metricsGrid}>
                  {WELLBEING_METRICS.map((metric) => (
                    <Chip
                      key={metric.value}
                      selected={selectedWellbeingMetric === metric.value}
                      onPress={() => setSelectedWellbeingMetric(metric.value)}
                      style={[
                        styles.metricChip,
                        selectedWellbeingMetric === metric.value && { backgroundColor: metric.color + '20' }
                      ]}
                      textStyle={[
                        styles.metricChipText,
                        selectedWellbeingMetric === metric.value && { color: metric.color, fontWeight: 'bold' }
                      ]}
                      icon={metric.icon}
                    >
                      {metric.label}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Gaveta 2: Treino Planejado */}
          <View style={styles.drawerContainer}>
            <Button
              mode="outlined"
              onPress={() => setPlannedDrawerOpen(!plannedDrawerOpen)}
              style={styles.drawerButton}
              contentStyle={styles.drawerButtonContent}
              labelStyle={styles.drawerButtonLabel}
              icon={({ size, color }) => (
                <MaterialCommunityIcons 
                  name={plannedDrawerOpen ? "chevron-up" : "chevron-down"} 
                  size={size} 
                  color={color} 
                />
              )}
            >
              <View style={styles.drawerButtonTextContainer}>
                <View style={styles.drawerButtonLeft}>
                  <MaterialCommunityIcons name="calendar" size={24} color="#2196F3" />
                  <Text style={styles.drawerButtonText}>Treino Planejado</Text>
                </View>
                <View style={styles.drawerButtonRight}>
                  <Text style={styles.selectedMetricText}>
                    {selectedPlannedInfo?.label}
                  </Text>
                </View>
              </View>
            </Button>
            
            {plannedDrawerOpen && (
              <View style={styles.drawerContent}>
                <View style={styles.metricsGrid}>
                  {PLANNED_TRAINING_METRICS.map((metric) => (
                    <Chip
                      key={metric.value}
                      selected={selectedPlannedMetric === metric.value}
                      onPress={() => setSelectedPlannedMetric(metric.value)}
                      style={[
                        styles.metricChip,
                        selectedPlannedMetric === metric.value && { backgroundColor: metric.color + '20' }
                      ]}
                      textStyle={[
                        styles.metricChipText,
                        selectedPlannedMetric === metric.value && { color: metric.color, fontWeight: 'bold' }
                      ]}
                      icon={metric.icon}
                    >
                      {metric.label}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Gaveta 3: Treino Realizado */}
          <View style={styles.drawerContainer}>
            <Button
              mode="outlined"
              onPress={() => setCompletedDrawerOpen(!completedDrawerOpen)}
              style={styles.drawerButton}
              contentStyle={styles.drawerButtonContent}
              labelStyle={styles.drawerButtonLabel}
              icon={({ size, color }) => (
                <MaterialCommunityIcons 
                  name={completedDrawerOpen ? "chevron-up" : "chevron-down"} 
                  size={size} 
                  color={color} 
                />
              )}
            >
              <View style={styles.drawerButtonTextContainer}>
                <View style={styles.drawerButtonLeft}>
                  <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                  <Text style={styles.drawerButtonText}>Treino Realizado</Text>
                </View>
                <View style={styles.drawerButtonRight}>
                  <Text style={styles.selectedMetricText}>
                    {selectedCompletedInfo?.label}
                  </Text>
                </View>
              </View>
            </Button>
            
            {completedDrawerOpen && (
              <View style={styles.drawerContent}>
                <View style={styles.metricsGrid}>
                  {COMPLETED_TRAINING_METRICS.map((metric) => (
                    <Chip
                      key={metric.value}
                      selected={selectedCompletedMetric === metric.value}
                      onPress={() => setSelectedCompletedMetric(metric.value)}
                      style={[
                        styles.metricChip,
                        selectedCompletedMetric === metric.value && { backgroundColor: metric.color + '20' }
                      ]}
                      textStyle={[
                        styles.metricChipText,
                        selectedCompletedMetric === metric.value && { color: metric.color, fontWeight: 'bold' }
                      ]}
                      icon={metric.icon}
                    >
                      {metric.label}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Descrição da Correlação Selecionada */}
      <Card style={styles.descriptionCard}>
        <Card.Content>
          <View style={styles.descriptionHeader}>
            <MaterialCommunityIcons 
              name="chart-scatter-plot" 
              size={24} 
              color="#2196F3" 
            />
            <Text style={styles.descriptionTitle}>
              {selectedWellbeingInfo?.label} vs {selectedPlannedInfo?.label} vs {selectedCompletedInfo?.label}
            </Text>
          </View>
          <Text style={styles.descriptionText}>
            {correlationData.length > 0 
              ? `Analisando correlação entre ${selectedWellbeingInfo?.label} e ${selectedCompletedInfo?.label} com ${correlationData.length} pontos de dados do período selecionado.`
              : 'Nenhum dado suficiente para análise. Faça check-ins e treinos para ver correlações.'
            }
          </Text>
        </Card.Content>
      </Card>

      {/* Resultado da Correlação */}
      <Card style={styles.resultCard}>
        <Card.Content>
          <Text style={styles.resultTitle}>Resultado da Análise</Text>
          <View style={styles.resultGrid}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Coeficiente de Correlação</Text>
              <Text style={styles.resultValue}>{correlationValue}</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Força da Correlação</Text>
              <Text style={[styles.resultValue, { color: strengthColor }]}>{strengthText}</Text>
            </View>
          </View>
          
          <View style={styles.interpretationContainer}>
            <Text style={styles.interpretationTitle}>Interpretação:</Text>
            <Text style={styles.interpretationText}>
              {parseFloat(correlationValue) > 0 
                ? 'Correlação positiva: quando uma variável aumenta, a outra também tende a aumentar.'
                : 'Correlação negativa: quando uma variável aumenta, a outra tende a diminuir.'
              }
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Gráfico de Dispersão Simples */}
      <Card style={styles.scatterCard}>
        <Card.Content>
          <Text style={styles.scatterTitle}>Gráfico de Dispersão</Text>
          <View style={styles.scatterContainer}>
            {correlationData.length > 0 ? (
              <>
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
                            backgroundColor: '#2196F3',
                          }
                        ]}
                      />
                    );
                  })}
                </View>
                <View style={styles.axisLabels}>
                  <Text style={styles.axisLabel}>{selectedWellbeingInfo?.label}</Text>
                  <Text style={styles.axisLabelVertical}>{selectedCompletedInfo?.label}</Text>
                </View>
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialCommunityIcons name="chart-scatter-plot" size={48} color="#ccc" />
                <Text style={styles.noDataText}>Nenhum dado para correlação</Text>
                <Text style={styles.noDataSubtext}>
                  Faça check-ins e treinos no mesmo dia para ver correlações
                </Text>
              </View>
            )}
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
    paddingBottom: 32, // Espaço extra no final para evitar corte
  },
  correlationCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  drawerContainer: {
    marginBottom: 12,
  },
  drawerButton: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  drawerButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16, // Aumentado para melhor toque
    paddingHorizontal: 16,
    minHeight: 56, // Altura mínima para toque
  },
  drawerButtonLabel: {
    fontSize: 14,
    color: '#333',
  },
  drawerButtonTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap', // Permite quebra de linha
  },
  drawerButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  drawerButtonRight: {
    alignItems: 'flex-end',
    flexShrink: 1,
  },
  drawerButtonText: {
    fontSize: 16, // Aumentado para melhor legibilidade
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  selectedMetricText: {
    fontSize: 13, // Aumentado ligeiramente
    color: '#666',
    fontStyle: 'italic',
    flexShrink: 1, // Permite encolher se necessário
    maxWidth: '40%', // Limita largura para evitar corte
  },
  drawerContent: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#e0e0e0',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 16, // Aumentado para melhor espaçamento
    marginTop: -2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // Aumentado para melhor espaçamento
  },
  metricChip: {
    marginBottom: 8, // Aumentado para melhor espaçamento
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 40, // Altura mínima para toque
    paddingVertical: 8, // Padding vertical para melhor toque
  },
  metricChipText: {
    color: '#333',
    fontSize: 14, // Aumentado para melhor legibilidade
  },
  descriptionCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  resultCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  resultGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  resultLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  interpretationContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
  },
  interpretationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  interpretationText: {
    fontSize: 13,
    color: '#1976d2',
    lineHeight: 18,
  },
  scatterCard: {
    borderRadius: 12,
  },
  scatterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  scatterContainer: {
    height: 200,
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
    width: 8,
    height: 8,
    borderRadius: 4,
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
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  axisLabelVertical: {
    fontSize: 10,
    color: '#666',
    transform: [{ rotate: '-90deg' }],
    position: 'absolute',
    left: -40,
    top: 80,
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
}); 