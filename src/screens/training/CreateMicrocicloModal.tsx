import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Modal, ScrollView, Alert, Platform } from 'react-native';
import { Text, Button, TextInput, IconButton, useTheme } from 'react-native-paper';
import { useCyclesStore } from '../../stores/cycles';
import type { Microciclo, CreateMicrocicloData } from '../../types/database';

interface CreateMicrocicloModalProps {
  visible: boolean;
  onDismiss: () => void;
  selectedMesocicloId: string;
  microcicloToEdit?: Microciclo | null;
  athleteId?: string; // ID do atleta quando criado por treinador
}

// Tipos de microciclo disponíveis (nomenclatura correta da periodização)
const MICROCICLO_TYPES = [
  'competitivo',
  'polimento',
  'regenerativo',
  'estabilizacao',
  'choque',
  'ordinario',
  'incorporacao'
];

// Mapeamento para exibição em português (nomenclatura correta da periodização)
const MICROCICLO_TYPE_LABELS: Record<string, string> = {
  'competitivo': 'Microciclo Competitivo',
  'polimento': 'Microciclo Polimento',
  'regenerativo': 'Microciclo Regenerativo',
  'estabilizacao': 'Microciclo de Estabilização',
  'choque': 'Microciclo de Choque',
  'ordinario': 'Microciclo Ordinário',
  'incorporacao': 'Microciclo Incorporação'
};

interface MicrocicloRow {
  id: string;
  name: string;
  focus: string;
  startDate: string;
  endDate: string;
  isSelected: boolean;
}

export default function CreateMicrocicloModal({
  visible,
  onDismiss,
  selectedMesocicloId,
  microcicloToEdit,
  athleteId
}: CreateMicrocicloModalProps) {
  const theme = useTheme();
  const { 
    mesociclos,
    microciclos,
    fetchMicrociclos,
    createMicrociclo,
    updateMicrociclo
  } = useCyclesStore();

  const [rows, setRows] = useState<MicrocicloRow[]>([]);
  const [selectedMesociclo, setSelectedMesociclo] = useState<any>(null);

  // Obter mesociclo selecionado
  useEffect(() => {
    if (selectedMesocicloId) {
      const mesociclo = mesociclos.find(m => m.id === selectedMesocicloId);
      setSelectedMesociclo(mesociclo);
    }
  }, [selectedMesocicloId, mesociclos]);

  // Obter microciclos existentes para validação
  const existingMicrociclos = useMemo(() => {
    return microciclos.filter(microciclo => microciclo.mesociclo_id === selectedMesocicloId);
  }, [microciclos, selectedMesocicloId]);

  // Inicializar modal
  useEffect(() => {
    if (visible) {
      if (microcicloToEdit) {
        // Modo edição
        setRows([{
          id: microcicloToEdit.id,
          name: microcicloToEdit.name,
          focus: microcicloToEdit.focus || 'ordinario',
          startDate: microcicloToEdit.start_date,
          endDate: microcicloToEdit.end_date,
          isSelected: true
        }]);
      } else {
        // Modo criação
        setRows([{
          id: Date.now().toString(),
          name: '',
          focus: 'ordinario',
          startDate: '',
          endDate: '',
          isSelected: true
        }]);
      }
    }
  }, [visible, microcicloToEdit]);

  // Calcular datas do microciclo baseado na data do mesociclo
  const calculateMicrocicloDates = (mesocicloStartDate: string, weekNumber: number) => {
    const startDate = new Date(mesocicloStartDate);
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (weekNumber - 1) * 7);
    
    // Ajustar para segunda-feira
    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - daysToMonday);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0]
    };
  };

  // Gerar microciclos automaticamente
  const generateMicrociclos = () => {
    if (!selectedMesociclo) return;
    
    const mesocicloWeeks = Math.ceil(
      (new Date(selectedMesociclo.end_date).getTime() - new Date(selectedMesociclo.start_date).getTime()) / 
      (1000 * 60 * 60 * 24 * 7)
    );
    
    const newRows: MicrocicloRow[] = [];
    for (let week = 1; week <= mesocicloWeeks; week++) {
      const dates = calculateMicrocicloDates(selectedMesociclo.start_date, week);
      newRows.push({
        id: Date.now().toString() + week,
        name: `Semana ${week}`,
        focus: 'ordinario',
        startDate: dates.start,
        endDate: dates.end,
        isSelected: true
      });
    }
    setRows(newRows);
  };

  // Adicionar nova linha
  const addNewRow = () => {
    const newRow: MicrocicloRow = {
      id: Date.now().toString(),
      name: '',
      focus: 'ordinario',
      startDate: '',
      endDate: '',
      isSelected: true
    };
    setRows([...rows, newRow]);
  };

  // Remover linha
  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  // Atualizar linha
  const updateRow = (id: string, field: keyof MicrocicloRow, value: string | boolean) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Selecionar/deselecionar linha
  const toggleRowSelection = (id: string) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, isSelected: !row.isSelected } : row
    ));
  };

  // Salvar microciclos
  const handleSave = async () => {
    try {
      const selectedRows = rows.filter(row => row.isSelected);
      
      if (selectedRows.length === 0) {
        Alert.alert('Erro', 'Selecione pelo menos um microciclo para salvar.');
        return;
      }

      for (const row of selectedRows) {
        if (!row.name.trim()) {
          Alert.alert('Erro', 'Todos os microciclos devem ter um nome.');
          return;
        }

                 const microcicloData: CreateMicrocicloData = {
           name: row.name.trim(),
           focus: row.focus,
           start_date: row.startDate || new Date().toISOString().split('T')[0],
           end_date: row.endDate || new Date().toISOString().split('T')[0],
           mesociclo_id: selectedMesocicloId,
           intensity_level: 'moderada',
           volume_level: 'moderado'
         };

        if (microcicloToEdit && row.id === microcicloToEdit.id) {
          await updateMicrociclo(microcicloToEdit.id, microcicloData);
        } else {
          await createMicrociclo(microcicloData, athleteId);
        }
      }

      Alert.alert('Sucesso', 'Microciclos salvos com sucesso!');
      onDismiss();
    } catch (error) {
      console.error('Erro ao salvar microciclos:', error);
      Alert.alert('Erro', 'Erro ao salvar microciclos. Tente novamente.');
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              {microcicloToEdit ? 'Editar Microciclo' : 'Criar Microciclos'}
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
            />
          </View>

          <ScrollView style={styles.content}>
            {selectedMesociclo && (
              <View style={styles.mesocicloInfo}>
                <Text variant="bodyMedium" style={styles.mesocicloName}>
                  Mesociclo: {selectedMesociclo.name}
                </Text>
                <Text variant="bodySmall" style={styles.mesocicloDates}>
                  {selectedMesociclo.start_date} - {selectedMesociclo.end_date}
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={generateMicrociclos}
                icon="plus"
                style={styles.generateButton}
              >
                Gerar Microciclos Automaticamente
              </Button>
            </View>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>Nome</Text>
                <Text style={styles.headerCell}>Tipo</Text>
                <Text style={styles.headerCell}>Data Início</Text>
                <Text style={styles.headerCell}>Data Fim</Text>
                <Text style={styles.headerCell}>Ações</Text>
              </View>

              {rows.map((row) => (
                <View key={row.id} style={styles.tableRow}>
                  <View style={styles.cell}>
                    <TextInput
                      value={row.name}
                      onChangeText={(text) => updateRow(row.id, 'name', text)}
                      placeholder="Nome do microciclo"
                      dense
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.cell}>
                    <View style={styles.typeSection}>
                      <TextInput
                        value={row.focus}
                        onChangeText={(text) => updateRow(row.id, 'focus', text)}
                        placeholder="Tipo"
                        dense
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <View style={styles.cell}>
                    <TextInput
                      value={row.startDate}
                      onChangeText={(text) => updateRow(row.id, 'startDate', text)}
                      placeholder="DD/MM/AAAA"
                      dense
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.cell}>
                    <TextInput
                      value={row.endDate}
                      onChangeText={(text) => updateRow(row.id, 'endDate', text)}
                      placeholder="DD/MM/AAAA"
                      dense
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.cell}>
                    <View style={styles.rowActions}>
                      <IconButton
                        icon={row.isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                        size={20}
                        onPress={() => toggleRowSelection(row.id)}
                      />
                      {rows.length > 1 && (
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => removeRow(row.id)}
                        />
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <Button
              mode="outlined"
              onPress={addNewRow}
              icon="plus"
              style={styles.addButton}
            >
              Adicionar Microciclo
            </Button>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.cancelButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
            >
              {microcicloToEdit ? 'Atualizar' : 'Salvar'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '90%',
    maxWidth: 800,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  mesocicloInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  mesocicloName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mesocicloDates: {
    color: '#666',
  },
  actions: {
    marginBottom: 16,
  },
  generateButton: {
    marginBottom: 8,
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  input: {
    backgroundColor: 'transparent',
  },
  typeSection: {
    position: 'relative',
    zIndex: 1,
  },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addButton: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
}); 