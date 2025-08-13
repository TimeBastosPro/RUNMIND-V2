import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Chip, Button, useTheme } from 'react-native-paper';
import { useCyclesStore } from '../../stores/cycles';
import DefineMesociclosModal from './DefineMesociclosModal';

interface CyclesOverviewProps {
  onOpenMacrocicloModal: () => void;
  onOpenMesocicloModal: () => void;
  onOpenMicrocicloModal: () => void;
}

export default function CyclesOverview({ 
  onOpenMacrocicloModal, 
  onOpenMesocicloModal, 
  onOpenMicrocicloModal 
}: CyclesOverviewProps) {
  const theme = useTheme();
  const { macrociclos, mesociclos, microciclos, getCurrentCycle } = useCyclesStore();
  
  const [defineMesociclosModalVisible, setDefineMesociclosModalVisible] = useState(false);
  const [selectedMacrociclo, setSelectedMacrociclo] = useState<any>(null);
  
  const currentCycle = getCurrentCycle();
  const today = new Date().toISOString().split('T')[0];

  const getIntensityColor = (level?: string) => {
    switch (level) {
      case 'baixa': return '#4CAF50';
      case 'moderada': return '#FF9800';
      case 'alta': return '#F44336';
      case 'muito_alta': return '#9C27B0';
      default: return '#666';
    }
  };

  const getVolumeColor = (level?: string) => {
    switch (level) {
      case 'baixo': return '#4CAF50';
      case 'moderado': return '#FF9800';
      case 'alto': return '#F44336';
      case 'muito_alto': return '#9C27B0';
      default: return '#666';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Ciclos de Treinamento
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Gerencie seus macrociclos, mesociclos e microciclos
        </Text>
      </View>

      {/* Botões de Ação */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={onOpenMacrocicloModal}
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          icon="calendar-plus"
        >
          Criar Macrociclo
        </Button>
        <Button
          mode="contained"
          onPress={onOpenMesocicloModal}
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          icon="calendar-month"
        >
          Criar Mesociclo
        </Button>
        <Button
          mode="contained"
          onPress={onOpenMicrocicloModal}
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          icon="calendar-week"
        >
          Criar Microciclo
        </Button>
      </View>

      {/* Ciclo Atual */}
      {(currentCycle.macrociclo || currentCycle.mesociclo || currentCycle.microciclo) && (
        <Card style={styles.currentCycleCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              🎯 Ciclo Atual
            </Text>
            
            {currentCycle.macrociclo && (
              <View style={styles.cycleInfo}>
                <Chip icon="calendar" style={styles.cycleChip}>
                  Macrociclo: {currentCycle.macrociclo.name}
                </Chip>
                {currentCycle.macrociclo.goal && (
                  <Text variant="bodySmall" style={styles.cycleGoal}>
                    Objetivo: {currentCycle.macrociclo.goal}
                  </Text>
                )}
              </View>
            )}

            {currentCycle.mesociclo && (
              <View style={styles.cycleInfo}>
                <Chip icon="calendar-month" style={styles.cycleChip}>
                  Mesociclo: {currentCycle.mesociclo.name}
                </Chip>
                {currentCycle.mesociclo.focus && (
                  <Text variant="bodySmall" style={styles.cycleFocus}>
                    Foco: {currentCycle.mesociclo.focus}
                  </Text>
                )}
                <View style={styles.cycleMetrics}>
                  <Chip 
                    style={[styles.metricChip, { backgroundColor: getIntensityColor(currentCycle.mesociclo.intensity_level) }]}
                    textStyle={{ color: 'white' }}
                  >
                    Intensidade: {currentCycle.mesociclo.intensity_level}
                  </Chip>
                  <Chip 
                    style={[styles.metricChip, { backgroundColor: getVolumeColor(currentCycle.mesociclo.volume_level) }]}
                    textStyle={{ color: 'white' }}
                  >
                    Volume: {currentCycle.mesociclo.volume_level}
                  </Chip>
                </View>
              </View>
            )}

            {currentCycle.microciclo && (
              <View style={styles.cycleInfo}>
                <Chip icon="calendar-week" style={styles.cycleChip}>
                  Microciclo: {currentCycle.microciclo.name}
                </Chip>
                {currentCycle.microciclo.focus && (
                  <Text variant="bodySmall" style={styles.cycleFocus}>
                    Foco: {currentCycle.microciclo.focus}
                  </Text>
                )}
                <View style={styles.cycleMetrics}>
                  <Chip 
                    style={[styles.metricChip, { backgroundColor: getIntensityColor(currentCycle.microciclo.intensity_level) }]}
                    textStyle={{ color: 'white' }}
                  >
                    Intensidade: {currentCycle.microciclo.intensity_level}
                  </Chip>
                  <Chip 
                    style={[styles.metricChip, { backgroundColor: getVolumeColor(currentCycle.microciclo.volume_level) }]}
                    textStyle={{ color: 'white' }}
                  >
                    Volume: {currentCycle.microciclo.volume_level}
                  </Chip>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Resumo dos Ciclos */}
      <View style={styles.summarySection}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          📊 Resumo dos Ciclos
        </Text>

        <View style={styles.summaryCards}>
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.summaryNumber}>
                {macrociclos.length}
              </Text>
              <Text variant="bodyMedium" style={styles.summaryLabel}>
                Macrociclos
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.summaryNumber}>
                {mesociclos.length}
              </Text>
              <Text variant="bodyMedium" style={styles.summaryLabel}>
                Mesociclos
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.summaryNumber}>
                {microciclos.length}
              </Text>
              <Text variant="bodyMedium" style={styles.summaryLabel}>
                Microciclos
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Lista de Macrociclos */}
      {macrociclos.length > 0 && (
        <View style={styles.listSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📅 Macrociclos
          </Text>
          {macrociclos.map((macrociclo) => (
            <Card key={macrociclo.id} style={styles.listCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cycleName}>
                  {macrociclo.name}
                </Text>
                {macrociclo.description && (
                  <Text variant="bodySmall" style={styles.cycleDescription}>
                    {macrociclo.description}
                  </Text>
                )}
                <View style={styles.cycleDates}>
                  <Chip icon="calendar-start" style={styles.dateChip}>
                    {macrociclo.start_date}
                  </Chip>
                  <Chip icon="calendar-end" style={styles.dateChip}>
                    {macrociclo.end_date}
                  </Chip>
                </View>
                {macrociclo.goal && (
                  <Text variant="bodySmall" style={styles.cycleGoal}>
                    🎯 {macrociclo.goal}
                  </Text>
                )}
                <View style={styles.cardActions}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setSelectedMacrociclo(macrociclo);
                      setDefineMesociclosModalVisible(true);
                    }}
                    style={styles.cardActionButton}
                    icon="calendar-edit"
                  >
                    Definir Mesociclos
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Lista de Mesociclos */}
      {mesociclos.length > 0 && (
        <View style={styles.listSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📆 Mesociclos
          </Text>
          {mesociclos.map((mesociclo) => (
            <Card key={mesociclo.id} style={styles.listCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cycleName}>
                  {mesociclo.name}
                </Text>
                {mesociclo.description && (
                  <Text variant="bodySmall" style={styles.cycleDescription}>
                    {mesociclo.description}
                  </Text>
                )}
                <View style={styles.cycleDates}>
                  <Chip icon="calendar-start" style={styles.dateChip}>
                    {mesociclo.start_date}
                  </Chip>
                  <Chip icon="calendar-end" style={styles.dateChip}>
                    {mesociclo.end_date}
                  </Chip>
                </View>
                {mesociclo.focus && (
                  <Text variant="bodySmall" style={styles.cycleFocus}>
                    🎯 Foco: {mesociclo.focus}
                  </Text>
                )}
                <View style={styles.cycleMetrics}>
                  <Chip 
                    style={[styles.metricChip, { backgroundColor: getIntensityColor(mesociclo.intensity_level) }]}
                    textStyle={{ color: 'white' }}
                  >
                    Intensidade: {mesociclo.intensity_level}
                  </Chip>
                  <Chip 
                    style={[styles.metricChip, { backgroundColor: getVolumeColor(mesociclo.volume_level) }]}
                    textStyle={{ color: 'white' }}
                  >
                    Volume: {mesociclo.volume_level}
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Lista de Microciclos */}
      {microciclos.length > 0 && (
        <View style={styles.listSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📅 Microciclos
          </Text>
          {microciclos.map((microciclo) => (
            <Card key={microciclo.id} style={styles.listCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cycleName}>
                  {microciclo.name}
                </Text>
                {microciclo.description && (
                  <Text variant="bodySmall" style={styles.cycleDescription}>
                    {microciclo.description}
                  </Text>
                )}
                <View style={styles.cycleDates}>
                  <Chip icon="calendar-start" style={styles.dateChip}>
                    {microciclo.start_date}
                  </Chip>
                  <Chip icon="calendar-end" style={styles.dateChip}>
                    {microciclo.end_date}
                  </Chip>
                </View>
                {microciclo.focus && (
                  <Text variant="bodySmall" style={styles.cycleFocus}>
                    🎯 Foco: {microciclo.focus}
                  </Text>
                )}
                <View style={styles.cycleMetrics}>
                  <Chip 
                    style={[styles.metricChip, { backgroundColor: getIntensityColor(microciclo.intensity_level) }]}
                    textStyle={{ color: 'white' }}
                  >
                    Intensidade: {microciclo.intensity_level}
                  </Chip>
                  <Chip 
                    style={[styles.metricChip, { backgroundColor: getVolumeColor(microciclo.volume_level) }]}
                    textStyle={{ color: 'white' }}
                  >
                    Volume: {microciclo.volume_level}
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Estado Vazio */}
      {macrociclos.length === 0 && mesociclos.length === 0 && microciclos.length === 0 && (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              🚀 Comece a Planejar!
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Crie seu primeiro macrociclo para começar a estruturar seu treinamento de forma organizada.
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Modal para Definir Mesociclos */}
      <DefineMesociclosModal
        visible={defineMesociclosModalVisible}
        onDismiss={() => setDefineMesociclosModalVisible(false)}
        onSuccess={() => {
          setDefineMesociclosModalVisible(false);
          setSelectedMacrociclo(null);
        }}
        macrociclo={selectedMacrociclo}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  currentCycleCard: {
    marginBottom: 24,
    backgroundColor: '#E3F2FD',
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cycleInfo: {
    marginBottom: 12,
  },
  cycleChip: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  cycleGoal: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  cycleFocus: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  cycleMetrics: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  metricChip: {
    flex: 1,
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  summaryLabel: {
    textAlign: 'center',
  },
  listSection: {
    marginBottom: 24,
  },
  listCard: {
    marginBottom: 12,
  },
  cycleName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cycleDescription: {
    marginBottom: 8,
    opacity: 0.7,
  },
  cycleDates: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dateChip: {
    flex: 1,
  },
  emptyCard: {
    backgroundColor: '#F5F5F5',
  },
  emptyTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  cardActions: {
    marginTop: 12,
  },
  cardActionButton: {
    marginTop: 8,
  },
}); 