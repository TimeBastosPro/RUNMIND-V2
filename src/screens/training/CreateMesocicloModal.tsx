import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Modal,
  TextInput,
  Button,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';

import { useCyclesStore } from '../../stores/cycles';
import { Mesociclo, CreateMesocicloData } from '../../types/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CreateMesocicloModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
  selectedMacrocicloId: string;
  mesocicloToEdit?: Mesociclo | null;
}

interface MesocicloRow {
  id?: string;
  number: number;
  type: string;
  startDate: string;
  endDate: string;
  isSelected: boolean;
  isNew?: boolean;
}

const MESOCICLO_TYPES = [
  'Ordinário',
  'Estabilizador', 
  'Choque',
  'Regenerativo',
  'Pré-competitivo',
  'Competitivo'
];

export default function CreateMesocicloModal({
  visible,
  onDismiss,
  onSuccess,
  selectedMacrocicloId,
  mesocicloToEdit
}: CreateMesocicloModalProps) {
  const { createMesociclo, updateMesociclo, deleteMesociclo, mesociclos, macrociclos } = useCyclesStore();
  const [loading, setLoading] = useState(false);
  const [mesocicloRows, setMesocicloRows] = useState<MesocicloRow[]>([]);
  const [selectedType, setSelectedType] = useState('Ordinário');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Get existing mesociclos for this macrociclo
  const existingMesociclos = useMemo(() => 
    mesociclos.filter(m => m.macrociclo_id === selectedMacrocicloId),
    [mesociclos, selectedMacrocicloId]
  );

  useEffect(() => {
    if (visible) {
      if (mesocicloToEdit) {
        // Edit mode - populate with existing data
        const existingRows = existingMesociclos.map((mesociclo, index) => ({
          id: mesociclo.id,
          number: index + 1,
          type: mesociclo.focus || 'Ordinário',
          startDate: formatDate(mesociclo.start_date),
          endDate: formatDate(mesociclo.end_date),
          isSelected: false,
          isNew: false
        }));
        setMesocicloRows(existingRows);
      } else {
        // Create mode - start with empty rows
        setMesocicloRows([]);
      }
    }
  }, [visible, mesocicloToEdit, existingMesociclos]);

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    if (dateString.includes('/')) return dateString;
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '';
    }
  };

  const convertDateToISO = (dateString: string): string => {
    console.log('🔄 Convertendo data:', dateString);
    
    if (!dateString || dateString.trim() === '') {
      throw new Error('Data vazia');
    }
    
    // Se já está no formato ISO, retorna como está
    if (dateString.includes('-') && dateString.length === 10) {
      console.log('✅ Data já em formato ISO:', dateString);
      return dateString;
    }
    
    // Converter de DD/MM/YYYY para YYYY-MM-DD
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log('✅ Data convertida:', dateString, '→', isoDate);
      return isoDate;
    }
    
    console.error('❌ Formato de data inválido:', dateString);
    throw new Error(`Formato de data inválido: ${dateString}`);
  };

  // Função para calcular datas dos mesociclos baseadas no macrociclo
  const calculateMesocicloDates = (macrocicloStartDate: string, mesocicloNumber: number, weeksPerMesociclo: number = 4): { startDate: string, endDate: string } => {
    const startDate = new Date(macrocicloStartDate);
    const mesocicloStart = new Date(startDate);
    
    // Calcular o início do mesociclo (cada mesociclo dura aproximadamente 4 semanas)
    const startWeek = (mesocicloNumber - 1) * weeksPerMesociclo + 1;
    mesocicloStart.setDate(startDate.getDate() + (startWeek - 1) * 7);
    
    // Ajustar para segunda-feira (0 = domingo, 1 = segunda, 2 = terça, etc.)
    const dayOfWeek = mesocicloStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
    mesocicloStart.setDate(mesocicloStart.getDate() + daysToMonday);
    
    // Calcular o fim do mesociclo (4 semanas depois, terminando no domingo)
    const mesocicloEnd = new Date(mesocicloStart);
    mesocicloEnd.setDate(mesocicloStart.getDate() + (weeksPerMesociclo * 7) - 1);
    
    return {
      startDate: formatDate(mesocicloStart.toISOString().split('T')[0]),
      endDate: formatDate(mesocicloEnd.toISOString().split('T')[0])
    };
  };

  // Função para gerar mesociclos automaticamente
  const generateMesociclos = () => {
    const selectedMacrociclo = macrociclos.find(m => m.id === selectedMacrocicloId);
    if (!selectedMacrociclo) return;

    // Calcular número total de semanas do macrociclo
    const startDate = new Date(selectedMacrociclo.start_date);
    const endDate = new Date(selectedMacrociclo.end_date);
    const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));

    console.log('Debug - Geração de Mesociclos:', {
      macrocicloStart: selectedMacrociclo.start_date,
      macrocicloEnd: selectedMacrociclo.end_date,
      totalWeeks
    });

    const newRows: MesocicloRow[] = [];
    for (let i = 1; i <= totalWeeks; i++) {
      const dates = calculateMesocicloDates(selectedMacrociclo.start_date, i, 1); // 1 semana por linha
      
      // Verificar se a semana não ultrapassa o fim do macrociclo
      const weekEndDate = new Date(dates.endDate);
      if (weekEndDate > endDate) {
        // Ajustar a data de fim para não ultrapassar o macrociclo
        dates.endDate = formatDate(endDate.toISOString().split('T')[0]);
      }
      
      console.log(`Debug - Semana ${i}:`, {
        startDate: dates.startDate,
        endDate: dates.endDate
      });
      
      newRows.push({
        number: i,
        type: '', // Tipo em branco para ser escolhido pelo usuário
        startDate: dates.startDate,
        endDate: dates.endDate,
        isSelected: false,
        isNew: true
      });
    }
    setMesocicloRows(newRows);
  };

  const validateDateFormat = (dateString: string): boolean => {
    if (!dateString || dateString.trim() === '') return false;
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(dateString)) return false;
    
    const [, day, month, year] = dateString.match(dateRegex)!;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.getDate() === parseInt(day) &&
           date.getMonth() === parseInt(month) - 1 &&
           date.getFullYear() === parseInt(year);
  };

  const addNewRow = () => {
    const selectedMacrociclo = macrociclos.find(m => m.id === selectedMacrocicloId);
    if (!selectedMacrociclo) {
      Alert.alert('Erro', 'Macrociclo não encontrado');
      return;
    }

    // Calcular o próximo número de semana
    const nextWeekNumber = mesocicloRows.length + 1;
    const dates = calculateMesocicloDates(selectedMacrociclo.start_date, nextWeekNumber, 1);
    
    // Verificar se a semana não ultrapassa o fim do macrociclo
    const endDate = new Date(selectedMacrociclo.end_date);
    const weekEndDate = new Date(dates.endDate);
    if (weekEndDate > endDate) {
      dates.endDate = formatDate(endDate.toISOString().split('T')[0]);
    }
    
    const newRow: MesocicloRow = {
      number: nextWeekNumber,
      type: '', // Tipo em branco para ser escolhido pelo usuário
      startDate: dates.startDate,
      endDate: dates.endDate,
      isSelected: false,
      isNew: true
    };
    setMesocicloRows([...mesocicloRows, newRow]);
  };

  const updateRow = (index: number, field: keyof MesocicloRow, value: any) => {
    const updatedRows = [...mesocicloRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setMesocicloRows(updatedRows);
  };

  const deleteRow = (index: number) => {
    const row = mesocicloRows[index];
    if (row.id) {
      // Delete from database
      Alert.alert(
        'Confirmar exclusão',
        'Tem certeza que deseja excluir este mesociclo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteMesociclo(row.id!);
                const updatedRows = mesocicloRows.filter((_, i) => i !== index);
                setMesocicloRows(updatedRows);
              } catch (error) {
                Alert.alert('Erro', 'Erro ao excluir mesociclo');
              }
            }
          }
        ]
      );
    } else {
      // Just remove from local state
      const updatedRows = mesocicloRows.filter((_, i) => i !== index);
      setMesocicloRows(updatedRows);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('🔄 Salvando mesociclos:', mesocicloRows);
      console.log('🔄 Modo de edição:', !!mesocicloToEdit);
      console.log('🔄 Total de linhas:', mesocicloRows.length);
      
      // Filtrar apenas linhas que têm dados válidos
      const validRows = mesocicloRows.filter(row => {
        const hasValidDates = row.startDate && row.endDate;
        const hasValidType = row.type && row.type.trim();
        console.log(`Linha ${row.number}:`, { hasValidDates, hasValidType, type: row.type });
        return hasValidDates && hasValidType;
      });
      
      console.log('🔄 Linhas válidas para salvar:', validRows.length);
      
      if (validRows.length === 0) {
        Alert.alert('Erro', 'Nenhum mesociclo válido para salvar. Verifique se todos têm datas e tipos preenchidos.');
        setLoading(false);
        return;
      }
      
      if (mesocicloToEdit) {
        // Modo de edição - atualizar mesociclo existente
        console.log('🔄 Modo de edição - atualizando mesociclo:', mesocicloToEdit.id);
        
        const firstValidRow = validRows[0];
        const updateData = {
          name: `Mesociclo ${firstValidRow.number}`,
          start_date: convertDateToISO(firstValidRow.startDate),
          end_date: convertDateToISO(firstValidRow.endDate),
          focus: firstValidRow.type.trim(),
          intensity_level: 'moderada' as const,
          volume_level: 'moderado' as const
        };
        
        console.log('📝 Atualizando mesociclo:', updateData);
        const result = await updateMesociclo(mesocicloToEdit.id, updateData);
        console.log('✅ Mesociclo atualizado:', result);
        
        Alert.alert('Sucesso', 'Mesociclo atualizado com sucesso!');
        onSuccess();
        onDismiss();
      } else {
        // Modo de criação - criar novos mesociclos
        console.log('🔄 Modo de criação - criando novos mesociclos');
        
        // Testar com apenas o primeiro mesociclo válido
        const firstValidRow = validRows[0];
        console.log('🔄 Testando com primeiro mesociclo válido:', firstValidRow);
        
        try {
          const mesocicloData: CreateMesocicloData = {
            macrociclo_id: selectedMacrocicloId,
            name: `Mesociclo ${firstValidRow.number}`,
            start_date: convertDateToISO(firstValidRow.startDate),
            end_date: convertDateToISO(firstValidRow.endDate),
            focus: firstValidRow.type.trim(),
            intensity_level: 'moderada' as const,
            volume_level: 'moderado' as const
          };
          console.log('📝 Criando mesociclo de teste:', mesocicloData);
          const result = await createMesociclo(mesocicloData);
          console.log('✅ Mesociclo de teste criado:', result);
          
          // Se o primeiro funcionou, salvar todos os outros
          for (let i = 1; i < validRows.length; i++) {
            const row = validRows[i];
            const mesocicloData: CreateMesocicloData = {
              macrociclo_id: selectedMacrocicloId,
              name: `Mesociclo ${row.number}`,
              start_date: convertDateToISO(row.startDate),
              end_date: convertDateToISO(row.endDate),
              focus: row.type.trim(),
              intensity_level: 'moderada' as const,
              volume_level: 'moderado' as const
            };
            console.log(`📝 Criando mesociclo ${i + 1}/${validRows.length}:`, mesocicloData);
            const result = await createMesociclo(mesocicloData);
            console.log(`✅ Mesociclo ${i + 1} criado:`, result);
          }
          
          console.log('✅ Todos os mesociclos salvos com sucesso');
          Alert.alert('Sucesso', `${validRows.length} mesociclos salvos com sucesso!`);
          onSuccess();
          onDismiss();
        } catch (testError) {
          console.error('❌ Erro no teste de salvamento:', testError);
          throw testError;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao salvar mesociclos:', error);
      Alert.alert('Erro', `Erro ao salvar mesociclos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const openDatePicker = (index: number, field: 'startDate' | 'endDate') => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'date';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
          const date = new Date(target.value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          const formattedDate = `${day}/${month}/${year}`;
          updateRow(index, field, formattedDate);
        }
      };
      input.click();
    }
  };

    return (
    <Modal
      visible={visible}
      onRequestClose={onDismiss}
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {mesocicloToEdit ? 'Editar Mesociclos' : 'Criar Mesociclos'}
          </Text>
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
                     {/* Type Selection */}
           <View style={styles.typeSection}>
             <Text style={styles.typeLabel}>Alterar tipo para semanas selecionadas:</Text>
             <TouchableOpacity
               style={styles.typeDropdown}
               onPress={() => setShowTypeDropdown(!showTypeDropdown)}
             >
               <Text style={styles.typeText}>{selectedType}</Text>
               <MaterialCommunityIcons 
                 name={showTypeDropdown ? "chevron-up" : "chevron-down"} 
                 size={20} 
                 color="#666" 
               />
             </TouchableOpacity>
             
             {/* Botão para gerar mesociclos automaticamente */}
             <TouchableOpacity 
               style={styles.generateButton} 
               onPress={generateMesociclos}
             >
               <MaterialCommunityIcons name="calendar-plus" size={20} color="white" />
               <Text style={styles.generateButtonText}>Gerar Semanas do Macrociclo</Text>
             </TouchableOpacity>
            
                         {showTypeDropdown && (
               <View style={styles.dropdownOptions}>
                 {MESOCICLO_TYPES.map((type) => (
                   <TouchableOpacity
                     key={type}
                     style={styles.dropdownOption}
                     onPress={() => {
                       setSelectedType(type);
                       // Atualizar o tipo apenas dos mesociclos selecionados e desmarcar os checkboxes
                       const updatedRows = mesocicloRows.map(row => ({
                         ...row,
                         type: row.isSelected ? type : row.type,
                         isSelected: false // Desmarcar todos os checkboxes após aplicar o tipo
                       }));
                       setMesocicloRows(updatedRows);
                       setShowTypeDropdown(false);
                     }}
                   >
                     <Text style={styles.dropdownOptionText}>{type}</Text>
                   </TouchableOpacity>
                 ))}
               </View>
             )}
          </View>

                     {/* Table Header */}
           <View style={styles.tableHeader}>
             <View style={styles.checkboxHeader} />
             <View style={styles.numberHeader}>
               <Text style={styles.headerText}>Semana</Text>
             </View>
             <View style={styles.typeHeader}>
               <Text style={styles.headerText}>Tipo de Mesociclo</Text>
             </View>
             <View style={styles.dateHeader}>
               <Text style={styles.headerText}>Início</Text>
             </View>
             <View style={styles.dateHeader}>
               <Text style={styles.headerText}>Término</Text>
             </View>
             <View style={styles.actionsHeader} />
           </View>

          {/* Table Rows */}
          {mesocicloRows.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.checkboxCell}>
                <TouchableOpacity
                  style={[styles.checkbox, row.isSelected && styles.checkboxSelected]}
                  onPress={() => updateRow(index, 'isSelected', !row.isSelected)}
                >
                  {row.isSelected && (
                    <MaterialCommunityIcons name="check" size={16} color="white" />
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.numberCell}>
                <Text style={styles.cellText}>{row.number}</Text>
              </View>
              
              <View style={styles.typeCell}>
                <Text style={[styles.cellText, !row.type && styles.dateText]}>
                  {row.type || 'Selecionar'}
                </Text>
              </View>
              
                             <View style={styles.dateCell}>
                 <TouchableOpacity
                   style={styles.dateInput}
                   onPress={() => openDatePicker(index, 'startDate')}
                 >
                   <Text style={[styles.dateText, row.startDate && styles.dateTextFilled]}>
                     {row.startDate || 'Selecionar'}
                   </Text>
                   <MaterialCommunityIcons name="calendar" size={16} color={row.startDate ? "#007AFF" : "#666"} />
                 </TouchableOpacity>
               </View>
               
               <View style={styles.dateCell}>
                 <TouchableOpacity
                   style={styles.dateInput}
                   onPress={() => openDatePicker(index, 'endDate')}
                 >
                   <Text style={[styles.dateText, row.endDate && styles.dateTextFilled]}>
                     {row.endDate || 'Selecionar'}
                   </Text>
                   <MaterialCommunityIcons name="calendar" size={16} color={row.endDate ? "#007AFF" : "#666"} />
                 </TouchableOpacity>
               </View>
               
               <View style={styles.actionsCell}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    // Edit functionality would go here
                    Alert.alert('Editar', 'Funcionalidade de edição será implementada');
                  }}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => deleteRow(index)}
                >
                  <MaterialCommunityIcons name="delete" size={16} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add New Row Button */}
          <TouchableOpacity style={styles.addButton} onPress={addNewRow}>
            <MaterialCommunityIcons name="plus" size={20} color="white" />
            <Text style={styles.addButtonText}>Adicionar Semana</Text>
          </TouchableOpacity>

          {/* Status for new rows */}
          {mesocicloRows.some(row => row.isNew) && (
            <View style={styles.statusSection}>
              <Text style={styles.statusText}>Status: Em preparação</Text>
            </View>
          )}
        </ScrollView>

                 {/* Action Buttons */}
         <View style={styles.footer}>
           <Button
             title="Cancelar"
             onPress={onDismiss}
             color="#666"
           />
           <Button
             title={mesocicloToEdit ? "Atualizar" : "Salvar"}
             onPress={handleSave}
             disabled={loading}
           />
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
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
    width: '90%',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  typeSection: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 9999,
  },
  typeLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  typeDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    backgroundColor: 'white',
  },
  typeText: {
    fontSize: 14,
  },
  dropdownOptions: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 8,
    position: 'relative',
    zIndex: 1,
  },
  checkboxHeader: {
    width: 40,
    alignItems: 'center',
  },
  numberHeader: {
    flex: 1,
    alignItems: 'center',
  },
  typeHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dateHeader: {
    flex: 1,
    alignItems: 'center',
  },
  weeksHeader: {
    flex: 1,
    alignItems: 'center',
  },
  actionsHeader: {
    width: 80,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  checkboxCell: {
    width: 40,
    alignItems: 'center',
  },
  numberCell: {
    flex: 1,
    alignItems: 'center',
  },
  typeCell: {
    flex: 1,
    alignItems: 'center',
  },
  dateCell: {
    flex: 1,
    alignItems: 'center',
  },
  actionsCell: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  cellText: {
    fontSize: 12,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: 'white',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  dateTextFilled: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  weeksCell: {
    flex: 1,
    alignItems: 'center',
  },
  weeksText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  actionButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 16,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 12,
    gap: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 4,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 16,
  },
});
