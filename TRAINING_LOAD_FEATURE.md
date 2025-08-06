# 🏃‍♂️ Monitoramento de Carga de Treino e Risco de Lesão

## 📋 Visão Geral

Esta funcionalidade implementa o **ACWR (Acute:Chronic Workload Ratio)**, um indicador cientificamente validado para prever o risco de lesões em atletas. O sistema calcula automaticamente a carga de treino baseada na duração e intensidade (PSE) de cada sessão.

## 🎯 Benefícios para o Usuário

### ✅ **Empoderamento Visual**
- Gráficos claros mostrando a zona de risco atual
- Indicadores visuais de tendências (aumentando/diminuindo)
- Barra de progresso do risco de lesão

### ✅ **Decisões Inteligentes**
- Alertas específicos sobre carga de treino
- Recomendações personalizadas baseadas no ACWR
- Prevenção proativa de lesões

### ✅ **Monitoramento Científico**
- Métricas baseadas em evidências científicas
- Comparação entre carga aguda (7 dias) e crônica (28 dias)
- Análise de tendências ao longo do tempo

## 🔬 Base Científica

### **ACWR (Acute:Chronic Workload Ratio)**
- **Fórmula**: ACWR = Carga Aguda (7 dias) / Carga Crônica (28 dias)
- **Carga**: Duração (min) × Intensidade (PSE 1-10)

### **Zonas de Risco**
- **< 0.8**: Zona de Destreino (risco de perda de condicionamento)
- **0.8 - 1.3**: Zona de Segurança (ideal para progressão)
- **1.3 - 1.5**: Zona de Risco (aumento moderado do risco de lesão)
- **> 1.5**: Zona de Alto Risco (risco significativo de lesão)

## 🛠️ Implementação Técnica

### **Arquivos Criados/Modificados**

#### 1. **Cálculos Esportivos** (`src/utils/sportsCalculations.ts`)
```typescript
// Funções principais implementadas:
- calculateWorkload(duration, intensity)
- calculateAcuteLoad(sessions)
- calculateChronicLoad(sessions)
- calculateACWR(acuteLoad, chronicLoad)
- determineRiskZone(acwr)
- calculateRiskPercentage(acwr)
- determineTrend(sessions)
- generateRecommendations(acwr, riskZone, trend)
- calculateWorkloadMetrics(sessions)
- calculateDailyWorkloads(sessions)
- calculateWeeklyWorkloads(sessions)
```

#### 2. **Interface de Usuário** (`src/screens/analysis/tabs/TrainingLoadTab.tsx`)
- Card principal com ACWR e zona de risco
- Métricas detalhadas (carga aguda, crônica, tendência)
- Recomendações personalizadas
- Gráficos de carga diária e semanal
- Informações educativas sobre ACWR

#### 3. **Navegação** (`src/screens/analysis/ComparativeChartsScreen.tsx`)
- Nova aba "Carga de Treino" adicionada
- Navegação com scroll horizontal para acomodar mais abas

### **Integração com Dados Existentes**
- Utiliza dados de `trainingSessions` do store
- Campos necessários: `training_date`, `duration_minutes`, `perceived_exertion`
- Compatível com estrutura atual do banco de dados

## 📊 Interface do Usuário

### **Card Principal - ACWR**
- Valor do ACWR em destaque
- Chip colorido indicando a zona de risco
- Barra de progresso do risco de lesão (quando aplicável)

### **Métricas Detalhadas**
- Carga Aguda (7 dias)
- Carga Crônica (28 dias)
- Tendência com ícones visuais

### **Recomendações**
- Lista de recomendações baseadas no ACWR
- Ícones de lâmpada para destacar dicas
- Linguagem clara e acionável

### **Gráficos**
- **Carga Diária**: Linha temporal dos últimos 7 dias
- **Carga Semanal**: Barras das últimas 4 semanas
- Cores consistentes com as zonas de risco

### **Educação**
- Explicação sobre o que é ACWR
- Tabela de referência das zonas de risco
- Contexto científico para o usuário

## 🎨 Design e UX

### **Cores e Indicadores**
- **Verde** (#4CAF50): Zona de segurança
- **Laranja** (#FF9800): Zona de destreino
- **Vermelho** (#FF5722): Zona de risco
- **Vermelho Escuro** (#D32F2F): Zona de alto risco

### **Ícones e Símbolos**
- 🛡️ Escudo para monitoramento de carga
- 📈📉 Tendências (aumentando/diminuindo)
- 💡 Lâmpada para recomendações
- ⚠️ Alertas para zonas de risco

### **Responsividade**
- Layout adaptável para diferentes tamanhos de tela
- Gráficos responsivos
- Cards com espaçamento adequado

## 🔄 Fluxo de Dados

```
1. Usuário acessa aba "Carga de Treino"
2. Sistema carrega trainingSessions do store
3. Cálculos são executados automaticamente:
   - Carga aguda (7 dias)
   - Carga crônica (28 dias)
   - ACWR
   - Zona de risco
   - Tendência
   - Recomendações
4. Interface é atualizada com métricas e gráficos
5. Usuário vê feedback visual imediato
```

## 🚀 Próximos Passos

### **Melhorias Futuras**
1. **Alertas Push**: Notificações quando entrar em zona de risco
2. **Histórico**: Gráfico de evolução do ACWR ao longo do tempo
3. **Personalização**: Ajuste de zonas baseado no perfil do atleta
4. **Integração**: Sincronização com dispositivos wearables
5. **Relatórios**: Exportação de relatórios de carga de treino

### **Otimizações**
1. **Performance**: Cache de cálculos para melhor performance
2. **Offline**: Funcionalidade offline com dados locais
3. **Backup**: Sincronização automática de dados

## 📚 Referências Científicas

- **ACWR**: Blanch & Gabbett (2016) - "Has the athlete trained enough to return to play safely?"
- **Zonas de Risco**: Hulin et al. (2014) - "The acute:chronic workload ratio predicts injury"
- **PSE**: Borg (1982) - "Psychophysical bases of perceived exertion"

## 🎯 Impacto na UX

### **Antes**
- Usuário recebia insights genéricos de texto
- Sem indicadores visuais de risco
- Decisões baseadas em intuição

### **Depois**
- Feedback visual claro e imediato
- Métricas científicas quantificáveis
- Recomendações específicas e acionáveis
- Empoderamento para decisões informadas

---

**Resultado**: Uma ferramenta poderosa que transforma dados de treino em insights acionáveis, ajudando atletas a treinar de forma mais inteligente e segura! 🏆 