import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, TextInput, Button, Text, Chip, useTheme, SegmentedButtons } from 'react-native-paper';
import { useCyclesStore } from '../../stores/cycles';
import type { CreateMesocicloData, Macrociclo } from '../../types/database';

interface CreateMesocicloModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
  selectedMacrocicloId?: string;
}

export default function CreateMesocicloModal({ 
  visible, 
  onDismiss, 
  onSuccess, 
  selectedMacrocicloId 
}: CreateMesocicloModalProps) {
  const theme = useTheme();
  const { createMesociclo, fetchMacrociclos, macrociclos } = useCyclesStore();
  
  const [formData, setFormData] = useState<CreateMesocicloData>({
    macrociclo_id: selectedMacrocicloId || '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    focus: '',
    intensity_level: 'moderada',
    volume_level: 'moderado',
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchMacrociclos();
    }
  }, [visible, fetchMacrociclos]);

  useEffect(() => {
    if (selectedMacrocicloId) {
      setFormData(prev => ({ ...prev, macrociclo_id: selectedMacrocicloId }));
    }
  }, [selectedMacrocicloId]);

  const handleSubmit = async () => {
    if (!formData.macrociclo_id || !formData.name || !formData.start_date || !formData.end_date) {
      alert('Por favor, preencha os campos obrigatórios (Macrociclo, Nome, Data Início e Data Fim)');
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      alert('A data de início deve ser anterior à data de fim');
      return;
    }

    setLoading(true);
    try {
      await createMesociclo(formData);
      setFormData({
        macrociclo_id: selectedMacrocicloId || '',
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        focus: '',
        intensity_level: 'moderada',
        volume_level: 'moderado',
        notes: ''
      });
      onSuccess?.();
      onDismiss();
    } catch (error) {
      console.error('Erro ao criar mesociclo:', error);
      alert('Erro ao criar mesociclo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      macrociclo_id: selectedMacrocicloId || '',
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      focus: '',
      intensity_level: 'moderada',
      volume_level: 'moderado',
      notes: ''
    });
    onDismiss();
  };

  const selectedMacrociclo = macrociclos.find(m => m.id === formData.macrociclo_id);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleCancel}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text variant="headlineSmall" style={styles.title}>
            Criar Mesociclo
          </Text>
          
          <Text variant="bodyMedium" style={styles.subtitle}>
            Mesociclos são períodos médios de treinamento (semanas/meses) com foco específico
          </Text>

          {selectedMacrociclo && (
            <Chip icon="calendar" style={styles.macrocicloChip}>
              Macrociclo: {selectedMacrociclo.name}
            </Chip>
          )}

          <TextInput
            label="Nome do Mesociclo *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={styles.input}
            mode="outlined"
            placeholder="Ex: Base Aeróbica"
          />

          <TextInput
            label="Descrição"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Descreva o foco deste mesociclo"
          />

          <TextInput
            label="Data de Início *"
            value={formData.start_date}
            onChangeText={(text) => setFormData({ ...formData, start_date: text })}
            style={styles.input}
            mode="outlined"
            placeholder="YYYY-MM-DD"
            keyboardType="numeric"
          />

          <TextInput
            label="Data de Fim *"
            value={formData.end_date}
            onChangeText={(text) => setFormData({ ...formData, end_date: text })}
            style={styles.input}
            mode="outlined"
            placeholder="YYYY-MM-DD"
            keyboardType="numeric"
          />

          <TextInput
            label="Foco do Mesociclo"
            value={formData.focus}
            onChangeText={(text) => setFormData({ ...formData, focus: text })}
            style={styles.input}
            mode="outlined"
            placeholder="Ex: Base, Força, Velocidade, Taper"
          />

          <Text variant="bodyMedium" style={styles.sectionTitle}>
            Nível de Intensidade
          </Text>
          <SegmentedButtons
            value={formData.intensity_level || 'moderada'}
            onValueChange={(value) => setFormData({ ...formData, intensity_level: value as any })}
            buttons={[
              { value: 'baixa', label: 'Baixa' },
              { value: 'moderada', label: 'Moderada' },
              { value: 'alta', label: 'Alta' },
              { value: 'muito_alta', label: 'Muito Alta' },
            ]}
            style={styles.segmentedButton}
          />

          <Text variant="bodyMedium" style={styles.sectionTitle}>
            Nível de Volume
          </Text>
          <SegmentedButtons
            value={formData.volume_level || 'moderado'}
            onValueChange={(value) => setFormData({ ...formData, volume_level: value as any })}
            buttons={[
              { value: 'baixo', label: 'Baixo' },
              { value: 'moderado', label: 'Moderado' },
              { value: 'alto', label: 'Alto' },
              { value: 'muito_alto', label: 'Muito Alto' },
            ]}
            style={styles.segmentedButton}
          />

          <TextInput
            label="Observações"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Observações adicionais sobre o mesociclo"
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
              Criar Mesociclo
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
  macrocicloChip: {
    marginBottom: 16,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  segmentedButton: {
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
}); 