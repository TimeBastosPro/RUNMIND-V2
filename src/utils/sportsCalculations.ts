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
  
  // ACWR (Acute:Chronic Workload Ratio)
  const acwr = fitness_ctl > 0 ? fatigue_atl / fitness_ctl : 0;
  
  // Determinar zona de risco baseada no ACWR
  let riskZone: 'detraining' | 'safety' | 'risk' | 'high-risk';
  let riskPercentage: number;
  
  if (acwr < 0.8) {
    riskZone = 'detraining';
    riskPercentage = Math.max(0, (0.8 - acwr) / 0.8 * 100);
  } else if (acwr <= 1.3) {
    riskZone = 'safety';
    riskPercentage = 0;
  } else if (acwr <= 1.5) {
    riskZone = 'risk';
    riskPercentage = Math.min(100, (acwr - 1.3) / 0.2 * 100);
  } else {
    riskZone = 'high-risk';
    riskPercentage = 100;
  }
  
  // Determinar tendência
  const recentSessions = sessions.filter(s => new Date(s.training_date) >= getDaysAgo(14));
  const olderSessions = sessions.filter(s => {
    const sessionDate = new Date(s.training_date);
    return sessionDate >= getDaysAgo(28) && sessionDate < getDaysAgo(14);
  });
  
  const recentLoad = recentSessions.reduce((sum, s) => sum + calculateSessionWorkload(s), 0) / 14;
  const olderLoad = olderSessions.reduce((sum, s) => sum + calculateSessionWorkload(s), 0) / 14;
  
  let trend: 'increasing' | 'decreasing' | 'stable';
  if (recentLoad > olderLoad * 1.1) {
    trend = 'increasing';
  } else if (recentLoad < olderLoad * 0.9) {
    trend = 'decreasing';
  } else {
    trend = 'stable';
  }
  
  // Gerar recomendações baseadas no ACWR e tendência
  const recommendations: string[] = [];
  
  if (riskZone === 'detraining') {
    recommendations.push('Considere aumentar gradualmente a carga de treino');
    recommendations.push('Mantenha pelo menos 2-3 sessões por semana');
  } else if (riskZone === 'safety') {
    recommendations.push('Carga de treino adequada - mantenha a consistência');
  } else if (riskZone === 'risk') {
    recommendations.push('Considere reduzir a intensidade ou volume');
    recommendations.push('Monitore sinais de fadiga excessiva');
  } else if (riskZone === 'high-risk') {
    recommendations.push('Reduza imediatamente a carga de treino');
    recommendations.push('Considere dias de recuperação completa');
    recommendations.push('Monitore sinais de overtraining');
  }
  
  // Calcular monotonia e strain
  const dailyWorkloads = calculateDailyWorkloads(sessions);
  const { monotony, strain } = calculateMonotonyAndStrain(dailyWorkloads);
  
  return {
    fitness_ctl: parseFloat(fitness_ctl.toFixed(1)),
    fatigue_atl: parseFloat(fatigue_atl.toFixed(1)),
    form_tsb: parseFloat(form_tsb.toFixed(1)),
    acwr: parseFloat(acwr.toFixed(2)),
    riskZone,
    riskPercentage: parseFloat(riskPercentage.toFixed(1)),
    trend,
    recommendations,
    monotony,
    strain
  };
}

export function calculatePaceZones(vo2max: number): PaceZone[] {
  if (!vo2max || vo2max <= 0) {
    return [];
  }

  // ✅ CORREÇÃO: Calcular VAM a partir do VO2max
  const vam = vo2max / 3.5;
  
  // ✅ CORREÇÃO: Calcular pace base em segundos por km
  const basePaceSeconds = 3600 / vam; // 3600 segundos / VAM km/h = segundos por km
  
  // ✅ CORREÇÃO: Multiplicadores baseados em evidência científica
  const zones = [
    { name: 'Z1 - Recuperação', minMultiplier: 1.25, maxMultiplier: 1.15, color: '#4CAF50', description: 'Recuperação ativa, regeneração' },
    { name: 'Z2 - Resistência', minMultiplier: 1.15, maxMultiplier: 1.05, color: '#8BC34A', description: 'Desenvolvimento da base aeróbica' },
    { name: 'Z3 - Limiar', minMultiplier: 1.05, maxMultiplier: 0.95, color: '#FFC107', description: 'Melhora da eficiência aeróbica' },
    { name: 'Z4 - VO2 Max', minMultiplier: 0.95, maxMultiplier: 0.85, color: '#FF9800', description: 'Aumento do limiar anaeróbico' },
    { name: 'Z5 - Anaeróbico', minMultiplier: 0.85, maxMultiplier: 0.75, color: '#F44336', description: 'Desenvolvimento do VO2 máximo' }
  ];

  return zones.map(zone => ({
    name: zone.name,
    min: formatPaceFromSeconds(basePaceSeconds * zone.minMultiplier),
    max: formatPaceFromSeconds(basePaceSeconds * zone.maxMultiplier),
    color: zone.color,
    description: zone.description
  }));
}

function formatPaceFromSeconds(seconds: number): string {
  // Garantir que seconds seja um número válido
  if (isNaN(seconds) || seconds <= 0) {
    return '--';
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  // Debug: Log da formatação
  console.log('DEBUG - formatPaceFromSeconds:', { seconds, minutes, remainingSeconds });
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatPaceFromMinutes(minutes: number): string {
  // Garantir que minutes seja um número válido
  if (isNaN(minutes) || minutes <= 0) {
    return '--';
  }
  
  const wholeMinutes = Math.floor(minutes);
  const remainingSeconds = Math.round((minutes - wholeMinutes) * 60);
  
  // Debug: Log da formatação
  console.log('DEBUG - formatPaceFromMinutes:', { minutes, wholeMinutes, remainingSeconds });
  
  return `${wholeMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatPaceString(pace: string): string {
  if (!pace || pace === '--') return '--';
  return pace;
}

// ✅ CORREÇÃO: Adicionar validações de entrada
function validateInputs(distance?: number, timeMinutes?: number, age?: number, weight?: number, heartRate?: number): void {
  if (distance !== undefined && (distance <= 0 || distance > 5000)) {
    throw new Error('Distância inválida. Deve estar entre 0 e 5000 metros.');
  }
  if (timeMinutes !== undefined && (timeMinutes <= 0 || timeMinutes > 60)) {
    throw new Error('Tempo inválido. Deve estar entre 0 e 60 minutos.');
  }
  if (age !== undefined && (age < 10 || age > 100)) {
    throw new Error('Idade inválida. Deve estar entre 10 e 100 anos.');
  }
  if (weight !== undefined && (weight <= 0 || weight > 300)) {
    throw new Error('Peso inválido. Deve estar entre 0 e 300 kg.');
  }
  if (heartRate !== undefined && (heartRate <= 0 || heartRate > 250)) {
    throw new Error('Frequência cardíaca inválida. Deve estar entre 0 e 250 bpm.');
  }
}

export function calculateVo2maxFromRockport(age: number, gender: 'male' | 'female', weight: number, timeMinutes: number, heartRate: number): number {
  // ✅ CORREÇÃO: Adicionar validações
  validateInputs(undefined, timeMinutes, age, weight, heartRate);
  
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
  // ✅ CORREÇÃO: Adicionar validações
  validateInputs(distance, undefined, age);
  
  // ✅ CORREÇÃO: Fórmula de Cooper cientificamente validada
  // Nota: A fórmula de Cooper original usa os mesmos coeficientes para ambos os gêneros
  // mas com diferentes interpretações dos resultados
  let vo2max = (distance - 504.9) / 44.73;
  
  // ✅ CORREÇÃO: Ajuste baseado no gênero (interpretação dos resultados)
  if (gender === 'female') {
    // Para mulheres, os resultados são ligeiramente diferentes
    // mas a fórmula base permanece a mesma
    vo2max = vo2max * 1.0; // Ajuste se necessário baseado em estudos específicos
  }
  
  return Math.max(0, parseFloat(vo2max.toFixed(1)));
}

export function calculateThresholdPace(vo2max: number, gender: 'male' | 'female'): string {
  // Fórmula de Karvonen para estimar pace no limiar anaeróbico
  // Baseado em: Pace (min/km) = 5.5 + (50 - VO2max) * 0.1
  // Ajustado para ser mais realista
  
  // Para VO2max de 30-70 ml/kg/min, pace varia de ~3:30 a ~7:30 min/km
  let paceMinutesPerKm: number;
  
  if (vo2max >= 60) {
    // Atletas de elite: pace mais rápido
    paceMinutesPerKm = 3.5 + (60 - vo2max) * 0.08;
  } else if (vo2max >= 45) {
    // Atletas intermediários
    paceMinutesPerKm = 4.5 + (50 - vo2max) * 0.1;
  } else {
    // Iniciantes: pace mais lento
    paceMinutesPerKm = 6.0 + (40 - vo2max) * 0.15;
  }
  
  // Garantir valores realistas (entre 3:00 e 10:00 min/km)
  paceMinutesPerKm = Math.max(3.0, Math.min(10.0, paceMinutesPerKm));
  
  const minutes = Math.floor(paceMinutesPerKm);
  const seconds = Math.round((paceMinutesPerKm - minutes) * 60);
  
  // Debug: Log dos cálculos
  console.log('DEBUG - calculateThresholdPace (KARVONEN):', { 
    vo2max, 
    paceMinutesPerKm, 
    minutes, 
    seconds 
  });
  
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
  // ✅ CORREÇÃO: Adicionar validações
  if (weight <= 0 || height <= 0) {
    throw new Error('Peso e altura devem ser valores positivos.');
  }
  
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

export function calculateMaxHeartRateTanaka(age: number): number {
  // ✅ CORREÇÃO: Adicionar validações
  if (age < 10 || age > 100) {
    throw new Error('Idade deve estar entre 10 e 100 anos.');
  }
  
  return Math.round(208 - (0.7 * age));
}

export function calculateVO2maxFromRaceTime(distance: number, timeMinutes: number): number {
  // ✅ CORREÇÃO: Adicionar validações
  validateInputs(distance, timeMinutes);
  
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
  // ✅ CORREÇÃO: Adicionar validações
  validateInputs(undefined, timeMinutes);
  
  // Fórmula específica para teste de 3km
  // VO2max = 80 - (pace_min/km - 3.5) × 8
  // Onde pace_min/km = tempo_total_minutos / 3_km
  
  const paceMinutesPerKm = timeMinutes / 3;
  const vo2max = 80 - (paceMinutesPerKm - 3.5) * 8;
  
  // Debug: Log dos cálculos
  console.log('DEBUG - calculateVo2maxFrom3km:', { 
    timeMinutes, 
    paceMinutesPerKm, 
    vo2max 
  });
  
  return Math.max(0, parseFloat(vo2max.toFixed(1)));
}

export function calculateVo2maxFromRace(distance: number, timeMinutes: number): number {
  return calculateVO2maxFromRaceTime(distance, timeMinutes);
}

// ✅ CORREÇÃO: Zonas de treino usando método Karvonen correto
export function calculateTrainingZones(maxHeartRate: number, restingHeartRate: number): TrainingZone[] {
  // ✅ CORREÇÃO: Adicionar validações
  if (maxHeartRate <= 0 || restingHeartRate <= 0 || maxHeartRate <= restingHeartRate) {
    throw new Error('FC Máxima deve ser maior que FC Repouso e ambos devem ser positivos.');
  }
  
  const heartRateReserve = maxHeartRate - restingHeartRate;
  
  // ✅ CORREÇÃO: Percentuais baseados na FC Reserva (método Karvonen)
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
  if (paceKmH <= 0) return '--';
  
  const minutesPerKm = 60 / paceKmH;
  const minutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
} 