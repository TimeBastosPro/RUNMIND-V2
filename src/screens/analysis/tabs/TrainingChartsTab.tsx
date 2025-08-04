import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';
import { filterDataByPeriod, getPeriodLabel } from '../../../utils/periodFilter';

const TRAINING_METRICS = [
  // Métricas Básicas (comuns a planejado e realizado)
  { 
    label: 'Distância', 
    value: 'distance',
    icon: 'map-marker-distance',
    color: '#4CAF50',
    unit: 'km',
    planned: 'distance_km',
    completed: 'distance_km',
  },
  { 
    label: 'Duração', 
    value: 'duration',
    icon: 'clock-outline',
    color: '#2196F3',
    unit: 'min',
    planned: 'duracao',
    completed: 'duracao',
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
    unit: 'muito leve - muito forte',
    planned: 'esforco',
    completed: 'effort_level',
  },
  { 
    label: 'Intensidade', 
    value: 'intensity',
    icon: 'speedometer',
    color: '#F44336',
    unit: '1-5',
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
    unit: 'corrida, força, educativo, flexibilidade, bike',
    planned: 'modalidade',
    completed: null, // Não existe no realizado
  },
  { 
    label: 'Tipo de Treino', 
    value: 'treino_tipo',
    icon: 'format-list-bulleted',
    color: '#2196F3',
    unit: 'contínuo, intervalado, longo, fartlek, tiro, ritmo, regenerativo',
    planned: 'treino_tipo',
    completed: null, // Não existe no realizado
  },
  { 
    label: 'Terreno', 
    value: 'terreno',
    icon: 'terrain',
    color: '#795548',
    unit: 'asfalto, esteira, trilha, pista, outro',
    planned: 'terreno',
    completed: null, // Não existe no realizado
  },
  { 
    label: 'Percurso', 
    value: 'percurso',
    icon: 'map',
    color: '#607D8B',
    unit: 'plano, ligeira, moderada, forte, muita inclinação',
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
   
  // Calcular datas padrão: semana atual (segunda a domingo)
  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Segunda-feira da semana atual
   
  const defaultStartDate = new Date(currentWeekStart);
  const defaultEndDate = new Date(currentWeekStart);
  defaultEndDate.setDate(currentWeekStart.getDate() + 6); // Domingo da semana atual
   
  const [customStartDate, setCustomStartDate] = useState<Date>(defaultStartDate);
  const [customEndDate, setCustomEndDate] = useState<Date>(defaultEndDate);
  const { trainingSessions, fetchTrainingSessions } = useCheckinStore();

  useEffect(() => {
    console.log('🔍 DEBUG - TrainingChartsTab montada, carregando treinos...');
    fetchTrainingSessions();
  }, [fetchTrainingSessions]);

  // Log quando os dados mudarem
  useEffect(() => {
    console.log('🔍 DEBUG - trainingSessions atualizado:', {
      total: trainingSessions.length,
      planned: trainingSessions.filter(t => t.status === 'planned').length,
      completed: trainingSessions.filter(t => t.status === 'completed').length,
      sample: trainingSessions.slice(0, 2).map(t => ({
        id: t.id,
        status: t.status,
        date: t.training_date,
        planned_distance: t.distance_km,
        actual_distance: t.distance_km
      }))
    });
  }, [trainingSessions]);

  // Resetar para semana atual quando mudar o tipo de análise
  useEffect(() => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Segunda-feira da semana atual
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Domingo da semana atual
    
    setCustomStartDate(currentWeekStart);
    setCustomEndDate(currentWeekEnd);
  }, [selectedAnalysis]);

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

  const selectedMetricInfo = TRAINING_METRICS.find(m => m.value === selectedMetric);
   
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
    console.log('🔍 DEBUG - getMetricData INÍCIO:', {
      trainingSessionsTotal: trainingSessions.length,
      selectedPeriod: 'custom', // PeriodSelector foi removido, então sempre 'custom'
      customStartDate: customStartDate?.toISOString(),
      customEndDate: customEndDate?.toISOString(),
      selectedMetric: selectedMetric,
      selectedAnalysis: selectedAnalysis,
      sampleTrainingSessions: trainingSessions.slice(0, 3).map(t => ({
        id: t.id,
        status: t.status,
        date: t.training_date,
        distance_km: t.distance_km,
        duracao_horas: t.duracao_horas,
        duracao_minutos: t.duracao_minutos,
        esforco: t.esforco,
        intensidade: t.intensidade,
        modalidade: t.modalidade,
        treino_tipo: t.treino_tipo,
        terreno: t.terreno,
        percurso: t.percurso
      }))
    });

    // Filtrar dados por período primeiro
    const allFilteredSessions = filterDataByPeriod(trainingSessions, 'custom', customStartDate, customEndDate);
    
    // Depois separar por tipo de análise
    const sessions = selectedAnalysis === 'completed' ? 
      allFilteredSessions.filter(s => s.status === 'completed') : 
      selectedAnalysis === 'planned' ? 
      allFilteredSessions.filter(s => s.status === 'planned') : 
      allFilteredSessions; // Para comparação, usar todos os dados
    
    console.log('🔍 DEBUG - getMetricData FILTRADO:', {
      selectedMetric,
      selectedAnalysis,
      'trainingSessions total': trainingSessions.length,
      'allFilteredSessions': allFilteredSessions.length,
      'sessions filtrados por tipo': sessions.length,
      'primeiro treino planejado': allFilteredSessions.find(s => s.status === 'planned') ? {
        id: allFilteredSessions.find(s => s.status === 'planned')?.id,
        status: allFilteredSessions.find(s => s.status === 'planned')?.status,
        distance_km: allFilteredSessions.find(s => s.status === 'planned')?.distance_km,
        duracao_horas: allFilteredSessions.find(s => s.status === 'planned')?.duracao_horas,
        duracao_minutos: allFilteredSessions.find(s => s.status === 'planned')?.duracao_minutos,
        esforco: allFilteredSessions.find(s => s.status === 'planned')?.esforco,
        intensidade: allFilteredSessions.find(s => s.status === 'planned')?.intensidade
      } : null,
      'primeiro treino realizado': allFilteredSessions.find(s => s.status === 'completed') ? {
        id: allFilteredSessions.find(s => s.status === 'completed')?.id,
        status: allFilteredSessions.find(s => s.status === 'completed')?.status,
        distance_km: allFilteredSessions.find(s => s.status === 'completed')?.distance_km,
        duracao_horas: allFilteredSessions.find(s => s.status === 'completed')?.duracao_horas,
        duracao_minutos: allFilteredSessions.find(s => s.status === 'completed')?.duracao_minutos,
        effort_level: allFilteredSessions.find(s => s.status === 'completed')?.effort_level
      } : null
    });

    // Sempre retornar 7 dias (segunda a domingo) para consistência visual
    const weekStart = new Date(customStartDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Segunda-feira
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      
      const dateStr = currentDate.toISOString().split('T')[0];
      const sessionForDay = sessions.find(s => s.training_date === dateStr);
      
      let value = 0;
      if (sessionForDay) {
        console.log('🔍 DEBUG - Processando sessão para dia:', {
          date: dateStr,
          sessionId: sessionForDay.id,
          status: sessionForDay.status,
          selectedMetric: selectedMetric,
          sessionData: {
            distance_km: sessionForDay.distance_km,
            duracao_horas: sessionForDay.duracao_horas,
            duracao_minutos: sessionForDay.duracao_minutos,
            esforco: sessionForDay.esforco,
            intensidade: sessionForDay.intensidade,
            effort_level: sessionForDay.effort_level
          }
        });
        
        switch (selectedMetric) {
          case 'distance':
            value = sessionForDay.distance_km !== null && sessionForDay.distance_km !== undefined ? sessionForDay.distance_km : 0;
            break;
          case 'duration':
            const hours = sessionForDay.duracao_horas && sessionForDay.duracao_horas !== '' ? 
              (isNaN(parseInt(sessionForDay.duracao_horas)) ? 0 : parseInt(sessionForDay.duracao_horas)) : 0;
            const minutes = sessionForDay.duracao_minutos && sessionForDay.duracao_minutos !== '' ? 
              (isNaN(parseInt(sessionForDay.duracao_minutos)) ? 0 : parseInt(sessionForDay.duracao_minutos)) : 0;
            value = hours * 60 + minutes;
            break;
          case 'elevation_gain':
            value = sessionForDay.elevation_gain_meters || 0;
            break;
          case 'elevation_loss':
            value = sessionForDay.elevation_loss_meters || 0;
            break;
          case 'avg_heart_rate':
            value = sessionForDay.avg_heart_rate || 0;
            break;
          case 'perceived_effort':
            value = sessionForDay.perceived_effort || 0;
            break;
          case 'effort_level':
            if (selectedAnalysis === 'planned') {
              // Para treinos planejados, usar esforco
              value = sessionForDay.esforco ? parseInt(sessionForDay.esforco) || 0 : 0;
            } else {
              // Para treinos realizados, usar effort_level
              value = sessionForDay.effort_level || 0;
            }
            break;
          case 'session_satisfaction':
            value = sessionForDay.session_satisfaction || 0;
            break;
          case 'max_heart_rate':
            value = sessionForDay.max_heart_rate || 0;
            break;
          case 'intensity':
            if (sessionForDay.intensidade) {
              const intensityStr = sessionForDay.intensidade.toString().toUpperCase();
              if (intensityStr.startsWith('Z')) {
                const zoneNumber = parseInt(intensityStr.substring(1));
                value = zoneNumber >= 1 && zoneNumber <= 5 ? zoneNumber : 0;
              } else {
                value = parseInt(intensityStr) || 0;
              }
            }
            break;
          case 'modalidade':
            if (sessionForDay.modalidade) {
              switch (sessionForDay.modalidade.toLowerCase()) {
                case 'corrida': value = 1; break;
                case 'forca': value = 2; break;
                case 'educativo': value = 3; break;
                case 'flexibilidade': value = 4; break;
                case 'bike': value = 5; break;
                default: value = 1;
              }
            }
            break;
          case 'treino_tipo':
            if (sessionForDay.treino_tipo) {
              switch (sessionForDay.treino_tipo.toLowerCase()) {
                case 'continuo': value = 1; break;
                case 'intervalado': value = 2; break;
                case 'longo': value = 3; break;
                case 'fartlek': value = 4; break;
                case 'tiro': value = 5; break;
                case 'ritmo': value = 6; break;
                case 'regenerativo': value = 7; break;
                default: value = 1;
              }
            }
            break;
          case 'terreno':
            if (sessionForDay.terreno) {
              if (!isNaN(Number(sessionForDay.terreno))) {
                value = parseInt(sessionForDay.terreno);
              } else {
                switch (sessionForDay.terreno.toLowerCase()) {
                  case 'asfalto': value = 1; break;
                  case 'esteira': value = 2; break;
                  case 'trilha/montanha': value = 3; break;
                  case 'pista': value = 4; break;
                  case 'outro': value = 5; break;
                  default: value = 1;
                }
              }
            }
            break;
          case 'percurso':
            if (sessionForDay.percurso) {
              if (!isNaN(Number(sessionForDay.percurso))) {
                value = parseInt(sessionForDay.percurso);
              } else {
                switch (sessionForDay.percurso.toLowerCase()) {
                  case 'plano': value = 1; break;
                  case 'ligeira inclinação': value = 2; break;
                  case 'moderada': value = 3; break;
                  case 'forte': value = 4; break;
                  case 'muita inclinação': value = 5; break;
                  default: value = 1;
                }
              }
            }
            break;
          default:
            value = 0;
        }
      }
      
      console.log('🔍 DEBUG - Valor calculado para dia:', {
        date: dateStr,
        value: value,
        selectedMetric: selectedMetric,
        selectedAnalysis: selectedAnalysis
      });
      
      weekDays.push({
        date: dateStr,
        value: value,
        plannedValue: selectedAnalysis === 'comparison' ? 
          (() => {
            const plannedSession = allFilteredSessions.find(s => s.status === 'planned' && s.training_date === dateStr);
            if (!plannedSession) return 0;
            
            switch (selectedMetric) {
              case 'distance':
                return plannedSession.distance_km || 0;
              case 'duration':
                const plannedHours = plannedSession.duracao_horas ? parseInt(plannedSession.duracao_horas) : 0;
                const plannedMinutes = plannedSession.duracao_minutos ? parseInt(plannedSession.duracao_minutos) : 0;
                return plannedHours * 60 + plannedMinutes;
              case 'effort_level':
                return plannedSession.esforco ? parseInt(plannedSession.esforco) : 0;
              case 'intensity':
                if (plannedSession.intensidade) {
                  const intensityStr = plannedSession.intensidade.toString().toUpperCase();
                  if (intensityStr.startsWith('Z')) {
                    const zoneNumber = parseInt(intensityStr.substring(1));
                    return zoneNumber >= 1 && zoneNumber <= 5 ? zoneNumber : 0;
                  }
                  return parseInt(intensityStr) || 0;
                }
                return 0;
              default:
                return 0;
            }
          })() : null,
        actualValue: selectedAnalysis === 'comparison' ? 
          (() => {
            const completedSession = allFilteredSessions.find(s => s.status === 'completed' && s.training_date === dateStr);
            if (!completedSession) return 0;
            
            switch (selectedMetric) {
              case 'distance':
                return completedSession.distance_km || 0;
              case 'duration':
                const completedHours = completedSession.duracao_horas ? parseInt(completedSession.duracao_horas) : 0;
                const completedMinutes = completedSession.duracao_minutos ? parseInt(completedSession.duracao_minutos) : 0;
                return completedHours * 60 + completedMinutes;
              case 'effort_level':
                return completedSession.effort_level || 0;
              default:
                return 0;
            }
          })() : null,
      });
    }
    
    return weekDays;
  };

  const metricData = getMetricData();
  const maxValue = Math.max(
    ...metricData.map(d => d?.value || 0),
    ...metricData.map(d => d?.plannedValue || 0),
    ...metricData.map(d => d?.actualValue || 0),
    1
  );

  // Log detalhado dos dados processados
  console.log('🔍 DEBUG - Dados finais do gráfico:', {
    metricDataLength: metricData.length,
    maxValue: maxValue,
    selectedMetric: selectedMetric,
    selectedAnalysis: selectedAnalysis,
    sampleData: metricData.slice(0, 3).map(d => ({
      date: d?.date,
      value: d?.value,
      plannedValue: d?.plannedValue,
      actualValue: d?.actualValue
    })),
    allData: metricData.map(d => ({
      date: d?.date,
      value: d?.value,
      plannedValue: d?.plannedValue,
      actualValue: d?.actualValue
    }))
  });

  // Calcular resumo
  const getSummary = () => {
    // Filtrar dados por período para o resumo
    const filteredCompletedSessions = filterDataByPeriod(completedSessions, 'custom', customStartDate, customEndDate);
    const filteredPlannedSessions = filterDataByPeriod(plannedSessions, 'custom', customStartDate, customEndDate);
    
    const totalSessions = filteredCompletedSessions.length;
    const totalPlanned = filteredPlannedSessions.length;
    const totalDistance = filteredCompletedSessions.reduce((sum, s) => sum + (s.distance_km || 0), 0);
    const totalDuration = filteredCompletedSessions.reduce((sum, s) => {
      const hours = s.duracao_horas ? parseInt(s.duracao_horas) : 0;
      const minutes = s.duracao_minutos ? parseInt(s.duracao_minutos) : 0;
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

  // Log antes da renderização
  console.log('🔍 DEBUG - Antes da renderização:', {
    metricDataLength: metricData.length,
    maxValue: maxValue,
    selectedAnalysis: selectedAnalysis,
    selectedMetric: selectedMetric,
    summary: summary
  });

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
            >
              Semana Anterior
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
            >
              Próxima Semana
            </Button>
          </View>
        </Card.Content>
      </Card>
      
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
            <Text style={styles.unitText}>
              {selectedMetric === 'intensity' && selectedAnalysis === 'planned' ? 'Z1-Z5' : 
               selectedMetric === 'effort_level' && selectedAnalysis === 'planned' ? 'muito leve - muito forte' :
               selectedMetric === 'modalidade' && selectedAnalysis === 'planned' ? 'corrida, força, educativo, flexibilidade, bike' :
               selectedMetric === 'treino_tipo' && selectedAnalysis === 'planned' ? 'contínuo, intervalado, longo, fartlek, tiro, ritmo, regenerativo' :
               selectedMetric === 'terreno' && selectedAnalysis === 'planned' ? 'asfalto, esteira, trilha, pista, outro' :
               selectedMetric === 'percurso' && selectedAnalysis === 'planned' ? 'plano, ligeira, moderada, forte, muita inclinação' :
               selectedMetricInfo?.unit}
            </Text>
          </View>
          
          <View style={styles.chartContainer}>
            {metricData.length > 0 ? (
                <View style={styles.chartBars}>
                  {metricData.map((item, index) => (
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
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][index]}
                      </Text>
                      <Text style={styles.barValue}>
                        {selectedAnalysis === 'comparison' ? 
                          `${item?.actualValue || 0}/${item?.plannedValue || 0}` : 
                          selectedMetric === 'intensity' && selectedAnalysis === 'planned' ?
                          `Z${item?.value || 0}` :
                          selectedMetric === 'effort_level' && selectedAnalysis === 'planned' ?
                          (() => {
                            switch (item?.value) {
                              case 1: return 'muito leve';
                              case 2: return 'leve';
                              case 3: return 'moderado';
                              case 4: return 'forte';
                              case 5: return 'muito forte';
                              default: return 'não definido';
                            }
                          })() :
                          selectedMetric === 'modalidade' && selectedAnalysis === 'planned' ?
                          (() => {
                            switch (item?.value) {
                              case 1: return 'corrida';
                              case 2: return 'força';
                              case 3: return 'educativo';
                              case 4: return 'flexibilidade';
                              case 5: return 'bike';
                              default: return 'não definido';
                            }
                          })() :
                          selectedMetric === 'treino_tipo' && selectedAnalysis === 'planned' ?
                          (() => {
                            switch (item?.value) {
                              case 1: return 'contínuo';
                              case 2: return 'intervalado';
                              case 3: return 'longo';
                              case 4: return 'fartlek';
                              case 5: return 'tiro';
                              case 6: return 'ritmo';
                              case 7: return 'regenerativo';
                              default: return 'não definido';
                            }
                          })() :
                          selectedMetric === 'terreno' && selectedAnalysis === 'planned' ?
                          (() => {
                            switch (item?.value) {
                              case 1: return 'asfalto';
                              case 2: return 'esteira';
                              case 3: return 'trilha';
                              case 4: return 'pista';
                              case 5: return 'outro';
                              default: return 'não definido';
                            }
                          })() :
                          selectedMetric === 'percurso' && selectedAnalysis === 'planned' ?
                          (() => {
                            switch (item?.value) {
                              case 1: return 'plano';
                              case 2: return 'ligeira';
                              case 3: return 'moderada';
                              case 4: return 'forte';
                              case 5: return 'muita';
                              default: return 'não definido';
                            }
                          })() :
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
          <Text style={styles.summaryTitle}>Resumo - {getPeriodLabel('custom', customStartDate, customEndDate)}</Text>
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 5,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 55,
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
    fontSize: 7,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
    textAlign: 'center',
    flexWrap: 'nowrap',
    maxWidth: 50,
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
  navigationCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  navButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  weekInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  weekLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
}); 