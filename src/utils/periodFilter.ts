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
  console.log('🔍 filterDataByPeriod - data recebida:', data);
  console.log('🔍 filterDataByPeriod - period:', period);
  console.log('🔍 filterDataByPeriod - customStartDate:', customStartDate);
  console.log('🔍 filterDataByPeriod - customEndDate:', customEndDate);

  if (!data || data.length === 0) {
    console.log('🔍 filterDataByPeriod - dados vazios, retornando array vazio');
    return [];
  }

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

  // Normalizar as datas para início e fim do dia
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  console.log('🔍 filterDataByPeriod - startDate final:', startDate);
  console.log('🔍 filterDataByPeriod - endDate final:', endDate);

  const filteredData = data.filter(item => {
    const dateString = item.date || item.training_date;
    if (!dateString) {
      console.log('🔍 filterDataByPeriod - item sem data:', item);
      return false;
    }
    
    const itemDate = new Date(dateString);
    if (isNaN(itemDate.getTime())) {
      console.log('🔍 filterDataByPeriod - data inválida:', dateString);
      return false;
    }
    
    // Normalizar a data do item para início do dia
    itemDate.setHours(0, 0, 0, 0);
    
    const isInRange = itemDate >= startDate && itemDate <= endDate;
    console.log('🔍 filterDataByPeriod - item:', item, 'itemDate:', itemDate, 'isInRange:', isInRange);
    return isInRange;
  });

  console.log('🔍 filterDataByPeriod - dados filtrados:', filteredData);
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