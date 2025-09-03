import { PeriodType } from '../components/ui/PeriodSelector';

// Estender o tipo para incluir week e month
export type ExtendedPeriodType = PeriodType | 'week' | 'month';

export interface DateFilterable {
  date?: string;
  training_date?: string;
  [key: string]: any;
}

export function filterDataByPeriod<T extends DateFilterable>(
  data: T[],
  period: ExtendedPeriodType,
  customStartDate?: Date,
  customEndDate?: Date
): T[] {
  if (!data || data.length === 0) {
    return [];
  }

  // Para o novo sistema, sempre usar datas customizadas
  let startDate: Date;
  let endDate: Date;

  if (customStartDate && customEndDate) {
    // CORRIGIR: Não normalizar as datas aqui, usar exatamente as datas fornecidas
    startDate = new Date(customStartDate);
    endDate = new Date(customEndDate);
  } else {
    // Datas padrão: 5 semanas antes e 5 semanas depois da semana atual
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Início da semana atual (domingo)
    
    endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + (5 * 7) + 6); // 5 semanas depois (incluindo o domingo)
    
    startDate = new Date(currentWeekStart);
    startDate.setDate(currentWeekStart.getDate() - (5 * 7)); // 5 semanas antes
  }

  const filteredData = data.filter(item => {
    const dateString = item.date || item.training_date;
    if (!dateString) {
      return false;
    }
    
    const itemDate = new Date(dateString);
    if (isNaN(itemDate.getTime())) {
      return false;
    }
    
    // ✅ CORREÇÃO: Normalizar datas para comparação segura
    const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // ✅ CORREÇÃO: Comparar usando getTime() para evitar problemas de timezone
    const isInRange = itemDateOnly.getTime() >= startDateOnly.getTime() && 
                     itemDateOnly.getTime() <= endDateOnly.getTime();
    
    // ✅ DEBUG: Log para verificar filtragem
    if (dateString === '2025-09-01') {
      console.log('🔍 DEBUG - Filtragem do dia 01/09:', {
        dateString,
        itemDateOnly: itemDateOnly.toISOString().split('T')[0],
        startDateOnly: startDateOnly.toISOString().split('T')[0],
        endDateOnly: endDateOnly.toISOString().split('T')[0],
        isInRange,
        itemTime: itemDateOnly.getTime(),
        startTime: startDateOnly.getTime(),
        endTime: endDateOnly.getTime()
      });
    }
    
    return isInRange;
  });
  
  return filteredData;
}

export function getPeriodLabel(period: ExtendedPeriodType, customStartDate?: Date, customEndDate?: Date): string {
  if (customStartDate && customEndDate) {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    return `${formatDate(customStartDate)} a ${formatDate(customEndDate)}`;
  }
  
  return 'Período personalizado';
}

/**
 * Navega para o período anterior ou posterior
 * @param currentDate Data atual do período
 * @param periodType Tipo do período ('week' ou 'month')
 * @param direction Direção da navegação ('prev' ou 'next')
 * @returns Nova data após navegação
 */
export function navigatePeriod(currentDate: Date, periodType: 'week' | 'month', direction: 'prev' | 'next'): Date {
  const newDate = new Date(currentDate);
  
  if (periodType === 'week') {
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
  } else {
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
  }
  
  return newDate;
} 