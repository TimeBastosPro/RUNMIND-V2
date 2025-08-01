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
  if (!data || data.length === 0) return [];

  // Para o novo sistema, sempre usar datas customizadas
  let startDate: Date;
  let endDate: Date;

  if (customStartDate && customEndDate) {
    startDate = customStartDate;
    endDate = customEndDate;
  } else {
    // Datas padrão: últimos 30 dias
    endDate = new Date();
    startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return data.filter(item => {
    const itemDate = new Date(item.date || item.training_date || '');
    return itemDate >= startDate && itemDate <= endDate;
  });
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