/**
 * Utilitários para validação e normalização de dados de métricas
 */

export interface ValidationResult {
  isValid: boolean;
  value: number;
  error?: string;
}

/**
 * Valida e normaliza um valor numérico
 * @param value Valor a ser validado
 * @param field Nome do campo para logs de erro
 * @param min Valor mínimo permitido (opcional)
 * @param max Valor máximo permitido (opcional)
 * @returns Resultado da validação com valor normalizado
 */
export function validateNumericValue(
  value: any,
  field: string,
  min?: number,
  max?: number
): ValidationResult {
  // Verificar se o valor é null ou undefined
  if (value === null || value === undefined) {
    return {
      isValid: false,
      value: 0,
      error: `Campo ${field} é null ou undefined`
    };
  }

  // Se já é um número, validar diretamente
  if (typeof value === 'number') {
    if (isNaN(value)) {
      return {
        isValid: false,
        value: 0,
        error: `Campo ${field} é NaN`
      };
    }

    if (min !== undefined && value < min) {
      return {
        isValid: false,
        value: 0,
        error: `Campo ${field} (${value}) está abaixo do mínimo (${min})`
      };
    }

    if (max !== undefined && value > max) {
      return {
        isValid: false,
        value: 0,
        error: `Campo ${field} (${value}) está acima do máximo (${max})`
      };
    }

    return {
      isValid: true,
      value: value
    };
  }

  // Se é string, tentar converter
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    
    if (trimmedValue === '') {
      return {
        isValid: false,
        value: 0,
        error: `Campo ${field} é string vazia`
      };
    }

    const numericValue = parseFloat(trimmedValue);
    
    if (isNaN(numericValue)) {
      return {
        isValid: false,
        value: 0,
        error: `Campo ${field} ("${value}") não é um número válido`
      };
    }

    if (min !== undefined && numericValue < min) {
      return {
        isValid: false,
        value: 0,
        error: `Campo ${field} (${numericValue}) está abaixo do mínimo (${min})`
      };
    }

    if (max !== undefined && numericValue > max) {
      return {
        isValid: false,
        value: 0,
        error: `Campo ${field} (${numericValue}) está acima do máximo (${max})`
      };
    }

    return {
      isValid: true,
      value: numericValue
    };
  }

  // Tipo não suportado
  return {
    isValid: false,
    value: 0,
    error: `Campo ${field} tem tipo não suportado: ${typeof value}`
  };
}

/**
 * Valida e converte duração de horas e minutos para minutos totais
 * @param hours Valor das horas (pode ser string ou number)
 * @param minutes Valor dos minutos (pode ser string ou number)
 * @param field Nome do campo para logs de erro
 * @returns Resultado da validação com minutos totais
 */
export function validateDuration(
  hours: any,
  minutes: any,
  field: string = 'duration'
): ValidationResult {
  const hoursResult = validateNumericValue(hours, `${field}_hours`, 0, 24);
  const minutesResult = validateNumericValue(minutes, `${field}_minutes`, 0, 59);

  if (!hoursResult.isValid && !minutesResult.isValid) {
    return {
      isValid: false,
      value: 0,
      error: `Duração inválida: ${hoursResult.error}, ${minutesResult.error}`
    };
  }

  const totalMinutes = (hoursResult.isValid ? hoursResult.value : 0) * 60 + 
                      (minutesResult.isValid ? minutesResult.value : 0);

  return {
    isValid: true,
    value: totalMinutes
  };
}

/**
 * Valida métricas de bem-estar (escala 1-10)
 * @param value Valor da métrica
 * @param field Nome do campo
 * @returns Resultado da validação
 */
export function validateWellbeingMetric(value: any, field: string): ValidationResult {
  return validateNumericValue(value, field, 1, 10);
}

/**
 * Valida métricas de treino (valores positivos)
 * @param value Valor da métrica
 * @param field Nome do campo
 * @param max Valor máximo (opcional)
 * @returns Resultado da validação
 */
export function validateTrainingMetric(value: any, field: string, max?: number): ValidationResult {
  return validateNumericValue(value, field, 0, max);
}

/**
 * Valida frequência cardíaca (30-220 bpm)
 * @param value Valor da FC
 * @param field Nome do campo
 * @returns Resultado da validação
 */
export function validateHeartRate(value: any, field: string): ValidationResult {
  return validateNumericValue(value, field, 30, 220);
}

/**
 * Valida distância (0-1000 km)
 * @param value Valor da distância
 * @param field Nome do campo
 * @returns Resultado da validação
 */
export function validateDistance(value: any, field: string): ValidationResult {
  return validateNumericValue(value, field, 0, 1000);
}

/**
 * Valida elevação (-1000 a 10000 metros)
 * @param value Valor da elevação
 * @param field Nome do campo
 * @returns Resultado da validação
 */
export function validateElevation(value: any, field: string): ValidationResult {
  return validateNumericValue(value, field, -1000, 10000);
}

/**
 * Log de erros de validação (apenas em desenvolvimento)
 * @param errors Array de erros
 */
export function logValidationErrors(errors: string[]): void {
  if (__DEV__ && errors.length > 0) {
    console.warn('⚠️ Erros de validação de dados:', errors);
  }
}

/**
 * Processa um array de dados com validação
 * @param data Array de dados
 * @param validator Função de validação
 * @param field Nome do campo
 * @returns Array de dados validados
 */
export function processDataWithValidation<T>(
  data: T[],
  validator: (item: T) => ValidationResult,
  field: string
): { validData: T[], errors: string[] } {
  const validData: T[] = [];
  const errors: string[] = [];

  data.forEach((item, index) => {
    const result = validator(item);
    
    if (result.isValid) {
      validData.push(item);
    } else {
      errors.push(`Item ${index} (${field}): ${result.error}`);
    }
  });

  logValidationErrors(errors);
  
  return { validData, errors };
}
