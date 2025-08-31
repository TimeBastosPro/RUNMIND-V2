// Utilitários para padronização de cálculo de semanas
// Semana sempre começa na segunda-feira e termina no domingo

import { formatDateToISO, formatDateToBrazilian } from './dateUtils';

/**
 * Calcula o início da semana (segunda-feira) para uma data específica
 * @param date Data de referência
 * @returns Data do início da semana (segunda-feira às 00:00:00)
 */
export function getWeekStart(date: Date): Date {
  // ✅ CORREÇÃO: Criar data local para evitar problemas de timezone
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = weekStart.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
  
  // Calcular dias para voltar até segunda-feira
  let daysToMonday: number;
  if (dayOfWeek === 0) { // Domingo
    daysToMonday = 6; // Voltar 6 dias para chegar na segunda
  } else {
    daysToMonday = dayOfWeek - 1; // Voltar (dia da semana - 1) dias
  }
  
  weekStart.setDate(weekStart.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  console.log('🔧 DEBUG - getWeekStart:', {
    inputDate: formatDateToISO(date),
    dayOfWeek: dayOfWeek,
    dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek],
    daysToMonday: daysToMonday,
    weekStart: formatDateToISO(weekStart)
  });
  
  return weekStart;
}

/**
 * Calcula o fim da semana (domingo) para uma data específica
 * @param date Data de referência
 * @returns Data do fim da semana (domingo às 23:59:59)
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  
  // ✅ SOLUÇÃO DEFINITIVA: Calcular domingo usando UTC para evitar problemas de timezone
  const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000)); // Adicionar 6 dias em milissegundos
  weekEnd.setHours(23, 59, 59, 999);
  
  // ✅ VERIFICAÇÃO: Garantir que o resultado é realmente domingo
  const dayOfWeek = weekEnd.getDay();
  if (dayOfWeek !== 0) {
    console.error('❌ ERRO CRÍTICO: getWeekEnd não retornou domingo!', {
      inputDate: formatDateToISO(date),
      weekStart: formatDateToISO(weekStart),
      weekEnd: formatDateToISO(weekEnd),
      dayOfWeek: dayOfWeek,
      dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek]
    });
    
    // ✅ CORREÇÃO DE EMERGÊNCIA: Forçar domingo usando cálculo direto
    const correctedWeekEnd = new Date(weekStart);
    correctedWeekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    correctedWeekEnd.setHours(23, 59, 59, 999);
    
    console.log('🔧 CORREÇÃO APLICADA:', {
      originalWeekEnd: formatDateToISO(weekEnd),
      correctedWeekEnd: formatDateToISO(correctedWeekEnd),
      correctedDayOfWeek: correctedWeekEnd.getDay()
    });
    
    return correctedWeekEnd;
  }
  
  console.log('🔧 DEBUG - getWeekEnd DEFINITIVO:', {
    inputDate: formatDateToISO(date),
    weekStart: formatDateToISO(weekStart),
    weekEnd: formatDateToISO(weekEnd),
    dayOfWeek: dayOfWeek,
    dayName: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek],
    daysDifference: Math.floor((weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24))
  });
  
  return weekEnd;
}

/**
 * Calcula o período da semana (segunda a domingo) para uma data específica
 * @param date Data de referência
 * @returns Objeto com startDate e endDate da semana
 */
export function getWeekPeriod(date: Date): { startDate: Date; endDate: Date } {
  return {
    startDate: getWeekStart(date),
    endDate: getWeekEnd(date)
  };
}

/**
 * Verifica se uma data está dentro de uma semana específica
 * @param date Data a ser verificada
 * @param weekStart Início da semana (segunda-feira)
 * @returns true se a data está na semana
 */
export function isDateInWeek(date: Date, weekStart: Date): boolean {
  const weekEnd = getWeekEnd(weekStart);
  return date >= weekStart && date <= weekEnd;
}

/**
 * Navega para a semana anterior ou próxima
 * @param currentDate Data atual
 * @param direction 'prev' para semana anterior, 'next' para próxima semana
 * @returns Nova data após navegação
 */
export function navigateWeek(currentDate: Date, direction: 'prev' | 'next'): Date {
  const newDate = new Date(currentDate);
  const daysToAdd = direction === 'next' ? 7 : -7;
  newDate.setDate(newDate.getDate() + daysToAdd);
  return newDate;
}

/**
 * Formata o período da semana para exibição
 * @param startDate Data de início da semana
 * @param endDate Data de fim da semana
 * @returns String formatada (ex: "25/08 - 31/08")
 */
export function formatWeekPeriod(startDate: Date, endDate: Date): string {
  const formatDate = (date: Date) => {
    return formatDateToBrazilian(date).substring(0, 5); // DD/MM
  };
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * Gera todas as datas de uma semana (segunda a domingo)
 * @param weekStart Data de início da semana (segunda-feira)
 * @returns Array com as 7 datas da semana
 */
export function generateWeekDates(weekStart: Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(weekStart);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

/**
 * Converte uma data para string no formato YYYY-MM-DD
 * @param date Data a ser convertida
 * @returns String no formato YYYY-MM-DD
 */
export function dateToISOString(date: Date): string {
  return formatDateToISO(date);
}

/**
 * Converte uma string YYYY-MM-DD para Date
 * @param dateString String no formato YYYY-MM-DD
 * @returns Objeto Date
 */
export function isoStringToDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z');
}
