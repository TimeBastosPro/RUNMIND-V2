import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useCheckinStore } from '../stores/checkin';

interface DebugPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function DebugPanel({ visible, onClose }: DebugPanelProps) {
  const { recentCheckins, loadRecentCheckins } = useCheckinStore();

  const handleRefreshData = async () => {
    try {
      await loadRecentCheckins();
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    }
  };

  const getDataSummary = () => {
    if (recentCheckins.length === 0) {
      return {
        total: 0,
        withSleepQuality: 0,
        withSoreness: 0,
        withMood: 0,
        withConfidence: 0,
        withFocus: 0,
        withEnergy: 0,
        recentDates: [],
        rawData: [],
      };
    }

    const withSleepQuality = recentCheckins.filter(c => c.sleep_quality !== null && c.sleep_quality !== undefined).length;
    const withSoreness = recentCheckins.filter(c => c.soreness !== null && c.soreness !== undefined).length;
    const withMood = recentCheckins.filter(c => c.motivation !== null && c.motivation !== undefined).length;
    const withConfidence = recentCheckins.filter(c => c.confidence !== null && c.confidence !== undefined).length;
    const withFocus = recentCheckins.filter(c => c.focus !== null && c.focus !== undefined).length;
    const withEnergy = recentCheckins.filter(c => c.emocional !== null && c.emocional !== undefined).length;

    const recentDates = recentCheckins
      .slice(0, 5)
      .map(c => ({
        date: c.date,
        sleep: c.sleep_quality,
        soreness: c.soreness,
        mood: c.motivation,
        confidence: c.confidence,
        focus: c.focus,
        energy: c.emocional,
      }));

    // Adicionar dados brutos para debug
    const rawData = recentCheckins.slice(0, 10).map(c => ({
      date: c.date,
      sleep_quality: c.sleep_quality,
      soreness: c.soreness,
      motivation: c.motivation,
      confidence: c.confidence,
      focus: c.focus,
      emocional: c.emocional,
      notes: c.notes,
    }));

    return {
      total: recentCheckins.length,
      withSleepQuality,
      withSoreness,
      withMood,
      withConfidence,
      withFocus,
      withEnergy,
      recentDates,
      rawData,
    };
  };

  const summary = getDataSummary();

  if (!visible) return null;

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Painel de Debug</Text>
          <Button onPress={onClose} mode="text" compact>
            Fechar
          </Button>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo dos Dados</Text>
          <Text>Total de check-ins: {summary.total}</Text>
          <Text>Com qualidade do sono: {summary.withSleepQuality}</Text>
          <Text>Com dores musculares: {summary.withSoreness}</Text>
          <Text>Com humor: {summary.withMood}</Text>
          <Text>Com confiança: {summary.withConfidence}</Text>
          <Text>Com foco: {summary.withFocus}</Text>
          <Text>Com energia: {summary.withEnergy}</Text>
        </View>

        {summary.recentDates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Últimos 5 Check-ins</Text>
            <ScrollView style={styles.datesContainer}>
              {summary.recentDates.map((item, index) => (
                <View key={index} style={styles.dateItem}>
                  <Text style={styles.dateText}>{item.date}</Text>
                  <Text style={styles.valuesText}>
                    Sono: {item.sleep || 'N/A'} | 
                    Dores: {item.soreness || 'N/A'} | 
                    Humor: {item.mood || 'N/A'} | 
                    Confiança: {item.confidence || 'N/A'} | 
                    Foco: {item.focus || 'N/A'} | 
                    Energia: {item.energy || 'N/A'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {summary.rawData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Brutos (Primeiros 10)</Text>
            <ScrollView style={styles.datesContainer}>
              {summary.rawData.map((item, index) => (
                <View key={index} style={styles.dateItem}>
                  <Text style={styles.dateText}>{item.date}</Text>
                  <Text style={styles.valuesText}>
                    sleep_quality: {item.sleep_quality || 'null'} | 
                    soreness: {item.soreness || 'null'} | 
                    motivation: {item.motivation || 'null'} | 
                    confidence: {item.confidence || 'null'} | 
                    focus: {item.focus || 'null'} | 
                    emocional: {item.emocional || 'null'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>
          <Button 
            mode="contained" 
            onPress={handleRefreshData}
            style={styles.button}
          >
            Recarregar Dados
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => {
              console.log('🔍 DEBUG - Testando dados brutos:', recentCheckins.slice(0, 5));
              console.log('🔍 DEBUG - Estrutura do primeiro check-in:', recentCheckins[0]);
            }}
            style={styles.button}
          >
            Testar Dados
          </Button>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnóstico</Text>
          {summary.total === 0 && (
            <Text style={styles.errorText}>
              ❌ Nenhum check-in encontrado. Verifique se os dados estão sendo salvos corretamente.
            </Text>
          )}
          {summary.total > 0 && summary.withSleepQuality === 0 && (
            <Text style={styles.errorText}>
              ⚠️ Check-ins encontrados, mas sem dados de qualidade do sono. 
              Verifique se as colunas estão sendo preenchidas corretamente.
            </Text>
          )}
          {summary.total > 0 && summary.withSleepQuality > 0 && (
            <Text style={styles.successText}>
              ✅ Dados encontrados e aparentemente corretos!
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  datesContainer: {
    maxHeight: 150,
  },
  dateItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  dateText: {
    fontWeight: 'bold',
    color: '#333',
  },
  valuesText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  button: {
    marginTop: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  successText: {
    color: '#388e3c',
    fontSize: 14,
  },
}); 