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
    const { athleteData } = await req.json(); // Removi promptContent, pois não era usado
    if (!athleteData) {
      return new Response(JSON.stringify({ error: 'Missing athleteData' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Desestruturação dos dados do atleta
    const { context_type, last_checkin, planned_training } = athleteData;

    // Construção dinâmica do prompt (sua lógica original, que está ótima)
    let prompt = '';
    if (context_type === 'coached') {
      prompt = `Este atleta, que tem um treinador, dormiu ${last_checkin?.sleep_hours ?? 'N/A'} horas, tem dor muscular nível ${last_checkin?.soreness ?? 'N/A'}/5 e hoje seu plano é ${planned_training?.description ?? 'descanso'}`;
      if (planned_training?.distance_km) prompt += ` de ${planned_training.distance_km}km`;
      if (planned_training?.duration_minutes) prompt += ` (${planned_training.duration_minutes} minutos)`;
      prompt += `. Com base nisso, gere um insight de duas frases sobre sua prontidão para o treino.`;
    } else {
      prompt = `Este atleta, que treina por conta própria, dormiu ${last_checkin?.sleep_hours ?? 'N/A'} horas, está se sentindo ${last_checkin?.mood ?? 'N/A'} e com dor muscular nível ${last_checkin?.soreness ?? 'N/A'}/5. `;
      if (planned_training?.description) {
        prompt += `Hoje o plano é: ${planned_training.description}`;
        if (planned_training?.distance_km) prompt += ` de ${planned_training.distance_km}km`;
        if (planned_training?.duration_minutes) prompt += ` (${planned_training.duration_minutes} minutos)`;
        prompt += '. ';
      }
      prompt += 'Gere um insight de duas frases sugerindo como ele pode aproveitar bem seu treino hoje.';
    }

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

    // Resposta de sucesso, agora com os headers de CORS
    return new Response(
      JSON.stringify({ result: geminiData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal error';
    // Resposta de erro, agora com os headers de CORS
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});