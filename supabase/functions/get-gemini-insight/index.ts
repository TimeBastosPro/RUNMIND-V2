// Caminho: supabase/functions/get-gemini-insight/index.ts

// Importações padrão do Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// --- INÍCIO DA CORREÇÃO DE CORS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
// --- FIM DA CORREÇÃO DE CORS ---

console.log("Hello from Functions!")

Deno.serve(async (req: Request) => {
  // --- INÍCIO DA CORREÇÃO DE CORS ---
  // Este bloco 'if' lida com a requisição preliminar (preflight) que o navegador envia.
  // Ele responde "ok, pode continuar" antes da verificação de JWT.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  // --- FIM DA CORREÇÃO DE CORS ---

  try {
    const { athleteData } = await req.json();
    if (!athleteData) {
      return new Response(JSON.stringify({ error: 'Missing athleteData' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Construção do prompt melhorada e simplificada
    const prompt = buildPromptFromAthleteData(athleteData);
    console.log('Prompt construído:', prompt);

    // Lê a chave Gemini dos segredos de ambiente
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Gemini API key' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Chama a API do Gemini
    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1, // Reduzido ainda mais para respostas mais consistentes
          maxOutputTokens: 200, // Aumentado para respostas mais completas
          topP: 0.8, // Adicionado para mais consistência
          topK: 40, // Adicionado para mais consistência
        }
      })
    });
    
    const geminiData = await geminiRes.json();
    if (!geminiRes.ok) {
      console.error("Gemini API Error:", geminiData.error);
      return new Response(JSON.stringify({ error: geminiData.error || 'Gemini API error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const insightText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Insight gerado com sucesso.';
    console.log('Insight gerado:', insightText);

    // Resposta de sucesso, agora com os headers de CORS
    return new Response(
      JSON.stringify({ result: { candidates: [{ content: { parts: [{ text: insightText }] } }] } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal error';
    console.error('Erro na função:', errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

function buildPromptFromAthleteData(athleteData: Record<string, unknown>): string {
  try {
    const { last_checkin, planned_training, recent_checkins, recent_trainings, user_profile } = athleteData;
    
    // Dados do último check-in com campos corretos
    const checkin = last_checkin as Record<string, unknown> || {};
    const sleepQuality = checkin.sleep_quality || checkin.sleep_hours || 'N/A';
    const soreness = checkin.soreness || checkin.soreness_score || 'N/A';
    const motivation = checkin.motivation || checkin.motivation_score || 'N/A';
    const confidence = checkin.confidence || checkin.confidence_score || 'N/A';
    const focus = checkin.focus || checkin.focus_score || 'N/A';
    
    // Dados do treino planejado
    const training = planned_training as Record<string, unknown> || {};
    const trainingType = training.training_type || training.description || 'treino';
    const distance = training.distance_km || training.planned_distance_km || 'N/A';
    const duration = training.duration_minutes || training.planned_duration_minutes || 'N/A';
    
    // Dados do perfil do usuário (personalização)
    const profile = user_profile as Record<string, unknown> || {};
    const experienceLevel = profile.experience_level || 'beginner';
    const mainGoal = profile.main_goal || 'health';
    
    // Análise de tendências dos últimos check-ins
    let trendAnalysis = '';
    if (recent_checkins && Array.isArray(recent_checkins) && recent_checkins.length > 0) {
      const last3Checkins = recent_checkins.slice(0, 3);
      const avgMotivation = last3Checkins.reduce((sum: number, c: Record<string, unknown>) => 
        sum + (Number(c.motivation) || 0), 0) / last3Checkins.length;
      const avgSleep = last3Checkins.reduce((sum: number, c: Record<string, unknown>) => 
        sum + (Number(c.sleep_quality) || 0), 0) / last3Checkins.length;
      
      if (avgMotivation > 4) trendAnalysis += 'Sua motivação tem estado alta. ';
      else if (avgMotivation < 3) trendAnalysis += 'Sua motivação tem estado baixa. ';
      
      if (avgSleep < 4) trendAnalysis += 'Seu sono tem estado abaixo do ideal. ';
      else if (avgSleep > 5) trendAnalysis += 'Seu sono tem estado muito bom. ';
    }
    
    // Análise de treinos recentes
    let trainingAnalysis = '';
    if (recent_trainings && Array.isArray(recent_trainings) && recent_trainings.length > 0) {
      const completedTrainings = recent_trainings.filter((t: Record<string, unknown>) => t.status === 'completed');
      if (completedTrainings.length > 0) {
        const avgEffort = completedTrainings.reduce((sum: number, t: Record<string, unknown>) => 
          sum + (Number(t.perceived_effort) || 0), 0) / completedTrainings.length;
        
        if (avgEffort > 7) trainingAnalysis += 'Seus treinos têm sido intensos. ';
        else if (avgEffort < 5) trainingAnalysis += 'Seus treinos têm sido leves. ';
      }
    }
    
    // Construção do prompt simplificado e focado
    const prompt = `Você é um treinador de corrida experiente. Analise os dados do atleta e gere um insight motivacional e prático de 2-3 frases em português brasileiro.

DADOS ATUAIS:
- Sono: ${sleepQuality}/7
- Dores: ${soreness}/7  
- Motivação: ${motivation}/5
- Confiança: ${confidence}/5
- Foco: ${focus}/5

TREINO PLANEJADO: ${trainingType} (${distance}km, ${duration}min)

TENDÊNCIAS: ${trendAnalysis}

TREINOS RECENTES: ${trainingAnalysis}

PERFIL: ${getExperienceLevelText(String(experienceLevel))} - Objetivo: ${getGoalText(String(mainGoal))}

INSTRUÇÕES:
1. Fale como um treinador experiente
2. Use linguagem motivacional e direta
3. Considere o estado atual e tendências
4. Forneça orientações práticas
5. Se houver sinais de fadiga, sugira ajustes
6. Se a motivação estiver baixa, ofereça estímulo
7. Seja específico e acionável

Responda apenas com o texto do insight, sem introduções.`;

    return prompt;
  } catch (error) {
    console.error('Erro ao construir prompt:', error);
    return 'Você é um treinador de corrida experiente. Gere um insight motivacional e prático para um atleta que está treinando hoje, considerando seu estado atual e objetivos.';
  }
}

// Funções auxiliares simplificadas
function getExperienceLevelText(level: string): string {
  switch (level) {
    case 'beginner': return 'Iniciante';
    case 'intermediate': return 'Intermediário';
    case 'advanced': return 'Avançado';
    default: return 'Não informado';
  }
}

function getGoalText(goal: string): string {
  switch (goal) {
    case 'health': return 'Saúde';
    case 'performance': return 'Performance';
    case 'weight_loss': return 'Perda de peso';
    case 'fun': return 'Diversão';
    default: return 'Não informado';
  }
}