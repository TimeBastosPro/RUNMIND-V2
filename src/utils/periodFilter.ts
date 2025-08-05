import { PeriodType } from '../components/ui/PeriodSelector';

export interface DateFilterable {
  date?: string;
  training_date?: string;
  [key: string]: any;
}

export function filterDataByPeriod<T extends DateFilterable>(
  data: T[],
  period: PeriodType,
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
    
    // CORRIGIR: Comparar apenas as datas, não as horas
    const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    const isInRange = itemDateOnly >= startDateOnly && itemDateOnly <= endDateOnly;
    
    return isInRange;
  });
  
  return filteredData;
}

export function getPeriodLabel(period: PeriodType, customStartDate?: Date, customEndDate?: Date): string {
  if (customStartDate && customEndDate) {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    return `${formatDate(customStartDate)} a ${formatDate(customEndDate)}`;
  }
  
  return 'Período personalizado';
} 