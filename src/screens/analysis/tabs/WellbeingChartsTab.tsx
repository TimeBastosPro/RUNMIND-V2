import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, Chip, Button, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCheckinStore } from '../../../stores/checkin';
import { useAuthStore } from '../../../stores/auth';
import { filterDataByPeriod, getPeriodLabel, navigatePeriod, ExtendedPeriodType } from '../../../utils/periodFilter';
import EmptyState from '../../../components/ui/EmptyState';
import LoadingState from '../../../components/ui/LoadingState';
import { validateWellbeingMetric, logValidationErrors } from '../../../utils/dataValidation';

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
    field: 'energy_score',
    description: 'Nível de energia física e mental',
    scale: '1 (Sem energia) - 10 (Muita energia)'
  },
];

// Tipos de período para navegação
const PERIOD_TYPES = [
  { label: 'Semana', value: 'week' },
  { label: 'Mês', value: 'month' },
];

// Remover tipos de visualização - manter apenas um tipo simples

export default function WellbeingChartsTab() {
  const [selectedMetric, setSelectedMetric] = useState('sleep_quality');
  const [periodType, setPeriodType] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(() => {
    // Inicializar com a data atual para sincronizar com a aba de treinos
    const today = new Date();
    return today;
  });
  
  const { recentCheckins, loadRecentCheckins, isLoading } = useCheckinStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // ✅ GARANTIR: Carregar apenas dados reais do usuário logado
    if (isAuthenticated && user?.id) {
      console.log('🔍 DEBUG - Carregando check-ins do usuário logado:', user.id);
      loadRecentCheckins(365); // Carrega check-ins reais do usuário logado
    }
  }, [loadRecentCheckins, isAuthenticated, user?.id]);

  const selectedMetricInfo = DAILY_METRICS.find(m => m.value === selectedMetric);

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
      
      // Fim da semana (domingo) - calcular corretamente
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      console.log('🔍 DEBUG - Cálculo da Semana:', {
        inputDate: currentDate.toISOString().split('T')[0],
        dayOfWeek,
        diff,
        startOfWeek: startOfWeek.toISOString().split('T')[0],
        endOfWeek: endOfWeek.toISOString().split('T')[0],
        startWeekday: startOfWeek.toLocaleDateString('pt-BR', { weekday: 'long' }),
        endWeekday: endOfWeek.toLocaleDateString('pt-BR', { weekday: 'long' })
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

  // Filtrar dados pelo período atual - APENAS DO USUÁRIO LOGADO
  const getFilteredCheckins = () => {
    // ✅ GARANTIR: Só processar se usuário está autenticado
    if (!isAuthenticated || !user?.id || !recentCheckins || recentCheckins.length === 0) {
      return [];
    }
    
    const { startDate, endDate } = getCurrentPeriod();
    
    // ✅ NOTA: recentCheckins já vem filtrado pelo store para o usuário logado
    // Usar periodFilter com datas customizadas para manter compatibilidade com navegação
    return filterDataByPeriod(recentCheckins, 'custom', startDate, endDate);
  };

  // Processar dados da métrica selecionada - APENAS DADOS REAIS
  const getMetricAnalysis = () => {
    // ✅ GARANTIR: Só processar se usuário está autenticado
    if (!isAuthenticated || !user?.id) {
      console.log('🚫 Usuário não autenticado - não exibindo dados');
      return {
        data: [],
        average: null,
        trend: null,
        consistency: null,
        checkinsCount: 0,
        daysWithData: 0
      };
    }
    
    const filteredCheckins = getFilteredCheckins();
    const { startDate, endDate } = getCurrentPeriod();
    
    console.log('🔍 DEBUG - Análise Real (USUÁRIO LOGADO):', {
      userId: user.id,
      periodType,
      currentDate: currentDate.toISOString().split('T')[0],
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      startDateDay: startDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }),
      endDateDay: endDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }),
      totalCheckins: filteredCheckins.length,
      selectedMetric,
      selectedField: selectedMetricInfo?.field,
      checkinsWithData: filteredCheckins.filter(c => {
        const value = c[selectedMetricInfo?.field as keyof typeof c];
        return typeof value === 'number' && value > 0;
      }).length
    });
    
    // Criar array completo de datas do período
    const allDatesInPeriod = [];
    const current = new Date(startDate);
    
    // Garantir que o loop pare no domingo correto (31/08, não 01/09)
    const endDateNormalized = new Date(endDate);
    endDateNormalized.setHours(0, 0, 0, 0);
    
    while (current <= endDateNormalized) {
      allDatesInPeriod.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    console.log('🔍 DEBUG - Datas do Período:', {
      totalDays: allDatesInPeriod.length,
      firstDate: allDatesInPeriod[0],
      lastDate: allDatesInPeriod[allDatesInPeriod.length - 1],
      allDates: allDatesInPeriod.map(date => {
        const d = new Date(date);
        return `${date} (${d.toLocaleDateString('pt-BR', { weekday: 'short' })})`;
      }),
      filteredCheckins: filteredCheckins.map(c => ({
        date: c.date,
        weekday: new Date(c.date).toLocaleDateString('pt-BR', { weekday: 'short' })
      }))
    });
    
    // Mapear dados para cada dia do período
    const metricData = allDatesInPeriod.map(dateStr => {
      const checkinForDay = filteredCheckins.find(c => {
        // Comparar datas normalizadas
        const checkinDate = new Date(c.date).toISOString().split('T')[0];
        return checkinDate === dateStr;
      });
      let value = 0;
      
      if (checkinForDay && selectedMetricInfo?.field) {
        const fieldValue = checkinForDay[selectedMetricInfo.field as keyof typeof checkinForDay];
        const validationResult = validateWellbeingMetric(fieldValue, selectedMetricInfo.field);
        
        if (validationResult.isValid) {
          value = validationResult.value;
        } else {
          // Log do erro de validação
          logValidationErrors([validationResult.error || 'Erro de validação']);
          value = 0;
        }
      }
      
      // Debug para cada dia
      if (checkinForDay) {
        console.log(`🔍 DEBUG - Dia ${dateStr}:`, {
          checkinDate: checkinForDay.date,
          field: selectedMetricInfo?.field,
          value: value,
          weekday: new Date(dateStr).toLocaleDateString('pt-BR', { weekday: 'short' })
        });
      }
      
      return {
        date: dateStr,
        value: value,
        hasData: value > 0
      };
    });

    // Calcular estatísticas REAIS
    const valuesWithData = metricData.filter(d => d.hasData).map(d => d.value);
    
    // Se não há dados suficientes, retornar estrutura com "-"
    if (valuesWithData.length === 0) {
      return {
        data: metricData,
        average: null,
        trend: null,
        consistency: null,
        checkinsCount: filteredCheckins.length,
        daysWithData: 0
      };
    }

    // Calcular estatísticas com dados reais
    const average = valuesWithData.reduce((sum, val) => sum + val, 0) / valuesWithData.length;
    
    // Calcular tendência (precisa de pelo menos 4 dados)
    let trend = null;
    if (valuesWithData.length >= 4) {
      const midPoint = Math.floor(valuesWithData.length / 2);
      const firstHalf = valuesWithData.slice(0, midPoint);
      const secondHalf = valuesWithData.slice(midPoint);
      
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 0.5) trend = 'improving';
      else if (secondAvg < firstAvg - 0.5) trend = 'declining';
      else trend = 'stable';
    }

    // Calcular consistência (precisa de pelo menos 3 dados)
    let consistency = null;
    if (valuesWithData.length >= 3) {
      const variance = valuesWithData.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / valuesWithData.length;
      const stdDev = Math.sqrt(variance);
      consistency = Math.max(0, 100 - ((stdDev / average) * 100));
    }

    return {
      data: metricData,
      average,
      trend,
      consistency,
      checkinsCount: filteredCheckins.length,
      daysWithData: valuesWithData.length
    };
  };

  const analysis = getMetricAnalysis();

  // Função para renderizar o gráfico simples
  const renderVisualization = () => {
    if (analysis.data.length === 0) {
      // Verificar se é o primeiro check-in ou se não há dados no período
      const isFirstTime = analysis.checkinsCount === 0;
      const hasCheckinsButNoData = analysis.checkinsCount > 0 && analysis.daysWithData === 0;
      
      let title, subtitle, icon;
      
      if (isFirstTime) {
        title = "Bem-vindo ao RunMind!";
        subtitle = "Faça seu primeiro check-in diário para começar a acompanhar seu bem-estar e receber insights personalizados sobre sua performance.";
        icon = "hand-wave";
      } else if (hasCheckinsButNoData) {
        title = "Nenhum dado para este período";
        subtitle = `Você tem ${analysis.checkinsCount} check-in(s) cadastrado(s), mas nenhum com dados de ${selectedMetricInfo?.label?.toLowerCase() || 'esta métrica'} no período selecionado.`;
        icon = "calendar-search";
      } else {
        title = "Nenhum dado disponível";
        subtitle = `Faça check-ins com dados de ${selectedMetricInfo?.label?.toLowerCase() || 'bem-estar'} para ver análises detalhadas.`;
        icon = "chart-line";
      }

      return (
        <Card style={styles.card}>
          <Card.Content>
            <EmptyState
              icon={icon}
              title={title}
              subtitle={subtitle}
              actionText={isFirstTime ? "Fazer Primeiro Check-in" : undefined}
              onAction={isFirstTime ? () => {
                // Navegar para tela de check-in - implementar conforme necessário
                console.log('Navegar para check-in');
              } : undefined}
            />
          </Card.Content>
        </Card>
      );
    }

    return renderChartView();
  };

  const renderChartView = () => {
    const displayData = analysis.data;
    const valuesWithData = displayData.filter(d => d.value > 0).map(d => d.value);
    const maxValue = valuesWithData.length > 0 ? Math.max(...valuesWithData) : 10;
    
    const { startDate, endDate } = getCurrentPeriod();
    
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
            <Text style={styles.periodLabel}>
              {startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </Text>
          </View>
          
          <View style={styles.chartContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}
            >
              <View style={styles.chartBars}>
                {displayData.map((item, index) => (
                  <View key={index} style={styles.barWrapper}>
                    <View 
                      style={[
                        styles.bar,
                        {
                          height: Math.max((item.value / maxValue) * 100, 2),
                          backgroundColor: item.value > 0 ? selectedMetricInfo?.color : '#e0e0e0'
                        }
                      ]}
                    />
                    <Text style={styles.barLabel}>
                      {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </Text>
                    <Text style={styles.barValue}>
                      {item.value > 0 ? item.value.toFixed(1) : '-'}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Mostrar loading enquanto os dados estão sendo carregados
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingState 
          message="Carregando dados de bem-estar..." 
          icon="heart-pulse"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Navegação de Período */}
      <Card style={styles.controlsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Análise de Bem-estar</Text>
          
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
          
          {!isAuthenticated && (
            <View style={styles.noAuthContainer}>
              <MaterialCommunityIcons name="account-alert" size={24} color="#666" />
              <Text style={styles.noAuthText}>Faça login para ver seus dados de bem-estar</Text>
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
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Média</Text>
              <Text style={styles.summaryLegend}>Valor médio da métrica no período</Text>
              <Text style={[styles.summaryValue, { color: selectedMetricInfo?.color }]}>
                {analysis.average !== null ? analysis.average.toFixed(1) : '-'}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tendência</Text>
              <Text style={styles.summaryLegend}>Evolução da primeira para segunda metade</Text>
              {analysis.trend !== null ? (
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
              ) : (
                <Text style={styles.summaryValue}>-</Text>
              )}
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Check-ins</Text>
              <Text style={styles.summaryLegend}>Total de avaliações registradas</Text>
              <Text style={styles.summaryValue}>{analysis.checkinsCount}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Consistência</Text>
              <Text style={styles.summaryLegend}>Regularidade dos valores (baixa variação)</Text>
              <Text style={[
                styles.summaryValue,
                { 
                  color: analysis.consistency !== null && analysis.consistency > 70 ? '#4CAF50' : 
                         analysis.consistency !== null && analysis.consistency > 40 ? '#FF9800' : '#F44336'
                }
              ]}>
                {analysis.consistency !== null ? analysis.consistency.toFixed(0) + '%' : '-'}
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
  periodLabel: {
    fontSize: isMobile ? 10 : 12,
    color: '#666',
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