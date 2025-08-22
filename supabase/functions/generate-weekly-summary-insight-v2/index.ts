// supabase/functions/generate-weekly-summary-insight-v2/index.ts

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

        const completedTrainings = athleteData.weeklyTrainings.filter(t => t.status === 'completed');
        const plannedTrainings = athleteData.weeklyTrainings.filter(t => t.status === 'planned');
        const consistency = plannedTrainings.length > 0 ? (completedTrainings.length / plannedTrainings.length) * 100 : 100;
        const totalDistance = completedTrainings.reduce((sum, t) => sum + (t.distance_km || 0), 0);
        const avgSleep = athleteData.weeklyCheckins.reduce((sum, c) => sum + (c.sleep_quality || 0), 0) / (athleteData.weeklyCheckins.length || 1);

        const prompt = `
            Você é o Head Coach do RunMind, preparando o resumo semanal para um de seus atletas.

            **Reflexão do Atleta:**
            - Diversão: ${athleteData.reflection.fun_score}/5
            - Progresso: ${athleteData.reflection.progress_score}/5
            - Confiança: ${athleteData.reflection.confidence_score}/5

            **Dados da Semana:**
            - Consistência (Planejado vs. Realizado): ${consistency.toFixed(0)}%
            - Distância Total: ${totalDistance.toFixed(1)}km
            - Qualidade Média de Sono: ${avgSleep.toFixed(1)}/7

            **Análise de Carga da Semana:**
            - ACWR Final: ${athleteData.workloadMetrics?.acwr.toFixed(2)}
            - Zona de Risco: ${athleteData.workloadMetrics?.riskZone}
            - Monotonia: ${athleteData.workloadMetrics?.monotony} (um valor > 2.0 sugere treinos repetitivos)
            - Strain (Tensão): ${athleteData.workloadMetrics?.strain.toFixed(0)}

            **Meta do Atleta:**
            - ${athleteData.userProfile?.specific_goal || 'Melhorar a saúde e o condicionamento.'}

            **Sua Tarefa:**
            Elabore um resumo semanal estratégico (3-4 frases) em português brasileiro.
            1.  Comece com um reforço positivo, conectando os dados (consistência, distância) com a reflexão do atleta (progresso, confiança).
            2.  Traduza as métricas de carga (ACWR, Monotonia) em conselhos práticos. Se a monotonia for alta, sugira variar os treinos. Se o ACWR estiver em risco, alerte sobre a importância da recuperação na próxima semana.
            3.  Conclua com uma orientação motivacional para a próxima semana, alinhada à meta do atleta.

            Seja inspirador e estratégico. Responda apenas com o texto do resumo.
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
                confidence_score: 0.9
            });
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
});
