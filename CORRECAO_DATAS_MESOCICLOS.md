# Correção: Datas dos Mesociclos - Problema Identificado

## Problema Atual

### **❌ Como está funcionando agora:**
- O sistema está criando **1 semana por mesociclo**
- Cada linha na tabela representa **1 semana**
- As datas mostram apenas **1 semana** (ex: "24/08/2025 - 30/08/2025")
- O usuário vê "1 semana" em vez da duração real do mesociclo

### **✅ Como deveria funcionar:**
- Os mesociclos devem ter a **duração real** baseada na quantidade de semanas escolhida
- Se um mesociclo tem 4 semanas, as datas devem cobrir **4 semanas**
- O usuário deve ver "4 semanas" e as datas de início e fim corretas

## Análise do Código

### **Problema na função `generateMesociclos`:**
```typescript
// ❌ PROBLEMA: Está criando 1 semana por linha
const dates = calculateMesocicloDates(selectedMacrociclo.start_date, i, 1); // 1 semana por linha
```

### **Problema na função `calculateMesocicloDates`:**
```typescript
// ❌ PROBLEMA: Parâmetro padrão é 4 semanas, mas está sendo passado 1
const calculateMesocicloDates = (macrocicloStartDate: string, mesocicloNumber: number, weeksPerMesociclo: number = 4)
```

## Solução Necessária

### **1. Modificar a lógica de criação de mesociclos:**
- Permitir que o usuário escolha quantas semanas cada mesociclo deve ter
- Agrupar as semanas em mesociclos de acordo com a duração escolhida
- Calcular as datas corretas para cada mesociclo

### **2. Exemplo de correção:**
```typescript
// ✅ CORREÇÃO: Permitir escolha da duração do mesociclo
const mesocicloDuration = 4; // Usuário escolhe 4 semanas
const dates = calculateMesocicloDates(selectedMacrociclo.start_date, i, mesocicloDuration);
```

### **3. Interface necessária:**
- Campo para escolher quantas semanas cada mesociclo deve ter
- Botão para aplicar a duração aos mesociclos selecionados
- Recalcular as datas automaticamente

## Impacto da Correção

### **Antes da correção:**
- Mesociclo "Base (5)": 1 semana 24/08/2025 - 30/08/2025 ❌

### **Depois da correção:**
- Mesociclo "Base (5)": 4 semanas 24/08/2025 - 20/09/2025 ✅

## Status

- ❌ **PROBLEMA IDENTIFICADO** - Datas incorretas dos mesociclos
- ⏳ **SOLUÇÃO PENDENTE** - Modificação da lógica de criação
- ⏳ **INTERFACE PENDENTE** - Campo para escolher duração dos mesociclos

## Próximos Passos

1. **Modificar `CreateMesocicloModal.tsx`** para permitir escolha da duração
2. **Atualizar `calculateMesocicloDates`** para usar a duração correta
3. **Corrigir `generateMesociclos`** para agrupar semanas adequadamente
4. **Testar** a criação de mesociclos com durações corretas
