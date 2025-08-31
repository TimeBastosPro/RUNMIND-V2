// 🎯 UTILITÁRIOS CENTRALIZADOS PARA FORMATAÇÃO DE DATAS
// Padroniza todos os formatos de data em todo o projeto

/**
 * Converte uma data para string no formato YYYY-MM-DD (ISO)
 * SEMPRE usa timezone local para evitar problemas
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte uma data para string no formato DD/MM/YYYY (brasileiro)
 */
export function formatDateToBrazilian(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Converte string YYYY-MM-DD para Date (timezone local)
 */
export function parseISODate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Converte string DD/MM/YYYY para Date (timezone local)
 */
export function parseBrazilianDate(dateString: string): Date {
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Converte string DD/MM/YYYY para YYYY-MM-DD
 */
export function convertBrazilianToISO(dateString: string): string {
  const date = parseBrazilianDate(dateString);
  return formatDateToISO(date);
}

/**
 * Converte string YYYY-MM-DD para DD/MM/YYYY
 */
export function convertISOToBrazilian(dateString: string): string {
  const date = parseISODate(dateString);
  return formatDateToBrazilian(date);
}

/**
 * Obtém chave de data consistente (sempre YYYY-MM-DD para processamento interno)
 */
export function getDateKey(dateInput: string | Date): string {
  if (typeof dateInput === 'string') {
    // Se já está no formato YYYY-MM-DD, retorna como está
    if (dateInput.includes('-') && dateInput.length === 10) {
      return dateInput;
    }
    // Se está no formato DD/MM/YYYY, converte para ISO
    if (dateInput.includes('/')) {
      return convertBrazilianToISO(dateInput);
    }
    // Se tem 'T' (ISO completo), extrai apenas a data
    if (dateInput.includes('T')) {
      return dateInput.split('T')[0];
    }
    return dateInput;
  } else {
    return formatDateToISO(dateInput);
  }
}

/**
 * Obtém chave de data para exibição (sempre DD/MM/YYYY)
 */
export function getDisplayDateKey(dateInput: string | Date): string {
  if (typeof dateInput === 'string') {
    // Se está no formato DD/MM/YYYY, retorna como está
    if (dateInput.includes('/')) {
      return dateInput;
    }
    // Se está no formato YYYY-MM-DD, converte para brasileiro
    if (dateInput.includes('-') && dateInput.length === 10) {
      return convertISOToBrazilian(dateInput);
    }
    // Se tem 'T' (ISO completo), extrai e converte
    if (dateInput.includes('T')) {
      const isoDate = dateInput.split('T')[0];
      return convertISOToBrazilian(isoDate);
    }
    return dateInput;
  } else {
    return formatDateToBrazilian(dateInput);
  }
}

/**
 * Verifica se duas datas são o mesmo dia (ignorando horário)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Formata data para exibição no gráfico (DD/MM)
 */
export function formatDateForChart(date: Date): string {
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit' 
  });
}

/**
 * Formata período para exibição (DD/MM - DD/MM)
 */
export function formatPeriodForDisplay(startDate: Date, endDate: Date): string {
  const start = formatDateForChart(startDate);
  const end = formatDateForChart(endDate);
  return `${start} - ${end}`;
}

/**
 * Valida se uma string está no formato YYYY-MM-DD
 */
export function isValidISODate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = parseISODate(dateString);
  return formatDateToISO(date) === dateString;
}

/**
 * Valida se uma string está no formato DD/MM/YYYY
 */
export function isValidBrazilianDate(dateString: string): boolean {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(dateString)) return false;
  
  const date = parseBrazilianDate(dateString);
  return formatDateToBrazilian(date) === dateString;
}
