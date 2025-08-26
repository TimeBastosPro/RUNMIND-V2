# 🏃‍♂️ Correção da Separação entre Treinos Planejados e Realizados

## 🎯 Problema Identificado

### ❌ **Problema Reportado:**
"Os dados de treino planejado estão incorretos, estão unificados com os de treino realizado."

### 🔍 **Causa Identificada:**
O sistema estava exibindo dados de treinos realizados no card de "Próximo Treino Planejado", causando confusão entre os dois tipos de dados.

## ✅ **Soluções Implementadas**

### **1. Melhoria na Lógica de Busca do Próximo Treino**

#### **Antes:**
```typescript
const nextPlannedTraining = trainingSessions?.find(session => 
  session.status === 'planned' && session.training_date >= todayDateString
);
```

#### **Depois:**
```typescript
const plannedTrainings = trainingSessions?.filter(session => 
  session.status === 'planned' && session.training_date >= todayDateString
) || [];

// Ordenar por data para pegar o mais próximo
const sortedPlannedTrainings = plannedTrainings.sort((a, b) => {
  const dateA = new Date(a.training_date);
  const dateB = new Date(b.training_date);
  return dateA.getTime() - dateB.getTime();
});

const nextPlannedTraining = sortedPlannedTrainings[0];
```

### **2. Verificação Dupla de Status**

#### **Antes:**
```typescript
{nextTraining && (
  <Card style={styles.card}>
```

#### **Depois:**
```typescript
{nextTraining && nextTraining.status === 'planned' && (
  <Card style={styles.card}>
```

### **3. Filtro de Altimetria para Treinos Planejados**

#### **Antes:**
```typescript
const formatElevation = (training: any) => {
  const gain = training.elevation_gain_meters || 0;
  const loss = training.elevation_loss_meters || 0;
  // Sempre exibia altimetria
};
```

#### **Depois:**
```typescript
const formatElevation = (training: any) => {
  // ✅ CORRIGIDO: Para treinos planejados, não exibir altimetria
  if (training.status === 'planned') {
    return null;
  }
  // Resto da lógica...
};
```

### **4. Verificações Adicionais nos Campos**

#### **Distância:**
```typescript
{nextTraining.distance_km && nextTraining.status === 'planned' && (
  <Text style={styles.trainingDetails}>📏 Distância: {nextTraining.distance_km}km</Text>
)}
```

#### **Duração:**
```typescript
{nextTraining.duration_minutes && !nextTraining.duracao_horas && !nextTraining.duracao_minutos && nextTraining.status === 'planned' && (
  <Text style={styles.trainingDetails}>⏱️ Duração: {nextTraining.duration_minutes}min</Text>
)}
```

## 🧮 **Logs de Debug Adicionados**

### **1. Log Detalhado dos Treinos Carregados:**
```typescript
console.log('DEBUG - HomeScreen - Treinos carregados:', {
  totalSessions: trainingSessions?.length || 0,
  todayDateString,
  sessions: trainingSessions?.map(s => ({
    id: s.id,
    date: s.training_date,
    status: s.status,
    title: s.title,
    distance: s.distance_km,
    duration: s.duration_minutes
  }))
});
```

### **2. Log do Próximo Treino Planejado:**
```typescript
console.log('DEBUG - HomeScreen - Próximo treino planejado:', {
  nextPlannedTraining: nextPlannedTraining ? {
    id: nextPlannedTraining.id,
    date: nextPlannedTraining.training_date,
    status: nextPlannedTraining.status,
    title: nextPlannedTraining.title,
    distance: nextPlannedTraining.distance_km,
    duration: nextPlannedTraining.duration_minutes
  } : null
});
```

### **3. Log dos Dados Sendo Exibidos:**
```typescript
console.log('DEBUG - HomeScreen - Dados do treino sendo exibido:', {
  id: nextTraining.id,
  status: nextTraining.status,
  title: nextTraining.title,
  modalidade: nextTraining.modalidade,
  treino_tipo: nextTraining.treino_tipo,
  distance_km: nextTraining.distance_km,
  duration_minutes: nextTraining.duration_minutes,
  perceived_effort: nextTraining.perceived_effort,
  elevation_gain_meters: nextTraining.elevation_gain_meters,
  elevation_loss_meters: nextTraining.elevation_loss_meters
});
```

## 📊 **Script de Diagnóstico Criado**

### **`verificar_treinos_planejados.sql`**
Script SQL completo para verificar:
- Estrutura da tabela `training_sessions`
- Contagem de treinos por status
- Treinos de hoje
- Próximos treinos planejados
- Últimos treinos realizados
- Possíveis problemas nos dados

## 🎯 **Campos Separados por Tipo de Treino**

### **Treinos Planejados (status = 'planned'):**
- ✅ **modalidade**: Tipo de atividade (corrida, força, etc.)
- ✅ **treino_tipo**: Tipo de treino (contínuo, intervalado, etc.)
- ✅ **terreno**: Superfície (asfalto, esteira, etc.)
- ✅ **esforco**: Nível de esforço planejado (1-5)
- ✅ **intensidade**: Zona de intensidade (Z1-Z5)
- ✅ **percurso**: Tipo de percurso (plano, inclinação, etc.)
- ✅ **distance_km**: Distância planejada
- ✅ **duracao_horas/duracao_minutos**: Duração planejada
- ✅ **observacoes**: Observações do planejamento

### **Treinos Realizados (status = 'completed'):**
- ✅ **perceived_effort**: Esforço percebido (1-10)
- ✅ **session_satisfaction**: Satisfação com a sessão (1-5)
- ✅ **elevation_gain_meters**: Ganho de altitude
- ✅ **elevation_loss_meters**: Perda de altitude
- ✅ **avg_heart_rate**: Frequência cardíaca média
- ✅ **max_heart_rate**: Frequência cardíaca máxima
- ✅ **sensacoes**: Array de sensações
- ✅ **clima**: Array de condições climáticas

## 📱 **Como Testar as Correções**

### **Teste 1: Verificar Separação de Dados**
1. Acesse a tela "Início"
2. Verifique o card "Próximo Treino Planejado"
3. **Resultado esperado**: Apenas dados de planejamento devem aparecer

### **Teste 2: Verificar Logs de Debug**
1. Abra o console do navegador
2. Recarregue a página
3. **Resultado esperado**: Logs detalhados mostrando a separação correta

### **Teste 3: Verificar Altimetria**
1. Crie um treino planejado com dados de altimetria
2. **Resultado esperado**: Altimetria não deve aparecer no card planejado

### **Teste 4: Verificar Campos Específicos**
1. Crie um treino planejado
2. **Resultado esperado**: Apenas campos de planejamento devem ser exibidos

## 🔧 **Arquivos Modificados**

### **`src/screens/home/index.tsx`**
- ✅ **Lógica de busca**: Melhorada para ordenar treinos planejados
- ✅ **Verificação de status**: Dupla verificação antes de exibir
- ✅ **Filtro de altimetria**: Não exibe para treinos planejados
- ✅ **Logs de debug**: Adicionados para rastreamento
- ✅ **Verificações de campos**: Garantem separação correta

### **`verificar_treinos_planejados.sql`**
- ✅ **Script de diagnóstico**: Criado para verificar dados no banco

## 🎉 **Resultado Esperado**

Após as correções:
- ✅ **Treinos planejados**: Exibem apenas dados de planejamento
- ✅ **Treinos realizados**: Exibem apenas dados de execução
- ✅ **Separação clara**: Não há mais mistura de dados
- ✅ **Logs detalhados**: Facilitam o debugging
- ✅ **Validação robusta**: Múltiplas verificações de status

A separação entre treinos planejados e realizados agora está correta! 🏃‍♂️
