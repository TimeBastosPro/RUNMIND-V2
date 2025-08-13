import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Modal, Portal, TextInput, Button, Text, Chip, useTheme } from 'react-native-paper';
import { useCyclesStore } from '../../stores/cycles';
import type { CreateMacrocicloData, Macrociclo } from '../../types/database';

interface CreateMacrocicloModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
}

export default function CreateMacrocicloModal({ visible, onDismiss, onSuccess }: CreateMacrocicloModalProps) {
  const theme = useTheme();
  const { createMacrociclo, fetchMacrociclos, macrociclos } = useCyclesStore();
  
  const [formData, setFormData] = useState<CreateMacrocicloData>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    goal: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [durationWeeks, setDurationWeeks] = useState<number>(0);

  // Carregar macrociclos existentes para validação
  useEffect(() => {
    if (visible) {
      fetchMacrociclos();
    }
  }, [visible, fetchMacrociclos]);

  // Calcular duração em semanas quando as datas mudam
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      setDurationWeeks(diffWeeks);
    }
  }, [formData.start_date, formData.end_date]);



  // Validar se há sobreposição de datas
  const checkDateOverlap = (startDate: string, endDate: string): boolean => {
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    
    return macrociclos.some(macrociclo => {
      const existingStart = new Date(macrociclo.start_date);
      const existingEnd = new Date(macrociclo.end_date);
      
      // Verifica se há sobreposição
      return (newStart <= existingEnd && newEnd >= existingStart);
    });
  };

  // Converter data DD/MM/AAAA para YYYY-MM-DD
  const convertDateToISO = (dateString: string): string => {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateString;
  };

  // Converter data YYYY-MM-DD para DD/MM/AAAA
  const convertDateToDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha os campos obrigatórios (Nome, Data Início e Data Fim)');
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      Alert.alert('Data Inválida', 'A data de início deve ser anterior à data de fim');
      return;
    }

    // Validar sobreposição de datas
    if (checkDateOverlap(formData.start_date, formData.end_date)) {
      Alert.alert('Datas Sobrepostas', 'Não é possível criar macrociclos com datas sobrepostas. Verifique as datas dos macrociclos existentes.');
      return;
    }

    setLoading(true);
    try {
      await createMacrociclo(formData);
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        goal: '',
        notes: ''
      });
      setDurationWeeks(0);
      onSuccess?.();
      onDismiss();
    } catch (error) {
      console.error('Erro ao criar macrociclo:', error);
      Alert.alert('Erro', 'Erro ao criar macrociclo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      goal: '',
      notes: ''
    });
    setDurationWeeks(0);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleCancel}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text variant="headlineSmall" style={styles.title}>
            Criar Macrociclo
          </Text>
          
          <Text variant="bodyMedium" style={styles.subtitle}>
            Macrociclos são períodos longos de treinamento (meses/anos) com objetivos específicos. 
            Defina as datas de início e fim para calcular automaticamente a duração em semanas.
          </Text>

          <TextInput
            label="Nome do Macrociclo *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={styles.input}
            mode="outlined"
            placeholder="Ex: Preparação Maratona 2024"
          />

          <TextInput
            label="Objetivo do Macrociclo *"
            value={formData.goal}
            onChangeText={(text) => setFormData({ ...formData, goal: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={2}
            placeholder="Ex: Completar maratona em 3h30min"
          />

          <Text variant="bodyMedium" style={styles.sectionTitle}>
            Período do Macrociclo
          </Text>

          <TextInput
            label="Data de Início *"
            value={convertDateToDisplay(formData.start_date)}
            onChangeText={(text) => {
              const isoDate = convertDateToISO(text);
              setFormData({ ...formData, start_date: isoDate });
            }}
            style={styles.input}
            mode="outlined"
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
          />

          <TextInput
            label="Data de Fim *"
            value={convertDateToDisplay(formData.end_date)}
            onChangeText={(text) => {
              const isoDate = convertDateToISO(text);
              setFormData({ ...formData, end_date: isoDate });
            }}
            style={styles.input}
            mode="outlined"
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
          />

          {durationWeeks > 0 && (
            <Chip icon="calendar" style={styles.durationChip}>
              Duração: {durationWeeks} semana{durationWeeks > 1 ? 's' : ''}
            </Chip>
          )}

          {/* Mostrar macrociclos existentes para evitar sobreposição */}
          {macrociclos.length > 0 && (
            <View style={styles.existingCyclesSection}>
              <Text variant="bodySmall" style={styles.existingCyclesTitle}>
                Macrociclos Existentes (evite sobreposição):
              </Text>
              {macrociclos.map((macrociclo) => (
                <Chip key={macrociclo.id} style={styles.existingCycleChip}>
                  {macrociclo.name}: {convertDateToDisplay(macrociclo.start_date)} - {convertDateToDisplay(macrociclo.end_date)}
                </Chip>
              ))}
            </View>
          )}

          <TextInput
            label="Observações"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Observações adicionais sobre o macrociclo"
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={[styles.button, styles.cancelButton]}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={[styles.button, styles.submitButton]}
              loading={loading}
              disabled={loading}
            >
              Criar Macrociclo
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    borderColor: '#666',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  durationChip: {
    marginBottom: 16,
    alignSelf: 'center',
    backgroundColor: '#E3F2FD',
  },
  existingCyclesSection: {
    marginBottom: 16,
  },
  existingCyclesTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#666',
  },
  existingCycleChip: {
    marginBottom: 4,
    backgroundColor: '#F5F5F5',
  },
}); 