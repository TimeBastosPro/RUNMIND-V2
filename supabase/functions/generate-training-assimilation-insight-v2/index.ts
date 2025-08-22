// supabase/functions/generate-training-assimilation-insight-v2/index.ts

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
        Você é um analista de performance esportiva. Sua missão é gerar um insight de assimilação para o atleta, conectando o estado matinal com a performance real do treino.
  
        **Check-in da Manhã (Prontidão):**
        - Sono: ${athleteData.morningCheckin.sleep_quality}/7
        - Dores: ${athleteData.morningCheckin.soreness}/7
        - Motivação: ${athleteData.morningCheckin.motivation}/5
  
        **Feedback do Treino Realizado:**
        - Descrição: ${athleteData.completedWorkout.description}
        - Esforço Percebido: ${athleteData.completedWorkout.perceived_effort}/10
        - Satisfação com a Sessão: ${athleteData.completedWorkout.session_satisfaction}/10
  
        **Impacto na Carga de Treino:**
        - Novo ACWR após o treino: ${athleteData.newWorkloadMetrics?.acwr.toFixed(2)}
        - Nova Zona de Risco: ${athleteData.newWorkloadMetrics?.riskZone}
  
        **Sua Tarefa:**
        Gere um insight de 2-3 frases, em português brasileiro.
        1.  Compare o estado matinal com o feedback do treino. A performance foi consistente com a prontidão? (Ex: "Mesmo com uma noite de sono regular, você conseguiu completar o treino com bom esforço, o que mostra sua resiliência.") ou (Ex: "Como esperado pelo seu baixo nível de energia pela manhã, o esforço percebido foi alto hoje.")
        2.  Analise o impacto do treino no ACWR, traduzindo o que isso significa. (Ex: "Este treino aumentou seu ACWR para a zona de segurança, indicando uma ótima progressão de carga.")
        3.  Conclua com uma recomendação breve para a recuperação. (Ex: "Foque em uma boa noite de sono para assimilar os ganhos de hoje.").
  
        Seja construtivo e educativo. Responda apenas com o texto do insight.
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
              confidence_score: 0.9
          });
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
});
