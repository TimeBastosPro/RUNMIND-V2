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

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '180d':
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case '365d':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      if (customStartDate && customEndDate) {
        return data.filter(item => {
          const itemDate = new Date(item.date || item.training_date || '');
          return itemDate >= customStartDate && itemDate <= customEndDate;
        });
      }
      // Se não há datas customizadas, usar 30 dias como padrão
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return data.filter(item => {
    const itemDate = new Date(item.date || item.training_date || '');
    return itemDate >= startDate && itemDate <= now;
  });
}

export function getPeriodLabel(period: PeriodType): string {
  switch (period) {
    case '7d':
      return 'Últimos 7 dias';
    case '30d':
      return 'Últimos 30 dias';
    case '90d':
      return 'Últimos 90 dias';
    case '180d':
      return 'Últimos 180 dias';
    case '365d':
      return 'Último ano';
    case 'custom':
      return 'Período personalizado';
    default:
      return 'Últimos 30 dias';
  }
} 