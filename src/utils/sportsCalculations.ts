import { TrainingSession } from '../types/database';

export interface WorkloadMetrics {
  acuteLoad: number;      // Carga aguda (7 dias)
  chronicLoad: number;    // Carga crônica (28 dias)
  acwr: number;          // Acute:Chronic Workload Ratio
  riskZone: 'detraining' | 'safety' | 'risk' | 'high-risk';
  riskPercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendations: string[];
}

export interface DailyWorkload {
  date: string;
  workload: number;
  intensity: number;
  duration: number;
}

/**
 * Calcula a carga de treino baseada na duração e intensidade
 * Fórmula: Carga = Duração (min) × Intensidade (PSE 1-10)
 */
export function calculateWorkload(duration: number, intensity: number): number {
  return duration * intensity;
}

/**
 * Calcula a carga aguda (últimos 7 dias)
 */
export function calculateAcuteLoad(sessions: TrainingSession[]): number {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentSessions = sessions.filter(session => {
    const sessionDate = new Date(session.training_date || '');
    return sessionDate >= sevenDaysAgo;
  });

  return recentSessions.reduce((total, session) => {
    const duration = session.duration_minutes || 0;
    const intensity = session.perceived_exertion || 5; // Default PSE 5
    return total + calculateWorkload(duration, intensity);
  }, 0);
}

/**
 * Calcula a carga crônica (últimos 28 dias)
 */
export function calculateChronicLoad(sessions: TrainingSession[]): number {
  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
  
  const recentSessions = sessions.filter(session => {
    const sessionDate = new Date(session.training_date || '');
    return sessionDate >= twentyEightDaysAgo;
  });

  return recentSessions.reduce((total, session) => {
    const duration = session.duration_minutes || 0;
    const intensity = session.perceived_exertion || 5;
    return total + calculateWorkload(duration, intensity);
  }, 0);
}

/**
 * Calcula o ACWR (Acute:Chronic Workload Ratio)
 * ACWR = Carga Aguda (7 dias) / Carga Crônica (28 dias)
 */
export function calculateACWR(acuteLoad: number, chronicLoad: number): number {
  if (chronicLoad === 0) return 0;
  return acuteLoad / chronicLoad;
}

/**
 * Determina a zona de risco baseada no ACWR
 */
export function determineRiskZone(acwr: number): 'detraining' | 'safety' | 'risk' | 'high-risk' {
  if (acwr < 0.8) return 'detraining';
  if (acwr >= 0.8 && acwr <= 1.3) return 'safety';
  if (acwr > 1.3 && acwr <= 1.5) return 'risk';
  return 'high-risk';
}

/**
 * Calcula a porcentagem de risco
 */
export function calculateRiskPercentage(acwr: number): number {
  if (acwr < 0.8) return 0; // Sem risco de lesão, mas risco de destreino
  if (acwr >= 0.8 && acwr <= 1.3) return 0; // Zona segura
  if (acwr > 1.3 && acwr <= 1.5) return Math.round(((acwr - 1.3) / 0.2) * 50); // 0-50%
  return Math.round(50 + ((acwr - 1.5) / 0.5) * 50); // 50-100%
}

/**
 * Determina a tendência da carga de treino
 */
export function determineTrend(sessions: TrainingSession[]): 'increasing' | 'decreasing' | 'stable' {
  const last14Days = sessions.filter(session => {
    const sessionDate = new Date(session.training_date || '');
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return sessionDate >= fourteenDaysAgo;
  });

  if (last14Days.length < 4) return 'stable';

  // Dividir em duas semanas
  const week1 = last14Days.slice(0, Math.ceil(last14Days.length / 2));
  const week2 = last14Days.slice(Math.ceil(last14Days.length / 2));

  const week1Load = week1.reduce((total, session) => {
    const duration = session.duration_minutes || 0;
    const intensity = session.perceived_exertion || 5;
    return total + calculateWorkload(duration, intensity);
  }, 0);

  const week2Load = week2.reduce((total, session) => {
    const duration = session.duration_minutes || 0;
    const intensity = session.perceived_exertion || 5;
    return total + calculateWorkload(duration, intensity);
  }, 0);

  const difference = week2Load - week1Load;
  const threshold = week1Load * 0.1; // 10% de variação

  if (difference > threshold) return 'increasing';
  if (difference < -threshold) return 'decreasing';
  return 'stable';
}

/**
 * Gera recomendações baseadas no ACWR e tendência
 */
export function generateRecommendations(
  acwr: number, 
  riskZone: string, 
  trend: string
): string[] {
  const recommendations: string[] = [];

  switch (riskZone) {
    case 'detraining':
      recommendations.push('⚠️ Sua carga de treino está baixa');
      recommendations.push('Considere aumentar gradualmente a intensidade');
      recommendations.push('Mantenha pelo menos 3 sessões por semana');
      break;
    
    case 'safety':
      recommendations.push('✅ Você está na zona segura');
      recommendations.push('Continue com sua rotina atual');
      if (trend === 'increasing') {
        recommendations.push('Monitore o aumento gradual da carga');
      }
      break;
    
    case 'risk':
      recommendations.push('⚠️ Carga de treino elevada');
      recommendations.push('Considere reduzir a intensidade ou volume');
      recommendations.push('Aumente o tempo de recuperação');
      break;
    
    case 'high-risk':
      recommendations.push('🚨 Risco alto de lesão!');
      recommendations.push('Reduza imediatamente a carga de treino');
      recommendations.push('Considere dias de descanso completo');
      recommendations.push('Consulte um profissional se necessário');
      break;
  }

  return recommendations;
}

/**
 * Calcula todas as métricas de carga de treino
 */
export function calculateWorkloadMetrics(sessions: TrainingSession[]): WorkloadMetrics {
  const acuteLoad = calculateAcuteLoad(sessions);
  const chronicLoad = calculateChronicLoad(sessions);
  const acwr = calculateACWR(acuteLoad, chronicLoad);
  const riskZone = determineRiskZone(acwr);
  const riskPercentage = calculateRiskPercentage(acwr);
  const trend = determineTrend(sessions);
  const recommendations = generateRecommendations(acwr, riskZone, trend);

  return {
    acuteLoad,
    chronicLoad,
    acwr,
    riskZone,
    riskPercentage,
    trend,
    recommendations
  };
}

/**
 * Calcula carga diária para gráficos
 */
export function calculateDailyWorkloads(sessions: TrainingSession[]): DailyWorkload[] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSessions = sessions.filter(session => {
    const sessionDate = new Date(session.training_date || '');
    return sessionDate >= thirtyDaysAgo;
  });

  // Agrupar por data
  const dailyWorkloads = new Map<string, DailyWorkload>();

  recentSessions.forEach(session => {
    const date = session.training_date || '';
    const duration = session.duration_minutes || 0;
    const intensity = session.perceived_exertion || 5;
    const workload = calculateWorkload(duration, intensity);

    if (dailyWorkloads.has(date)) {
      const existing = dailyWorkloads.get(date)!;
      existing.workload += workload;
      existing.duration += duration;
      existing.intensity = Math.max(existing.intensity, intensity);
    } else {
      dailyWorkloads.set(date, {
        date,
        workload,
        intensity,
        duration
      });
    }
  });

  return Array.from(dailyWorkloads.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Calcula a carga semanal para análise de tendências
 */
export function calculateWeeklyWorkloads(sessions: TrainingSession[]): Array<{
  weekStart: string;
  totalWorkload: number;
  averageIntensity: number;
  sessionsCount: number;
}> {
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const recentSessions = sessions.filter(session => {
    const sessionDate = new Date(session.training_date || '');
    return sessionDate >= eightWeeksAgo;
  });

  const weeklyData = new Map<string, {
    weekStart: string;
    totalWorkload: number;
    totalIntensity: number;
    sessionsCount: number;
  }>();

  recentSessions.forEach(session => {
    const sessionDate = new Date(session.training_date || '');
    const weekStart = new Date(sessionDate);
    weekStart.setDate(sessionDate.getDate() - sessionDate.getDay()); // Domingo
    const weekKey = weekStart.toISOString().split('T')[0];

    const duration = session.duration_minutes || 0;
    const intensity = session.perceived_exertion || 5;
    const workload = calculateWorkload(duration, intensity);

    if (weeklyData.has(weekKey)) {
      const existing = weeklyData.get(weekKey)!;
      existing.totalWorkload += workload;
      existing.totalIntensity += intensity;
      existing.sessionsCount += 1;
    } else {
      weeklyData.set(weekKey, {
        weekStart: weekKey,
        totalWorkload: workload,
        totalIntensity: intensity,
        sessionsCount: 1
      });
    }
  });

  return Array.from(weeklyData.values())
    .map(week => ({
      weekStart: week.weekStart,
      totalWorkload: week.totalWorkload,
      averageIntensity: week.totalIntensity / week.sessionsCount,
      sessionsCount: week.sessionsCount
    }))
    .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());
} 