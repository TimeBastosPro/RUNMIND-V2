import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Modal, Portal, TextInput, Button, Text, Chip, useTheme, Checkbox, Menu, Divider } from 'react-native-paper';
import { useCyclesStore } from '../../stores/cycles';
import type { Macrociclo, CreateMesocicloData } from '../../types/database';
import { supabase } from '../../services/supabase';

interface DefineMesociclosModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
  macrociclo: Macrociclo | null;
}

interface WeekSelection {
  weekNumber: number;
  startDate: string;
  endDate: string;
  selected: boolean;
  mesocicloType?: string;
}

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

export default function DefineMesociclosModal({ visible, onDismiss, onSuccess, macrociclo }: DefineMesociclosModalProps) {
  const theme = useTheme();
  const { createMesociclo } = useCyclesStore();
  
  const [weeks, setWeeks] = useState<WeekSelection[]>([]);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [mesocicloType, setMesocicloType] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);


  // Gerar semanas do macrociclo (segunda a domingo)
  useEffect(() => {
    if (macrociclo && visible) {
      const startDate = new Date(macrociclo.start_date);
      const endDate = new Date(macrociclo.end_date);
      
      // Ajustar para começar na segunda-feira
      const dayOfWeek = startDate.getDay(); // 0 = domingo, 1 = segunda, etc.
      const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
      
      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setDate(startDate.getDate() + daysToMonday);
      
      // Calcular número total de semanas
      const totalDays = Math.ceil((endDate.getTime() - adjustedStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksCount = Math.ceil(totalDays / 7);
      
      console.log('🔍 DEBUG - Cálculo de semanas:', {
        originalStart: startDate.toISOString().split('T')[0],
        originalEnd: endDate.toISOString().split('T')[0],
        adjustedStart: adjustedStartDate.toISOString().split('T')[0],
        dayOfWeek,
        daysToMonday,
        totalDays,
        weeksCount
      });
      
      const weeksList: WeekSelection[] = [];
      for (let i = 0; i < weeksCount; i++) {
        const weekStart = new Date(adjustedStartDate);
        weekStart.setDate(adjustedStartDate.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Segunda + 6 dias = domingo
        
        // Verificar se a semana está dentro do período do macrociclo
        if (weekStart <= endDate) {
          weeksList.push({
            weekNumber: i + 1,
            startDate: weekStart.toISOString().split('T')[0],
            endDate: weekEnd.toISOString().split('T')[0],
            selected: false,
            mesocicloType: undefined,
          });
        }
      }
      
      console.log('🔍 DEBUG - Semanas geradas:', weeksList.map(w => ({
        week: w.weekNumber,
        start: w.startDate,
        end: w.endDate
      })));
      
      setWeeks(weeksList);
    }
  }, [macrociclo, visible]);

  // Converter data YYYY-MM-DD para DD/MM/AAAA
  const convertDateToDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  const handleWeekToggle = (weekNumber: number) => {
    console.log('Toggle semana:', weekNumber, 'Tipo atual:', mesocicloType);
    setWeeks(prev => prev.map(week => {
      if (week.weekNumber === weekNumber) {
        const newSelected = !week.selected;
        const newWeek = {
          ...week,
          selected: newSelected,
          // Mantém o tipo que já tinha, não aplica novo tipo aqui
          mesocicloType: week.mesocicloType
        };
        console.log('Semana atualizada:', newWeek);
        return newWeek;
      }
      return week;
    }));
  };

  // Aplicar tipo às semanas marcadas e desmarcar automaticamente
  useEffect(() => {
    if (mesocicloType) {
      console.log('🔍 DEBUG - Aplicando tipo:', mesocicloType, 'às semanas marcadas');
      setWeeks(prev => {
        const updatedWeeks = prev.map(week => {
          if (week.selected) {
            console.log('🔍 DEBUG - Aplicando tipo à semana:', week.weekNumber);
            // Aplica o tipo e desmarca automaticamente
            return {
              ...week,
              mesocicloType: mesocicloType,
              selected: false
            };
          }
          return week;
        });
        console.log('🔍 DEBUG - Semanas atualizadas:', updatedWeeks.filter(w => w.mesocicloType).length, 'com tipo');
        return updatedWeeks;
      });
    }
  }, [mesocicloType]);

  const handleCreateMesociclos = async () => {
    console.log('🔍 DEBUG - DefineMesociclosModal: handleCreateMesociclos iniciado');
    console.log('🔍 DEBUG - DefineMesociclosModal: macrociclo:', macrociclo?.id);
    
    if (!macrociclo) {
      console.error('❌ DEBUG - DefineMesociclosModal: Macrociclo não encontrado');
      Alert.alert('Erro', 'Macrociclo não encontrado');
      return;
    }

    const selectedWeeks = weeks.filter(week => week.mesocicloType);
    console.log('🔍 DEBUG - DefineMesociclosModal: Semanas com tipo encontradas:', selectedWeeks.length);
    console.log('🔍 DEBUG - DefineMesociclosModal: Detalhes das semanas:', selectedWeeks.map(w => ({ week: w.weekNumber, type: w.mesocicloType })));
    
    if (selectedWeeks.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos uma semana com tipo definido');
      return;
    }

    setLoading(true); // Set loading state
    let createdCount = 0; // Contador de mesociclos criados com sucesso
    
    // Timeout de segurança para evitar travamento
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ DEBUG - DefineMesociclosModal: Timeout de segurança - resetando loading');
      setLoading(false);
    }, 30000); // 30 segundos
    
    try {
      console.log('🔍 DEBUG - DefineMesociclosModal: Iniciando criação de mesociclos');
      console.log('🔍 DEBUG - DefineMesociclosModal: Semanas com tipo:', selectedWeeks.map(w => ({ week: w.weekNumber, type: w.mesocicloType })));
      
      // Agrupar semanas por tipo
      const weeksByType = selectedWeeks.reduce((groups, week) => {
        const type = week.mesocicloType!;
        if (!groups[type]) {
          groups[type] = [];
        }
        groups[type].push(week);
        return groups;
      }, {} as Record<string, typeof selectedWeeks>);

      console.log('🔍 DEBUG - DefineMesociclosModal: Semanas agrupadas por tipo:', weeksByType);

      // Criar um mesociclo para cada tipo
      for (const [type, typeWeeks] of Object.entries(weeksByType)) {
        // Ordenar semanas do tipo por número
        const sortedWeeks = [...typeWeeks].sort((a, b) => a.weekNumber - b.weekNumber);
        
        // Calcular datas do mesociclo baseado nas semanas do tipo
        const firstWeek = sortedWeeks[0];
        const lastWeek = sortedWeeks[sortedWeeks.length - 1];
        
        // Data de início: início da primeira semana
        const startDate = new Date(firstWeek.startDate);
        // Data de fim: fim da última semana (domingo)
        const endDate = new Date(lastWeek.endDate);
        
        // Verificar se as datas estão corretas
        if (startDate >= endDate) {
          Alert.alert('Erro de Datas', 'Data de início deve ser menor que data de fim');
          return;
        }

        // Verificar se já existe um mesociclo com sobreposição de datas
        console.log('🔍 DEBUG - DefineMesociclosModal: Verificando sobreposição para tipo:', type);
        console.log('🔍 DEBUG - DefineMesociclosModal: Datas - início:', startDate.toISOString().split('T')[0], 'fim:', endDate.toISOString().split('T')[0]);
        
        const { data: overlappingMesociclos, error: overlapError } = await supabase
          .from('mesociclos')
          .select('*')
          .eq('macrociclo_id', macrociclo.id)
          .or(`start_date.lte.${endDate.toISOString().split('T')[0]},end_date.gte.${startDate.toISOString().split('T')[0]}`);

        if (overlapError) {
          console.error('❌ Erro ao verificar sobreposição:', overlapError);
        }

        console.log('🔍 DEBUG - DefineMesociclosModal: Mesociclos sobrepostos encontrados:', overlappingMesociclos?.length || 0);

        if (overlappingMesociclos && overlappingMesociclos.length > 0) {
          console.log('❌ DEBUG - DefineMesociclosModal: Sobreposição detectada, parando criação');
          Alert.alert('Sobreposição de Datas', 'Existe sobreposição com outro mesociclo. Verifique as datas selecionadas.');
          continue; // Continua para o próximo tipo em vez de parar tudo
        }

        const tipoLabel = MESOCICLO_TYPES.find(t => t.value === type)?.label || type;
        const autoName = `${tipoLabel}`;

        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔍 DEBUG - DefineMesociclosModal: Usuário autenticado:', user?.id);
        
        if (!user) {
          console.error('❌ DEBUG - DefineMesociclosModal: Usuário não autenticado');
          Alert.alert('Erro', 'Usuário não autenticado');
          return;
        }

        const mesocicloData = {
          macrociclo_id: macrociclo.id,
          name: autoName,
          description: `Mesociclo ${tipoLabel} - Semanas ${sortedWeeks.map(w => w.weekNumber).join(', ')}`,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          mesociclo_type: type,
          focus: `Foco em ${tipoLabel.toLowerCase()}`,
          intensity_level: 'moderada' as const,
          volume_level: 'moderado' as const,
          notes: `Criado automaticamente para semanas ${sortedWeeks.map(w => w.weekNumber).join(', ')}`,
          user_id: user.id
        };

        console.log('🔍 DEBUG - DefineMesociclosModal: Dados do mesociclo:', mesocicloData);
        console.log('🔍 DEBUG - DefineMesociclosModal: Tentando inserir no banco...');

        const { data: newMesociclo, error } = await supabase
          .from('mesociclos')
          .insert([mesocicloData])
          .select()
          .single();

        if (error) {
          console.error('❌ Erro ao criar mesociclo:', error);
          console.error('❌ Detalhes do erro:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          Alert.alert('Erro', 'Erro ao salvar mesociclo: ' + error.message);
          continue; // Continua para o próximo mesociclo em vez de parar
        }

        console.log('✅ DEBUG - DefineMesociclosModal: Mesociclo criado com sucesso:', newMesociclo);
        createdCount++; // Incrementar contador de sucessos
      }
      
      // Limpar seleções
      setWeeks(prev => prev.map(week => ({ ...week, selected: false, mesocicloType: undefined })));
      
      console.log('✅ DEBUG - DefineMesociclosModal: Mesociclos criados com sucesso!');
      console.log('✅ DEBUG - DefineMesociclosModal: Total criado:', createdCount, 'de', Object.keys(weeksByType).length, 'tipos');
      Alert.alert('Sucesso', `${createdCount} mesociclo(s) criado(s) com sucesso!`);
      onSuccess?.();
      
    } catch (error) {
      console.error('❌ Erro ao criar mesociclo:', error);
      Alert.alert('Erro', 'Erro inesperado ao criar mesociclo');
    } finally {
      console.log('🔍 DEBUG - DefineMesociclosModal: Finalizando função, resetando loading');
      clearTimeout(timeoutId); // Limpar timeout
      setLoading(false); // Sempre resetar loading state
    }
  };

  const handleCancel = () => {
    setWeeks(prev => prev.map(week => ({ ...week, selected: false, mesocicloType: undefined })));
    setSelectedWeeks([]);
    setMesocicloType('base');
    onDismiss();
  };

  const selectedWeeksCount = weeks.filter(week => week.mesocicloType).length;
  const totalWeeksCount = weeks.length;
  
  console.log('🔍 DEBUG - DefineMesociclosModal: selectedWeeksCount:', selectedWeeksCount, 'loading:', loading);
  
  // Contar tipos diferentes selecionados
  const selectedTypes = [...new Set(weeks.filter(w => w.mesocicloType).map(w => w.mesocicloType))];
  const selectedTypesLabels = selectedTypes.map(type => MESOCICLO_TYPES.find(t => t.value === type)?.label).join(', ');

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        dismissable={true} // Sempre permitir sair
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        {/* Cabeçalho fixo */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Definir Mesociclos
          </Text>
          
          <Text variant="bodyMedium" style={styles.subtitle}>
            Selecione as semanas e defina o tipo de mesociclo para o período escolhido
          </Text>

          {macrociclo && (
            <View style={styles.macrocicloInfo}>
              <Chip icon="calendar" style={styles.macrocicloChip}>
                {macrociclo.name}: {convertDateToDisplay(macrociclo.start_date)} - {convertDateToDisplay(macrociclo.end_date)}
              </Chip>
              <Text variant="bodySmall" style={styles.totalWeeks}>
                Total de {totalWeeksCount} semanas (segunda a domingo)
              </Text>
            </View>
          )}

          <Text variant="bodyMedium" style={styles.sectionTitle}>
            Tipo de Mesociclo
          </Text>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                style={styles.dropdownButton}
                icon="menu-down"
              >
                {mesocicloType ? MESOCICLO_TYPES.find(t => t.value === mesocicloType)?.label : 'Escolher Tipo'}
              </Button>
            }
          >
            <Menu.Item
              key="empty"
              onPress={() => {
                setMesocicloType('');
                setMenuVisible(false);
              }}
              title="Nenhum tipo"
              leadingIcon={mesocicloType === '' ? "check" : undefined}
            />
            {MESOCICLO_TYPES.map((type) => (
              <Menu.Item
                key={type.value}
                onPress={() => {
                  setMesocicloType(type.value);
                  setMenuVisible(false);
                }}
                title={type.label}
                leadingIcon={mesocicloType === type.value ? "check" : undefined}
              />
            ))}
          </Menu>

          <Text variant="bodyMedium" style={styles.sectionTitle}>
            Selecionar Semanas ({selectedWeeksCount} com tipo definido)
          </Text>
        </View>

        {/* Lista de semanas com rolagem */}
        <ScrollView 
          style={styles.weeksScrollView}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.weeksScrollContent}
        >
          <View style={styles.weeksContainer}>
            {weeks.map((week) => (
              <View key={week.weekNumber} style={styles.weekRow}>
                <Checkbox
                  status={week.selected ? 'checked' : 'unchecked'}
                  onPress={() => handleWeekToggle(week.weekNumber)}
                />
                <View style={styles.weekInfo}>
                  <Text variant="bodyMedium" style={styles.weekNumber}>
                    Semana {week.weekNumber}
                  </Text>
                  <Text variant="bodySmall" style={styles.weekDates}>
                    {convertDateToDisplay(week.startDate)} - {convertDateToDisplay(week.endDate)}
                  </Text>
                  {week.mesocicloType && (
                    <Chip 
                      style={[styles.typeChip, { 
                        backgroundColor: week.selected ? '#E8F5E8' : '#2196F3',
                        opacity: week.selected ? 1 : 0.9
                      }]}
                      textStyle={{ fontSize: 12, color: week.selected ? '#000' : '#FFF' }}
                    >
                      {MESOCICLO_TYPES.find(t => t.value === week.mesocicloType)?.label}
                    </Chip>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Resumo e botões fixos */}
        <View style={styles.footer}>
          {selectedWeeksCount > 0 && (
            <Chip icon="calendar-check" style={styles.selectedChip}>
              <Text>
                {selectedWeeksCount} semana{selectedWeeksCount > 1 ? 's' : ''} com tipo definido - Tipos: {selectedTypesLabels}
              </Text>
            </Chip>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.cancelButton}
              disabled={false} // Sempre permitir cancelar
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                console.log('🔍 DEBUG - DefineMesociclosModal: Botão "Criar Mesociclos" clicado');
                console.log('🔍 DEBUG - DefineMesociclosModal: loading:', loading, 'selectedWeeksCount:', selectedWeeksCount);
                handleCreateMesociclos();
              }}
              style={styles.submitButton}
              loading={loading}
              disabled={loading || selectedWeeksCount === 0}
            >
              Criar Mesociclos
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '90%',
    flexDirection: 'column',
  },
  header: {
    flexShrink: 0, // Não permite que o cabeçalho encolha
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  macrocicloInfo: {
    marginBottom: 16,
    alignItems: 'center',
  },
  macrocicloChip: {
    marginBottom: 8,
    backgroundColor: '#E3F2FD',
  },
  totalWeeks: {
    opacity: 0.7,
    fontStyle: 'italic',
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  dropdownButton: {
    marginBottom: 16,
  },
  weeksScrollView: {
    flex: 1, // Ocupa o espaço disponível
    maxHeight: 300, // Altura máxima para a lista de semanas
  },
  weeksScrollContent: {
    paddingBottom: 8,
  },
  weeksContainer: {
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  weekInfo: {
    flex: 1,
    marginLeft: 8,
  },
  weekNumber: {
    fontWeight: 'bold',
  },
  weekDates: {
    opacity: 0.7,
  },
  typeChip: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8',
  },

  selectedChip: {
    marginBottom: 16,
    alignSelf: 'center',
    backgroundColor: '#E8F5E8',
  },
  footer: {
    flexShrink: 0, // Não permite que o footer encolha
    marginTop: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2196F3',
  },
}); 