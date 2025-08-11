import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Card, Text, ActivityIndicator, IconButton, Chip, FAB } from 'react-native-paper';
import { useCheckinStore } from '../../stores/checkin';
import type { Insight } from '../../types/database';
import { useViewStore } from '../../stores/view';
import { supabase } from '../../services/supabase';

export default function InsightsScreen() {
  const { 
    savedInsights, 
    isLoading, 
    isSubmitting,
    loadSavedInsights, 
    deleteInsight,
    generateAndSaveInsight,
    recentCheckins,
    trainingSessions
  } = useCheckinStore();
  const { isCoachView, exitCoachView, viewAsAthleteId, athleteName: athleteNameFromStore } = useViewStore();
  const [athleteName, setAthleteName] = React.useState<string | null>(athleteNameFromStore || null);

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
    loadSavedInsights();
  }, [loadSavedInsights]);

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

  const handleGenerateInsight = async () => {
    if (isCoachView) return;
    if (recentCheckins.length === 0) {
      Alert.alert('Sem dados', 'É necessário ter pelo menos um check-in para gerar insights.');
      return;
    }

    try {
      const latestCheckin = recentCheckins[0];
      const latestTraining = trainingSessions.find(t => t.status === 'completed');
      
      await generateAndSaveInsight({
        context_type: 'solo',
        last_checkin: latestCheckin,
        planned_training: latestTraining,
        recent_checkins: recentCheckins.slice(0, 7), // últimos 7 dias
        recent_trainings: trainingSessions.filter(t => t.status === 'completed').slice(0, 5) // últimos 5 treinos
      });
      
      Alert.alert('Sucesso', 'Insight gerado com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o insight. Tente novamente.');
    }
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
      {isCoachView && (
        <View style={{ padding: 10, marginBottom: 8, borderRadius: 8, backgroundColor: '#EDE7F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip icon="shield-account" mode="outlined">Visualizando como Treinador{athleteName ? ` — ${athleteName}` : ''}</Chip>
          <Text onPress={() => { exitCoachView(); try { (global as any).navigation?.reset?.({ index: 0, routes: [{ name: 'CoachMain' }] }); } catch {} }} style={{ color: '#1976d2' }}>Sair do modo treinador</Text>
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
          </View>
        }
        contentContainerStyle={savedInsights.length === 0 ? { flex: 1 } : undefined}
        refreshing={isLoading}
        onRefresh={loadSavedInsights}
      />
      {!isCoachView && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleGenerateInsight}
          loading={isSubmitting}
          disabled={isSubmitting}
          label="Gerar Insight"
        />
      )}
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 