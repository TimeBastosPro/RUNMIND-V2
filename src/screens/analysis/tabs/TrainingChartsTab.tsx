import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';
import { useAuthStore } from '../../../stores/auth';
import { navigatePeriod, filterDataByPeriod } from '../../../utils/periodFilter';
import EmptyState from '../../../components/ui/EmptyState';
import LoadingState from '../../../components/ui/LoadingState';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

// Tipos de Análise
const ANALYSIS_TYPES = [
  { 
    label: 'Treinos Realizados', 
    value: 'completed',
    icon: 'check-circle',
    color: '#4CAF50',
  },
  { 
    label: 'Treinos Planejados', 
    value: 'planned',
    icon: 'calendar-clock',
    color: '#2196F3',
  },
];

// Métricas para Treinos Realizados (baseadas nos campos exatos do modal "Editar Treino Realizado")
const COMPLETED_TRAINING_METRICS = [
  { 
    label: 'Duração (min)', 
    value: 'duration_minutes',
    icon: 'clock-outline',
    color: '#FF9800',
    unit: 'min',
    field: 'duration_calculated',
  },
  { 
    label: 'Distância (km)', 
    value: 'distance_km',
    icon: 'map-marker-distance',
    color: '#4CAF50',
    unit: 'km',
    field: 'distance_km',
  },
  { 
    label: 'Altimetria Positiva', 
    value: 'elevation_gain',
    icon: 'arrow-up-bold',
    color: '#00BCD4',
    unit: 'm',
    field: 'elevation_gain_meters',
  },
  { 
    label: 'Altimetria Negativa', 
    value: 'elevation_loss',
    icon: 'arrow-down-bold',
    color: '#0097A7',
    unit: 'm',
    field: 'elevation_loss_meters',
  },
  { 
    label: 'FC Média', 
    value: 'avg_heart_rate',
    icon: 'heart-pulse',
    color: '#E91E63',
    unit: 'bpm',
    field: 'avg_heart_rate',
  },
  { 
    label: 'Percepção de Esforço (PSE)', 
    value: 'perceived_effort',
    icon: 'gauge',
    color: '#F44336',
    unit: '/10',
    field: 'perceived_effort',
  },
  { 
    label: 'Satisfação com o Treino', 
    value: 'session_satisfaction',
    icon: 'emoticon-happy',
    color: '#9C27B0',
    unit: '/5',
    field: 'session_satisfaction',
  },
  { 
    label: 'Sensação Geral', 
    value: 'sensacoes',
    icon: 'emoticon-outline',
    color: '#673AB7',
    unit: 'itens',
    field: 'sensacoes',
  },
  { 
    label: 'Clima', 
    value: 'clima',
    icon: 'weather-partly-cloudy',
    color: '#607D8B',
    unit: '',
    field: 'clima',
  }
];

// Métricas para Treinos Planejados (baseadas nos campos reais do planningState)
const PLANNED_TRAINING_METRICS = [
  { 
    label: 'Distância Planejada', 
    value: 'planned_distance',
    icon: 'map-marker-distance',
    color: '#4CAF50',
    unit: 'km',
    field: 'distance_km',
  },
  { 
    label: 'Duração Planejada', 
    value: 'planned_duration',
    icon: 'clock-outline',
    color: '#FF9800',
    unit: 'min',
    field: 'duration',
  },
  { 
    label: 'Esforço Planejado', 
    value: 'planned_effort',
    icon: 'gauge',
    color: '#F44336',
    unit: '/5',
    field: 'esforco',
  },
  { 
    label: 'Intensidade Planejada', 
    value: 'planned_intensity',
    icon: 'speedometer',
    color: '#9C27B0',
    unit: '',
    field: 'intensidade',
  },
  { 
    label: 'Modalidade', 
    value: 'modality',
    icon: 'run',
    color: '#E91E63',
    unit: '',
    field: 'modalidade',
  },
  { 
    label: 'Tipo de Treino', 
    value: 'training_type',
    icon: 'dumbbell',
    color: '#795548',
    unit: '',
    field: 'treino_tipo',
  }
];

// Tipos de período (simplificado)
const PERIOD_TYPES = [
  { label: 'Semana', value: 'week' },
  { label: 'Mês', value: 'month' },
];

export default function TrainingChartsTab() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<'completed' | 'planned'>('completed');
  const [selectedMetric, setSelectedMetric] = useState('distance');
  const [periodType, setPeriodType] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(() => {
    // Sincronizar com a aba de treinos - usar a data atual
    const today = new Date();
    return today;
  });
  
  const { trainingSessions, fetchTrainingSessions, isLoading } = useCheckinStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('🔍 TrainingChartsTab - Carregando treinos para usuário:', user.id);
      fetchTrainingSessions(); // ✅ Carrega treinos do usuário logado
    } else {
      console.log('🔍 TrainingChartsTab - Usuário não autenticado ou sem ID:', { isAuthenticated, userId: user?.id });
    }
  }, [fetchTrainingSessions, isAuthenticated, user?.id]);

  // Resetar métrica quando o tipo de análise mudar
  useEffect(() => {
    const currentMetrics = getCurrentMetrics();
    const firstMetric = currentMetrics[0];
    if (firstMetric && selectedMetric !== firstMetric.value) {
      setSelectedMetric(firstMetric.value);
    }
  }, [selectedAnalysis]);

  // Obter métricas baseadas no tipo de análise selecionado
  const getCurrentMetrics = () => {
    return selectedAnalysis === 'completed' ? COMPLETED_TRAINING_METRICS : PLANNED_TRAINING_METRICS;
  };

  const currentMetrics = getCurrentMetrics();
  const selectedMetricInfo = currentMetrics.find(m => m.value === selectedMetric);

  // ✅ COPIE a função getCurrentPeriod da aba WellbeingChartsTab.tsx JÁ CORRIGIDA
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

  // ✅ COPIE a função handleNavigatePeriod
  const handleNavigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = navigatePeriod(currentDate, periodType, direction);
    setCurrentDate(newDate);
  };

  // ✅ CRIE a função de análise para treinos
  const getTrainingAnalysis = () => {
    if (!isAuthenticated || !user?.id) {
      return { data: [], sessionsCount: 0 };
    }
    
    const { startDate, endDate } = getCurrentPeriod();
    
    // Debug: Verificar dados brutos
    console.log('🔍 DEBUG - Dados brutos de treinos:', {
      totalSessions: trainingSessions?.length || 0,
      sessions: trainingSessions?.map(s => ({
        id: s.id,
        date: s.training_date,
        status: s.status,
        distance_km: s.distance_km,
        duracao_horas: s.duracao_horas,
        duracao_minutos: s.duracao_minutos,
        elevation_gain_meters: s.elevation_gain_meters,
        elevation_loss_meters: s.elevation_loss_meters,
        avg_heart_rate: s.avg_heart_rate,
        perceived_effort: s.perceived_effort,
        session_satisfaction: s.session_satisfaction,
        sensacoes: s.sensacoes,
        clima: s.clima
      })) || []
    });
    
    // Filtrar treinos baseado no tipo de análise selecionado
    // Usar a mesma lógica da aba de treinos: trainingSessionsByDate
    const filteredSessions = (trainingSessions || []).filter(session => {
      if (!session.training_date || session.user_id !== user.id) return false;
      const sessionDate = new Date(session.training_date);
      
      // Verificar se a data está no período
      if (sessionDate < startDate || sessionDate > endDate) return false;
      
      if (selectedAnalysis === 'completed') {
        // Para treinos realizados, usar apenas status === 'completed'
        return session.status === 'completed';
      } else {
        // Para treinos planejados, usar apenas status === 'planned'
        return session.status === 'planned';
      }
    });

    // Debug: verificar filtragem
    console.log('🔍 DEBUG - Filtragem de treinos:', {
      selectedAnalysis,
      totalSessions: trainingSessions?.length || 0,
      filteredSessions: filteredSessions.map(s => ({
        id: s.id,
        date: s.training_date,
        status: s.status,
        distance: s.distance_km
      }))
    });

    const allDatesInPeriod: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      allDatesInPeriod.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Função para obter chave de data (igual à aba de treinos)
    const getDateKey = (dateString: string): string => {
      return dateString.split('T')[0];
    };

    const metricData = allDatesInPeriod.map(dateObj => {
      const dateStr = dateObj.toISOString().split('T')[0];
      const sessionForDay = filteredSessions.find(s => {
        const sessionDateStr = new Date(s.training_date).toISOString().split('T')[0];
        return sessionDateStr === dateStr;
      });
      
      // Debug: verificar se encontrou sessão para o dia
      if (sessionForDay) {
        console.log(`🔍 DEBUG - Sessão encontrada para ${dateStr}:`, {
          id: sessionForDay.id,
          date: sessionForDay.training_date,
          status: sessionForDay.status,
          distance: sessionForDay.distance_km
        });
      }
      
      let value = 0;
      if (sessionForDay && selectedMetricInfo) {
        const fieldValue = sessionForDay[selectedMetricInfo.field as keyof typeof sessionForDay];
        
        // Debug específico para cada métrica (apenas quando há dados)
        if (sessionForDay && (fieldValue !== null && fieldValue !== undefined)) {
          console.log(`🔍 DEBUG - Extraindo ${selectedMetricInfo.value}:`, {
            field: selectedMetricInfo.field,
            fieldValue: fieldValue,
            fieldType: typeof fieldValue,
            date: dateStr
          });
        }
        
        // Tratar diferentes tipos de campos baseado na métrica selecionada
        if (selectedMetricInfo.value === 'duration_minutes') {
          // Calcular duração em minutos (horas * 60 + minutos)
          const hours = parseInt(String(sessionForDay.duracao_horas)) || 0;
          const minutes = parseInt(String(sessionForDay.duracao_minutos)) || 0;
          value = hours * 60 + minutes;
        } else if (selectedMetricInfo.value === 'sensacoes') {
          // Sensação Geral: contar número de itens selecionados
          if (Array.isArray(fieldValue)) {
            value = fieldValue.length;
          } else if (typeof fieldValue === 'string' && fieldValue) {
            // Se for string, contar vírgulas + 1 (assumindo formato "item1,item2,item3")
            value = fieldValue.split(',').length;
          } else {
            value = 0;
          }
        } else if (selectedMetricInfo.value === 'clima') {
          // Clima: converter para número baseado no tipo
          const clima = String(fieldValue).toLowerCase();
          if (clima === 'agradável') value = 1;
          else if (clima === 'calor') value = 2;
          else if (clima === 'frio') value = 3;
          else if (clima === 'chuva') value = 4;
          else if (clima === 'vento') value = 5;
          else if (clima === 'neblina') value = 6;
          else value = 0;
        } else if (typeof fieldValue === 'number') {
          // Campos numéricos diretos
          value = fieldValue;
        } else if (typeof fieldValue === 'string') {
          // Para campos de string, converter para número quando possível
          if (selectedMetricInfo.value === 'planned_effort') {
            // Esforço planejado (1-5)
            value = parseInt(fieldValue) || 0;
          } else if (selectedMetricInfo.value === 'modality') {
            // Modalidade: converter para número
            const modality = fieldValue.toLowerCase();
            if (modality === 'corrida') value = 1;
            else if (modality === 'forca') value = 2;
            else if (modality === 'educativo') value = 3;
            else if (modality === 'flexibilidade') value = 4;
            else if (modality === 'bike') value = 5;
            else value = 6;
          } else if (selectedMetricInfo.value === 'training_type') {
            // Tipo de treino: converter para número
            const type = fieldValue.toLowerCase();
            if (type === 'continuo') value = 1;
            else if (type === 'intervalado') value = 2;
            else if (type === 'longo') value = 3;
            else if (type === 'fartlek') value = 4;
            else if (type === 'tiro') value = 5;
            else if (type === 'ritmo') value = 6;
            else if (type === 'regenerativo') value = 7;
            else value = 8;
          } else if (selectedMetricInfo.value === 'planned_intensity') {
            // Intensidade: Z1=1, Z2=2, etc.
            const intensity = fieldValue.toUpperCase();
            if (intensity === 'Z1') value = 1;
            else if (intensity === 'Z2') value = 2;
            else if (intensity === 'Z3') value = 3;
            else if (intensity === 'Z4') value = 4;
            else if (intensity === 'Z5') value = 5;
            else value = 0;
          } else {
            // Tentar converter string para número
            const numValue = parseFloat(fieldValue);
            value = isNaN(numValue) ? 0 : numValue;
          }
        }
      }
      
      return {
        date: dateObj,
        value: value,
        hasData: value > 0,
      };
    });

    // Debug final: verificar dados processados
    console.log('🔍 DEBUG - Dados processados para o gráfico:', {
      selectedAnalysis,
      selectedMetric,
      filteredSessionsCount: filteredSessions.length,
      filteredSessions: filteredSessions.map(s => ({
        id: s.id,
        date: s.training_date,
        status: s.status,
        metricValue: s[selectedMetricInfo?.field as keyof typeof s]
      })),
      metricData: metricData.map(d => ({
        date: d.date.toISOString().split('T')[0],
        value: d.value,
        hasData: d.hasData
      }))
    });

    return {
      data: metricData,
      sessionsCount: filteredSessions.length
    };
  };

  const analysis = getTrainingAnalysis();

    // Debug: Log dos dados para entender a inconsistência
    console.log('🔍 DEBUG - Análise de Treinos:', {
      selectedAnalysis,
      selectedMetric,
      periodType,
      currentDate: currentDate.toISOString().split('T')[0],
      period: {
        startDate: getCurrentPeriod().startDate.toISOString().split('T')[0],
        endDate: getCurrentPeriod().endDate.toISOString().split('T')[0]
      },
      totalSessions: trainingSessions?.length || 0,
      filteredSessions: analysis.sessionsCount,
      allTrainingSessions: trainingSessions?.map(s => ({
        id: s.id,
        date: s.training_date,
        status: s.status,
        distance_km: s.distance_km,
        duracao_horas: s.duracao_horas,
        duracao_minutos: s.duracao_minutos,
        elevation_gain_meters: s.elevation_gain_meters,
        elevation_loss_meters: s.elevation_loss_meters,
        avg_heart_rate: s.avg_heart_rate,
        perceived_effort: s.perceived_effort,
        session_satisfaction: s.session_satisfaction,
        sensacoes: s.sensacoes,
        clima: s.clima
      })) || [],
      analysisData: analysis.data.map(d => ({
        date: d.date.toISOString().split('T')[0],
        value: d.value,
        hasData: d.hasData
      }))
    });

  if (isLoading) {
    return <LoadingState message="Carregando dados de treinos..." icon="run-fast" />;
  }

    return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Card de Controles */}
      <Card style={styles.controlsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Análise de Treinos</Text>
          
          {/* Tipo de Análise */}
          <View style={styles.controlSection}>
            <Text style={styles.controlLabel}>Tipo de Análise:</Text>
            <View style={styles.analysisGrid}>
              {ANALYSIS_TYPES.map((type) => (
                <Chip
                  key={type.value}
                  selected={selectedAnalysis === type.value}
                  onPress={() => setSelectedAnalysis(type.value as 'completed' | 'planned')}
                  style={[styles.analysisChip, { backgroundColor: selectedAnalysis === type.value ? type.color : undefined }]}
                  compact={isMobile}
                >
                  {type.label}
                </Chip>
              ))}
              </View>
          </View>
          
          {/* Tipo de Período */}
          <View style={styles.controlSection}>
            <Text style={styles.controlLabel}>Tipo de Período:</Text>
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
            <Button
              mode="outlined"
              onPress={() => handleNavigatePeriod('prev')}
              icon="chevron-left"
              style={styles.navButton}
              compact={isMobile}
            >
              Anterior
            </Button>
            
            <View style={styles.currentPeriodContainer}>
              <Text style={styles.currentPeriodText}>
                {periodType === 'week' ? 
                  `Semana de ${getCurrentPeriod().startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} a ${getCurrentPeriod().endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}` :
                  `Mês de ${getCurrentPeriod().startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
                }
              </Text>
            </View>
            
            <Button
              mode="outlined"
              onPress={() => handleNavigatePeriod('next')}
              icon="chevron-right"
              style={styles.navButton}
              compact={isMobile}
            >
              Próximo
            </Button>
          </View>
        </Card.Content>
      </Card>
      
      {/* Card de Métricas */}
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text style={styles.controlLabel}>
            Métrica de Treino {selectedAnalysis === 'completed' ? 'Realizado' : 'Planejado'}:
          </Text>
          <View style={styles.metricsGrid}>
            {currentMetrics.map((metric) => (
              <Chip
                key={metric.value}
                selected={selectedMetric === metric.value}
                onPress={() => setSelectedMetric(metric.value)}
                style={[styles.metricChip, { backgroundColor: selectedMetric === metric.value ? metric.color : undefined }]}
                  compact={isMobile}
              >
                {metric.label}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Card do Gráfico */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>
              {selectedMetricInfo?.label} - {selectedAnalysis === 'completed' ? 'Treinos Realizados' : 'Treinos Planejados'}
          </Text>
            <Text style={styles.periodLabel}>
              {getCurrentPeriod().startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {getCurrentPeriod().endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </Text>
          </View>
          
          {analysis.data.length > 0 && analysis.data.some(d => d.hasData) ? (
            <View style={styles.chartContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chartBars}>
                  {analysis.data.map((item, index) => {
                    const valuesWithData = analysis.data.filter(d => d.hasData).map(d => d.value);
                    const maxValue = valuesWithData.length > 0 ? Math.max(...valuesWithData) : 1;
                    
                    return (
                      <View key={index} style={styles.barWrapper}>
                        <View 
                style={[
                            styles.bar,
                            {
                              height: Math.max((item.value / maxValue) * 100, 2), 
                              backgroundColor: item.hasData ? selectedMetricInfo?.color : '#e0e0e0'
                            }
                          ]}
                        />
                        <Text style={styles.barLabel}>
                          {item.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </Text>
                        <Text style={styles.barValue}>
                          {item.hasData ? item.value.toFixed(1) : '-'}
                        </Text>
          </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons 
                name={selectedAnalysis === 'completed' ? "run" : "calendar-clock"} 
                size={64} 
                color="#ccc" 
                style={styles.emptyStateIcon}
              />
              <Text style={styles.emptyStateTitle}>
                Nenhum treino {selectedAnalysis === 'completed' ? 'realizado' : 'planejado'}
              </Text>
              <Text style={styles.emptyStateMessage}>
                {selectedAnalysis === 'completed' 
                  ? 'Não há treinos realizados neste período. Conclua seus treinos para ver a análise.'
                  : 'Não há treinos planejados neste período. Planeje seus treinos para ver a análise.'
                }
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Resumo Estatístico */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryHeader}>
            <MaterialCommunityIcons name="chart-line" size={24} color="#2196F3" />
            <Text style={styles.summaryTitle}>Resumo - {periodType === 'week' ? 'Semana' : 'Mês'}</Text>
                </View>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                Treinos {selectedAnalysis === 'completed' ? 'Realizados' : 'Planejados'}
                  </Text>
              <Text style={styles.summaryDescription}>
                Total de treinos {selectedAnalysis === 'completed' ? 'completados' : 'planejados'} no período
              </Text>
              <Text style={styles.summaryValue}>{analysis.sessionsCount}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Média {selectedMetricInfo?.label}</Text>
              <Text style={styles.summaryDescription}>
                Valor médio nos treinos {selectedAnalysis === 'completed' ? 'realizados' : 'planejados'}
              </Text>
              <Text style={styles.summaryValue}>
                {analysis.data.filter(d => d.hasData).length > 0 ? 
                  (analysis.data.filter(d => d.hasData).reduce((sum, d) => sum + d.value, 0) / analysis.data.filter(d => d.hasData).length).toFixed(1) : 
                  'N/A'
                }
              </Text>
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
  },
  controlsCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  metricsCard: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  card: {
    margin: 16,
    marginVertical: 8,
    elevation: 2,
  },
  summaryCard: {
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
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  analysisChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  periodNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navButton: {
    minWidth: 100,
  },
  currentPeriodContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  currentPeriodText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  periodLabel: {
    fontSize: 14,
    color: '#666',
  },
  chartContainer: {
    marginTop: 8,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
    paddingHorizontal: 8,
  },
  barWrapper: {
    alignItems: 'center',
    marginHorizontal: 4,
    minWidth: 40,
  },
  bar: {
    width: 20,
    marginBottom: 8,
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    color: '#333',
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
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
  summaryDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
}); 