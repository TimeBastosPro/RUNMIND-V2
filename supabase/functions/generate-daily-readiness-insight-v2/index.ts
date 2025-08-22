// supabase/functions/generate-daily-readiness-insight-v2/index.ts

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

    // NOVO PROMPT APRIMORADO
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
      1.  **Valide o sentimento do atleta:** Use a métrica de "Forma (TSB)" para explicar por que ele se sente de determinada maneira. (Ex: "É normal você acordar com pouca motivação; sua 'Forma' está em -15, indicando que seu corpo está absorvendo treinos pesados.")
      2.  **Dê uma orientação clara para o dia:** Com base em todos os dados, dê um conselho prático. (Ex: "Isso mostra que o treino está funcionando. Foque em completar o treino de hoje com consistência, sem se preocupar com a velocidade.")
      3.  **Se a Forma for positiva (> 5):** Encoraje o atleta a aproveitar o bom momento. (Ex: "Sua 'Forma' está em +10, você está descansado e pronto para um ótimo treino. Aproveite a sensação de força hoje!")

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
            confidence_score: 0.95 // Maior confiança devido a dados mais ricos
        });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});
