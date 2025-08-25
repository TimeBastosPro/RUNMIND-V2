// supabase/functions/generate-daily-readiness-insight-v2/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }) }

  try {
    console.log('🔍 Edge Function generate-daily-readiness-insight-v2 iniciada');
    
    const { athleteData } = await req.json();
    console.log('🔍 Dados recebidos:', {
      hasTodayCheckin: !!athleteData.todayCheckin,
      hasProfile: !!athleteData.profile,
      sessionsCount: athleteData.sessions?.length || 0,
      hasPlannedWorkout: !!athleteData.plannedWorkout,
      hasWorkloadMetrics: !!athleteData.workloadMetrics
    });
    
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");
    
    console.log('🔍 Usuário autenticado:', user.id);

    // ✅ SIMPLIFICADO: Gerar insight diretamente sem Gemini
    const sleepQuality = athleteData.todayCheckin?.sleep_quality || athleteData.todayCheckin?.sleep_quality_score || 4;
    const soreness = athleteData.todayCheckin?.soreness || athleteData.todayCheckin?.soreness_score || 4;
    const motivation = athleteData.todayCheckin?.motivation || athleteData.todayCheckin?.emocional || 3;
    
    const fitnessCtl = athleteData.workloadMetrics?.fitness_ctl || 0;
    const fatigueAtl = athleteData.workloadMetrics?.fatigue_atl || 0;
    const formTsb = athleteData.workloadMetrics?.form_tsb || 0;
    
    const plannedWorkoutText = athleteData.plannedWorkout?.title || athleteData.plannedWorkout?.description || 'Dia de descanso.';

    // ✅ NOVO: Gerar insight baseado nos dados
    let insightText = '';
    if (sleepQuality >= 6 && motivation >= 4) {
      insightText = `🎯 Excelente estado hoje! Seu sono de ${sleepQuality}/7 e motivação de ${motivation}/5 indicam que você está pronto para um treino produtivo. Sua Forma (TSB) está em ${formTsb.toFixed(0)}, mostrando que você está bem equilibrado. Aproveite essa energia positiva e mantenha o foco nos seus objetivos!`;
    } else if (soreness >= 5) {
      insightText = `⚠️ Atenção às dores! Com nível de ${soreness}/7, sugiro um treino mais leve hoje, focando na recuperação. Sua Forma (TSB) está em ${formTsb.toFixed(0)}, indicando que seu corpo precisa de descanso. Priorize alongamentos e atividades de baixo impacto para permitir que seu corpo se recupere adequadamente.`;
    } else if (motivation <= 3) {
      insightText = `💪 Motivação baixa detectada (${motivation}/5), mas isso é normal! Sua Forma (TSB) está em ${formTsb.toFixed(0)}, indicando que seu corpo está absorvendo treinos pesados. Sugiro começar com uma atividade que você gosta, mesmo que seja apenas uma caminhada leve. O importante é manter a consistência, não a intensidade.`;
    } else {
      insightText = `📊 Estado equilibrado hoje! Sono: ${sleepQuality}/7, Dores: ${soreness}/7, Motivação: ${motivation}/5. Sua Forma (TSB) está em ${formTsb.toFixed(0)}, mostrando um bom equilíbrio entre treino e recuperação. Continue monitorando esses indicadores para otimizar seus treinos.`;
    }

    console.log('🔍 Insight gerado:', insightText.substring(0, 100) + '...');

    // ✅ SIMPLIFICADO: Inserir insight no banco
    const { error: insertError } = await supabase.from('insights').insert({
        user_id: user.id,
        insight_text: insightText,
        insight_type: 'ai_analysis',
        context_type: 'daily_checkin',
        confidence_score: 0.95,
        generated_by: 'ai'
    });
    
    if (insertError) {
      console.error('❌ Erro ao inserir insight:', insertError);
      throw new Error(`Erro ao salvar insight: ${insertError.message}`);
    }
    
    console.log('✅ Insight salvo com sucesso');

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
