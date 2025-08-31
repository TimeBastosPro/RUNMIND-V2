// 🔧 UTILITÁRIOS PARA PROCESSAMENTO DE DADOS DE TREINOS
// Reutiliza a mesma lógica da aba de treinos para garantir consistência

import { TrainingSession } from '../types/database';
import { getDateKey, formatDateToISO } from './dateUtils';

// Função para processar dados de treinos por data (igual à aba de treinos)
export const getTrainingSessionsByDate = (trainingSessions: TrainingSession[]) => {
  const map: Record<string, TrainingSession> = {};
  
  // Primeiro, adicionar treinos completados
  trainingSessions.filter(t => t.status === 'completed').forEach(t => {
    const dateKey = getDateKey(t.training_date);
    map[dateKey] = t;
  });
  
  // Depois, adicionar treinos planejados (se não houver treino completo para a data)
  trainingSessions.filter(t => t.status === 'planned').forEach(t => {
    const dateKey = getDateKey(t.training_date);
    if (!map[dateKey]) map[dateKey] = t;
  });
  
  return map;
};

// Função para filtrar treinos por período
export const filterTrainingSessionsByPeriod = (
  trainingSessions: TrainingSession[],
  startDate: Date,
  endDate: Date
): TrainingSession[] => {
  return trainingSessions.filter(session => {
    if (!session.training_date) return false;
    
    // ✅ CORREÇÃO CRÍTICA: Usar timezone local para evitar problemas
    const sessionDateStr = session.training_date.split('T')[0];
    const [year, month, day] = sessionDateStr.split('-').map(Number);
    const sessionDate = new Date(year, month - 1, day);
    
    // ✅ DEBUG: Log para segunda-feira
    if (sessionDateStr === '2025-09-01') {
      console.log('🔍 DEBUG - Filtrando segunda-feira:', {
        sessionDateStr,
        sessionDate: sessionDate.toISOString().split('T')[0],
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        isInRange: sessionDate >= startDate && sessionDate <= endDate
      });
    }
    
    return sessionDate >= startDate && sessionDate <= endDate;
  });
};

// Função para obter treinos planejados (simples e direta)
export const getPlannedTrainingSessions = (trainingSessions: TrainingSession[]): TrainingSession[] => {
  return trainingSessions.filter(t => t.status === 'planned');
};

// Função para obter treinos completados (simples e direta)
export const getCompletedTrainingSessions = (trainingSessions: TrainingSession[]): TrainingSession[] => {
  return trainingSessions.filter(t => t.status === 'completed');
};

// Função para processar dados para gráfico (reutilizando lógica da aba de treinos)
export const processTrainingDataForChart = (
  trainingSessions: TrainingSession[],
  startDate: Date,
  endDate: Date,
  analysisType: 'planned' | 'completed',
  metricField: string
) => {
  // Filtrar treinos por período
  const filteredSessions = filterTrainingSessionsByPeriod(trainingSessions, startDate, endDate);
  
  // ✅ DEBUG: Log de sessões filtradas
  console.log('🔍 DEBUG - Sessões filtradas por período:', {
    totalSessions: trainingSessions.length,
    filteredSessions: filteredSessions.length,
    analysisType,
    startDate: formatDateToISO(startDate),
    endDate: formatDateToISO(endDate),
    filteredSessionsData: filteredSessions.map(s => ({
      id: s.id,
      training_date: s.training_date,
      status: s.status,
      [metricField]: s[metricField as keyof TrainingSession]
    }))
  });
  
  // Filtrar por tipo de análise
  const sessionsByType = analysisType === 'planned' 
    ? getPlannedTrainingSessions(filteredSessions)
    : getCompletedTrainingSessions(filteredSessions);
  
  // ✅ DEBUG: Log de sessões por tipo
  console.log('🔍 DEBUG - Sessões por tipo:', {
    analysisType,
    sessionsByType: sessionsByType.length,
    sessionsByTypeData: sessionsByType.map(s => ({
      id: s.id,
      training_date: s.training_date,
      status: s.status,
      [metricField]: s[metricField as keyof TrainingSession]
    }))
  });
  
  // Obter dados por data (igual à aba de treinos)
  const sessionsByDate = getTrainingSessionsByDate(sessionsByType);
  
  // ✅ DEBUG: Log de sessões por data
  console.log('🔍 DEBUG - Sessões por data:', {
    sessionsByDateKeys: Object.keys(sessionsByDate),
    sessionsByDateData: Object.entries(sessionsByDate).map(([date, session]) => ({
      date,
      session: {
        id: session.id,
        training_date: session.training_date,
        status: session.status,
        [metricField]: session[metricField as keyof TrainingSession]
      }
    }))
  });
  
  // Gerar datas do período
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  // Processar dados para cada data
  return dates.map(dateObj => {
    // ✅ CORREÇÃO CRÍTICA: Usar formato de data consistente para evitar problemas de timezone
    const dateStr = formatDateToISO(dateObj);
    const session = sessionsByDate[dateStr];
    
    let value = 0;
    let hasData = false;
    
    // ✅ DEBUG: Log específico para segunda-feira
    if (dateObj.getDay() === 1) { // 1 = segunda-feira
      console.log('🔍 DEBUG - Processando segunda-feira:', {
        dateStr,
        hasSession: !!session,
        sessionData: session ? {
          id: session.id,
          training_date: session.training_date,
          status: session.status,
          [metricField]: session[metricField as keyof TrainingSession]
        } : null,
        sessionsByDateKeys: Object.keys(sessionsByDate)
      });
    }
    
    if (session) {
      const fieldValue = session[metricField as keyof TrainingSession];
      
      // Processar valor baseado no tipo de campo
      if (typeof fieldValue === 'number') {
        value = fieldValue;
        hasData = true;
      } else if (typeof fieldValue === 'string') {
        const numValue = parseFloat(fieldValue);
        if (!isNaN(numValue)) {
          value = numValue;
          hasData = true;
        }
      } else if (fieldValue !== null && fieldValue !== undefined) {
        hasData = true;
        value = 1; // Para campos não numéricos, usar 1 como indicador
      }
      
      // ✅ DEBUG: Log específico para segunda-feira com dados
      if (dateObj.getDay() === 1) {
        console.log('🔍 DEBUG - Segunda-feira processada:', {
          dateStr,
          fieldValue,
          value,
          hasData
        });
      }
    }
    
    return {
      date: dateObj,
      value,
      hasData,
      session
    };
  });
};

// Função para obter resumo mensal (reutilizando lógica da aba de treinos)
export const getMonthlyTrainingSummary = (
  trainingSessions: TrainingSession[],
  month: Date
) => {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  const plannedSessions = getPlannedTrainingSessions(
    filterTrainingSessionsByPeriod(trainingSessions, monthStart, monthEnd)
  );
  
  const completedSessions = getCompletedTrainingSessions(
    filterTrainingSessionsByPeriod(trainingSessions, monthStart, monthEnd)
  );
  
  const plannedDistance = plannedSessions.reduce((sum, s) => sum + (s.distance_km || 0), 0);
  const completedDistance = completedSessions.reduce((sum, s) => sum + (s.distance_km || 0), 0);
  
  return {
    planned: {
      count: plannedSessions.length,
      distance: plannedDistance
    },
    completed: {
      count: completedSessions.length,
      distance: completedDistance
    }
  };
};
