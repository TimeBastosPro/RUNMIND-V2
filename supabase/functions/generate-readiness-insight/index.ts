import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

serve(async (req) => {
  // Responder preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { athleteData } = await req.json();

    // Montar prompt para o Gemini
    const prompt = `
Você é um treinador de corrida experiente. Analise os dados abaixo e gere um insight de prontidão para o atleta, de forma motivacional, curta e personalizada para o dia de hoje.

Dados do Check-in de Hoje:
${JSON.stringify(athleteData.todayCheckin, null, 2)}

Próximo Treino Planejado:
${athleteData.plannedWorkout ? JSON.stringify(athleteData.plannedWorkout, null, 2) : 'Nenhum treino planejado para hoje.'}

Tendência dos últimos 3 dias (sono, motivação, estresse):
${JSON.stringify(athleteData.recentTrend, null, 2)}

Responda apenas com o texto do insight.
    `.trim();

    // Chamar Gemini API
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    const geminiJson = await geminiRes.json();
    const insightText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível gerar um insight no momento.';

    return new Response(JSON.stringify({ insight: insightText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}) 