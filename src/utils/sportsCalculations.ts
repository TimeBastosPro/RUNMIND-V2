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

export interface TrainingZone {
  name: string;
  minHR: number;
  maxHR: number;
  description: string;
  color: string;
}

export interface PaceZone {
  name: string;
  zone: string;
  minPercentage: number;
  maxPercentage: number;
  minPace: number;
  maxPace: number;
  description: string;
  color: string;
}

/**
 * Calcula o IMC (Índice de Massa Corporal)
 * Fórmula: IMC = peso (kg) / altura (m)²
 */
export function calculateIMC(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Calcula VO2max a partir do tempo de prova
 */
export function calculateVO2maxFromRaceTime(distanceKm: number, timeSeconds: number): number {
  if (distanceKm <= 0 || timeSeconds <= 0) return 0;
  const paceSecondsPerKm = timeSeconds / distanceKm;
  const paceMinutesPerKm = paceSecondsPerKm / 60;
  
  // Fórmula aproximada baseada em estudos de VO2max
  return Math.max(0, 85 - (paceMinutesPerKm - 3.5) * 10);
}

/**
 * Calcula VAM (Velocidade Aeróbica Máxima)
 * Fórmula: VAM = VO2max / 3.5
 */
export function calculateVAM(vo2max: number): number {
  return vo2max / 3.5;
}

/**
 * Calcula VAM a partir do VO2max
 */
export function calculateVamFromVo2max(vo2max: number): number {
  return vo2max / 3.5;
}

/**
 * Calcula zonas de treino baseadas na frequência cardíaca máxima
 */
export function calculateTrainingZones(maxHR: number): TrainingZone[] {
  return [
    {
      name: 'Zona 1 - Recuperação',
      minHR: Math.round(maxHR * 0.5),
      maxHR: Math.round(maxHR * 0.6),
      description: 'Recuperação ativa, aquecimento',
      color: '#4CAF50'
    },
    {
      name: 'Zona 2 - Resistência Aeróbica',
      minHR: Math.round(maxHR * 0.6),
      maxHR: Math.round(maxHR * 0.7),
      description: 'Treino de base, resistência',
      color: '#2196F3'
    },
    {
      name: 'Zona 3 - Resistência Aeróbica',
      minHR: Math.round(maxHR * 0.7),
      maxHR: Math.round(maxHR * 0.8),
      description: 'Treino de limiar aeróbico',
      color: '#FF9800'
    },
    {
      name: 'Zona 4 - Limiar Anaeróbico',
      minHR: Math.round(maxHR * 0.8),
      maxHR: Math.round(maxHR * 0.9),
      description: 'Treino de limiar anaeróbico',
      color: '#F44336'
    },
    {
      name: 'Zona 5 - Capacidade Anaeróbica',
      minHR: Math.round(maxHR * 0.9),
      maxHR: maxHR,
      description: 'Treino de alta intensidade',
      color: '#9C27B0'
    }
  ];
}

/**
 * Calcula VO2max a partir do teste de Cooper (12 min)
 */
export function calculateVo2maxFromCooper(distanceMeters: number): number {
  if (distanceMeters <= 0) return 0;
  // Fórmula de Cooper: VO2max = (distância - 504.9) / 44.73
  return Math.max(0, (distanceMeters - 504.9) / 44.73);
}

/**
 * Calcula VO2max a partir do teste de 3km
 */
export function calculateVo2maxFrom3km(timeSeconds: number): number {
  if (timeSeconds <= 0) return 0;
  const paceSecondsPerKm = timeSeconds / 3;
  const paceMinutesPerKm = paceSecondsPerKm / 60;
  
  // Fórmula aproximada para 3km
  return Math.max(0, 80 - (paceMinutesPerKm - 3.5) * 8);
}

/**
 * Calcula VO2max a partir do teste de caminhada Rockport
 */
export function calculateVo2maxFromRockport(
  weightKg: number, 
  age: number, 
  gender: string, 
  timeSeconds: number, 
  heartRate: number
): number {
  if (weightKg <= 0 || age <= 0 || timeSeconds <= 0 || heartRate <= 0) return 0;
  
  const timeMinutes = timeSeconds / 60;
  const genderFactor = gender.toLowerCase() === 'male' ? 1 : 0;
  
  // Fórmula de Rockport
  return 132.853 - (0.0769 * weightKg) - (0.3877 * age) + (6.315 * genderFactor) - 
         (3.2649 * timeMinutes) - (0.1565 * heartRate);
}

/**
 * Calcula VO2max a partir de resultado de prova
 */
export function calculateVo2maxFromRace(distanceKm: number, timeSeconds: number): number {
  return calculateVO2maxFromRaceTime(distanceKm, timeSeconds);
}

/**
 * Calcula zonas de treino usando método de Karvonen
 */
export function calculateKarvonenZones(maxHR: number, restingHR: number): TrainingZone[] {
  const hrReserve = maxHR - restingHR;
  
  return [
    {
      name: 'Zona 1 - Recuperação',
      minHR: Math.round(restingHR + hrReserve * 0.5),
      maxHR: Math.round(restingHR + hrReserve * 0.6),
      description: 'Recuperação ativa, aquecimento',
      color: '#4CAF50'
    },
    {
      name: 'Zona 2 - Resistência Aeróbica',
      minHR: Math.round(restingHR + hrReserve * 0.6),
      maxHR: Math.round(restingHR + hrReserve * 0.7),
      description: 'Treino de base, resistência',
      color: '#2196F3'
    },
    {
      name: 'Zona 3 - Resistência Aeróbica',
      minHR: Math.round(restingHR + hrReserve * 0.7),
      maxHR: Math.round(restingHR + hrReserve * 0.8),
      description: 'Treino de limiar aeróbico',
      color: '#FF9800'
    },
    {
      name: 'Zona 4 - Limiar Anaeróbico',
      minHR: Math.round(restingHR + hrReserve * 0.8),
      maxHR: Math.round(restingHR + hrReserve * 0.9),
      description: 'Treino de limiar anaeróbico',
      color: '#F44336'
    },
    {
      name: 'Zona 5 - Capacidade Anaeróbica',
      minHR: Math.round(restingHR + hrReserve * 0.9),
      maxHR: Math.round(restingHR + hrReserve * 1.0),
      description: 'Treino de alta intensidade',
      color: '#9C27B0'
    }
  ];
}

/**
 * Formata segundos para formato min:seg
 */
export function formatPace(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Calcula zonas de pace baseadas no VO2max
 */
export function calculatePaceZones(vo2max: number): PaceZone[] {
  const vam = calculateVAM(vo2max);
  const basePace = 3600 / vam; // segundos por km
  
  return [
    {
      name: 'Zona 1 - Recuperação',
      zone: 'Z1',
      minPercentage: 50,
      maxPercentage: 60,
      minPace: basePace * 1.3,
      maxPace: basePace * 1.2,
      description: 'Recuperação ativa, aquecimento',
      color: '#4CAF50'
    },
    {
      name: 'Zona 2 - Resistência Aeróbica',
      zone: 'Z2',
      minPercentage: 60,
      maxPercentage: 70,
      minPace: basePace * 1.2,
      maxPace: basePace * 1.1,
      description: 'Treino de base, resistência',
      color: '#2196F3'
    },
    {
      name: 'Zona 3 - Resistência Aeróbica',
      zone: 'Z3',
      minPercentage: 70,
      maxPercentage: 80,
      minPace: basePace * 1.1,
      maxPace: basePace * 1.05,
      description: 'Treino de limiar aeróbico',
      color: '#FF9800'
    },
    {
      name: 'Zona 4 - Limiar Anaeróbico',
      zone: 'Z4',
      minPercentage: 80,
      maxPercentage: 90,
      minPace: basePace * 1.05,
      maxPace: basePace * 0.95,
      description: 'Treino de limiar anaeróbico',
      color: '#F44336'
    },
    {
      name: 'Zona 5 - Capacidade Anaeróbica',
      zone: 'Z5',
      minPercentage: 90,
      maxPercentage: 100,
      minPace: basePace * 0.95,
      maxPace: basePace * 0.85,
      description: 'Treino de alta intensidade',
      color: '#9C27B0'
    }
  ];
}

/**
 * Calcula frequência cardíaca máxima usando fórmula de Tanaka
 */
export function calculateMaxHeartRateTanaka(age: number): number {
  if (age <= 0) return 0;
  // Fórmula de Tanaka: FCmax = 208 - (0.7 × idade)
  return Math.round(208 - (0.7 * age));
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