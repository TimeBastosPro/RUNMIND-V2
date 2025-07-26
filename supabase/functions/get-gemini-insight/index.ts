// Caminho: supabase/functions/get-gemini-insight/index.ts

// Importações padrão do Supabase
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// --- INÍCIO DA CORREÇÃO DE CORS ---
// Headers de CORS que vamos reutilizar.
// Eles dizem ao navegador que seu app em localhost:8081 tem permissão.
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:8081',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Construção do prompt melhorada
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
        contents: [{ parts: [{ text: prompt }] }]
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
    // Resposta de erro, agora com os headers de CORS
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function buildPromptFromAthleteData(athleteData: any): string {
  try {
    const { context_type, last_checkin, planned_training, recent_checkins, recent_trainings } = athleteData;
    
    // Dados do último check-in
    const checkin = last_checkin || {};
    const sleepQuality = checkin.sleep_quality || checkin.sleep_hours || 'N/A';
    const soreness = checkin.soreness || checkin.soreness_score || 'N/A';
    const motivation = checkin.motivation || checkin.motivation_score || 'N/A';
    const confidence = checkin.confidence || checkin.confidence_score || 'N/A';
    const focus = checkin.focus || checkin.focus_score || 'N/A';
    const emocional = checkin.emocional || 'N/A';
    
    // Dados do treino planejado
    const training = planned_training || {};
    const trainingType = training.training_type || training.description || 'treino';
    const distance = training.distance_km || training.planned_distance_km || 'N/A';
    const duration = training.duration_minutes || training.planned_duration_minutes || 'N/A';
    
    // Análise de tendências
    let trendAnalysis = '';
    if (recent_checkins && Array.isArray(recent_checkins) && recent_checkins.length > 0) {
      const avgMotivation = recent_checkins.reduce((sum: number, c: any) => sum + (c.motivation || 0), 0) / recent_checkins.length;
      if (avgMotivation > 4) {
        trendAnalysis = 'Sua motivação tem estado alta ultimamente. ';
      } else if (avgMotivation < 3) {
        trendAnalysis = 'Sua motivação tem estado baixa ultimamente. ';
      }
    }
    
    // Construção do prompt
    let prompt = `Como especialista em treinamento esportivo, analise os dados deste atleta e gere um insight personalizado de 2-3 frases em português brasileiro.

DADOS DO ATLETA:
- Qualidade do sono: ${sleepQuality}/7
- Dores musculares: ${soreness}/7  
- Motivação: ${motivation}/5
- Confiança: ${confidence}/5
- Foco: ${focus}/5
- Estado emocional: ${emocional}/5

TREINO PLANEJADO:
- Tipo: ${trainingType}
- Distância: ${distance}km
- Duração: ${duration}min

${trendAnalysis}

Gere um insight motivacional e prático que ajude o atleta a aproveitar melhor seu treino hoje, considerando seu estado atual e o treino planejado.`;

    return prompt;
  } catch (error) {
    console.error('Erro ao construir prompt:', error);
    return 'Gere um insight motivacional para um atleta que está treinando hoje.';
  }
}