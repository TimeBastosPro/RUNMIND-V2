// Cálculo do IMC
export function calculateIMC(pesoKg: number, alturaCm: number): number | undefined {
  if (!pesoKg || !alturaCm) return undefined;
  const alturaM = alturaCm / 100;
  return pesoKg / (alturaM * alturaM);
}

// Cálculo do VO2max estimado a partir de tempo de prova (Jack Daniels para 5k, 10k, etc)
// tempoEmSegundos deve ser o tempo total da prova
export function calculateVO2maxFromRaceTime(distanciaEmMetros: number, tempoHHMMSS: string): number | undefined {
  if (!distanciaEmMetros || !tempoHHMMSS) return undefined;
  // Converter HH:MM:SS para segundos
  const [hh = '0', mm = '0', ss = '0'] = tempoHHMMSS.split(':');
  const tempoSegundos = parseInt(hh) * 3600 + parseInt(mm) * 60 + parseInt(ss);
  if (!tempoSegundos || tempoSegundos === 0) return undefined;
  // Fórmula simplificada de Jack Daniels para corrida de longa distância
  const velocidadeMS = distanciaEmMetros / tempoSegundos;
  const vo2 = (-4.6 + 0.182258 * velocidadeMS * 60 + 0.000104 * Math.pow(velocidadeMS * 60, 2));
  const vo2max = vo2 / (0.8 + 0.1894393 * Math.exp(-0.012778 * tempoSegundos / 60) + 0.2989558 * Math.exp(-0.1932605 * tempoSegundos / 60));
  return vo2max;
}

// Cálculo da VAM (Velocidade Aeróbia Máxima)
export function calculateVAM(vo2max: number): number | undefined {
  if (!vo2max) return undefined;
  // VAM em km/h (VAM ≈ VO2max / 3.5)
  return vo2max / 3.5;
}

// Cálculo das zonas de treino de FC (Karvonen)
export function calculateTrainingZones(fcMax: number, fcRepouso: number) {
  if (!fcMax || !fcRepouso) return undefined;
  // 5 zonas clássicas: 50-60%, 60-70%, 70-80%, 80-90%, 90-100%
  const zonas = [
    { min: Math.round((fcMax - fcRepouso) * 0.5 + fcRepouso), max: Math.round((fcMax - fcRepouso) * 0.6 + fcRepouso) },
    { min: Math.round((fcMax - fcRepouso) * 0.6 + fcRepouso), max: Math.round((fcMax - fcRepouso) * 0.7 + fcRepouso) },
    { min: Math.round((fcMax - fcRepouso) * 0.7 + fcRepouso), max: Math.round((fcMax - fcRepouso) * 0.8 + fcRepouso) },
    { min: Math.round((fcMax - fcRepouso) * 0.8 + fcRepouso), max: Math.round((fcMax - fcRepouso) * 0.9 + fcRepouso) },
    { min: Math.round((fcMax - fcRepouso) * 0.9 + fcRepouso), max: fcMax },
  ];
  return zonas;
}

// Novas funções para testes de performance
export const calculateVo2maxFromCooper = (distanceInMeters: number): number => {
  return (distanceInMeters - 504.9) / 44.73;
};

export const calculateVo2maxFrom3km = (timeInSeconds: number): number => {
  const timeInMinutes = timeInSeconds / 60;
  return (483 / timeInMinutes) + 3.5;
};

export const calculateVo2maxFromRockport = (
  weightKg: number,
  age: number,
  gender: string,
  timeInSeconds: number,
  finalHeartRate: number
): number => {
  const timeInMinutes = timeInSeconds / 60;
  const genderValue = gender === 'male' ? 1 : 0;
  
  return 132.853 - (0.0769 * weightKg) - (0.3877 * age) + (6.315 * genderValue) - (3.2649 * timeInMinutes) - (0.1565 * finalHeartRate);
};

export const calculateVo2maxFromRace = (distanceInMeters: number, timeInSeconds: number): number => {
  const timeInMinutes = timeInSeconds / 60;
  const velocity = distanceInMeters / timeInMinutes; // m/min
  
  // Fórmula VDOT de Jack Daniels
  return velocity * 0.2 + 3.5;
};

export const calculateVamFromVo2max = (vo2max: number): number => {
  return vo2max / 3.5;
};

export interface TrainingZone {
  zone: number;
  minPercentage: number;
  maxPercentage: number;
  minHeartRate: number;
  maxHeartRate: number;
  description: string;
}

export interface PaceZone {
  zone: number;
  minPercentage: number;
  maxPercentage: number;
  minPace: string; // formato "mm:ss"
  maxPace: string; // formato "mm:ss"
  description: string;
}

export const calculateKarvonenZones = (maxHeartRate: number, restingHeartRate: number): TrainingZone[] => {
  const heartRateReserve = maxHeartRate - restingHeartRate;
  
  return [
    {
      zone: 1,
      minPercentage: 0.5,
      maxPercentage: 0.6,
      minHeartRate: Math.round(restingHeartRate + (heartRateReserve * 0.5)),
      maxHeartRate: Math.round(restingHeartRate + (heartRateReserve * 0.6)),
      description: 'Recuperação'
    },
    {
      zone: 2,
      minPercentage: 0.6,
      maxPercentage: 0.7,
      minHeartRate: Math.round(restingHeartRate + (heartRateReserve * 0.6)),
      maxHeartRate: Math.round(restingHeartRate + (heartRateReserve * 0.7)),
      description: 'Aeróbico'
    },
    {
      zone: 3,
      minPercentage: 0.7,
      maxPercentage: 0.8,
      minHeartRate: Math.round(restingHeartRate + (heartRateReserve * 0.7)),
      maxHeartRate: Math.round(restingHeartRate + (heartRateReserve * 0.8)),
      description: 'Limiar'
    },
    {
      zone: 4,
      minPercentage: 0.8,
      maxPercentage: 0.9,
      minHeartRate: Math.round(restingHeartRate + (heartRateReserve * 0.8)),
      maxHeartRate: Math.round(restingHeartRate + (heartRateReserve * 0.9)),
      description: 'Anaeróbico'
    },
    {
      zone: 5,
      minPercentage: 0.9,
      maxPercentage: 1.0,
      minHeartRate: Math.round(restingHeartRate + (heartRateReserve * 0.9)),
      maxHeartRate: Math.round(restingHeartRate + (heartRateReserve * 1.0)),
      description: 'Máximo'
    }
  ];
};

// Calcular zonas de ritmo baseadas no VO2max e VAM
export const calculatePaceZones = (vo2max: number, vam: number): PaceZone[] => {
  console.log('DEBUG - calculatePaceZones chamado com:', { vo2max, vam });
  
  if (!vo2max || !vam) {
    console.log('DEBUG - VO2max ou VAM inválidos, retornando array vazio');
    return [];
  }
  
  // Converter VAM de km/h para min/km (ritmo)
  const vamPaceSeconds = 3600 / vam; // segundos por km
  console.log('DEBUG - VAM Pace Seconds:', vamPaceSeconds);
  
  const zones = [
    {
      zone: 1,
      minPercentage: 0.5,
      maxPercentage: 0.6,
      minPace: formatSecondsToPace(vamPaceSeconds / 0.5),
      maxPace: formatSecondsToPace(vamPaceSeconds / 0.6),
      description: 'Recuperação'
    },
    {
      zone: 2,
      minPercentage: 0.6,
      maxPercentage: 0.7,
      minPace: formatSecondsToPace(vamPaceSeconds / 0.6),
      maxPace: formatSecondsToPace(vamPaceSeconds / 0.7),
      description: 'Aeróbico'
    },
    {
      zone: 3,
      minPercentage: 0.7,
      maxPercentage: 0.8,
      minPace: formatSecondsToPace(vamPaceSeconds / 0.7),
      maxPace: formatSecondsToPace(vamPaceSeconds / 0.8),
      description: 'Limiar'
    },
    {
      zone: 4,
      minPercentage: 0.8,
      maxPercentage: 0.9,
      minPace: formatSecondsToPace(vamPaceSeconds / 0.8),
      maxPace: formatSecondsToPace(vamPaceSeconds / 0.9),
      description: 'Anaeróbico'
    },
    {
      zone: 5,
      minPercentage: 0.9,
      maxPercentage: 1.0,
      minPace: formatSecondsToPace(vamPaceSeconds / 0.9),
      maxPace: formatSecondsToPace(vamPaceSeconds / 1.0),
      description: 'Máximo'
    }
  ];
  
  console.log('DEBUG - Zonas de ritmo calculadas:', zones);
  return zones;
};

// Função auxiliar para formatar segundos em ritmo (mm:ss)
const formatSecondsToPace = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Fórmula de Tanaka para calcular FC Máxima baseada na idade
export const calculateMaxHeartRateTanaka = (age: number): number => {
  if (!age || age <= 0) return 0;
  // Fórmula de Tanaka: FCmax = 208 - (0.7 × idade)
  return Math.round(208 - (0.7 * age));
}; 