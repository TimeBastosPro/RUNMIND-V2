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
        console.log('🔍 Edge Function generate-weekly-summary-insight-v2 iniciada');
        
        const { athleteData } = await req.json();
        console.log('🔍 Dados recebidos:', {
          hasWeeklyReflection: !!athleteData.weeklyReflection,
          hasProfile: !!athleteData.profile,
          sessionsCount: athleteData.sessions?.length || 0,
          checkinsCount: athleteData.checkins?.length || 0
        });
        
        const authHeader = req.headers.get('Authorization')!;
        const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado.");

        // ✅ MELHORADO: Dados da reflexão semanal
        const reflection = athleteData.weeklyReflection || {};
        const funScore = reflection.enjoyment || 3;
        const progressScore = reflection.progress || 'Bom';
        const confidenceScore = reflection.confidence || 'Boa';

        // ✅ MELHORADO: Calcular métricas da semana
        const completedTrainings = athleteData.sessions?.filter(t => t.status === 'completed') || [];
        const plannedTrainings = athleteData.sessions?.filter(t => t.status === 'planned') || [];
        const consistency = plannedTrainings.length > 0 ? (completedTrainings.length / plannedTrainings.length) * 100 : 100;
        const totalDistance = completedTrainings.reduce((sum, t) => sum + (t.distance_km || 0), 0);
        const avgSleep = athleteData.checkins?.reduce((sum, c) => sum + (c.sleep_quality || c.sleep_quality_score || 4), 0) / (athleteData.checkins?.length || 1);

        const prompt = `
            Você é o Head Coach do RunMind, preparando o resumo semanal para um de seus atletas.

            **Reflexão do Atleta:**
            - Diversão: ${funScore}/5
            - Progresso: ${progressScore}
            - Confiança: ${confidenceScore}

            **Dados da Semana:**
            - Consistência (Planejado vs. Realizado): ${consistency.toFixed(0)}%
            - Distância Total: ${totalDistance.toFixed(1)}km
            - Qualidade Média de Sono: ${avgSleep.toFixed(1)}/7

            **Meta do Atleta:**
            - ${athleteData.profile?.specific_goal || 'Melhorar a saúde e o condicionamento.'}

            **Sua Tarefa:**
            Elabore um resumo semanal estratégico (3-4 frases) em português brasileiro.
            1.  Comece com um reforço positivo, conectando os dados (consistência, distância) com a reflexão do atleta (progresso, confiança).
            2.  Analise a consistência e a qualidade do sono, traduzindo em conselhos práticos. Se a consistência for baixa, sugira estratégias para melhorar. Se o sono for ruim, enfatize sua importância.
            3.  Conclua com uma orientação motivacional para a próxima semana, alinhada à meta do atleta.

            Seja inspirador e estratégico. Responda apenas com o texto do resumo.
        `.trim();
        
        console.log('🔍 Chamando Gemini API...');
        const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 400,
              topP: 0.8,
              topK: 40,
            }
          }),
        });
        
        if (!geminiRes.ok) {
          console.error('❌ Erro na API do Gemini:', geminiRes.status, geminiRes.statusText);
          throw new Error(`Erro na API do Gemini: ${geminiRes.status}`);
        }
        
        const geminiJson = await geminiRes.json();
        const insightText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!insightText) {
          console.error('❌ Nenhum insight gerado pelo Gemini');
          throw new Error('Nenhum insight foi gerado');
        }

        console.log('🔍 Insight gerado:', insightText.substring(0, 100) + '...');

        // ✅ MELHORADO: Inserir insight no banco
        const { error: insertError } = await supabase.from('insights').insert({
            user_id: user.id,
            insight_text: insightText,
            insight_type: 'ai_analysis',
            context_type: 'weekly_summary',
            confidence_score: 0.9,
            generated_by: 'ai'
        });
        
        if (insertError) {
          console.error('❌ Erro ao inserir insight:', insertError);
          throw new Error(`Erro ao salvar insight: ${insertError.message}`);
        }

        console.log('✅ Insight semanal salvo com sucesso');

        return new Response(JSON.stringify({ 
          success: true, 
          insight: insightText.substring(0, 100) + '...'
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        });
    } catch (error) {
        console.error('❌ Erro na Edge Function:', error);
        return new Response(JSON.stringify({ 
          error: error.message,
          details: error.stack
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        });
    }
});
