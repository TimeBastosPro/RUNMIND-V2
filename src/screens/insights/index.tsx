import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Card, Text, ActivityIndicator, IconButton, Chip, Button } from 'react-native-paper';
import { useCheckinStore } from '../../stores/checkin';
import type { Insight } from '../../types/database';
import { useViewStore } from '../../stores/view';
import { resetToCoachMain } from '../../navigation/navigationRef';
import { supabase } from '../../services/supabase';

export default function InsightsScreen() {
  const { 
    savedInsights, 
    isLoading, 
    loadSavedInsights, 
    deleteInsight
  } = useCheckinStore();
  const { isCoachView, exitCoachView, viewAsAthleteId, athleteName: athleteNameFromStore } = useViewStore();
  const [athleteName, setAthleteName] = React.useState<string | null>(athleteNameFromStore || null);

  // ✅ NOVO: Log de debug para insights
  console.log('🔍 InsightsScreen - Estado atual:', {
    savedInsightsCount: savedInsights?.length || 0,
    isLoading,
    isCoachView,
    viewAsAthleteId,
    athleteName
  });

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isCoachView && viewAsAthleteId) {
        if (athleteNameFromStore) {
          if (isMounted) setAthleteName(athleteNameFromStore);
        } else {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', viewAsAthleteId)
            .maybeSingle();
          if (isMounted) setAthleteName(data?.full_name || data?.email || null);
        }
      } else {
        if (isMounted) setAthleteName(null);
      }
    })();
    return () => { isMounted = false; };
  }, [isCoachView, viewAsAthleteId, athleteNameFromStore]);

  useEffect(() => {
    console.log('🔍 InsightsScreen - useEffect principal executado');
    
    // Se estamos no modo treinador mas não temos viewAsAthleteId, aguardar
    if (isCoachView && !viewAsAthleteId) {
      console.log('🔍 Modo coach sem viewAsAthleteId, aguardando...');
      return;
    }
    
    console.log('🔍 Carregando insights...');
    loadSavedInsights();
  }, [loadSavedInsights, isCoachView, viewAsAthleteId]);

  // ✅ NOVO: useEffect específico para recarregar insights quando viewAsAthleteId muda
  useEffect(() => {
    if (viewAsAthleteId) {
      console.log('🔍 viewAsAthleteId mudou, recarregando insights...');
      loadSavedInsights();
    }
  }, [viewAsAthleteId, loadSavedInsights]);

  // ✅ NOVO: Função para forçar recarregamento
  const handleRefresh = async () => {
    console.log('🔍 Recarregamento manual solicitado');
    try {
      await loadSavedInsights();
      console.log('✅ Recarregamento manual concluído');
    } catch (error) {
      console.error('❌ Erro no recarregamento manual:', error);
    }
  };

  const handleDeleteInsight = async (insightId: string) => {
    if (isCoachView) return;
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este insight?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInsight(insightId);
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir o insight.');
            }
          }
        }
      ]
    );
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'ai_analysis': return '#2196F3';
      case 'correlation': return '#4CAF50';
      case 'trend': return '#FF9800';
      case 'alert': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getInsightTypeLabel = (type: string) => {
    switch (type) {
      case 'ai_analysis': return 'IA';
      case 'correlation': return 'Correlação';
      case 'trend': return 'Tendência';
      case 'alert': return 'Alerta';
      default: return 'Sistema';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando insights...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ NOVO: Botão de debug para forçar recarregamento */}
      <View style={{ marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#666' }}>
          Insights: {savedInsights?.length || 0} encontrados
        </Text>
        <Button 
          mode="outlined" 
          onPress={handleRefresh}
          style={{ height: 30 }}
          labelStyle={{ fontSize: 12 }}
        >
          🔄 Recarregar
        </Button>
      </View>

      {isCoachView && (
        <View style={{ padding: 10, marginBottom: 8, borderRadius: 8, backgroundColor: '#EDE7F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip icon="shield-account" mode="outlined">Visualizando como Treinador{athleteName ? ` — ${athleteName}` : ''}</Chip>
          <Text onPress={() => { exitCoachView(); try { resetToCoachMain(); } catch {}; try { const { loadCoachProfile, loadCoachRelationships } = (require('../../stores/coach') as any).useCoachStore.getState(); loadCoachProfile(); loadCoachRelationships(); } catch {} }} style={{ color: '#1976d2' }}>Sair do modo treinador</Text>
        </View>
      )}
      <FlatList
        data={savedInsights}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: Insight }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <Text style={styles.insightIcon}>💡</Text>
                  <Chip 
                    style={[styles.typeChip, { backgroundColor: getInsightTypeColor(item.insight_type) }]}
                    textStyle={styles.typeChipText}
                  >
                    {getInsightTypeLabel(item.insight_type)}
                  </Chip>
                </View>
                {!isCoachView && (
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => handleDeleteInsight(item.id)}
                    style={styles.deleteButton}
                  />
                )}
              </View>
              
              <Text style={styles.insightText}>{item.insight_text}</Text>
              
              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                {item.confidence_score > 0 && (
                  <Text style={styles.confidenceText}>
                    Confiança: {Math.round(item.confidence_score * 100)}%
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>🤔</Text>
            <Text style={styles.emptyTitle}>Nenhum insight encontrado</Text>
            <Text style={styles.emptyText}>
              Seus insights personalizados aparecerão aqui após alguns check-ins e análises!
            </Text>
            {/* ✅ NOVO: Botão para forçar recarregamento quando vazio */}
            <Button 
              mode="contained" 
              onPress={handleRefresh}
              style={{ marginTop: 20 }}
            >
              🔄 Tentar Novamente
            </Button>
          </View>
        }
        contentContainerStyle={savedInsights.length === 0 ? { flex: 1 } : undefined}
        refreshing={isLoading}
        onRefresh={loadSavedInsights}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  card: {
    marginVertical: 8,
    elevation: 3,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  typeChip: {
    height: 24,
  },
  typeChipText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    margin: 0,
  },
  insightText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  confidenceText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

}); 