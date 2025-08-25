# 🔧 CONFIGURAÇÃO MANUAL DAS EDGE FUNCTIONS

## 📋 PASSO 1: CRIAR EDGE FUNCTION NO DASHBOARD

### 1.1 Acessar Edge Functions
1. No Supabase Dashboard, clique em **Edge Functions** no menu lateral
2. Clique em **Create a new function**

### 1.2 Criar Function: generate-daily-readiness-insight-v2
1. **Function name:** `generate-daily-readiness-insight-v2`
2. **Import method:** Copy and paste
3. Cole o código abaixo:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }) }

  try {
    const { athleteData } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const prompt = `
      Você é um treinador de corrida especialista em fisiologia e psicologia do esporte. Sua missão é gerar um insight de prontidão para o atleta hoje, baseado nos dados a seguir.

      **Dados Psicológicos (Check-in de Hoje):**
      - Sono: ${athleteData.todayCheckin.sleep_quality}/7
      - Dores: ${athleteData.todayCheckin.soreness}/7
      - Motivação: ${athleteData.todayCheckin.motivation}/5

      **Dados Fisiológicos (Métricas de Carga):**
      - Fitness (Condicionamento): ${athleteData.workloadMetrics?.fitness_ctl.toFixed(0)}
      - Fadiga (Cansaço): ${athleteData.workloadMetrics?.fatigue_atl.toFixed(0)}
      - Forma (Prontidão): ${athleteData.workloadMetrics?.form_tsb.toFixed(0)}

      **Treino Planejado para Hoje:**
      - ${athleteData.plannedWorkout ? `${athleteData.plannedWorkout.description}` : 'Dia de descanso.'}

      **Sua Tarefa:**
      Gere um insight de 2-3 frases, em português brasileiro, que conecte o estado psicológico do atleta com seus dados fisiológicos.
      1. **Valide o sentimento do atleta:** Use a métrica de "Forma (TSB)" para explicar por que ele se sente de determinada maneira.
      2. **Dê uma orientação clara para o dia:** Com base em todos os dados, dê um conselho prático.
      3. **Se a Forma for positiva (> 5):** Encoraje o atleta a aproveitar o bom momento.

      Seja empático e educativo. Responda apenas com o texto do insight.
    `.trim();

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const geminiJson = await geminiRes.json();
    const insightText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (insightText) {
        await supabase.from('insights').insert({
            user_id: user.id,
            insight_text: insightText,
            insight_type: 'ai_analysis',
            context_type: 'daily_checkin',
            confidence_score: 0.95
        });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});
```

4. Clique em **Create function**

### 1.3 Criar Function: generate-training-assimilation-insight-v2
1. **Function name:** `generate-training-assimilation-insight-v2`
2. Cole o código:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }) }

  try {
    const { athleteData } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const prompt = `
      Você é um analista de performance esportiva. Analise o treino recém-completado e gere um insight de assimilação.

      **Treino Completado:**
      - Modalidade: ${athleteData.completedTraining.modalidade}
      - Duração: ${athleteData.completedTraining.duration_minutes} minutos
      - Esforço Percebido: ${athleteData.completedTraining.perceived_effort}/10
      - Satisfação: ${athleteData.completedTraining.session_satisfaction}/10
      - Distância: ${athleteData.completedTraining.distance_km}km

      **Perfil do Atleta:**
      - Objetivo: ${athleteData.profile?.training_goal}
      - Nível: ${athleteData.profile?.experience_level}

      **Sua Tarefa:**
      Gere um insight de 2-3 frases sobre como o atleta assimilou este treino específico. 
      Conecte a performance real com o objetivo de treinamento.
      Seja específico sobre o que funcionou bem e o que pode ser melhorado.

      Responda apenas com o texto do insight.
    `.trim();

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const geminiJson = await geminiRes.json();
    const insightText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (insightText) {
        await supabase.from('insights').insert({
            user_id: user.id,
            insight_text: insightText,
            insight_type: 'ai_analysis',
            context_type: 'training_assimilation',
            confidence_score: 0.90
        });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});
```

### 1.4 Criar Function: generate-weekly-summary-insight-v2
1. **Function name:** `generate-weekly-summary-insight-v2`
2. Cole o código:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }) }

  try {
    const { athleteData } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const prompt = `
      Você é um Head Coach experiente. Analise a semana de treinamento e gere um resumo estratégico.

      **Reflexão Semanal do Atleta:**
      - Satisfação: ${athleteData.weeklyReflection.enjoyment}/10
      - Progresso: ${athleteData.weeklyReflection.progress}
      - Confiança: ${athleteData.weeklyReflection.confidence}

      **Dados da Semana:**
      - Treinos completados: ${athleteData.sessions?.length || 0}
      - Check-ins realizados: ${athleteData.checkins?.length || 0}

      **Sua Tarefa:**
      Gere um insight de 3-4 frases que:
      1. Valide o sentimento do atleta sobre a semana
      2. Identifique padrões positivos e áreas de melhoria
      3. Dê orientação estratégica para a próxima semana
      4. Mantenha o atleta motivado e focado no objetivo

      Seja estratégico e motivacional. Responda apenas com o texto do insight.
    `.trim();

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const geminiJson = await geminiRes.json();
    const insightText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (insightText) {
        await supabase.from('insights').insert({
            user_id: user.id,
            insight_text: insightText,
            insight_type: 'ai_analysis',
            context_type: 'weekly_summary',
            confidence_score: 0.85
        });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});
```

## 📋 PASSO 2: CONFIGURAR VARIÁVEIS DE AMBIENTE

### 2.1 Acessar Settings das Edge Functions
1. No menu lateral, clique em **Edge Functions**
2. Clique em **Settings** (⚙️)

### 2.2 Adicionar Variáveis
Clique em **Add Environment Variable** e adicione:

**GEMINI_API_KEY:**
```
AIzaSyBahBJhhkdv59AjDg5uLLgVeloKy6-fVaQ
```

## 📋 PASSO 3: TESTAR AS FUNCTIONS

### 3.1 Verificar se estão funcionando
1. No dashboard, vá para **Edge Functions**
2. Verifique se as 3 functions aparecem na lista
3. Clique em cada uma para ver se estão ativas

### 3.2 Testar no aplicativo
1. Acesse o link Netlify
2. Faça login
3. Faça um check-in diário
4. Verifique se o insight é gerado automaticamente
