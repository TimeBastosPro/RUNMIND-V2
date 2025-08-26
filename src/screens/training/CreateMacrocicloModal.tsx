import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Modal, Portal, TextInput, Button, Text, Chip, useTheme, TouchableRipple, IconButton } from 'react-native-paper';
import { useCyclesStore } from '../../stores/cycles';
import type { CreateMacrocicloData, Macrociclo } from '../../types/database';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CreateMacrocicloModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
  macrocicloToEdit?: Macrociclo | null;
  athleteId?: string; // ID do atleta quando criado por treinador
}

export default function CreateMacrocicloModal({ visible, onDismiss, onSuccess, macrocicloToEdit, athleteId }: CreateMacrocicloModalProps) {
  const theme = useTheme();
  const { createMacrociclo, updateMacrociclo, fetchMacrociclos, macrociclos } = useCyclesStore();
  
  const [formData, setFormData] = useState<CreateMacrocicloData>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    goal: ''
  });

  const [loading, setLoading] = useState(false);
  const [durationWeeks, setDurationWeeks] = useState<number>(0);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [dateOverlapError, setDateOverlapError] = useState<string>('');
  const [weeksInput, setWeeksInput] = useState<string>('');

  // Carregar macrociclos existentes para validação
  useEffect(() => {
    if (visible) {
      fetchMacrociclos();
      
      // Limpar campos ao abrir o modal
      if (!macrocicloToEdit) {
        setFormData({
          name: '',
          description: '',
          start_date: '',
          end_date: '',
          goal: ''
        });
        setDurationWeeks(0);
        setDateOverlapError('');
        setWeeksInput('');
      }
    }
  }, [visible, fetchMacrociclos, macrocicloToEdit]);

  // Preencher formulário quando estiver editando
  useEffect(() => {
    if (macrocicloToEdit) {
      // ✅ CORRIGIDO: Converter datas ISO para formato DD/MM/AAAA para exibição
      const startDateFormatted = formatDate(macrocicloToEdit.start_date);
      const endDateFormatted = formatDate(macrocicloToEdit.end_date);
      
      setFormData({
        name: macrocicloToEdit.name,
        description: macrocicloToEdit.description || '',
        start_date: startDateFormatted, // ✅ CORRIGIDO: Usar formato DD/MM/AAAA
        end_date: endDateFormatted, // ✅ CORRIGIDO: Usar formato DD/MM/AAAA
        goal: macrocicloToEdit.goal || ''
      });
      
      // ✅ NOVO: Calcular e exibir semanas automaticamente
      const weeks = calculateWeeks(macrocicloToEdit.start_date, macrocicloToEdit.end_date);
      setDurationWeeks(weeks);
      setWeeksInput(weeks.toString());
    } else {
      // Limpar formulário quando não estiver editando
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        goal: ''
      });
      setDurationWeeks(0);
      setWeeksInput('');
    }
  }, [macrocicloToEdit, visible]);

  // Calcular duração em semanas quando as datas mudam
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      // ✅ CORRIGIDO: Converter datas DD/MM/AAAA para ISO antes de calcular
      const startDateISO = convertDateToISO(formData.start_date);
      const endDateISO = convertDateToISO(formData.end_date);
      
      const weeks = calculateWeeks(startDateISO, endDateISO);
      setDurationWeeks(weeks);
      
      // Validar sobreposição usando datas ISO
      const overlap = checkDateOverlap(startDateISO, endDateISO);
      if (overlap) {
        setDateOverlapError('⚠️ Datas sobrepostas com macrociclo existente');
      } else {
        setDateOverlapError('');
      }
    }
  }, [formData.start_date, formData.end_date]);

  // Calcular semanas entre duas datas (segunda a domingo)
  const calculateWeeks = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ajustar para início da semana (segunda-feira)
    const startOfWeek = new Date(start);
    const dayOfWeek = start.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 = domingo
    startOfWeek.setDate(start.getDate() - daysToMonday);
    
    // Ajustar para fim da semana (domingo)
    const endOfWeek = new Date(end);
    const endDayOfWeek = end.getDay();
    const daysToSunday = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
    endOfWeek.setDate(end.getDate() + daysToSunday);
    
    const diffTime = Math.abs(endOfWeek.getTime() - startOfWeek.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    return diffWeeks;
  };

  // Calcular data final baseada na data inicial e número de semanas
  const calculateEndDateFromWeeks = (startDate: string, weeks: number): string => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (weeks * 7) - 1); // -1 para incluir a data inicial
    return formatDateToISO(end);
  };

  // Validar se há sobreposição de datas
  const checkDateOverlap = (startDate: string, endDate: string): boolean => {
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    
    return macrociclos.some(macrociclo => {
      // Pular o macrociclo sendo editado
      if (macrocicloToEdit && macrociclo.id === macrocicloToEdit.id) {
        return false;
      }
      
      const existingStart = new Date(macrociclo.start_date);
      const existingEnd = new Date(macrociclo.end_date);
      
      // Verifica se há sobreposição
      return (newStart <= existingEnd && newEnd >= existingStart);
    });
  };

  // Formatar data para exibição
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    // ✅ CORRIGIDO: Se já está no formato DD/MM/AAAA, retornar como está
    if (dateString.includes('/')) {
      // Verificar se não há múltiplas datas concatenadas
      const parts = dateString.split('/');
      if (parts.length === 3) {
        return dateString;
      } else {
        // Se há múltiplas datas concatenadas, pegar apenas a última
        const lastPart = dateString.split('/').slice(-3).join('/');
        return lastPart;
      }
    }
    
    // ✅ CORRIGIDO: Se é uma data ISO válida, converter para DD/MM/AAAA
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      // Formatar manualmente para DD/MM/AAAA
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '';
    }
  };

  // Converter data para formato ISO
  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Validar formato de data (DD/MM/AAAA)
  const validateDateFormat = (dateString: string): boolean => {
    // ✅ CORRIGIDO: Verificar se está vazio
    if (!dateString || dateString.trim() === '') {
      return false;
    }
    
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateString.match(dateRegex);
    if (!match) return false;
    
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);
    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
  };

  // Converter data de DD/MM/AAAA para ISO
  const convertDateToISO = (dateString: string): string => {
    // ✅ CORRIGIDO: Verificar se já está no formato ISO
    if (dateString.includes('-') && dateString.length === 10) {
      return dateString;
    }
    
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateString;
  };

  // Manipular seleção de data de início
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      // ✅ CORRIGIDO: Converter para formato DD/MM/AAAA
      const formattedDate = formatDate(formatDateToISO(selectedDate));
      setFormData({ ...formData, start_date: formattedDate });
    }
  };

  // Manipular seleção de data de fim
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      // ✅ CORRIGIDO: Converter para formato DD/MM/AAAA
      const formattedDate = formatDate(formatDateToISO(selectedDate));
      setFormData({ ...formData, end_date: formattedDate });
    }
  };

  // Manipular mudança no campo de data inicial
  const handleStartDateInputChange = (text: string) => {
    // Limpar qualquer concatenação anterior
    if (text.includes('/') && text.split('/').length > 3) {
      const parts = text.split('/');
      text = parts.slice(-3).join('/');
    }
    
    // Atualizar o estado com o texto digitado
    setFormData({ ...formData, start_date: text });
  };

  // Manipular mudança no campo de data final
  const handleEndDateInputChange = (text: string) => {
    // Limpar qualquer concatenação anterior
    if (text.includes('/') && text.split('/').length > 3) {
      const parts = text.split('/');
      text = parts.slice(-3).join('/');
    }
    
    // Atualizar o estado com o texto digitado
    setFormData({ ...formData, end_date: text });
  };

  // Função para abrir date picker no web
  const openWebDatePicker = (isStartDate: boolean) => {
    const input = document.createElement('input');
    input.type = 'date';
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.value) {
        const date = new Date(target.value);
        // ✅ CORRIGIDO: Converter para formato DD/MM/AAAA
        const formattedDate = formatDate(formatDateToISO(date));
        if (isStartDate) {
          setFormData({ ...formData, start_date: formattedDate });
        } else {
          setFormData({ ...formData, end_date: formattedDate });
        }
      }
      document.body.removeChild(input);
    };
    
    input.click();
  };

  // Manipular mudança no campo de semanas
  const handleWeeksInputChange = (text: string) => {
    setWeeksInput(text);
  };

  // Função para calcular data final baseada nas semanas
  const handleCalculateEndDate = () => {
    if (formData.start_date && weeksInput) {
      const weeks = parseInt(weeksInput);
      if (weeks > 0) {
        // ✅ CORRIGIDO: Converter data inicial para ISO, calcular e converter de volta
        const startDateISO = convertDateToISO(formData.start_date);
        const endDateISO = calculateEndDateFromWeeks(startDateISO, weeks);
        const endDateFormatted = formatDate(endDateISO);
        setFormData({ ...formData, end_date: endDateFormatted });
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha os campos obrigatórios (Nome, Data Início e Data Fim)');
      return;
    }

    // ✅ CORRIGIDO: Validar formato das datas diretamente
    if (!validateDateFormat(formData.start_date) || !validateDateFormat(formData.end_date)) {
      Alert.alert('Formato de Data Inválido', 'Por favor, use o formato DD/MM/AAAA');
      return;
    }

    // ✅ CORRIGIDO: Converter para ISO para validação
    const startDateISO = convertDateToISO(formData.start_date);
    const endDateISO = convertDateToISO(formData.end_date);

    if (new Date(startDateISO) >= new Date(endDateISO)) {
      Alert.alert('Data Inválida', 'A data de início deve ser anterior à data de fim');
      return;
    }

    // Validar sobreposição de datas
    if (checkDateOverlap(startDateISO, endDateISO)) {
      Alert.alert('Datas Sobrepostas', 'Não é possível criar macrociclos com datas sobrepostas. Verifique as datas dos macrociclos existentes.');
      return;
    }

    setLoading(true);
    try {
      if (macrocicloToEdit) {
        await updateMacrociclo(macrocicloToEdit.id, {
          ...formData,
          start_date: startDateISO,
          end_date: endDateISO
        });
      } else {
        await createMacrociclo({
          ...formData,
          start_date: startDateISO,
          end_date: endDateISO
        }, athleteId); // Passar athleteId se fornecido
      }
      
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        goal: ''
      });
      setDurationWeeks(0);
      setDateOverlapError('');
      setWeeksInput('');
      onSuccess?.();
      onDismiss();
    } catch (error) {
      console.error('Erro ao salvar macrociclo:', error);
      Alert.alert('Erro', `Erro ao ${macrocicloToEdit ? 'atualizar' : 'criar'} macrociclo. Tente novamente.`);
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
      goal: ''
    });
    setDurationWeeks(0);
    setDateOverlapError('');
    setWeeksInput('');
    onDismiss();
  };

  const isEditing = !!macrocicloToEdit;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleCancel}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text variant="headlineSmall" style={styles.title}>
            {isEditing ? 'Editar Macrociclo' : 'Criar Macrociclo'}
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

          <View style={styles.dateInputContainer}>
            <TextInput
              label="Data de Início *"
              value={formData.start_date}
              onChangeText={handleStartDateInputChange}
              style={[styles.input, styles.dateInput]}
              mode="outlined"
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
            />
            <IconButton
              icon="calendar"
              size={24}
              onPress={() => {
                if (Platform.OS === 'web') {
                  openWebDatePicker(true);
                } else {
                  setShowStartDatePicker(true);
                }
              }}
              style={styles.calendarIcon}
            />
          </View>

          <View style={styles.dateInputContainer}>
            <TextInput
              label="Data de Fim *"
              value={formData.end_date}
              onChangeText={handleEndDateInputChange}
              style={[styles.input, styles.dateInput]}
              mode="outlined"
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
            />
            <IconButton
              icon="calendar"
              size={24}
              onPress={() => {
                if (Platform.OS === 'web') {
                  openWebDatePicker(false);
                } else {
                  setShowEndDatePicker(true);
                }
              }}
              style={styles.calendarIcon}
            />
          </View>

          {/* Campo opcional para definir semanas */}
          <View style={styles.weeksInputContainer}>
            <TextInput
              label="Duração em Semanas (opcional)"
              value={weeksInput}
              onChangeText={handleWeeksInputChange}
              style={[styles.input, styles.weeksInput]}
              mode="outlined"
              placeholder="Ex: 12"
              keyboardType="numeric"
            />
            <Button
              mode="outlined"
              onPress={handleCalculateEndDate}
              style={styles.calculateButton}
            >
              Calcular
            </Button>
          </View>

          {durationWeeks > 0 && (
            <Chip icon="calendar" style={styles.durationChip}>
              Duração: {durationWeeks} semana{durationWeeks > 1 ? 's' : ''}
            </Chip>
          )}

          {dateOverlapError && (
            <Chip icon="alert" style={styles.overlapErrorChip}>
              {dateOverlapError}
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
                  {macrociclo.name}: {formatDate(macrociclo.start_date)} - {formatDate(macrociclo.end_date)}
                </Chip>
              ))}
            </View>
          )}

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
              {isEditing ? 'Atualizar Macrociclo' : 'Criar Macrociclo'}
            </Button>
          </View>
        </ScrollView>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={formData.start_date ? new Date(convertDateToISO(formData.start_date)) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'default' : 'default'}
            onChange={handleStartDateChange}
            minimumDate={new Date()}
          />
        )}
        
        {showEndDatePicker && (
          <DateTimePicker
            value={formData.end_date ? new Date(convertDateToISO(formData.end_date)) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'default' : 'default'}
            onChange={handleEndDateChange}
            minimumDate={formData.start_date ? new Date(convertDateToISO(formData.start_date)) : new Date()}
          />
        )}
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
  overlapErrorChip: {
    marginBottom: 16,
    alignSelf: 'center',
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
    borderWidth: 1,
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
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
  },
  calendarIcon: {
    marginLeft: 10,
  },
  weeksInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weeksInput: {
    flex: 1,
  },
  calculateButton: {
    marginLeft: 10,
  },
}); 