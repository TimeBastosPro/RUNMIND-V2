import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, Chip, Button, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';
import { useAuthStore } from '../../../stores/auth';
import { navigatePeriod, ExtendedPeriodType } from '../../../utils/periodFilter';
import EmptyState from '../../../components/ui/EmptyState';
import LoadingState from '../../../components/ui/LoadingState';
import { validateTrainingMetric, validateDuration, validateHeartRate, validateDistance, validateElevation, logValidationErrors } from '../../../utils/dataValidation';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

// TODAS as Métricas de Treino Disponíveis (Planejado + Realizado)
const TRAINING_METRICS = [
  // === MÉTRICAS BÁSICAS ===
  { 
    label: 'Distância', 
    value: 'distance',
    icon: 'map-marker-distance',
    color: '#4CAF50',
    unit: 'km',
    field: 'distance_km',
    description: 'Distância total percorrida no treino',
    type: 'both' // disponível em treinos planejados e realizados
  },
  { 
    label: 'Duração', 
    value: 'duration',
    icon: 'clock-outline',
    color: '#2196F3',
    unit: 'min',
    field: 'duration_minutes',
    description: 'Tempo total de duração do treino',
    type: 'both'
  },
  
  // === MÉTRICAS DE PLANEJAMENTO ===
  { 
    label: 'Modalidade', 
    value: 'modalidade',
    icon: 'run-fast',
    color: '#9C27B0',
    unit: '',
    field: 'modalidade',
    description: 'Tipo de modalidade do treino (corrida, força, etc.)',
    type: 'planned'
  },
  { 
    label: 'Tipo de Treino', 
    value: 'treino_tipo',
    icon: 'chart-timeline-variant',
    color: '#FF5722',
    unit: '',
    field: 'treino_tipo',
    description: 'Tipo específico do treino (contínuo, intervalado, etc.)',
    type: 'planned'
  },
  { 
    label: 'Terreno', 
    value: 'terreno',
    icon: 'terrain',
    color: '#795548',
    unit: '',
    field: 'terreno',
    description: 'Tipo de terreno do treino (asfalto, trilha, etc.)',
    type: 'planned'
  },
  { 
    label: 'Intensidade Planejada', 
    value: 'intensidade',
    icon: 'speedometer',
    color: '#FF9800',
    unit: 'Z1-Z5',
    field: 'intensidade',
    description: 'Zona de intensidade planejada para o treino',
    type: 'planned'
  },
  
  // === MÉTRICAS DE EXECUÇÃO ===
  { 
    label: 'Esforço Percebido', 
    value: 'perceived_effort',
    icon: 'gauge',
    color: '#FF9800',
    unit: '1-10',
    field: 'perceived_effort',
    description: 'Nível de esforço percebido durante o treino (PSE)',
    type: 'completed'
  },
  { 
    label: 'Satisfação', 
    value: 'satisfaction',
    icon: 'heart-outline',
    color: '#E91E63',
    unit: '1-5',
    field: 'session_satisfaction',
    description: 'Nível de satisfação com o treino realizado',
    type: 'completed'
  },
  { 
    label: 'Frequência Cardíaca Média', 
    value: 'avg_heart_rate',
    icon: 'heart-pulse',
    color: '#F44336',
    unit: 'bpm',
    field: 'avg_heart_rate',
    description: 'Frequência cardíaca média durante o treino',
    type: 'completed'
  },
  { 
    label: 'FC Máxima', 
    value: 'max_heart_rate',
    icon: 'heart-flash',
    color: '#D32F2F',
    unit: 'bpm',
    field: 'max_heart_rate',
    description: 'Frequência cardíaca máxima atingida no treino',
    type: 'completed'
  },
  { 
    label: 'Ganho de Elevação', 
    value: 'elevation_gain',
    icon: 'trending-up',
    color: '#388E3C',
    unit: 'm',
    field: 'elevation_gain_meters',
    description: 'Metros de elevação ganhos durante o treino',
    type: 'completed'
  },
  { 
    label: 'Perda de Elevação', 
    value: 'elevation_loss',
    icon: 'trending-down',
    color: '#1976D2',
    unit: 'm',
    field: 'elevation_loss_meters',
    description: 'Metros de elevação perdidos durante o treino',
    type: 'completed'
  }
];

// Tipos de período para navegação
const PERIOD_TYPES = [
  { label: 'Semana', value: 'week' },
  { label: 'Mês', value: 'month' },
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
  const [periodType, setPeriodType] = useState<'week' | 'month'>('week');
  
  // Inicializar com a data atual para sincronizar com a aba de treinos
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return today;
  });
  
  const { trainingSessions, fetchTrainingSessions, isLoading } = useCheckinStore();
  const { user, isAuthenticated } = useAuthStore();

  // Função centralizada para processar métricas de treino com validação
  const getMetricValue = (session: any, metricValue: string): number => {
    const validationErrors: string[] = [];
    let validationResult;

    switch (metricValue) {
      case 'distance':
        validationResult = validateDistance(session.distance_km, 'distance_km');
        break;
      case 'duration':
        validationResult = validateDuration(
          session.duracao_horas, 
          session.duracao_minutos, 
          'duration'
        );
        break;
      case 'perceived_effort':
        validationResult = validateTrainingMetric(session.perceived_effort, 'perceived_effort', 10);
        break;
      case 'satisfaction':
        validationResult = validateTrainingMetric(session.session_satisfaction, 'session_satisfaction', 5);
        break;
      case 'avg_heart_rate':
        validationResult = validateHeartRate(session.avg_heart_rate, 'avg_heart_rate');
        break;
      case 'max_heart_rate':
        validationResult = validateHeartRate(session.max_heart_rate, 'max_heart_rate');
        break;
      case 'elevation_gain':
        validationResult = validateElevation(session.elevation_gain_meters, 'elevation_gain_meters');
        break;
      case 'elevation_loss':
        validationResult = validateElevation(session.elevation_loss_meters, 'elevation_loss_meters');
        break;
      default:
        validationResult = { isValid: false, value: 0, error: `Métrica ${metricValue} não reconhecida` };
    }

    if (!validationResult.isValid) {
      validationErrors.push(validationResult.error || 'Erro de validação');
      logValidationErrors(validationErrors);
    }

    return validationResult.isValid ? validationResult.value : 0;
  };

  useEffect(() => {
    // ✅ GARANTIR: Carregar apenas dados reais do usuário logado
    if (isAuthenticated && user?.id) {
      console.log('🔍 DEBUG - Carregando treinos do usuário logado:', user.id);
      fetchTrainingSessions(); // Carrega treinos reais do usuário logado
    }
  }, [fetchTrainingSessions, isAuthenticated, user?.id]);

  // ✅ DEBUG: Log dos dados do store
  useEffect(() => {
    console.log('🔍 DEBUG - Dados do Store:', {
      isAuthenticated,
      userId: user?.id,
      totalTrainingSessions: trainingSessions.length,
      sampleSessions: trainingSessions.slice(0, 3).map(s => ({
        id: s.id,
        date: s.training_date,
        status: s.status,
        distance: s.distance_km,
        userId: s.user_id
      }))
    });
  }, [trainingSessions, isAuthenticated, user?.id]);

  const selectedMetricInfo = TRAINING_METRICS.find(m => m.value === selectedMetric);
  const selectedAnalysisInfo = ANALYSIS_TYPES.find(a => a.value === selectedAnalysis);

  // Calcular período atual baseado na data e tipo selecionado
  const getCurrentPeriod = () => {
    // ✅ CORRIGIDO: Usar data local sem problemas de fuso horário
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    
    if (periodType === 'week') {
      // Início da semana (segunda-feira)
      const startOfWeek = new Date(year, month, day);
      const dayOfWeek = startOfWeek.getDay(); // 0 = domingo, 1 = segunda, etc.
      
      // Calcular diferença para segunda-feira
      let diff = 1 - dayOfWeek; // Para segunda-feira
      if (dayOfWeek === 0) diff = -6; // Se for domingo, voltar 6 dias
      
      startOfWeek.setDate(startOfWeek.getDate() + diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Fim da semana (domingo)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      console.log('🔍 DEBUG - Cálculo da Semana (Treinos) - ATUALIZADO:', {
        inputDate: currentDate.toISOString().split('T')[0],
        dayOfWeek,
        diff,
        startOfWeek: startOfWeek.toISOString().split('T')[0],
        endOfWeek: endOfWeek.toISOString().split('T')[0],
        startWeekday: startOfWeek.toLocaleDateString('pt-BR', { weekday: 'long' }),
        endWeekday: endOfWeek.toLocaleDateString('pt-BR', { weekday: 'long' }),
        timestamp: new Date().toISOString()
      });
      
      return { startDate: startOfWeek, endDate: endOfWeek };
    } else {
      // Início do mês
      const startOfMonth = new Date(year, month, 1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      // Fim do mês
      const endOfMonth = new Date(year, month + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      return { startDate: startOfMonth, endDate: endOfMonth };
    }
  };

  // Navegar para período anterior/posterior usando função centralizada
  const handleNavigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = navigatePeriod(currentDate, periodType, direction);
    setCurrentDate(newDate);
  };

  // Filtrar treinos pelo período atual
  const getFilteredSessions = () => {
    if (!trainingSessions || trainingSessions.length === 0) return [];
    
    const { startDate, endDate } = getCurrentPeriod();
    
    return trainingSessions.filter(session => {
      if (!session.training_date) return false;
      const sessionDate = new Date(session.training_date);
      sessionDate.setHours(0, 0, 0, 0); // Normalizar para início do dia
      return sessionDate >= startDate && sessionDate <= endDate;
    }).sort((a, b) => new Date(a.training_date).getTime() - new Date(b.training_date).getTime());
  };

  // Processar dados de treinos para análise - APENAS DADOS REAIS
  const getTrainingAnalysis = () => {
    // ✅ GARANTIR: Só processar se usuário está autenticado
    if (!isAuthenticated || !user?.id) {
      console.log('🚫 Usuário não autenticado - não exibindo dados');
      return {
        completedSessions: [],
        plannedSessions: [],
        completionRate: null,
        averageMetrics: {},
        weeklyData: [],
        comparisonData: [],
        sessionsCount: 0,
        userSessions: [] // ✅ NOVO: Array vazio para usuário não logado
      };
    }
    
    const filteredSessions = getFilteredSessions();
    const periodInfo = getCurrentPeriod();
    
    // ✅ GARANTIR: Filtrar apenas sessões do usuário logado
    const userSessions = filteredSessions.filter(session => session.user_id === user.id);
    
    console.log('🔍 DEBUG - Análise Treinos Real (USUÁRIO LOGADO):', {
      userId: user.id,
      periodType,
      currentDate: currentDate.toISOString().split('T')[0],
      startDate: periodInfo.startDate.toISOString().split('T')[0],
      endDate: periodInfo.endDate.toISOString().split('T')[0],
      totalSessionsDB: filteredSessions.length,
      userSessionsOnly: userSessions.length,
      selectedMetric,
      selectedAnalysis,
      // ✅ NOVO: Debug detalhado dos dados
      allUserSessions: userSessions.map(s => ({
        id: s.id,
        date: s.training_date,
        type: s.training_type || 'unknown',
        distance: s.distance_km,
        status: s.status || 'unknown'
      }))
    });
    
    if (userSessions.length === 0) {
      return {
        completedSessions: [],
        plannedSessions: [],
        completionRate: null,
        averageMetrics: {},
        weeklyData: [],
        comparisonData: [],
        sessionsCount: 0,
        userSessions: []
      };
    }

    // Separar treinos por status - APENAS DO USUÁRIO LOGADO
    // ✅ CORRIGIDO: Incluir treinos sem status definido como 'completed' se tiverem dados
    const completedSessions = userSessions.filter(s => {
      if (s.status === 'completed') return true;
      // Se não tem status definido mas tem dados de execução, considerar como completed
      if (!s.status && (s.distance_km || s.perceived_effort || s.session_satisfaction || s.avg_heart_rate)) {
        return true;
      }
      return false;
    });
    const plannedSessions = userSessions.filter(s => s.status === 'planned');
    
    console.log('🔍 DEBUG - Separação por Status - ATUALIZADO:', {
      totalUserSessions: userSessions.length,
      completedCount: completedSessions.length,
      plannedCount: plannedSessions.length,
      statusValues: [...new Set(userSessions.map(s => s.status))],
      completedSample: completedSessions.slice(0, 2).map(s => ({ id: s.id, date: s.training_date, status: s.status })),
      plannedSample: plannedSessions.slice(0, 2).map(s => ({ id: s.id, date: s.training_date, status: s.status })),
      allSessionsWithData: userSessions.map(s => ({
        id: s.id,
        date: s.training_date,
        status: s.status,
        distance: s.distance_km,
        effort: s.perceived_effort,
        satisfaction: s.session_satisfaction,
        heartRate: s.avg_heart_rate
      })),
      timestamp: new Date().toISOString()
    });

    // Calcular taxa de conclusão - real
    const completionRate = plannedSessions.length > 0 ? 
      (completedSessions.length / plannedSessions.length) * 100 : null;

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

    // Dados de comparação baseados no período real selecionado
    const comparisonData: Array<{
      date: string;
      planned: number;
      completed: number;
      plannedMetric: number;
      completedMetric: number;
    }> = [];
    
    // ✅ CORRIGIDO: Usar datas do período selecionado, não últimos 7 dias fixos
    const currentPeriod = getCurrentPeriod();
    const periodDays: string[] = [];
    const current = new Date(currentPeriod.startDate);
    
    // Garantir que o loop pare no domingo correto
    const endDateNormalized = new Date(currentPeriod.endDate);
    endDateNormalized.setHours(0, 0, 0, 0);
    
    while (current <= endDateNormalized) {
      periodDays.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    console.log('🔍 DEBUG - Datas do Período (Treinos):', {
      totalDays: periodDays.length,
      firstDate: periodDays[0],
      lastDate: periodDays[periodDays.length - 1],
      allDates: periodDays.map(date => {
        const d = new Date(date);
        return `${date} (${d.toLocaleDateString('pt-BR', { weekday: 'short' })})`;
      })
    });

    periodDays.forEach(dateStr => {
      const plannedForDay = plannedSessions.filter(s => {
        const sessionDate = new Date(s.training_date).toISOString().split('T')[0];
        return sessionDate === dateStr;
      });
      const completedForDay = completedSessions.filter(s => {
        const sessionDate = new Date(s.training_date).toISOString().split('T')[0];
        return sessionDate === dateStr;
      });
      
      // ✅ DEBUG: Log detalhado para cada dia
      if (plannedForDay.length > 0 || completedForDay.length > 0) {
        console.log(`🔍 DEBUG - Data ${dateStr}:`, {
          planned: plannedForDay.length,
          completed: completedForDay.length,
          plannedSessions: plannedForDay.map(s => ({ id: s.id, date: s.training_date, distance: s.distance_km, status: s.status })),
          completedSessions: completedForDay.map(s => ({ id: s.id, date: s.training_date, distance: s.distance_km, status: s.status }))
        });
      }
      
      // ✅ CORRIGIDO: Calcular métricas corretamente
      let plannedMetric = 0;
      let completedMetric = 0;
      
      if (plannedForDay.length > 0) {
        // Para treinos planejados, somar todos os valores do dia
        plannedMetric = plannedForDay.reduce((sum, session) => {
          const value = getMetricValue(session, selectedMetric);
          console.log(`🔍 DEBUG - Planned session ${session.id} metric value:`, value);
          return sum + value;
        }, 0);
      }
      
      if (completedForDay.length > 0) {
        // Para treinos completados, somar todos os valores do dia
        completedMetric = completedForDay.reduce((sum, session) => {
          const value = getMetricValue(session, selectedMetric);
          console.log(`🔍 DEBUG - Completed session ${session.id} metric value:`, value);
          return sum + value;
        }, 0);
      }
      
      console.log(`🔍 DEBUG - Métricas finais para ${dateStr}:`, { plannedMetric, completedMetric });
      
      comparisonData.push({
        date: dateStr,
        planned: plannedForDay.length,
        completed: completedForDay.length,
        plannedMetric,
        completedMetric,
      });
    });
    
    console.log('🔍 DEBUG - ComparisonData Final:', {
      totalDays: comparisonData.length,
      daysWithData: comparisonData.filter(d => d.planned > 0 || d.completed > 0).length,
      sample: comparisonData.slice(0, 3),
      allData: comparisonData
    });

    return {
      completedSessions,
      plannedSessions,
      completionRate,
      averageMetrics,
      weeklyData,
      comparisonData,
      sessionsCount: userSessions.length,
      userSessions
    };
  };

  // Função auxiliar para extrair valor da métrica (usando validação)
  const getMetricValueLegacy = (session: any, metric: string) => {
    console.log('🔍 DEBUG - getMetricValue:', { metric, session: { id: session.id, date: session.training_date, distance_km: session.distance_km } });
    
    const value = getMetricValue(session, metric);
    console.log('🔍 DEBUG - Validated value:', value);
    return value;
  };

  const analysis = getTrainingAnalysis();

  // ✅ DEBUG: Log detalhado da análise
  console.log('🔍 DEBUG - Análise Completa:', {
    completedSessions: analysis.completedSessions.length,
    plannedSessions: analysis.plannedSessions.length,
    comparisonData: analysis.comparisonData.length,
    completionRate: analysis.completionRate,
    averageMetrics: analysis.averageMetrics,
    sessionsCount: analysis.sessionsCount,
    userSessions: analysis.userSessions.length,
    // ✅ NOVO: Verificar dados específicos
    sampleCompletedSessions: analysis.completedSessions.slice(0, 2).map(s => ({
      date: s.training_date,
      distance: s.distance_km,
      status: s.status
    })),
    sampleComparisonData: analysis.comparisonData.slice(0, 3).map(d => ({
      date: d.date,
      completed: d.completed,
      completedMetric: d.completedMetric,
      value: (d as any).value
    }))
  });

  // ✅ DEBUG: Verificar se há dados para renderizar
  console.log('🔍 DEBUG - Dados para Renderização:', {
    hasCompletedSessions: analysis.completedSessions.length > 0,
    hasPlannedSessions: analysis.plannedSessions.length > 0,
    hasComparisonData: analysis.comparisonData.length > 0,
    willShowNoData: analysis.completedSessions.length === 0 && analysis.plannedSessions.length === 0
  });

  // Função de renderização simplificada
  const renderVisualization = () => {
    // ✅ DEBUG: Verificar condição de renderização
    console.log('🔍 DEBUG - Condição de Renderização:', {
      completedSessions: analysis.completedSessions.length,
      plannedSessions: analysis.plannedSessions.length,
      comparisonData: analysis.comparisonData.length,
      willShowNoData: analysis.completedSessions.length === 0 && analysis.plannedSessions.length === 0,
      hasAnyData: analysis.completedSessions.length > 0 || analysis.plannedSessions.length > 0 || analysis.comparisonData.length > 0
    });

    if (analysis.completedSessions.length === 0 && analysis.plannedSessions.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <EmptyState
              icon="run"
              title="Nenhum treino cadastrado"
              subtitle="Cadastre seus primeiros treinos para começar a acompanhar sua evolução e receber insights personalizados sobre sua performance. Você pode planejar treinos futuros ou registrar treinos já realizados."
              actionText="Cadastrar Primeiro Treino"
              onAction={() => {
                // Navegar para tela de cadastro de treino - implementar conforme necessário
                console.log('Navegar para cadastro de treino');
              }}
            />
          </Card.Content>
        </Card>
      );
    }

    return renderChartView();
  };

  const renderChartView = () => {
    const data = selectedAnalysis === 'comparison' ? 
      analysis.comparisonData : 
      analysis.comparisonData.map(d => ({
        ...d,
        value: selectedAnalysis === 'planned' ? d.plannedMetric : d.completedMetric
      }));

    // ✅ DEBUG: Log dos dados do gráfico
    console.log('🔍 DEBUG - Dados do Gráfico:', {
      selectedAnalysis,
      selectedMetric,
      totalDataPoints: data.length,
      dataWithValues: data.filter(d => {
        if (selectedAnalysis === 'comparison') {
          return d.plannedMetric > 0 || d.completedMetric > 0;
        } else {
          return (d as any).value > 0;
        }
      }).length,
      sampleData: data.slice(0, 3).map(d => ({
        date: d.date,
        planned: d.plannedMetric,
        completed: d.completedMetric,
        value: (d as any).value
      })),
      // ✅ NOVO: Debug detalhado de todos os dados
      allData: data.map(d => ({
        date: d.date,
        planned: d.plannedMetric,
        completed: d.completedMetric,
        value: (d as any).value,
        hasData: (d as any).value > 0 || d.plannedMetric > 0 || d.completedMetric > 0
      }))
    });

    const maxValue = Math.max(...data.map(d => 
      selectedAnalysis === 'comparison' ? 
        Math.max(d.plannedMetric, d.completedMetric) : 
        (typeof (d as any).value === 'number' ? (d as any).value : 0)
    ), 1);

    console.log('🔍 DEBUG - MaxValue do Gráfico:', maxValue);

    // ✅ DEBUG: Verificar se vai renderizar barras
    console.log('🔍 DEBUG - Renderização das Barras:', {
      totalBars: data.length,
      barsWithData: data.filter(d => {
        if (selectedAnalysis === 'comparison') {
          return d.plannedMetric > 0 || d.completedMetric > 0;
        } else {
          return (d as any).value > 0;
        }
      }).length,
      willRenderBars: data.length > 0
    });

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
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}
            >
              <View style={styles.chartBars}>
                {data.map((item, index) => (
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
                          height: Math.max((typeof (item as any).value === 'number' ? (item as any).value : 0) / maxValue * 100, 4),
                          backgroundColor: selectedAnalysisInfo?.color,
                          minHeight: 4
                        }
                      ]}
                    />
                  )}
                  <Text style={styles.barLabel}>
                    {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </Text>
                  {selectedAnalysis !== 'comparison' && (
                    <Text style={styles.barValue}>
                      {(typeof (item as any).value === 'number' ? (item as any).value : 0).toFixed(1)}
                    </Text>
                  )}
                </View>
              ))}
              </View>
            </ScrollView>
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



  // Mostrar loading enquanto os dados estão sendo carregados
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingState 
          message="Carregando dados de treinos..." 
          icon="run"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Navegação de Período */}
      <Card style={styles.controlsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Análise de Treinos</Text>
          
          {/* Tipo de Período */}
          <View style={styles.controlSection}>
            <Text style={styles.controlLabel}>Tipo de Período:</Text>
            <View style={styles.periodTypeGrid}>
              {PERIOD_TYPES.map((type) => (
                <Chip
                  key={type.value}
                  selected={periodType === type.value}
                  onPress={() => setPeriodType(type.value as 'week' | 'month')}
                  style={[
                    styles.controlChip,
                    periodType === type.value && { backgroundColor: '#2196F3' + '20' }
                  ]}
                  textStyle={[
                    styles.controlChipText,
                    periodType === type.value && { color: '#2196F3', fontWeight: 'bold' }
                  ]}
                  compact={isMobile}
                >
                  {type.label}
                </Chip>
              ))}
            </View>
          </View>

          {/* Navegação */}
          <View style={styles.navigationSection}>
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
      
      {/* Controles de Análise */}
      <Card style={styles.controlsCard}>
        <Card.Content>

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

        </Card.Content>
      </Card>

      {/* Seleção de Métrica - FILTRADA POR TIPO DE ANÁLISE */}
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Métrica de Treino:</Text>
          <Text style={styles.metricSubtitle}>
            {selectedAnalysis === 'planned' ? 'Métricas de Planejamento' : 
             selectedAnalysis === 'completed' ? 'Métricas de Execução' : 
             'Métricas para Comparação'}
          </Text>
          <View style={styles.metricsGrid}>
            {TRAINING_METRICS
              .filter(metric => {
                // ✅ FILTRAR: Métricas baseadas no tipo de análise
                if (selectedAnalysis === 'planned') {
                  return metric.type === 'planned' || metric.type === 'both';
                } else if (selectedAnalysis === 'completed') {
                  return metric.type === 'completed' || metric.type === 'both';
                } else {
                  // Para comparação, mostrar apenas métricas que existem em ambos
                  return metric.type === 'both';
                }
              })
              .map((metric) => (
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
          
          {!isAuthenticated && (
            <View style={styles.noAuthContainer}>
              <MaterialCommunityIcons name="account-alert" size={24} color="#666" />
              <Text style={styles.noAuthText}>Faça login para ver seus dados de treino</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Visualização Principal */}
      {renderVisualization()}

      {/* Resumo com Dados Reais e Legendas */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryHeader}>
              <MaterialCommunityIcons 
              name="chart-timeline-variant" 
              size={isMobile ? 18 : 20} 
              color="#666" 
            />
          <Text style={styles.summaryTitle}>
              Resumo - {periodType === 'week' ? 'Semana' : 'Mês'}
          </Text>
                </View>
          
          {/* ✅ DEBUG: Log dos dados do resumo */}
          {(() => {
            console.log('🔍 DEBUG - Dados do Resumo:', {
              completionRate: analysis.completionRate,
              completedSessions: analysis.completedSessions.length,
              plannedSessions: analysis.plannedSessions.length,
              averageMetrics: analysis.averageMetrics,
              selectedMetric,
              selectedMetricValue: analysis.averageMetrics[selectedMetric]
            });
            return null;
          })()}
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Taxa de Conclusão</Text>
              <Text style={styles.summaryLegend}>Percentual de treinos planejados realizados</Text>
              {analysis.completionRate !== null ? (
                <>
                  <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                    {(analysis.completionRate || 0).toFixed(1)}%
                  </Text>
                  <ProgressBar 
                    progress={(analysis.completionRate || 0) / 100} 
                    color="#4CAF50"
                    style={styles.progressBar}
                  />
                </>
              ) : (
                <Text style={styles.summaryValue}>-</Text>
              )}
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Realizados</Text>
              <Text style={styles.summaryLegend}>Total de treinos completados</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                {analysis.completedSessions.length}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Planejados</Text>
              <Text style={styles.summaryLegend}>Total de treinos programados</Text>
              <Text style={[styles.summaryValue, { color: '#2196F3' }]}>
                {analysis.plannedSessions.length}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Média {selectedMetricInfo?.label}</Text>
              <Text style={styles.summaryLegend}>Valor médio nos treinos realizados</Text>
              <Text style={[styles.summaryValue, { color: selectedMetricInfo?.color }]}>
                {analysis.averageMetrics[selectedMetric] ? 
                  analysis.averageMetrics[selectedMetric].toFixed(1) : '-'}
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
  periodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isMobile ? 6 : 8,
  },
  navigationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: isMobile ? 80 : 100,
  },
  currentPeriodContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  currentPeriodText: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
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
  metricSubtitle: {
    fontSize: isMobile ? 11 : 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  noAuthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 12,
  },
  noAuthText: {
    fontSize: isMobile ? 12 : 14,
    color: '#666',
    marginLeft: 8,
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
    fontWeight: 'bold',
  },
  summaryLegend: {
    fontSize: isMobile ? 8 : 10,
    color: '#999',
    marginBottom: 6,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: isMobile ? 12 : 14,
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
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 8,
  },
  scrollContainer: {
    paddingHorizontal: 12,
    minWidth: '100%',
    justifyContent: 'flex-start',
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: isMobile ? 40 : 48,
    height: '100%',
    marginHorizontal: isMobile ? 6 : 8,
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