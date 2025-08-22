// src/utils/sportsCalculations.ts

import type { TrainingSession } from '../types/database';

export interface DailyWorkload {
  date: string;
  workload: number;
}

// Interface ATUALIZADA com as novas métricas
export interface WorkloadMetrics {
  fitness_ctl: number;   // Condicionamento (antiga chronicLoad)
  fatigue_atl: number;   // Fadiga (antiga acuteLoad)
  form_tsb: number;      // Forma / Prontidão (NOVA)
  acwr: number;
  riskZone: 'detraining' | 'safety' | 'risk' | 'high-risk';
  riskPercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendations: string[];
  monotony: number;
  strain: number;
}

// Interfaces para zonas de treino
export interface TrainingZone {
  name: string;
  min: number;
  max: number;
  color: string;
  description: string;
}

export interface PaceZone {
  name: string;
  min: string;
  max: string;
  color: string;
  description: string;
}

function calculateSessionWorkload(session: TrainingSession): number {
  if (session.status !== 'completed' || !session.perceived_effort || !session.duration_minutes) {
    return 0;
  }
  const duration = Number(session.duration_minutes) || 0;
  const effort = Number(session.perceived_effort) || 0;
  return duration * effort;
}

export function calculateDailyWorkloads(sessions: TrainingSession[]): DailyWorkload[] {
  const workloadByDate: { [date: string]: number } = {};
  sessions.forEach(session => {
    if (session.status === 'completed' && session.training_date) {
      const workload = calculateSessionWorkload(session);
      workloadByDate[session.training_date] = (workloadByDate[session.training_date] || 0) + workload;
    }
  });
  const sortedDates = Object.keys(workloadByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  return sortedDates.map(date => ({ date, workload: workloadByDate[date] }));
}

export function calculateMonotonyAndStrain(dailyWorkloads: DailyWorkload[]): { monotony: number; strain: number } {
  if (dailyWorkloads.length < 7) {
    return { monotony: 0, strain: 0 };
  }
  const last7DaysWorkloads = dailyWorkloads.slice(-7).map(d => d.workload);
  const weeklyLoad = last7DaysWorkloads.reduce((sum, load) => sum + load, 0);
  if (weeklyLoad === 0) return { monotony: 0, strain: 0 };
  const meanDailyLoad = weeklyLoad / 7;
  const stdDev = Math.sqrt(
    last7DaysWorkloads.map(load => Math.pow(load - meanDailyLoad, 2)).reduce((sum, v) => sum + v, 0) / 7
  );
  const monotony = stdDev > 0 ? meanDailyLoad / stdDev : 0;
  const strain = weeklyLoad * monotony;
  return {
    monotony: parseFloat(monotony.toFixed(2)),
    strain: parseFloat(strain.toFixed(2)),
  };
}

export function calculateWeeklyWorkloads(sessions: TrainingSession[]): any[] {
    // Manter implementação original
    return [];
}

// Função principal ATUALIZADA para usar os novos conceitos
export function calculateWorkloadMetrics(sessions: TrainingSession[]): WorkloadMetrics | null {
  if (sessions.length === 0) return null;

  const today = new Date();
  const getDaysAgo = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

  // Períodos padrão da indústria (7 dias para agudo, 42 dias para crônico)
  const fatigueSessions = sessions.filter(s => new Date(s.training_date) >= getDaysAgo(7));
  const fitnessSessions = sessions.filter(s => new Date(s.training_date) >= getDaysAgo(42));

  const fatigue_atl = fatigueSessions.reduce((sum, s) => sum + calculateSessionWorkload(s), 0) / 7;
  const fitness_ctl = fitnessSessions.reduce((sum, s) => sum + calculateSessionWorkload(s), 0) / 42;
  
  // Cálculo da Forma (TSB)
  const form_tsb = fitness_ctl - fatigue_atl;

  // Manter ACWR para risco de lesão (usa 7 e 28 dias)
  const acuteLoad_forACWR = sessions.filter(s => new Date(s.training_date) >= getDaysAgo(7)).reduce((sum, s) => sum + calculateSessionWorkload(s), 0);
  const chronicLoad_forACWR = (sessions.filter(s => new Date(s.training_date) >= getDaysAgo(28)).reduce((sum, s) => sum + calculateSessionWorkload(s), 0) / 28) * 7;
  const acwr = chronicLoad_forACWR > 0 ? acuteLoad_forACWR / chronicLoad_forACWR : 0;

  // Lógica de risco, tendência e recomendações (sem alterações)
  let riskZone: WorkloadMetrics['riskZone'] = 'safety';
  let riskPercentage = 0;
  if (acwr < 0.8) { riskZone = 'detraining'; riskPercentage = 5; }
  else if (acwr > 1.3 && acwr <= 1.5) { riskZone = 'risk'; riskPercentage = 20; }
  else if (acwr > 1.5) { riskZone = 'high-risk'; riskPercentage = 50; }

  const lastWeekLoad = acuteLoad_forACWR;
  const prevWeekLoad = sessions.filter(s => { const date = new Date(s.training_date); return date >= getDaysAgo(14) && date < getDaysAgo(7); }).reduce((sum, s) => sum + calculateSessionWorkload(s), 0);
  let trend: WorkloadMetrics['trend'] = 'stable';
  if (lastWeekLoad > prevWeekLoad * 1.1) trend = 'increasing';
  if (lastWeekLoad < prevWeekLoad * 0.9) trend = 'decreasing';
  
  const recommendations: string[] = [];
  if (form_tsb < -30) recommendations.push("Sua forma está muito baixa, indicando alta fadiga. Priorize a recuperação.");
  else if (form_tsb < -10) recommendations.push("Você está em um bloco de treino produtivo, mas cansativo. Monitore seu bem-estar.");
  else if (form_tsb > 5) recommendations.push("Você está descansado e pronto para treinos fortes ou competições.");
  
  const dailyWorkloads = calculateDailyWorkloads(sessions);
  const { monotony, strain } = calculateMonotonyAndStrain(dailyWorkloads);
  
  if (monotony > 2.0) recommendations.push("Seus treinos estão muito repetitivos. Tente variar o estímulo.");

  return {
    fitness_ctl: parseFloat(fitness_ctl.toFixed(1)),
    fatigue_atl: parseFloat(fatigue_atl.toFixed(1)),
    form_tsb: parseFloat(form_tsb.toFixed(1)),
    acwr: parseFloat(acwr.toFixed(2)),
    riskZone,
    riskPercentage,
    trend,
    recommendations,
    monotony,
    strain,
  };
}

// Funções auxiliares para cálculos de zonas de treino
export function calculateMaxHeartRate(age: number, gender: 'male' | 'female'): number {
  // Fórmula de Tanaka (mais precisa)
  return Math.round(208 - (0.7 * age));
}

export function calculateHeartRateZones(maxHR: number): TrainingZone[] {
  return [
    {
      name: 'Z1 - Recuperação',
      min: Math.round(maxHR * 0.5),
      max: Math.round(maxHR * 0.6),
      color: '#4CAF50',
      description: 'Recuperação ativa, regeneração'
    },
    {
      name: 'Z2 - Resistência Aeróbica',
      min: Math.round(maxHR * 0.6),
      max: Math.round(maxHR * 0.7),
      color: '#8BC34A',
      description: 'Desenvolvimento da base aeróbica'
    },
    {
      name: 'Z3 - Resistência',
      min: Math.round(maxHR * 0.7),
      max: Math.round(maxHR * 0.8),
      color: '#FFC107',
      description: 'Limiar aeróbico, ritmo de maratona'
    },
    {
      name: 'Z4 - Limiar',
      min: Math.round(maxHR * 0.8),
      max: Math.round(maxHR * 0.9),
      color: '#FF9800',
      description: 'Limiar anaeróbico, ritmo de 10km'
    },
    {
      name: 'Z5 - VO2 Max',
      min: Math.round(maxHR * 0.9),
      max: maxHR,
      color: '#F44336',
      description: 'Capacidade máxima, ritmo de 5km'
    }
  ];
}

export function calculatePaceZones(thresholdPace: string): PaceZone[] {
  // Converte pace de formato "mm:ss" para segundos
  const paceToSeconds = (pace: string) => {
    const [minutes, seconds] = pace.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const thresholdSeconds = paceToSeconds(thresholdPace);
  
  return [
    {
      name: 'Z1 - Recuperação',
      min: formatPaceFromSeconds(thresholdSeconds * 1.3),
      max: formatPaceFromSeconds(thresholdSeconds * 1.2),
      color: '#4CAF50',
      description: 'Recuperação ativa'
    },
    {
      name: 'Z2 - Resistência',
      min: formatPaceFromSeconds(thresholdSeconds * 1.2),
      max: formatPaceFromSeconds(thresholdSeconds * 1.1),
      color: '#8BC34A',
      description: 'Desenvolvimento aeróbico'
    },
    {
      name: 'Z3 - Limiar',
      min: formatPaceFromSeconds(thresholdSeconds * 1.1),
      max: formatPaceFromSeconds(thresholdSeconds * 1.0),
      color: '#FFC107',
      description: 'Limiar aeróbico'
    },
    {
      name: 'Z4 - VO2 Max',
      min: formatPaceFromSeconds(thresholdSeconds * 1.0),
      max: formatPaceFromSeconds(thresholdSeconds * 0.9),
      color: '#FF9800',
      description: 'Capacidade máxima'
    },
    {
      name: 'Z5 - Anaeróbico',
      min: formatPaceFromSeconds(thresholdSeconds * 0.9),
      max: formatPaceFromSeconds(thresholdSeconds * 0.8),
      color: '#F44336',
      description: 'Potência anaeróbica'
    }
  ];
}

function formatPaceFromSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatPaceString(pace: string): string {
  if (!pace || pace === '--') return '--';
  return pace;
}

export function calculateVo2maxFromRockport(age: number, gender: 'male' | 'female', weight: number, timeMinutes: number, heartRate: number): number {
  const timeHours = timeMinutes / 60;
  const distance = 1.609; // 1 milha em km
  
  let vo2max;
  if (gender === 'male') {
    vo2max = 132.853 - (0.0769 * weight) - (0.3877 * age) + (6.315 * 1) - (3.2649 * timeHours) - (0.1565 * heartRate);
  } else {
    vo2max = 132.853 - (0.0769 * weight) - (0.3877 * age) + (6.315 * 0) - (3.2649 * timeHours) - (0.1565 * heartRate);
  }
  
  return Math.max(0, parseFloat(vo2max.toFixed(1)));
}

export function calculateVo2maxFromCooper(distance: number, age: number, gender: 'male' | 'female'): number {
  // Fórmula de Cooper para 12 minutos
  let vo2max;
  if (gender === 'male') {
    vo2max = (distance - 504.9) / 44.73;
  } else {
    vo2max = (distance - 504.9) / 44.73;
  }
  
  return Math.max(0, parseFloat(vo2max.toFixed(1)));
}

export function calculateThresholdPace(vo2max: number, gender: 'male' | 'female'): string {
  // Estimativa do pace no limiar anaeróbico (aproximadamente 85-90% do VO2max)
  const thresholdVo2 = vo2max * 0.87;
  
  // Fórmula simplificada para converter VO2 em pace
  // Pace = 3600 / (VO2 * 3.5) em segundos por km
  const paceSeconds = 3600 / (thresholdVo2 * 3.5);
  
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.floor(paceSeconds % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function calculateTrainingStressScore(duration: number, intensity: number): number {
  // TSS = (Duration * Intensity * IF) / (FTP * 3600) * 100
  // Simplificado para: TSS = (Duration * Intensity) / 100
  return Math.round((duration * intensity) / 100);
}

export function calculateIntensityFactor(normalizedPower: number, functionalThresholdPower: number): number {
  return normalizedPower / functionalThresholdPower;
}

export function calculateNormalizedPower(powers: number[]): number {
  if (powers.length === 0) return 0;
  
  // Aplica média móvel de 30 segundos
  const windowSize = 30;
  const smoothedPowers = [];
  
  for (let i = 0; i < powers.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = powers.slice(start, i + 1);
    const avg = window.reduce((sum, p) => sum + p, 0) / window.length;
    smoothedPowers.push(avg);
  }
  
  // Calcula a média da quarta potência
  const fourthPowerSum = smoothedPowers.reduce((sum, p) => sum + Math.pow(p, 4), 0);
  const normalizedPower = Math.pow(fourthPowerSum / smoothedPowers.length, 0.25);
  
  return Math.round(normalizedPower);
}

// Funções básicas que estavam sendo usadas em outros arquivos
export function calculateIMC(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

export function calculateMaxHeartRateTanaka(age: number): number {
  return Math.round(208 - (0.7 * age));
}

export function calculateVO2maxFromRaceTime(distance: number, timeMinutes: number): number {
  const timeHours = timeMinutes / 60;
  const paceMinutesPerKm = timeMinutes / distance;
  const velocityKmH = distance / timeHours;
  
  // Fórmula de Riegel para VO2max
  const vo2max = 0.2 * velocityKmH + 3.5;
  return parseFloat(vo2max.toFixed(1));
}

export function calculateVAM(vo2max: number): number {
  // Velocidade Aeróbica Máxima (VAM)
  return parseFloat((vo2max / 3.5).toFixed(2));
}

export function calculateVamFromVo2max(vo2max: number): number {
  return calculateVAM(vo2max);
}

export function calculateVo2maxFrom3km(timeMinutes: number): number {
  const timeHours = timeMinutes / 60;
  const velocityKmH = 3 / timeHours;
  const vo2max = 0.2 * velocityKmH + 3.5;
  return parseFloat(vo2max.toFixed(1));
}

export function calculateVo2maxFromRace(distance: number, timeMinutes: number): number {
  return calculateVO2maxFromRaceTime(distance, timeMinutes);
}

export function calculateTrainingZones(maxHeartRate: number, restingHeartRate: number): TrainingZone[] {
  const heartRateReserve = maxHeartRate - restingHeartRate;
  
  return [
    {
      name: 'Zona 1 - Recuperação',
      min: Math.round(restingHeartRate + (heartRateReserve * 0.5)),
      max: Math.round(restingHeartRate + (heartRateReserve * 0.6)),
      color: '#4CAF50',
      description: 'Recuperação ativa, regeneração'
    },
    {
      name: 'Zona 2 - Resistência Aeróbica',
      min: Math.round(restingHeartRate + (heartRateReserve * 0.6)),
      max: Math.round(restingHeartRate + (heartRateReserve * 0.7)),
      color: '#8BC34A',
      description: 'Desenvolvimento da base aeróbica'
    },
    {
      name: 'Zona 3 - Resistência',
      min: Math.round(restingHeartRate + (heartRateReserve * 0.7)),
      max: Math.round(restingHeartRate + (heartRateReserve * 0.8)),
      color: '#FFC107',
      description: 'Melhora da eficiência aeróbica'
    },
    {
      name: 'Zona 4 - Limiar Anaeróbico',
      min: Math.round(restingHeartRate + (heartRateReserve * 0.8)),
      max: Math.round(restingHeartRate + (heartRateReserve * 0.9)),
      color: '#FF9800',
      description: 'Aumento do limiar anaeróbico'
    },
    {
      name: 'Zona 5 - VO2 Máximo',
      min: Math.round(restingHeartRate + (heartRateReserve * 0.9)),
      max: maxHeartRate,
      color: '#F44336',
      description: 'Desenvolvimento do VO2 máximo'
    }
  ];
}

export function calculateKarvonenZones(maxHeartRate: number, restingHeartRate: number): TrainingZone[] {
  return calculateTrainingZones(maxHeartRate, restingHeartRate);
}

export function formatPace(paceKmH: number): string {
  const minutesPerKm = 60 / paceKmH;
  const minutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
} 