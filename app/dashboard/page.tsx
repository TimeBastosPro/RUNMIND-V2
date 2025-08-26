"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    checkTodayStatus();
  }, []);
  
  const checkTodayStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('checkin_sessions')
        .select('id, analysis_results(*)')
        .eq('user_id', session.user.id)
        .gte('completed_at', `${today}T00:00:00`)
        .lt('completed_at', `${today}T23:59:59`)
        .single();
      
      if (data) {
        setHasCheckedInToday(true);
        if (data.analysis_results?.[0]) {
          setAnalysis(data.analysis_results[0].analysis_data);
        }
      }
    } catch (error) {
      console.log('No check-in today');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCheckIn = async () => {
    try {
      // Check-in simplificado para MVP
      const mockResponses = [
        { question_id: 'feeling', value: 7 },
        { question_id: 'energy', value: 8 },
        { question_id: 'sleep', value: 'good' }
      ];
      
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: mockResponses })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setHasCheckedInToday(true);
        setAnalysis(result.analysis);
      }
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            RunMind
          </h1>
          <p className="text-gray-600">
            Como você está hoje?
          </p>
        </header>
        
        {!hasCheckedInToday ? (
          <CheckInPrompt onCheckIn={handleCheckIn} />
        ) : (
          <AnalysisDisplay analysis={analysis} />
        )}
      </div>
    </div>
  );
}

function CheckInPrompt({ onCheckIn }: { onCheckIn: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="text-6xl mb-4">🌟</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Fazer Check-in Diário
      </h2>
      <p className="text-gray-600 mb-6">
        Vamos analisar como seu corpo e mente estão hoje.
      </p>
      <Button onClick={onCheckIn} className="w-full py-3 text-lg">
        Começar Check-in
      </Button>
    </div>
  );
}

function AnalysisDisplay({ analysis }: { analysis: any }) {
  if (!analysis) return null;
  
  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="space-y-6">
      {/* Score Principal */}
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <div className="text-4xl mb-2">
          {analysis.physical_readiness >= 80 ? '💪' : 
           analysis.physical_readiness >= 60 ? '👍' : '😴'}
        </div>
        <div className={`text-3xl font-bold mb-2 ${getReadinessColor(analysis.physical_readiness)}`}>
          {analysis.physical_readiness}% Pronto
        </div>
        <p className="text-gray-700">
          Físico: {analysis.physical_readiness}% • Mental: {analysis.mental_readiness}%
        </p>
      </div>
      
      {/* Insights */}
      {analysis.insights && analysis.insights.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">💡</span>
            Insights de Hoje
          </h3>
          {analysis.insights.map((insight: any, index: number) => (
            <div key={index} className="mb-3 last:mb-0">
              <h4 className="font-medium text-gray-900 mb-1">
                {insight.title}
              </h4>
              <p className="text-sm text-gray-700">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      )}
      
      {/* Recomendações */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Recomendações
          </h3>
          {analysis.recommendations.map((rec: any, index: number) => (
            <div key={index} className="mb-3 last:mb-0">
              <h4 className="font-medium text-gray-900 mb-1">
                {rec.title}
              </h4>
              <p className="text-sm text-gray-700">
                {rec.description}
              </p>
            </div>
          ))}
        </div>
      )}
      
      {/* Ação para novo check-in */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">
          Próximo check-in disponível amanhã
        </p>
        <Button variant="outline" className="w-full">
          Ver Histórico de Análises
        </Button>
      </div>
    </div>
  );
} 