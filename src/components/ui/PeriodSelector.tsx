import React, { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, Portal, Modal, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type PeriodType = 'custom';

export interface PeriodSelectorProps {
  selectedPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (startDate: Date, endDate: Date) => void;
}

export default function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}: PeriodSelectorProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date>(customStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [tempEndDate, setTempEndDate] = useState<Date>(customEndDate || new Date());
  
  // Usar datas padrão se não fornecidas
  const startDate = customStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = customEndDate || new Date();

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate && onCustomDateChange) {
      onCustomDateChange(selectedDate, endDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate && onCustomDateChange) {
      onCustomDateChange(startDate, selectedDate);
    }
  };

  const handleWebDateChange = (type: 'start' | 'end', value: string) => {
    const newDate = new Date(value);
    if (onCustomDateChange) {
      if (type === 'start') {
        onCustomDateChange(newDate, endDate);
      } else {
        onCustomDateChange(startDate, newDate);
      }
    }
  };

  const handleDateChipPress = () => {
    if (Platform.OS === 'web') {
      setShowDateModal(true);
    } else {
      setShowStartPicker(true);
    }
  };

  const handleModalConfirm = () => {
    if (onCustomDateChange) {
      onCustomDateChange(tempStartDate, tempEndDate);
    }
    setShowDateModal(false);
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatDateForInput = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  const formatDateForDisplay = (date: Date) => {
    return format(date, 'dd MMM yyyy', { locale: ptBR });
  };

  // Verificar se está rodando na web
  const isWeb = Platform.OS === 'web';

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="calendar-range" size={20} color="#333" />
          <Text style={styles.title}>Período de Análise</Text>
        </View>
        
        <View style={styles.dateChipsContainer}>
          <Chip
            selected={true}
            onPress={handleDateChipPress}
            style={styles.dateChip}
            textStyle={styles.dateChipText}
            icon="calendar"
          >
            {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
          </Chip>
        </View>

        {/* Modal para seleção de datas na web */}
        {isWeb && (
          <Portal>
            <Modal
              visible={showDateModal}
              onDismiss={() => setShowDateModal(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Selecionar Período</Text>
                
                <View style={[styles.modalDateRow, Platform.OS !== 'web' && styles.modalDateRowMobile]}>
                  <Text style={styles.modalDateLabel}>De:</Text>
                  <View style={styles.modalDateInputContainer}>
                    <input
                      type="date"
                      value={formatDateForInput(tempStartDate)}
                      onChange={(e) => setTempStartDate(new Date(e.target.value))}
                      style={{
                        width: '100%',
                        padding: Platform.OS === 'web' ? '8px 12px' : '6px 10px',
                        borderWidth: 1,
                        borderColor: '#e0e0e0',
                        borderRadius: 8,
                        fontSize: Platform.OS === 'web' ? 14 : 13,
                        color: '#333',
                        backgroundColor: '#f8f9fa',
                        minHeight: Platform.OS === 'web' ? 36 : 32,
                        boxSizing: 'border-box',
                      }}
                      max={formatDateForInput(tempEndDate)}
                    />
                  </View>
                </View>
                
                <View style={[styles.modalDateRow, Platform.OS !== 'web' && styles.modalDateRowMobile]}>
                  <Text style={styles.modalDateLabel}>Até:</Text>
                  <View style={styles.modalDateInputContainer}>
                    <input
                      type="date"
                      value={formatDateForInput(tempEndDate)}
                      onChange={(e) => setTempEndDate(new Date(e.target.value))}
                      style={{
                        width: '100%',
                        padding: Platform.OS === 'web' ? '8px 12px' : '6px 10px',
                        borderWidth: 1,
                        borderColor: '#e0e0e0',
                        borderRadius: 8,
                        fontSize: Platform.OS === 'web' ? 14 : 13,
                        color: '#333',
                        backgroundColor: '#f8f9fa',
                        minHeight: Platform.OS === 'web' ? 36 : 32,
                        boxSizing: 'border-box',
                      }}
                      min={formatDateForInput(tempStartDate)}
                      max={formatDateForInput(new Date())}
                                         />
                   </View>
                </View>
                
                <View style={styles.modalButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowDateModal(false)}
                    style={styles.modalButton}
                  >
                    Cancelar
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleModalConfirm}
                    style={styles.modalButton}
                  >
                    Confirmar
                  </Button>
                </View>
              </View>
            </Modal>
          </Portal>
        )}

        {/* Date Pickers - apenas para mobile */}
        {!isWeb && showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
            maximumDate={endDate}
          />
        )}
        
        {!isWeb && showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndDateChange}
            minimumDate={startDate}
            maximumDate={new Date()}
          />
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  dateChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateChip: {
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  dateChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: {
    backgroundColor: 'white',
    padding: Platform.OS === 'web' ? 20 : 16,
    margin: Platform.OS === 'web' ? 20 : 16,
    borderRadius: 12,
    maxWidth: Platform.OS === 'web' ? 400 : '90%',
    minWidth: Platform.OS === 'web' ? 300 : 280,
    alignSelf: 'center',
    maxHeight: Platform.OS === 'web' ? 'auto' : '80%',
  },
  modalContent: {
    gap: Platform.OS === 'web' ? 16 : 12,
  },
  modalTitle: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalDateRowMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
  },
  modalDateLabel: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    fontWeight: '600',
    color: '#333',
    minWidth: Platform.OS === 'web' ? 40 : 35,
  },
  modalDateInputContainer: {
    flex: 1,
    marginLeft: Platform.OS === 'web' ? 12 : 0,
    position: 'relative',
    width: Platform.OS !== 'web' ? '100%' : undefined,
    overflow: 'hidden',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Platform.OS === 'web' ? 12 : 8,
    marginTop: Platform.OS === 'web' ? 12 : 8,
  },
  modalButton: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? 36 : 32,
  },
}); 