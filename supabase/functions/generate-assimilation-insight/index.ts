import { serve } from 'std/server';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

serve(async (req) => {
  // Suporte a preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      status: 204,
    });
  }
  try {
    const { workoutData } = await req.json();

    // Montar prompt para o Gemini
    const prompt = `
Você é um analista de performance esportiva. Analise os dados abaixo e gere um insight de assimilação para o atleta, conectando o estado matinal com a performance real dos treinos realizados hoje. O insight deve ser construtivo, curto e ajudar o atleta a aprender sobre como seu corpo e mente responderam ao esforço do dia.

Check-in da Manhã:
${JSON.stringify(workoutData.morningCheckin, null, 2)}

Feedback dos Treinos Realizados Hoje:
${JSON.stringify(workoutData.todayWorkouts, null, 2)}

Tendência dos últimos 3 dias (sono, motivação, estresse):
${JSON.stringify(workoutData.recentTrend, null, 2)}

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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || e.toString() }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      status: 500,
    });
  }
}); 