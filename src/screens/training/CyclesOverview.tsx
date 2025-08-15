import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Chip, Button, useTheme, IconButton, Divider } from 'react-native-paper';
import { useCyclesStore } from '../../stores/cycles';
import DefineMesociclosModal from './DefineMesociclosModal';

// Constante dos tipos de mesociclo
const MESOCICLO_TYPES = [
  { value: 'base', label: 'Base' },
  { value: 'desenvolvimento', label: 'Desenvolvimento' },
  { value: 'estabilizador', label: 'Estabilizador' },
  { value: 'especifico', label: 'Específico' },
  { value: 'pre_competitivo', label: 'Pré-Competitivo' },
  { value: 'polimento', label: 'Polimento' },
  { value: 'competitivo', label: 'Competitivo' },
  { value: 'transicao', label: 'Transição' },
  { value: 'recuperativo', label: 'Recuperativo' },
];

interface CyclesOverviewProps {
  onOpenMacrocicloModal: () => void;
}

export default function CyclesOverview({ 
  onOpenMacrocicloModal
}: CyclesOverviewProps) {
  const theme = useTheme();
  const { 
    macrociclos, 
    mesociclos, 
    microciclos, 
    getCurrentCycle, 
    fetchMesociclos,
    deleteMesociclo,
    updateMesociclo
  } = useCyclesStore();
  
  const [defineMesociclosModalVisible, setDefineMesociclosModalVisible] = useState(false);
  const [selectedMacrociclo, setSelectedMacrociclo] = useState<any>(null);
  const [expandedMacrociclos, setExpandedMacrociclos] = useState<Set<string>>(new Set());
  
  // Função para expandir macrociclos automaticamente - VERSÃO FINAL CORRIGIDA
  const expandMacrociclosWithMesociclos = () => {
    console.log('🔍 DEBUG - CyclesOverview: Iniciando expansão automática FINAL');
    console.log('🔍 DEBUG - CyclesOverview: Total de macrociclos:', macrociclos.length);
    console.log('🔍 DEBUG - CyclesOverview: Total de mesociclos:', mesociclos.length);
    
    if (mesociclos.length > 0 && macrociclos.length > 0) {
      // CORREÇÃO: Usar todos os macrociclos que têm mesociclos
      const macrociclosComMesociclos = new Set<string>();
      
      // Verificar cada mesociclo e adicionar seu macrociclo à lista
      mesociclos.forEach(mesociclo => {
        if (mesociclo.macrociclo_id) {
          macrociclosComMesociclos.add(mesociclo.macrociclo_id);
          console.log(`🔍 DEBUG - CyclesOverview: Adicionando macrociclo ${mesociclo.macrociclo_id} para expansão`);
        }
      });
      
      console.log('🔍 DEBUG - CyclesOverview: Macrociclos para expansão:', Array.from(macrociclosComMesociclos));
      
      // FORÇAR expansão imediata de todos os macrociclos que têm mesociclos
      setExpandedMacrociclos(macrociclosComMesociclos);
      
      // Log adicional para verificar se a expansão foi aplicada
      setTimeout(() => {
        console.log('🔍 DEBUG - CyclesOverview: Estado final de expansão:', Array.from(expandedMacrociclos));
      }, 50);
    } else {
      console.log('🔍 DEBUG - CyclesOverview: Não há dados suficientes para expansão');
      setExpandedMacrociclos(new Set());
    }
  };
  
  const currentCycle = getCurrentCycle();
  const today = new Date().toISOString().split('T')[0];

  // Debug logs e expansão automática - VERSÃO SIMPLIFICADA
  useEffect(() => {
    console.log('🔍 DEBUG - CyclesOverview: Dados carregados:', {
      macrociclos: macrociclos.length,
      mesociclos: mesociclos.length,
      microciclos: microciclos.length
    });
    
    // Chamar a função de expansão
    expandMacrociclosWithMesociclos();
  }, [macrociclos, mesociclos]);

  // Efeito para forçar recarregamento dos dados quando o componente é montado
  useEffect(() => {
    const forceReload = async () => {
      console.log('🔄 DEBUG - CyclesOverview: Forçando recarregamento dos dados...');
      try {
        // Forçar recarregamento múltiplas vezes para garantir
        await fetchMesociclos();
        console.log('✅ DEBUG - CyclesOverview: Primeiro recarregamento concluído');
        
        // Segundo recarregamento após 200ms
        setTimeout(async () => {
          await fetchMesociclos();
          console.log('✅ DEBUG - CyclesOverview: Segundo recarregamento concluído');
          
          // Terceiro recarregamento após mais 200ms
          setTimeout(async () => {
            await fetchMesociclos();
            console.log('✅ DEBUG - CyclesOverview: Terceiro recarregamento concluído');
            
            // Forçar expansão após todos os recarregamentos
            setTimeout(() => {
              console.log('🔄 DEBUG - CyclesOverview: Forçando expansão final...');
              expandMacrociclosWithMesociclos();
            }, 100);
          }, 200);
        }, 200);
        
      } catch (error) {
        console.error('❌ DEBUG - CyclesOverview: Erro ao recarregar dados:', error);
      }
    };
    
    // Aguardar um pouco e forçar recarregamento
    const timer = setTimeout(forceReload, 500);
    return () => clearTimeout(timer);
  }, [fetchMesociclos]);

  // Efeito adicional para garantir que a expansão seja aplicada corretamente
  useEffect(() => {
    if (mesociclos.length > 0 && macrociclos.length > 0) {
      console.log('🔄 DEBUG - CyclesOverview: Dados disponíveis, forçando expansão...');
      
      // Aguardar um pouco para garantir que o estado foi atualizado
      const timer = setTimeout(() => {
        expandMacrociclosWithMesociclos();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [mesociclos, macrociclos]);

  // Efeito adicional para forçar carregamento completo
  useEffect(() => {
    const forceCompleteLoad = async () => {
      console.log('🔄 DEBUG - CyclesOverview: Forçando carregamento completo...');
      try {
        // Forçar recarregamento múltiplas vezes
        for (let i = 0; i < 5; i++) {
          await fetchMesociclos();
          console.log(`✅ DEBUG - CyclesOverview: Recarregamento ${i + 1}/5 concluído`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Aguardar e forçar expansão final
        setTimeout(() => {
          console.log('🔄 DEBUG - CyclesOverview: Forçando expansão final após carregamento completo...');
          expandMacrociclosWithMesociclos();
        }, 500);
        
      } catch (error) {
        console.error('❌ DEBUG - CyclesOverview: Erro no carregamento completo:', error);
      }
    };
    
    // Executar carregamento completo após 1 segundo
    const timer = setTimeout(forceCompleteLoad, 1000);
    return () => clearTimeout(timer);
  }, [fetchMesociclos]);


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

  const toggleMacrocicloExpansion = (macrocicloId: string) => {
    const newExpanded = new Set(expandedMacrociclos);
    if (newExpanded.has(macrocicloId)) {
      newExpanded.delete(macrocicloId);
    } else {
      newExpanded.add(macrocicloId);
    }
    setExpandedMacrociclos(newExpanded);
  };

  const handleEditMacrociclo = (macrociclo: any) => {
    console.log('🔍 DEBUG - CyclesOverview: Editando macrociclo:', macrociclo.id);
    // TODO: Implementar edição de macrociclo
    Alert.alert('Editar Macrociclo', 'Funcionalidade de edição será implementada em breve');
  };

  const handleDeleteMacrociclo = (macrociclo: any) => {
    console.log('🔍 DEBUG - CyclesOverview: Excluindo macrociclo:', macrociclo.id);
    Alert.alert(
      'Excluir Macrociclo',
      `Tem certeza que deseja excluir o macrociclo "${macrociclo.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implementar exclusão de macrociclo
            console.log('🗑️ DEBUG - CyclesOverview: Confirmada exclusão do macrociclo:', macrociclo.id);
          }
        }
      ]
    );
  };

  const handleEditMesociclo = (mesociclo: any) => {
    console.log('🔍 DEBUG - CyclesOverview: Editando mesociclo:', mesociclo.id);
    Alert.alert('Editar Mesociclo', 'Funcionalidade de edição será implementada em breve');
  };

  const handleDeleteMesociclo = (mesociclo: any) => {
    console.log('🔍 DEBUG - CyclesOverview: Excluindo mesociclo:', mesociclo.id);
    Alert.alert(
      'Excluir Mesociclo',
      `Tem certeza que deseja excluir o mesociclo "${mesociclo.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMesociclo(mesociclo.id);
              Alert.alert('✅ Sucesso', 'Mesociclo excluído com sucesso!');
            } catch (error) {
              console.error('❌ Erro ao excluir mesociclo:', error);
              Alert.alert('❌ Erro', 'Não foi possível excluir o mesociclo.');
            }
          }
        }
      ]
    );
  };

  // Função para formatar datas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Função para calcular semanas entre duas datas
  const calculateWeeks = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  };

  // Agrupar mesociclos por macrociclo - VERSÃO CORRIGIDA
  const mesociclosByMacrociclo: Record<string, any[]> = {};
  
  console.log('🔍 DEBUG - CyclesOverview: Iniciando agrupamento de mesociclos');
  console.log('🔍 DEBUG - CyclesOverview: Total de macrociclos:', macrociclos.length);
  console.log('🔍 DEBUG - CyclesOverview: Total de mesociclos:', mesociclos.length);
  
  // Debug: Verificar todos os mesociclos antes do agrupamento
  console.log('🔍 DEBUG - CyclesOverview: TODOS os mesociclos antes do agrupamento:', mesociclos.map(m => ({
    id: m.id,
    name: m.name,
    macrociclo_id: m.macrociclo_id,
    type: m.mesociclo_type,
    start_date: m.start_date,
    end_date: m.end_date
  })));
  
  // Debug: Verificar todos os macrociclos
  console.log('🔍 DEBUG - CyclesOverview: TODOS os macrociclos:', macrociclos.map(m => ({
    id: m.id,
    name: m.name,
    created_at: m.created_at
  })));
  
  // CORREÇÃO: Agrupar mesociclos por macrociclo de forma mais robusta
  macrociclos.forEach(macrociclo => {
    // Filtrar mesociclos que pertencem a este macrociclo
    const mesociclosDoMacrociclo = mesociclos.filter(m => {
      const pertence = m.macrociclo_id === macrociclo.id;
      console.log(`🔍 DEBUG - CyclesOverview: Mesociclo ${m.name} (${m.id}) pertence ao macrociclo ${macrociclo.name} (${macrociclo.id})? ${pertence}`);
      return pertence;
    });
    
    // Ordenar por data de início
    const mesociclosOrdenados = mesociclosDoMacrociclo.sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    
    mesociclosByMacrociclo[macrociclo.id] = mesociclosOrdenados;
    
    console.log(`🔍 DEBUG - CyclesOverview: Macrociclo ${macrociclo.name} (${macrociclo.id}) tem ${mesociclosDoMacrociclo.length} mesociclos`);
    
    if (mesociclosDoMacrociclo.length > 0) {
      console.log(`🔍 DEBUG - CyclesOverview: Mesociclos do macrociclo ${macrociclo.name}:`, 
        mesociclosDoMacrociclo.map(m => ({
          id: m.id,
          name: m.name,
          type: m.mesociclo_type,
          macrociclo_id: m.macrociclo_id,
          start_date: m.start_date,
          end_date: m.end_date
        }))
      );
    } else {
      console.log(`⚠️ DEBUG - CyclesOverview: Macrociclo ${macrociclo.name} (${macrociclo.id}) NÃO tem mesociclos`);
    }
  });

  // Debug: Verificar agrupamento final
  console.log('🔍 DEBUG - CyclesOverview: Agrupamento final de mesociclos:', {
    totalMacrociclos: macrociclos.length,
    totalMesociclos: mesociclos.length,
    agrupamento: Object.keys(mesociclosByMacrociclo).map(macrocicloId => ({
      macrocicloId,
      macrocicloName: macrociclos.find(m => m.id === macrocicloId)?.name,
      mesociclosCount: mesociclosByMacrociclo[macrocicloId].length,
      mesociclos: mesociclosByMacrociclo[macrocicloId].map(m => ({
        id: m.id,
        name: m.name,
        type: m.mesociclo_type,
        macrociclo_id: m.macrociclo_id,
        start_date: m.start_date,
        end_date: m.end_date
      }))
    }))
  });

  // Debug: Verificar se há mesociclos sem macrociclo_id
  const mesociclosSemMacrociclo = mesociclos.filter(m => !m.macrociclo_id);
  if (mesociclosSemMacrociclo.length > 0) {
    console.warn('⚠️ DEBUG - CyclesOverview: Mesociclos sem macrociclo_id:', mesociclosSemMacrociclo);
  }

  // Debug: Verificar se há mesociclos órfãos
  const mesociclosOrfaos = mesociclos.filter(m => {
    const macrocicloExiste = macrociclos.some(mc => mc.id === m.macrociclo_id);
    return !macrocicloExiste;
  });
  if (mesociclosOrfaos.length > 0) {
    console.warn('⚠️ DEBUG - CyclesOverview: Mesociclos órfãos (sem macrociclo correspondente):', mesociclosOrfaos);
  }

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
          style={[styles.actionButton, { backgroundColor: '#2196F3', flex: 1 }]}
          icon="calendar-plus"
        >
          Criar Macrociclo
        </Button>
      </View>

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

      {/* Lista de Macrociclos com Gavetas */}
      {macrociclos.length > 0 && (
        <View style={styles.listSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📅 Macrociclos
          </Text>
          {macrociclos.map((macrociclo) => {
            const isExpanded = expandedMacrociclos.has(macrociclo.id);
            const mesociclosDoMacrociclo = mesociclosByMacrociclo[macrociclo.id] || [];
            
            console.log(`🔍 DEBUG - CyclesOverview: Renderizando macrociclo ${macrociclo.name}:`, {
              id: macrociclo.id,
              isExpanded,
              mesociclosCount: mesociclosDoMacrociclo.length,
              mesociclos: mesociclosDoMacrociclo.map(m => ({
                id: m.id,
                name: m.name,
                type: m.mesociclo_type
              }))
            });
            
            return (
              <Card key={macrociclo.id} style={styles.macrocicloCard}>
                <Card.Content>
                  {/* Cabeçalho do Macrociclo */}
                  <View style={styles.macrocicloHeader}>
                    <View style={styles.macrocicloInfo}>
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
                          {formatDate(macrociclo.start_date)}
                        </Chip>
                        <Chip icon="calendar-end" style={styles.dateChip}>
                          {formatDate(macrociclo.end_date)}
                        </Chip>
                      </View>
                      {macrociclo.goal && (
                        <Text variant="bodySmall" style={styles.cycleGoal}>
                          🎯 {macrociclo.goal}
                        </Text>
                      )}
                    </View>
                    
                    {/* Botão de expansão */}
                    <IconButton
                      icon={isExpanded ? "chevron-up" : "chevron-down"}
                      onPress={() => toggleMacrocicloExpansion(macrociclo.id)}
                      style={styles.expandButton}
                    />
                  </View>

                  {/* Ações do Macrociclo */}
                  <View style={styles.macrocicloActions}>
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
                    <View style={styles.actionButtonsRow}>
                      <Button
                        mode="outlined"
                        onPress={() => handleEditMacrociclo(macrociclo)}
                        style={[styles.cardActionButton, styles.editButton]}
                        icon="pencil"
                      >
                        Editar
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => handleDeleteMacrociclo(macrociclo)}
                        style={[styles.cardActionButton, styles.deleteButton]}
                        icon="delete"
                        textColor="#D32F2F"
                      >
                        Excluir
                      </Button>
                    </View>
                  </View>

                  {/* Conteúdo expansível - Mesociclos */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <Divider style={styles.divider} />
                      
                      {(() => {
                        console.log(`🔍 DEBUG - CyclesOverview: Renderizando conteúdo expansível para ${macrociclo.name}:`, {
                          isExpanded,
                          mesociclosCount: mesociclosDoMacrociclo.length,
                          mesociclos: mesociclosDoMacrociclo.map(m => ({
                            id: m.id,
                            name: m.name,
                            type: m.mesociclo_type
                          }))
                        });
                        return null;
                      })()}
                      
                      {mesociclosDoMacrociclo.length > 0 ? (
                        <View style={styles.mesociclosContainer}>
                          <Text variant="titleSmall" style={styles.mesociclosTitle}>
                            📆 Mesociclos ({mesociclosDoMacrociclo.length})
                          </Text>
                          
                          {mesociclosDoMacrociclo.map((mesociclo, index) => {
                            const tipo = mesociclo.mesociclo_type || 'sem_tipo';
                            const tipoLabel = MESOCICLO_TYPES.find(t => t.value === tipo)?.label || tipo;
                            const weeksCount = calculateWeeks(mesociclo.start_date, mesociclo.end_date);
                            
                            return (
                              <Card key={mesociclo.id} style={styles.mesocicloCard}>
                                <Card.Content>
                                  <View style={styles.mesocicloRow}>
                                    <View style={styles.mesocicloInfo}>
                                      <Text variant="bodyMedium" style={styles.mesocicloName}>
                                        {tipoLabel} - {weeksCount} semana{weeksCount > 1 ? 's' : ''}
                                      </Text>
                                      <Text variant="bodySmall" style={styles.mesocicloDates}>
                                        {formatDate(mesociclo.start_date)} a {formatDate(mesociclo.end_date)}
                                      </Text>
                                      {mesociclo.description && (
                                        <Text variant="bodySmall" style={styles.mesocicloDescription}>
                                          {mesociclo.description}
                                        </Text>
                                      )}
                                    </View>
                                    
                                    <View style={styles.mesocicloActions}>
                                      <Chip style={styles.orderChip}>
                                        <Text>#{index + 1}</Text>
                                      </Chip>
                                      <View style={styles.mesocicloActionButtons}>
                                        <IconButton
                                          icon="pencil"
                                          size={20}
                                          onPress={() => handleEditMesociclo(mesociclo)}
                                          style={styles.mesocicloActionButton}
                                        />
                                        <IconButton
                                          icon="delete"
                                          size={20}
                                          onPress={() => handleDeleteMesociclo(mesociclo)}
                                          style={[styles.mesocicloActionButton, styles.deleteIconButton]}
                                          iconColor="#D32F2F"
                                        />
                                      </View>
                                    </View>
                                  </View>
                                </Card.Content>
                              </Card>
                            );
                          })}
                        </View>
                      ) : (
                        <View style={styles.emptyMesociclos}>
                          <Text variant="bodyMedium" style={styles.emptyMesociclosText}>
                            📝 Nenhum mesociclo definido ainda
                          </Text>
                          <Text variant="bodySmall" style={styles.emptyMesociclosSubtext}>
                            Clique em "Definir Mesociclos" para começar
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </Card.Content>
              </Card>
            );
          })}
        </View>
      )}

      {/* Estado Vazio */}
      {macrociclos.length === 0 && (
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
        onDismiss={() => {
          console.log('🔍 DEBUG - CyclesOverview: Modal fechado via onDismiss');
          setDefineMesociclosModalVisible(false);
          setSelectedMacrociclo(null);
        }}
                 onSuccess={async () => {
           console.log('🔄 DEBUG - CyclesOverview: onSuccess chamado - recarregando dados');
           try {
             await fetchMesociclos(); // Buscar todos os mesociclos
             console.log('✅ DEBUG - CyclesOverview: Dados recarregados com sucesso');
           } catch (error) {
             console.error('❌ DEBUG - CyclesOverview: Erro ao recarregar dados:', error);
           }
           console.log('🔍 DEBUG - CyclesOverview: Fechando modal após onSuccess');
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
  macrocicloCard: {
    marginBottom: 16,
    elevation: 2,
  },
  macrocicloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  macrocicloInfo: {
    flex: 1,
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
    backgroundColor: '#FFF3E0',
    alignSelf: 'flex-start',
  },
  cycleGoal: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  expandButton: {
    margin: 0,
  },
  macrocicloActions: {
    marginTop: 12,
  },
  cardActionButton: {
    marginTop: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    borderColor: '#2196F3',
  },
  deleteButton: {
    flex: 1,
    borderColor: '#D32F2F',
  },
  expandedContent: {
    marginTop: 16,
  },
  divider: {
    marginBottom: 16,
  },
  mesociclosContainer: {
    gap: 12,
  },
  mesociclosTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mesocicloCard: {
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  mesocicloRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mesocicloInfo: {
    flex: 1,
  },
  mesocicloName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mesocicloDates: {
    opacity: 0.7,
    marginBottom: 4,
  },
  mesocicloDescription: {
    opacity: 0.6,
    fontStyle: 'italic',
  },
  mesocicloActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  orderChip: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-start',
  },
  mesocicloActionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  mesocicloActionButton: {
    margin: 0,
    backgroundColor: '#F5F5F5',
  },
  deleteIconButton: {
    backgroundColor: '#FFEBEE',
  },
  emptyMesociclos: {
    alignItems: 'center',
    padding: 20,
  },
  emptyMesociclosText: {
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyMesociclosSubtext: {
    textAlign: 'center',
    opacity: 0.6,
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
}); 