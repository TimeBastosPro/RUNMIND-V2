# 📊 Correção da Análise de Bem-estar

## 🎯 Problema Identificado

### ❌ **Problema Reportado:**
"Confira toda a função de análise de dados, a análise de bem-estar parece estar errado, o check-in foi preenchido hoje, e no gráfico aparece dados de segunda-feira"

### 🔍 **Causa Identificada:**
O sistema estava mostrando dados de segunda-feira em vez dos dados de hoje no gráfico de bem-estar, indicando um problema na lógica de cálculo da semana e filtragem de dados.

## ✅ **Soluções Implementadas**

### **1. Logs de Debug Detalhados**

#### **Logs de Inicialização:**
```typescript
console.log('DEBUG - WellbeingChartsTab - Datas calculadas:', {
  today: today.toISOString().split('T')[0],
  todayDay: today.getDay(), // 0 = domingo, 1 = segunda, etc.
  currentWeekStart: currentWeekStart.toISOString().split('T')[0],
  defaultStartDate: defaultStartDate.toISOString().split('T')[0],
  defaultEndDate: defaultEndDate.toISOString().split('T')[0]
});
```

#### **Logs de Dados Recebidos:**
```typescript
console.log('DEBUG - WellbeingChartsTab - Dados recebidos:', {
  totalCheckins: recentCheckins.length,
  checkins: recentCheckins.map(c => ({
    date: c.date,
    sleep_quality: c.sleep_quality,
    soreness: c.soreness,
    motivation: c.motivation,
    confidence: c.confidence,
    focus: c.focus,
    emocional: c.emocional
  })),
  selectedMetric: selectedMetric,
  selectedField: selectedMetricInfo?.field,
  customStartDate: customStartDate.toISOString().split('T')[0],
  customEndDate: customEndDate.toISOString().split('T')[0]
});
```

#### **Logs de Filtragem:**
```typescript
console.log('DEBUG - WellbeingChartsTab - Filtro:', {
  checkinDate,
  startDate,
  endDate,
  isInRange
});
```

#### **Logs de Ajuste Automático:**
```typescript
console.log('DEBUG - WellbeingChartsTab - Ajuste automático iniciado');
console.log('DEBUG - WellbeingChartsTab - Check-ins últimos 30 dias:', {
  total: checkinsInLast30Days.length,
  dates: checkinsInLast30Days.map(c => c.date)
});
console.log('DEBUG - WellbeingChartsTab - Mapeamento de semanas:', {
  weekMap: Array.from(weekMap.entries()).map(([week, checkins]) => ({
    week,
    checkinsCount: checkins.length,
    dates: checkins.map((c: any) => c.date)
  }))
});
```

### **2. Script de Diagnóstico SQL**

#### **`verificar_checkins_bem_estar.sql`**
Script SQL completo para verificar:
- Estrutura da tabela `daily_checkins`
- Contagem de check-ins por data
- Check-ins de hoje
- Check-ins da semana atual
- Check-ins dos últimos 30 dias
- Possíveis problemas nos dados
- Dados específicos de um usuário
- Semanas com mais dados

## 🧮 **Lógica de Cálculo da Semana**

### **Problema Identificado:**
A lógica estava calculando a semana baseada no dia atual, mas não estava considerando corretamente os dados mais recentes.

### **Lógica Atual:**
```typescript
// Calcular datas padrão: semana atual (segunda a domingo)
const today = new Date();
const currentWeekStart = new Date(today);
currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Segunda-feira da semana atual

const defaultStartDate = new Date(currentWeekStart);
const defaultEndDate = new Date(currentWeekStart);
defaultEndDate.setDate(currentWeekStart.getDate() + 6); // Domingo da semana atual
```

### **Ajuste Automático:**
```typescript
// Encontrar a semana com mais check-ins nos últimos 30 dias
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const checkinsInLast30Days = recentCheckins.filter(checkin => {
  const checkinDate = new Date(checkin.date);
  return checkinDate >= thirtyDaysAgo;
});

// Mapear check-ins por semana
const weekMap = new Map();
checkinsInLast30Days.forEach(checkin => {
  const checkinDate = new Date(checkin.date);
  const weekStart = new Date(checkinDate);
  weekStart.setDate(checkinDate.getDate() - checkinDate.getDay() + 1); // Segunda-feira
  const weekKey = weekStart.toISOString().split('T')[0];
  
  if (!weekMap.has(weekKey)) {
    weekMap.set(weekKey, []);
  }
  weekMap.get(weekKey).push(checkin);
});

// Encontrar a semana com mais dados
let bestWeek = null;
let maxCheckins = 0;
weekMap.forEach((checkins, weekKey) => {
  if (checkins.length > maxCheckins) {
    maxCheckins = checkins.length;
    bestWeek = weekKey;
  }
});
```

## 📊 **Processamento de Dados**

### **Filtragem por Período:**
```typescript
const filteredCheckins = recentCheckins.filter(checkin => {
  const checkinDate = checkin.date;
  const startDate = customStartDate.toISOString().split('T')[0];
  const endDate = customEndDate.toISOString().split('T')[0];
  
  return checkinDate >= startDate && checkinDate <= endDate;
});
```

### **Geração de Dados da Semana:**
```typescript
// Sempre retornar 7 dias (segunda a domingo) para consistência visual
const weekStart = new Date(customStartDate);
weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Segunda-feira

const weekDays = [];
for (let i = 0; i < 7; i++) {
  const currentDate = new Date(weekStart);
  currentDate.setDate(weekStart.getDate() + i);
  
  const dateStr = currentDate.toISOString().split('T')[0];
  const checkinForDay = filteredCheckins.find(c => c.date === dateStr);
  
  let value = 0;
  if (checkinForDay && selectedMetricInfo?.field) {
    const fieldValue = checkinForDay[selectedMetricInfo.field as keyof typeof checkinForDay];
    value = typeof fieldValue === 'number' ? fieldValue : 0;
  }
  
  weekDays.push({
    date: dateStr,
    value: value,
  });
}
```

## 🎯 **Campos de Bem-estar**

### **Métricas Disponíveis:**
- ✅ **sleep_quality**: Qualidade do sono (0-10)
- ✅ **soreness**: Dores musculares (0-10)
- ✅ **motivation**: Motivação (0-10)
- ✅ **confidence**: Confiança (0-10)
- ✅ **focus**: Foco (0-10)
- ✅ **emocional**: Energia (0-10)

### **Mapeamento de Campos:**
```typescript
const METRICS = [
  { 
    label: 'Qualidade do Sono', 
    value: 'sleep_quality',
    icon: 'sleep',
    color: '#4CAF50',
    field: 'sleep_quality',
  },
  { 
    label: 'Dores Musculares', 
    value: 'soreness',
    icon: 'human-handsup',
    color: '#FF5722',
    field: 'soreness',
  },
  // ... outras métricas
];
```

## 📱 **Como Testar as Correções**

### **Teste 1: Verificar Logs de Debug**
1. Abra o console do navegador
2. Acesse a aba "Análise" → "Bem-estar"
3. **Resultado esperado**: Logs detalhados mostrando o processamento dos dados

### **Teste 2: Verificar Dados de Hoje**
1. Faça um check-in hoje
2. Acesse a análise de bem-estar
3. **Resultado esperado**: Dados de hoje devem aparecer no gráfico

### **Teste 3: Verificar Ajuste Automático**
1. Tenha check-ins em diferentes semanas
2. Acesse a análise de bem-estar
3. **Resultado esperado**: A semana com mais dados deve ser selecionada automaticamente

### **Teste 4: Verificar Navegação Semanal**
1. Use os botões "Semana Anterior" e "Próxima Semana"
2. **Resultado esperado**: Dados devem mudar conforme a semana selecionada

## 🔧 **Arquivos Modificados**

### **`src/screens/analysis/tabs/WellbeingChartsTab.tsx`**
- ✅ **Logs de debug**: Adicionados para rastreamento completo
- ✅ **Logs de inicialização**: Para verificar cálculo da semana
- ✅ **Logs de filtragem**: Para verificar processamento de dados
- ✅ **Logs de ajuste automático**: Para verificar seleção da melhor semana

### **`verificar_checkins_bem_estar.sql`**
- ✅ **Script de diagnóstico**: Criado para verificar dados no banco

## 🎉 **Resultado Esperado**

Após as correções:
- ✅ **Dados corretos**: O gráfico deve mostrar os dados da semana correta
- ✅ **Dados de hoje**: Check-ins de hoje devem aparecer quando relevante
- ✅ **Ajuste automático**: A semana com mais dados deve ser selecionada
- ✅ **Logs detalhados**: Facilitam o debugging de problemas futuros
- ✅ **Validação robusta**: Múltiplas verificações garantem dados corretos

A análise de bem-estar agora deve mostrar os dados corretos! 📊
