import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Modal, Portal, TextInput, Button, Text, Chip, useTheme, Checkbox, Menu, Divider } from 'react-native-paper';
import { useCyclesStore } from '../../stores/cycles';
import type { Macrociclo, CreateMesocicloData } from '../../types/database';

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
  const [mesocicloType, setMesocicloType] = useState<string>('base');
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
      
      const weeksCount = Math.ceil((endDate.getTime() - adjustedStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      
      const weeksList: WeekSelection[] = [];
      for (let i = 0; i < weeksCount; i++) {
        const weekStart = new Date(adjustedStartDate);
        weekStart.setDate(adjustedStartDate.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Segunda + 6 dias = domingo
        
        weeksList.push({
          weekNumber: i + 1,
          startDate: weekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0],
          selected: false,
          mesocicloType: undefined,
        });
      }
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
          // Se está marcando, não define tipo ainda. Se está desmarcando, mantém o tipo que tinha
          mesocicloType: newSelected ? undefined : week.mesocicloType
        };
        console.log('Semana atualizada:', newWeek);
        return newWeek;
      }
      return week;
    }));
  };

  // Aplicar tipo selecionado às semanas marcadas e desmarcar automaticamente
  useEffect(() => {
    setWeeks(prev => prev.map(week => {
      if (week.selected) {
        // Aplica o tipo e desmarca automaticamente
        return { 
          ...week, 
          mesocicloType: mesocicloType,
          selected: false 
        };
      }
      return week;
    }));
  }, [mesocicloType]);

  const handleCreateMesociclo = async () => {
    const selectedWeekData = weeks.filter(week => week.mesocicloType);
    if (selectedWeekData.length === 0) {
      Alert.alert('Semanas Selecionadas', 'Por favor, selecione pelo menos uma semana e defina o tipo');
      return;
    }

    if (!macrociclo) {
      Alert.alert('Erro', 'Macrociclo não encontrado');
      return;
    }

    setLoading(true);
    try {
      // Criar mesociclo para as semanas selecionadas
      const startDate = selectedWeekData[0].startDate;
      const endDate = selectedWeekData[selectedWeekData.length - 1].endDate;

      // Gerar nome automático baseado no tipo e semanas
      const typeLabel = MESOCICLO_TYPES.find(t => t.value === mesocicloType)?.label || mesocicloType;
      const autoName = `Mesociclo ${typeLabel} - Semanas ${selectedWeekData.map(w => w.weekNumber).join(', ')}`;

             const mesocicloData: CreateMesocicloData = {
         macrociclo_id: macrociclo!.id,
         name: autoName,
         description: `Mesociclo ${typeLabel} - Semanas ${selectedWeekData.map(w => w.weekNumber).join(', ')}`,
         start_date: startDate,
         end_date: endDate,
         focus: `Foco em ${typeLabel}`,
         mesociclo_type: mesocicloType as 'base' | 'desenvolvimento' | 'estabilizador' | 'especifico' | 'pre_competitivo' | 'polimento' | 'competitivo' | 'transicao' | 'recuperativo',
         notes: `Criado automaticamente para as semanas ${selectedWeekData.map(w => w.weekNumber).join(', ')}`,
       };

      await createMesociclo(mesocicloData);
      
      // Limpar seleções
      setWeeks(prev => prev.map(week => ({ ...week, selected: false, mesocicloType: undefined })));
      setSelectedWeeks([]);
      setMesocicloType('base');
      
      onSuccess?.();
      Alert.alert('Sucesso', 'Mesociclo criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar mesociclo:', error);
      Alert.alert('Erro', 'Erro ao criar mesociclo. Tente novamente.');
    } finally {
      setLoading(false);
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
  const selectedTypeLabel = MESOCICLO_TYPES.find(t => t.value === mesocicloType)?.label || mesocicloType;

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
                {selectedTypeLabel}
              </Button>
            }
          >
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
                      style={styles.typeChip}
                      textStyle={{ fontSize: 12 }}
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
                {selectedWeeksCount} semana{selectedWeeksCount > 1 ? 's' : ''} com tipo definido - Tipo: {selectedTypeLabel}
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
              onPress={handleCreateMesociclo}
              style={styles.submitButton}
              loading={loading}
              disabled={loading || selectedWeeksCount === 0}
            >
              Criar Mesociclo
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