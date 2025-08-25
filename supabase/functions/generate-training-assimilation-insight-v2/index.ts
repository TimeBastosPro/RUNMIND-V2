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
      console.log('🔍 Edge Function generate-training-assimilation-insight-v2 iniciada');
      
      const { athleteData } = await req.json();
      console.log('🔍 Dados recebidos:', {
        hasCompletedTraining: !!athleteData.completedTraining,
        hasProfile: !!athleteData.profile,
        sessionsCount: athleteData.sessions?.length || 0
      });
      
      const authHeader = req.headers.get('Authorization')!;
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");
  
      // ✅ MELHORADO: Buscar check-in da manhã
      const today = new Date().toISOString().split('T')[0];
      const { data: morningCheckin } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      // ✅ MELHORADO: Dados do treino com fallbacks
      const completedWorkout = athleteData.completedTraining || {};
      const workoutDescription = completedWorkout.title || completedWorkout.training_type || 'Treino realizado';
      const perceivedEffort = completedWorkout.perceived_effort || 5;
      const sessionSatisfaction = completedWorkout.session_satisfaction || 3;

      const prompt = `
        Você é um analista de performance esportiva. Sua missão é gerar um insight de assimilação para o atleta, conectando o estado matinal com a performance real do treino.
  
        **Check-in da Manhã (Prontidão):**
        - Sono: ${morningCheckin?.sleep_quality || morningCheckin?.sleep_quality_score || 4}/7
        - Dores: ${morningCheckin?.soreness || morningCheckin?.soreness_score || 4}/7
        - Motivação: ${morningCheckin?.motivation || morningCheckin?.emocional || 3}/5
  
        **Feedback do Treino Realizado:**
        - Descrição: ${workoutDescription}
        - Esforço Percebido: ${perceivedEffort}/10
        - Satisfação com a Sessão: ${sessionSatisfaction}/5
  
        **Sua Tarefa:**
        Gere um insight de 2-3 frases, em português brasileiro.
        1.  Compare o estado matinal com o feedback do treino. A performance foi consistente com a prontidão? (Ex: "Mesmo com uma noite de sono regular, você conseguiu completar o treino com bom esforço, o que mostra sua resiliência.") ou (Ex: "Como esperado pelo seu baixo nível de energia pela manhã, o esforço percebido foi alto hoje.")
        2.  Analise o impacto do treino na recuperação e assimilação. (Ex: "Este treino foi bem assimilado, indicando uma boa progressão de carga.")
        3.  Conclua com uma recomendação breve para a recuperação. (Ex: "Foque em uma boa noite de sono para assimilar os ganhos de hoje.").
  
        Seja construtivo e educativo. Responda apenas com o texto do insight.
      `.trim();
  
      console.log('🔍 Chamando Gemini API...');
      const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
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
          context_type: 'training_assimilation',
          confidence_score: 0.9,
          generated_by: 'ai'
      });
      
      if (insertError) {
        console.error('❌ Erro ao inserir insight:', insertError);
        throw new Error(`Erro ao salvar insight: ${insertError.message}`);
      }

      console.log('✅ Insight de assimilação salvo com sucesso');

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
