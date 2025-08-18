import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, Chip, IconButton, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCyclesStore } from '../../stores/cycles';
import type { Macrociclo, Mesociclo, Microciclo } from '../../types/database';

// Tipos de microciclo disponíveis
const MICROCICLO_TYPES = [
  'Ordinário',
  'Estabilizador', 
  'Choque',
  'Regenerativo',
  'Pré-competitivo',
  'Competitivo'
];

interface CyclesOverviewProps {
  onOpenMacrocicloModal: () => void;
  onOpenMesocicloModal: (macrocicloId: string) => void;
}

export default function CyclesOverview({ 
  onOpenMacrocicloModal, 
  onOpenMesocicloModal
}: CyclesOverviewProps) {
  const theme = useTheme();
  const { 
    macrociclos, 
    mesociclos, 
    microciclos,
    createMicrociclo,
    updateMicrociclo,
    deleteMicrociclo,
    deleteMesociclo,
    deleteMacrociclo 
  } = useCyclesStore();

  // Estados para controlar expansão dos macrociclos
  const [expandedMacrociclos, setExpandedMacrociclos] = useState<string[]>([]);
  
  // Estados para controlar expansão dos mesociclos
  const [expandedMesociclos, setExpandedMesociclos] = useState<string[]>([]);
  
  // Estados para controlar o dropdown de tipo de microciclo
  const [showMicrocicloTypeDropdown, setShowMicrocicloTypeDropdown] = useState<string | null>(null);

  // Estados para edição
  const [macrocicloToEdit, setMacrocicloToEdit] = useState<Macrociclo | null>(null);
  const [mesocicloToEdit, setMesocicloToEdit] = useState<Mesociclo | null>(null);

  // Função para alternar o dropdown de tipo de microciclo
  const toggleMicrocicloTypeDropdown = (mesocicloId: string) => {
    setShowMicrocicloTypeDropdown(showMicrocicloTypeDropdown === mesocicloId ? null : mesocicloId);
  };

  // Função para criar microciclo diretamente
  const handleCreateMicrociclo = async (mesocicloId: string, type: string) => {
    try {
      console.log('🔄 Iniciando criação de microciclo:', { mesocicloId, type });
      
      const mesociclo = mesociclos.find(m => m.id === mesocicloId);
      if (!mesociclo) {
        Alert.alert('Erro', 'Mesociclo não encontrado');
        return;
      }

      // Verificar se já existe um microciclo para este mesociclo
      const existingMicrociclo = microciclos.find(m => m.mesociclo_id === mesocicloId);
      if (existingMicrociclo) {
        console.log('⚠️ Microciclo já existe:', existingMicrociclo);
        Alert.alert('Aviso', 'Este mesociclo já possui um microciclo. Cada mesociclo pode ter apenas um microciclo (uma semana).');
        return;
      }

      const microcicloData = {
        name: type, // Usar o tipo como nome
        focus: type,
        start_date: mesociclo.start_date,
        end_date: mesociclo.end_date,
        mesociclo_id: mesocicloId,
        intensity_level: 'moderada' as const,
        volume_level: 'moderado' as const
      };

      console.log('🔄 Criando microciclo:', microcicloData);
      await createMicrociclo(microcicloData);
      setShowMicrocicloTypeDropdown(null);
      console.log('✅ Microciclo criado com sucesso');
      Alert.alert('Sucesso', 'Microciclo criado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao criar microciclo:', error);
      Alert.alert('Erro', 'Erro ao criar microciclo');
    }
  };

  useEffect(() => {
    // Carregar dados iniciais se necessário
  }, []);

  // Formatar data para exibição
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        return dateString;
      } else {
        const lastPart = dateString.split('/').slice(-3).join('/');
        return lastPart;
      }
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '';
    }
  };

  // Calcular semanas entre duas datas
  const calculateWeeks = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    return diffWeeks;
  };

  const handleEditMacrociclo = (macrociclo: Macrociclo) => {
    setMacrocicloToEdit(macrociclo);
    onOpenMacrocicloModal();
  };

  const handleDeleteMacrociclo = async (macrociclo: Macrociclo) => {
    console.log('🔄 CyclesOverview: Iniciando exclusão do macrociclo:', macrociclo.id, macrociclo.name);
    
    // Teste direto sem Alert para verificar se o problema é no Alert
    console.log('🔄 CyclesOverview: Testando exclusão direta...');
    try {
      console.log('🔄 CyclesOverview: Chamando deleteMacrociclo...');
      await deleteMacrociclo(macrociclo.id);
      console.log('✅ CyclesOverview: Macrociclo excluído com sucesso');
      Alert.alert('Sucesso', 'Macrociclo excluído com sucesso!');
    } catch (error) {
      console.error('❌ CyclesOverview: Erro ao excluir macrociclo:', error);
      Alert.alert('Erro', 'Erro ao excluir macrociclo. Tente novamente.');
    }
  };

  const toggleMacrocicloExpansion = (macrocicloId: string) => {
    setExpandedMacrociclos(prev => 
      prev.includes(macrocicloId) 
        ? prev.filter(id => id !== macrocicloId)
        : [...prev, macrocicloId]
    );
  };

  const handleEditMesociclo = (mesociclo: Mesociclo) => {
    setMesocicloToEdit(mesociclo);
    onOpenMesocicloModal(mesociclo.macrociclo_id);
  };

  const handleDeleteMesociclo = async (mesociclo: Mesociclo) => {
    console.log('🔄 CyclesOverview: Iniciando exclusão do mesociclo:', mesociclo.id, mesociclo.name);
    
    // Teste direto sem Alert para verificar se o problema é no Alert
    console.log('🔄 CyclesOverview: Testando exclusão direta de mesociclo...');
    try {
      console.log('🔄 CyclesOverview: Chamando deleteMesociclo...');
      await deleteMesociclo(mesociclo.id);
      console.log('✅ CyclesOverview: Mesociclo excluído com sucesso');
      Alert.alert('Sucesso', 'Mesociclo excluído com sucesso!');
    } catch (error) {
      console.error('❌ CyclesOverview: Erro ao excluir mesociclo:', error);
      Alert.alert('Erro', 'Erro ao excluir mesociclo. Tente novamente.');
    }
  };

  const handleDeleteMicrociclo = async (microciclo: Microciclo) => {
    console.log('🔄 CyclesOverview: Iniciando exclusão do microciclo:', microciclo.id, microciclo.name);
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o microciclo "${microciclo.name}"? Esta ação não pode ser desfeita.`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => {
            console.log('❌ CyclesOverview: Exclusão de microciclo cancelada pelo usuário');
          }
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            console.log('🔄 CyclesOverview: Usuário confirmou exclusão de microciclo, iniciando processo...');
            try {
              console.log('🔄 CyclesOverview: Chamando deleteMicrociclo...');
              await deleteMicrociclo(microciclo.id);
              console.log('✅ CyclesOverview: Microciclo excluído com sucesso');
              Alert.alert('Sucesso', 'Microciclo excluído com sucesso!');
            } catch (error) {
              console.error('❌ CyclesOverview: Erro ao excluir microciclo:', error);
              Alert.alert('Erro', 'Erro ao excluir microciclo. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  const toggleMesocicloExpansion = (mesocicloId: string) => {
    setExpandedMesociclos(prev => 
      prev.includes(mesocicloId) 
        ? prev.filter(id => id !== mesocicloId)
        : [...prev, mesocicloId]
    );
  };



  // Obter mesociclos de um macrociclo específico
  const getMesociclosForMacrociclo = (macrocicloId: string): Mesociclo[] => {
    return mesociclos.filter(mesociclo => mesociclo.macrociclo_id === macrocicloId);
  };

  // Obter microciclos de um mesociclo específico
  const getMicrociclosForMesociclo = (mesocicloId: string): Microciclo[] => {
    return microciclos.filter(microciclo => microciclo.mesociclo_id === mesocicloId);
  };

  // Agrupar mesociclos por tipo
  const getMesociclosGroupedByType = (macrocicloId: string) => {
    const mesociclosDoMacrociclo = getMesociclosForMacrociclo(macrocicloId);
    
    const grouped = mesociclosDoMacrociclo.reduce((acc, mesociclo) => {
      const type = mesociclo.focus || 'Ordinário';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(mesociclo);
      return acc;
    }, {} as Record<string, Mesociclo[]>);

    return grouped;
  };

  // Estados para controlar expansão dos grupos de tipo
  const [expandedMesocicloTypes, setExpandedMesocicloTypes] = useState<string[]>([]);

  const toggleMesocicloTypeExpansion = (macrocicloId: string, type: string) => {
    const key = `${macrocicloId}-${type}`;
    setExpandedMesocicloTypes(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };



  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Ciclos de Treinamento
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Gerencie seus macrociclos e mesociclos de treinamento
        </Text>
      </View>

      {/* Seção de Macrociclos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Macrociclos
          </Text>
          <Button
            mode="contained"
            onPress={onOpenMacrocicloModal}
            icon="plus"
            style={styles.createButton}
          >
            Criar Macrociclo
          </Button>
        </View>

        {macrociclos.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Nenhum macrociclo criado ainda. Crie seu primeiro macrociclo para começar!
              </Text>
            </Card.Content>
          </Card>
        ) : (
          macrociclos.map((macrociclo) => {
            const mesociclosDoMacrociclo = getMesociclosForMacrociclo(macrociclo.id);
            const weeks = calculateWeeks(macrociclo.start_date, macrociclo.end_date);

            return (
              <Card key={macrociclo.id} style={styles.macrocicloCard}>
                <Card.Content>
                  <View style={styles.macrocicloHeader}>
                    <View style={styles.macrocicloInfo}>
                      <Text variant="titleMedium" style={styles.macrocicloName}>
                        {macrociclo.name}
                      </Text>
                      {macrociclo.goal && (
                        <Text variant="bodySmall" style={styles.macrocicloGoal}>
                          {macrociclo.goal}
                        </Text>
                      )}
                      <View style={styles.macrocicloDates}>
                        <Chip icon="calendar" style={styles.dateChip}>
                          {formatDate(macrociclo.start_date)} - {formatDate(macrociclo.end_date)}
                        </Chip>
                        <Chip icon="clock" style={styles.weeksChip}>
                          {weeks} semana{weeks > 1 ? 's' : ''}
                        </Chip>
                      </View>
                    </View>
                    <View style={styles.macrocicloActions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEditMacrociclo(macrociclo)}
                        style={styles.actionButton}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleDeleteMacrociclo(macrociclo)}
                        style={styles.actionButton}
                      />
                    </View>
                  </View>

                  {/* Seção de Mesociclos Agrupados por Tipo */}
                  <View style={styles.mesociclosSection}>
                    <View style={styles.mesociclosHeader}>
                      <Text variant="titleSmall" style={styles.mesociclosTitle}>
                        Mesociclos ({mesociclosDoMacrociclo.length})
                      </Text>
                      <View style={styles.mesociclosHeaderActions}>
                        <Button
                          mode="outlined"
                          onPress={() => onOpenMesocicloModal(macrociclo.id)}
                          icon="plus"
                          style={styles.createMesocicloButton}
                          compact
                        >
                          Criar Mesociclo
                        </Button>
                        {mesociclosDoMacrociclo.length > 0 && (
                          <IconButton
                            icon={expandedMacrociclos.includes(macrociclo.id) ? "chevron-up" : "chevron-down"}
                            size={20}
                            onPress={() => toggleMacrocicloExpansion(macrociclo.id)}
                            style={styles.expandButton}
                          />
                        )}
                      </View>
                    </View>

                    {mesociclosDoMacrociclo.length === 0 ? (
                      <Text variant="bodySmall" style={styles.emptyMesociclos}>
                        Nenhum mesociclo criado. Crie mesociclos para organizar seu treinamento.
                      </Text>
                    ) : (
                      expandedMacrociclos.includes(macrociclo.id) && (
                        <View style={styles.mesociclosList}>
                          {Object.entries(getMesociclosGroupedByType(macrociclo.id)).map(([type, mesociclosOfType]) => {
                            const typeKey = `${macrociclo.id}-${type}`;
                            const isExpanded = expandedMesocicloTypes.includes(typeKey);
                            
                            return (
                              <Card key={typeKey} style={styles.mesocicloTypeCard}>
                                <Card.Content>
                                  <View style={styles.mesocicloTypeHeader}>
                                    <View style={styles.mesocicloTypeInfo}>
                                      <Text variant="titleSmall" style={styles.mesocicloTypeTitle}>
                                        {type} ({mesociclosOfType.length})
                                      </Text>
                                    </View>
                                    <View style={styles.mesocicloTypeActions}>
                                      <IconButton
                                        icon={isExpanded ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        onPress={() => toggleMesocicloTypeExpansion(macrociclo.id, type)}
                                        style={styles.expandButton}
                                      />
                                    </View>
                                  </View>

                                  {isExpanded && (
                                    <View style={styles.mesociclosOfTypeList}>
                                      {mesociclosOfType.map((mesociclo) => {
                                        const mesocicloWeeks = calculateWeeks(mesociclo.start_date, mesociclo.end_date);
                                        const microciclosDoMesociclo = getMicrociclosForMesociclo(mesociclo.id);
                                        
                                        return (
                                          <Card key={mesociclo.id} style={styles.mesocicloCard}>
                                            <Card.Content>
                                              <View style={styles.mesocicloHeader}>
                                                <View style={styles.mesocicloInfo}>
                                                  <Text variant="bodyMedium" style={styles.mesocicloName}>
                                                    {microciclosDoMesociclo.length > 0 
                                                      ? microciclosDoMesociclo[0].focus || microciclosDoMesociclo[0].name
                                                      : mesociclo.name
                                                    }
                                                  </Text>
                                                  <View style={styles.mesocicloEssentialInfo}>
                                                    <Text variant="bodySmall" style={styles.mesocicloWeeks}>
                                                      {mesocicloWeeks} semana{mesocicloWeeks > 1 ? 's' : ''}
                                                    </Text>
                                                    <Text variant="bodySmall" style={styles.mesocicloDates}>
                                                      {formatDate(mesociclo.start_date)} - {formatDate(mesociclo.end_date)}
                                                    </Text>
                                                  </View>
                                                  
                                                  {/* Seção de Microciclos */}
                                                  <View style={styles.microciclosSection}>
                                                    <View style={styles.microciclosHeader}>
                                                      <View style={styles.microciclosHeaderActions}>
                                                        {microciclosDoMesociclo.length === 0 && (
                                                          <View style={styles.microcicloTypeDropdownContainer}>
                                                            <Button
                                                              mode="outlined"
                                                              onPress={() => toggleMicrocicloTypeDropdown(mesociclo.id)}
                                                              icon="plus"
                                                              style={styles.createMicrocicloButton}
                                                              compact
                                                            >
                                                              Escolher Tipo
                                                            </Button>
                                                            
                                                            {showMicrocicloTypeDropdown === mesociclo.id && (
                                                              <View style={styles.microcicloTypeDropdown}>
                                                                {MICROCICLO_TYPES.map(type => (
                                                                  <Button
                                                                    key={type}
                                                                    mode="text"
                                                                    onPress={() => handleCreateMicrociclo(mesociclo.id, type)}
                                                                    style={styles.microcicloTypeOption}
                                                                  >
                                                                    {type}
                                                                  </Button>
                                                                ))}
                                                              </View>
                                                            )}
                                                          </View>
                                                        )}
                                                        
                                                        {microciclosDoMesociclo.length > 0 && (
                                                          <View style={styles.microcicloActions}>
                                                            <IconButton
                                                              icon="pencil"
                                                              size={16}
                                                              onPress={() => {
                                                                Alert.alert('Editar', 'Funcionalidade de edição será implementada');
                                                              }}
                                                              style={styles.actionButton}
                                                            />
                                                            <IconButton
                                                              icon="delete"
                                                              size={16}
                                                              onPress={() => {
                                                                Alert.alert(
                                                                  'Confirmar exclusão',
                                                                  'Deseja realmente excluir este microciclo?',
                                                                  [
                                                                    { text: 'Cancelar', style: 'cancel' },
                                                                    {
                                                                      text: 'Excluir',
                                                                      style: 'destructive',
                                                                      onPress: () => deleteMicrociclo(microciclosDoMesociclo[0].id)
                                                                    }
                                                                  ]
                                                                );
                                                              }}
                                                              style={styles.actionButton}
                                                            />
                                                          </View>
                                                        )}
                                                      </View>
                                                    </View>
                                                  </View>
                                                </View>
                                                <View style={styles.mesocicloActions}>
                                                  <IconButton
                                                    icon="pencil"
                                                    size={18}
                                                    onPress={() => handleEditMesociclo(mesociclo)}
                                                    style={styles.smallActionButton}
                                                  />
                                                  <IconButton
                                                    icon="delete"
                                                    size={18}
                                                    onPress={() => handleDeleteMesociclo(mesociclo)}
                                                    style={styles.smallActionButton}
                                                  />
                                                </View>
                                              </View>
                                            </Card.Content>
                                          </Card>
                                        );
                                      })}
                                    </View>
                                  )}
                                </Card.Content>
                              </Card>
                            );
                          })}
                        </View>
                      )
                    )}
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </View>
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
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  primaryButton: {
    flex: 1,
  },
  editButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
    zIndex: 1000,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  createButton: {
    marginLeft: 16,
  },
  weeksInfo: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  weeksChip: {
    backgroundColor: '#E0E0E0',
  },
  // New styles for macrociclos, mesociclos, and microciclos
  section: {
    marginBottom: 24,
  },
  macrocicloCard: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  macrocicloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  macrocicloInfo: {
    flex: 1,
  },
  macrocicloName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  macrocicloGoal: {
    fontStyle: 'italic',
    marginBottom: 4,
  },
  macrocicloDates: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  macrocicloActions: {
    flexDirection: 'row',
    gap: 4,
  },
  smallActionButton: {
    margin: 0,
    padding: 4,
  },
  mesociclosSection: {
    marginBottom: 12,
  },
  mesociclosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mesociclosTitle: {
    fontWeight: 'bold',
  },
  createMesocicloButton: {
    marginLeft: 16,
  },
  mesociclosHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    margin: 0,
  },
  mesociclosList: {
    marginTop: 8,
  },
  mesocicloEssentialInfo: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  mesocicloType: {
    fontWeight: 'bold',
    color: '#666',
  },
  mesocicloWeeks: {
    color: '#666',
  },
  microciclosHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  microciclosList: {
    marginTop: 8,
  },
  microcicloEssentialInfo: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  microcicloType: {
    fontWeight: 'bold',
    color: '#666',
  },
  microcicloWeeks: {
    color: '#666',
  },
  mesocicloCard: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mesocicloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mesocicloInfo: {
    flex: 1,
  },
  mesocicloName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mesocicloFocus: {
    fontStyle: 'italic',
    marginBottom: 4,
  },
  mesocicloDates: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  mesocicloActions: {
    flexDirection: 'row',
    gap: 4,
  },
  mesocicloCharacteristics: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  characteristicChip: {
    backgroundColor: '#E0E0E0',
  },
  microciclosSection: {
    marginBottom: 12,
  },
  microciclosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  microciclosTitle: {
    fontWeight: 'bold',
  },
  createMicrocicloButton: {
    marginLeft: 16,
  },
  microcicloCard: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  microcicloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  microcicloInfo: {
    flex: 1,
  },
  microcicloName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  microcicloFocus: {
    fontStyle: 'italic',
    marginBottom: 4,
  },
  microcicloDates: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  microcicloActions: {
    flexDirection: 'row',
    gap: 4,
  },
  microcicloCharacteristics: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  smallDateChip: {
    flex: 1,
  },
  smallWeeksChip: {
    backgroundColor: '#E0E0E0',
  },
  emptyMesociclos: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
  },
     emptyMicrociclos: {
     textAlign: 'center',
     opacity: 0.7,
     marginTop: 8,
   },
   // Estilos para grupos de tipo de mesociclo
   mesocicloTypeCard: {
     marginBottom: 12,
     borderRadius: 8,
     overflow: 'hidden',
     backgroundColor: '#F8F9FA',
   },
   mesocicloTypeHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 8,
   },
   mesocicloTypeInfo: {
     flex: 1,
   },
   mesocicloTypeTitle: {
     fontWeight: 'bold',
     color: '#495057',
   },
   mesocicloTypeActions: {
     flexDirection: 'row',
     gap: 4,
   },
   mesociclosOfTypeList: {
     marginTop: 8,
     paddingLeft: 8,
   },
   microcicloTypeDropdownContainer: {
     position: 'relative',
   },
   microcicloTypeDropdown: {
     position: 'absolute',
     top: 40, // Adjust as needed for spacing
     left: 0,
     backgroundColor: '#FFFFFF',
     borderRadius: 8,
     padding: 8,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
     zIndex: 100,
   },
   microcicloTypeOption: {
     paddingVertical: 8,
     paddingHorizontal: 12,
     borderRadius: 6,
     marginVertical: 4,
   },
   actionButton: {
     marginHorizontal: 2,
   },
   createMicrocicloButton: {
     marginRight: 8,
   },
   microciclosHeader: {
     marginTop: 8,
   },
   microciclosHeaderActions: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
   },
   microciclosSection: {
     marginTop: 8,
   },
   microciclosTitle: {
     fontWeight: 'bold',
     marginBottom: 4,
   },
   microciclosList: {
     marginTop: 8,
   },
   microcicloType: {
     fontStyle: 'italic',
     color: '#666',
   },
   microcicloEssentialInfo: {
     flexDirection: 'row',
     gap: 8,
     marginTop: 4,
   },
});  