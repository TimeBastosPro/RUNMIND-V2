import React, { useState, useMemo, useEffect } from 'react';
import { View, Pressable, ActivityIndicator, ScrollView, StyleSheet, Alert } from 'react-native';
// LINHA CORRIGIDA: Adicionados 'RadioButton' e outros componentes que estavam em falta.
import { Portal, Modal, TextInput, Button, Text, Checkbox, RadioButton, List, Chip } from 'react-native-paper';
import { useCheckinStore } from '../../stores/checkin';
import type { TrainingSession } from '../../types/database';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MarkTrainingDoneModal from './MarkTrainingDoneModal';
import Slider from '@react-native-community/slider';

// --- Constantes e Funções de Data ---
const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getFirstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function generateCalendarDays(date: Date): Date[] {
  const startOfMonth = getFirstDayOfMonth(date);
  // Segunda-feira = 1, Domingo = 0
  let dayOfWeek = startOfMonth.getDay();
  // Ajuste: se domingo (0), queremos -6, se segunda (1), queremos 0, etc.
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startDate = new Date(startOfMonth);
  startDate.setDate(startOfMonth.getDate() + diff);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Função utilitária para agrupar dias em semanas
function groupDaysByWeek(days: Date[]): Date[][] {
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

// Função utilitária para garantir data YYYY-MM-DD
function getDateKey(dateString: string): string {
  // Remove qualquer parte de hora/timezone
  return dateString.split('T')[0];
}

// --- Componente CustomDay ---
interface CustomDayProps {
  day: Date;
  displayMonth: number;
  training: TrainingSession | null;
  onPress: (day: Date, training?: TrainingSession | null) => void;
  onLongPress: (day: Date, training: TrainingSession) => void;
}

function CustomDay({ day, displayMonth, training, onPress, onLongPress }: CustomDayProps) {
    const isOtherMonth = day.getMonth() !== displayMonth;
    const isToday = isSameDay(day, new Date());

    let chipStyle = {};
    let chipText = '';
    let dynamicStyle: any = {};

    if (training) {
        if (training.status === 'completed') {
            chipStyle = {};
            chipText = '';
            dynamicStyle = { borderColor: '#e0e0e0', backgroundColor: '#fff' };
        } else if (training.status === 'planned') {
            chipStyle = {};
            chipText = '';
            dynamicStyle = { borderColor: '#e0e0e0', backgroundColor: '#fff' };
        }
    } else {
        dynamicStyle = { backgroundColor: '#fff' };
    }
    if (isOtherMonth) {
        dynamicStyle.opacity = 0.5;
        dynamicStyle.backgroundColor = '#f5f5f5';
    }

    // Detalhes do treino
    const details = [];
    if (training) {
        if (training.distance_km) details.push(<Text key="dist" style={styles.detailLine}><Text style={styles.detailValue}>{training.distance_km} km</Text></Text>);
        if (training.duration_minutes) details.push(<Text key="dur" style={styles.detailLine}><Text style={styles.detailValue}>{training.duration_minutes} min</Text></Text>);
        if (training.avg_heart_rate) details.push(<Text key="fc" style={styles.detailLine}>FC Média: <Text style={styles.detailValue}>{training.avg_heart_rate}</Text></Text>);
        if (training.elevation_gain_meters) details.push(<Text key="alt" style={styles.detailLine}>Altimetria: <Text style={styles.detailValue}>{training.elevation_gain_meters}m</Text></Text>);
        if (training.intensidade) details.push(<Text key="esf" style={styles.detailLine}>Esforço: <Text style={styles.detailValue}>{training.intensidade}</Text></Text>);
    }

    // Função para marcar como realizado
    const handleMarkCompleted = () => {
        if (training && training.status === 'planned') {
            onPress(day, training); // já abre o modal de conclusão
        }
    };
    // Função para editar/visualizar treino
    const handleEditTraining = () => {
        onPress(day, training);
    };

    return (
        <Pressable
            onPress={() => onPress(day, training)}
            onLongPress={() => training && onLongPress(day, training)}
            style={[styles.dayContainer, dynamicStyle]}
        >
            <Text
              style={[
                styles.dayText,
                isToday && styles.todayHighlight,
                { color: isToday ? '#1976d2' : isOtherMonth ? '#ccc' : '#222' }
              ]}
            >
                {day.getDate()}
            </Text>
            {training ? (
                <View style={styles.trainingContent}>
                    {/* Informações principais do treino */}
                    <Text style={{fontWeight:'bold', color:'#111', fontSize:16, marginBottom:2}}>Modalidade: <Text style={{color:'#111'}}>{training.modalidade ? training.modalidade.charAt(0).toUpperCase() + training.modalidade.slice(1) : '-'}</Text></Text>
                    <Text style={{fontWeight:'bold', color:'#111', fontSize:16, marginBottom:2}}>Percurso: <Text style={{color:'#111'}}>{training.percurso ? training.percurso.charAt(0).toUpperCase() + training.percurso.slice(1) : '-'}</Text></Text>
                    <Text style={{fontWeight:'bold', color:'#111', fontSize:16, marginBottom:2}}>Terreno: <Text style={{color:'#111'}}>{training.terreno ? training.terreno.charAt(0).toUpperCase() + training.terreno.slice(1) : '-'}</Text></Text>
                    <Text style={{fontWeight:'bold', color:'#111', fontSize:16, marginBottom:2}}>Tipo de treino: <Text style={{color:'#111'}}>{training.treino_tipo ? training.treino_tipo.charAt(0).toUpperCase() + training.treino_tipo.slice(1) : '-'}</Text></Text>
                    <Text style={{fontWeight:'bold', color:'#111', fontSize:16, marginBottom:2}}>Duração: <Text style={{color:'#111'}}>{(training.duracao_horas || training.duracao_minutos) ? `${training.duracao_horas || '0'}h ${training.duracao_minutos || '0'}min` : (training.distance_km ? `${training.distance_km}km` : '-')}</Text></Text>
                    <Text style={{fontWeight:'bold', color:'#111', fontSize:16, marginBottom:2}}>Intensidade: <Text style={{color:'#111'}}>{training.intensidade || '-'}</Text></Text>
                    <Text style={{fontWeight:'bold', color:'#111', fontSize:16, marginBottom:2}}>Esforço: <Text style={{color:'#111'}}>{training.esforco ? training.esforco.charAt(0).toUpperCase() + training.esforco.slice(1).replace('_',' ') : '-'}</Text></Text>
                    {training.status === 'planned' && (
                        null
                    )}
                    <View style={styles.buttonRow}>
                        <Button
                          mode="outlined"
                          style={styles.actionButton}
                          labelStyle={styles.actionButtonLabelOutline}
                          onPress={handleEditTraining}
                        >
                          Treino
                        </Button>
                        <Button
                          mode="contained"
                          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                          labelStyle={styles.actionButtonLabelContained}
                          onPress={handleMarkCompleted}
                          disabled={training.status === 'completed'}
                        >
                          Realizado
                        </Button>
                  </View>
                    {/* Removido Chip visual cinza */}
                </View>
            ) : (
                <View style={styles.trainingContent}>
                    <MaterialCommunityIcons name="run" size={28} color="#e0e0e0" style={{ marginTop: 16 }} />
              </View>
            )}
        </Pressable>
    );
}

// --- Componente Principal ---
export default function TrainingScreen() {
    const {
      trainingSessions,
      fetchTrainingSessions,
      saveTrainingSession,
      markTrainingAsCompleted,
      deleteTrainingSession
    } = useCheckinStore(s => s);

    const [displayDate, setDisplayDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [modalPlanVisible, setModalPlanVisible] = useState(false);
    const [modalDoneVisible, setModalDoneVisible] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
    const [planningTitle, setPlanningTitle] = useState('');
    const [planningType, setPlanningType] = useState('rodagem');

    // Atualize o useState planningState:
    const [planningState, setPlanningState] = useState({
      modalidade: 'corrida',
      esforco: '',
      percurso: '',
      terreno: '',
      treino_tipo: '',
      intensidade: 'Z1',
      duracao_horas: '0',
      duracao_minutos: '0',
      distance_km: '',
      distancia_m: '',
      observacoes: '',
      elevation_gain_meters: '',
      avg_heart_rate: '',
      perceived_effort: '',
      notes: '',
    });

    useEffect(() => {
        setLoading(true);
        fetchTrainingSessions().finally(() => setLoading(false));
    }, [fetchTrainingSessions]);

    const days = useMemo(() => generateCalendarDays(displayDate), [displayDate]);
    const weeks = useMemo(() => groupDaysByWeek(days), [days]);
    const trainingByDate = useMemo(() => {
        const map: Record<string, TrainingSession> = {};
        trainingSessions.forEach(t => {
            const dateKey = getDateKey(t.training_date);
            map[dateKey] = t;
        });
        return map;
    }, [trainingSessions]);

    const handleDayPress = (day: Date, training?: TrainingSession | null) => {
        setSelectedDay(day);
        setEditingSession(training || null);
        if (training) {
            setPlanningState({
                modalidade: training.modalidade || '',
                esforco: training.esforco || '',
                percurso: training.percurso || '',
                terreno: training.terreno || '',
                treino_tipo: training.treino_tipo || '',
                intensidade: training.intensidade ? String(training.intensidade) : 'Z1',
                duracao_horas: training.duracao_horas || '0',
                duracao_minutos: training.duracao_minutos || '0',
                distance_km: training.distance_km ? String(training.distance_km) : '',
                distancia_m: training.distancia_m || '',
                observacoes: training.observacoes || '',
                elevation_gain_meters: training.elevation_gain_meters ? String(training.elevation_gain_meters) : '',
                avg_heart_rate: training.avg_heart_rate ? String(training.avg_heart_rate) : '',
                perceived_effort: training.perceived_effort ? String(training.perceived_effort) : '',
                notes: training.notes || '',
            });
        } else {
            setPlanningTitle('');
            setPlanningType('rodagem');
            // Reset planningState para valores iniciais
            setPlanningState({
              modalidade: 'corrida',
              esforco: '',
              percurso: '',
              terreno: '',
              treino_tipo: '',
              intensidade: 'Z1',
              duracao_horas: '0',
              duracao_minutos: '0',
              distance_km: '',
              distancia_m: '',
              observacoes: '',
              elevation_gain_meters: '',
              avg_heart_rate: '',
              perceived_effort: '',
              notes: '',
            });
        }
        setModalPlanVisible(true);
    };

    const handleDayLongPress = async (day: Date, training: TrainingSession) => {
      return new Promise<void>((resolve) => {
        Alert.alert(
          "Excluir Treino",
          `Deseja realmente excluir o treino "${training.title}"?`,
          [
            { text: "Cancelar", style: "cancel", onPress: () => resolve() },
            { text: "Excluir", style: "destructive", onPress: async () => {
                if (training.id) {
                  await deleteTrainingSession(training.id);
                  await fetchTrainingSessions();
                }
                resolve();
              }
            }
          ]
        );
      });
    };
    
    const handleSavePlan = async () => {
        if (!selectedDay) {
            Alert.alert("Erro", "Selecione um dia para planejar o treino.");
            return;
        }
        const trainingData: Partial<TrainingSession> = {
            training_date: formatDate(selectedDay),
            status: 'planned',
            modalidade: planningState.modalidade || undefined,
            esforco: planningState.esforco || undefined,
            percurso: planningState.percurso || undefined,
            terreno: planningState.terreno || undefined,
            treino_tipo: planningState.treino_tipo || undefined,
            intensidade: planningState.intensidade || undefined,
            duracao_horas: planningState.duracao_horas || undefined,
            duracao_minutos: planningState.duracao_minutos || undefined,
            distance_km: planningState.distance_km ? Number(planningState.distance_km) : undefined,
            distancia_m: planningState.distancia_m || undefined,
            observacoes: planningState.observacoes || undefined,
        };
        try {
            await saveTrainingSession(trainingData);
            await fetchTrainingSessions(); // Garante atualização imediata dos cards
            setModalPlanVisible(false);
            Alert.alert("Sucesso", "Treino salvo com sucesso!");
        } catch (err) {
            console.error('Erro ao salvar treino:', err);
            Alert.alert("Erro", "Não foi possível salvar o treino. Tente novamente.");
        }
    };

    const handleSaveDone = async (completedData: Partial<TrainingSession>) => {
        if (!editingSession || !editingSession.id) return;
        // Corrigir tipos para garantir que não haja null
        const safeCompletedData: any = { ...completedData };
        if ('avg_heart_rate' in safeCompletedData && (safeCompletedData.avg_heart_rate == null)) delete safeCompletedData.avg_heart_rate;
        if ('elevation_gain_meters' in safeCompletedData && (safeCompletedData.elevation_gain_meters == null)) delete safeCompletedData.elevation_gain_meters;
        if ('distance_km' in safeCompletedData && (safeCompletedData.distance_km == null)) delete safeCompletedData.distance_km;
        if ('duration_minutes' in safeCompletedData && (safeCompletedData.duration_minutes == null)) delete safeCompletedData.duration_minutes;
        await markTrainingAsCompleted(editingSession.id, safeCompletedData);
        setModalDoneVisible(false);
    };

    const monthLabel = `${MONTHS_PT[displayDate.getMonth()]} / ${displayDate.getFullYear()}`;
    const goPrevMonth = () => setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
    const goNextMonth = () => setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Button onPress={goPrevMonth}>Anterior</Button>
                <Text style={styles.headerText}>{monthLabel}</Text>
                <Button onPress={goNextMonth}>Próximo</Button>
            </View>
            <View style={styles.weekdaysContainer}>
                {WEEKDAYS.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekdayText}>{day}</Text>)}
            </View>
            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 50 }} />
            ) : (
                <ScrollView>
                    {weeks.map((week, weekIdx) => (
                        <View key={weekIdx} style={styles.weekRow}>
                            {week.map((day, dayIdx) => {
                                const training = trainingByDate[formatDate(day)] || null;
                                const isOtherMonth = day.getMonth() !== displayDate.getMonth();
                                return (
                                    <CustomDay
                                        key={day.toISOString()}
                                        day={day}
                                        displayMonth={displayDate.getMonth()}
                                        training={training}
                                        onPress={handleDayPress}
                                        onLongPress={handleDayLongPress}
                                    />
                                );
                            })}
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Modais permanecem iguais */}
            <Portal>
                <Modal visible={modalPlanVisible} onDismiss={() => setModalPlanVisible(false)} contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 12, maxHeight: '80%' }}>
                    <ScrollView>
                        <Text variant="titleLarge" style={{ marginBottom: 10 }}>
                          {editingSession ? 'Editar Treino Planejado' : 'Planejar Novo Treino'}
                        </Text>
                        {/* Modalidade */}
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Modalidade</Text>
                            <RadioButton.Group onValueChange={val => setPlanningState(p => ({...p, modalidade: val}))} value={planningState.modalidade}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                                <RadioButton.Item label="Corrida" value="corrida" style={{flex:1}}/>
                                <RadioButton.Item label="Força" value="forca" style={{flex:1}}/>
                                <RadioButton.Item label="Educativo" value="educativo" style={{flex:1}}/>
                                <RadioButton.Item label="Flexibilidade" value="flexibilidade" style={{flex:1}}/>
                                <RadioButton.Item label="Bike" value="bike" style={{flex:1}}/>
                            </View>
                        </RadioButton.Group>
                        {/* Esforço */}
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Esforço</Text>
                        <RadioButton.Group onValueChange={val => setPlanningState(p => ({...p, esforco: val}))} value={planningState.esforco}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                                <RadioButton.Item label="Muito Leve" value="muito_leve" style={{flex:1}}/>
                                <RadioButton.Item label="Leve" value="leve" style={{flex:1}}/>
                                <RadioButton.Item label="Moderado" value="moderado" style={{flex:1}}/>
                                <RadioButton.Item label="Forte" value="forte" style={{flex:1}}/>
                                <RadioButton.Item label="Muito Forte" value="muito_forte" style={{flex:1}}/>
                            </View>
                        </RadioButton.Group>
                        {/* Percurso */}
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Percurso</Text>
                        <RadioButton.Group onValueChange={val => setPlanningState(p => ({...p, percurso: val}))} value={planningState.percurso}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                                <RadioButton.Item label="Plano" value="plano" style={{flex:1}}/>
                                <RadioButton.Item label="Ligeira Inclinação" value="ligeira_inclinacao" style={{flex:1}}/>
                                <RadioButton.Item label="Muita Inclinação" value="muita_inclinacao" style={{flex:1}}/>
                            </View>
                        </RadioButton.Group>
                        {/* Terreno */}
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Terreno</Text>
                        <RadioButton.Group onValueChange={val => setPlanningState(p => ({...p, terreno: val}))} value={planningState.terreno}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                                <RadioButton.Item label="Asfalto" value="asfalto" style={{flex:1}}/>
                                <RadioButton.Item label="Esteira" value="esteira" style={{flex:1}}/>
                                <RadioButton.Item label="Trilha/Montanha" value="trilha" style={{flex:1}}/>
                                <RadioButton.Item label="Pista" value="pista" style={{flex:1}}/>
                            </View>
                        </RadioButton.Group>
                        {/* Tipo de Treino */}
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Tipo de Treino</Text>
                        <RadioButton.Group onValueChange={val => setPlanningState(p => ({...p, treino_tipo: val}))} value={planningState.treino_tipo}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                                <RadioButton.Item label="Contínuo" value="continuo" style={{flex:1}}/>
                                <RadioButton.Item label="Intervalado" value="intervalado" style={{flex:1}}/>
                                <RadioButton.Item label="Longo" value="longo" style={{flex:1}}/>
                                <RadioButton.Item label="Fartlek" value="fartlek" style={{flex:1}}/>
                                <RadioButton.Item label="Tiro" value="tiro" style={{flex:1}}/>
                                <RadioButton.Item label="Ritmo" value="ritmo" style={{flex:1}}/>
                                <RadioButton.Item label="Regenerativo" value="regenerativo" style={{flex:1}}/>
                            </View>
                            </RadioButton.Group>
                        {/* Duração/Distância */}
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Duração / Distância</Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                            <TextInput label="Distância (km)" value={planningState.distance_km} onChangeText={val => setPlanningState(p => ({ ...p, distance_km: val }))} keyboardType="numeric" style={{flex: 1, marginRight: 8}} mode="outlined" dense />
                            <TextInput label="Metros" value={planningState.distancia_m} onChangeText={val => setPlanningState(p => ({ ...p, distancia_m: val }))} keyboardType="numeric" style={{flex: 1, marginRight: 8}} mode="outlined" dense />
                              <TextInput label="Horas" value={planningState.duracao_horas} onChangeText={val => setPlanningState(p => ({...p, duracao_horas: val}))} keyboardType="numeric" style={{flex: 1, marginRight: 8}} mode="outlined" dense/>
                              <TextInput label="Minutos" value={planningState.duracao_minutos} onChangeText={val => setPlanningState(p => ({...p, duracao_minutos: val}))} keyboardType="numeric" style={{flex: 1}} mode="outlined" dense/>
                        </View>
                        {/* Intensidade */}
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Intensidade</Text>
                        <RadioButton.Group onValueChange={val => setPlanningState(p => ({...p, intensidade: val}))} value={planningState.intensidade}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                                <RadioButton.Item label="Z1" value="Z1" style={{flex:1}}/>
                                <RadioButton.Item label="Z2" value="Z2" style={{flex:1}}/>
                                <RadioButton.Item label="Z3" value="Z3" style={{flex:1}}/>
                                <RadioButton.Item label="Z4" value="Z4" style={{flex:1}}/>
                                <RadioButton.Item label="Z5" value="Z5" style={{flex:1}}/>
                            </View>
                        </RadioButton.Group>
                        {/* Observações */}
                        <TextInput label="Observações" value={planningState.observacoes} onChangeText={val => setPlanningState(p => ({...p, observacoes: val}))} multiline numberOfLines={3} mode="outlined" style={{marginBottom: 12}}/>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                             <Button onPress={() => setModalPlanVisible(false)}>Cancelar</Button>
                             <Button mode="contained" onPress={handleSavePlan}>
                               {editingSession ? 'Salvar Alterações' : 'Salvar Treino'}
                             </Button>
                        </View>
                        {editingSession && editingSession.id && (
                          <Button 
                            textColor='red' 
                            onPress={async () => {
                              console.log('Tentando excluir treino', editingSession.id);
                              if (editingSession.id) {
                                await deleteTrainingSession(editingSession.id);
                                await fetchTrainingSessions();
                                setEditingSession(null);
                                setSelectedDay(null);
                                setModalPlanVisible(false);
                              } else {
                                console.log('ID do treino inválido:', editingSession.id);
                              }
                            }} 
                            style={{marginTop: 10}}
                          >
                            Excluir Treino
                          </Button>
                        )}
                    </ScrollView>
                </Modal>
            </Portal>
            {editingSession && (
                <MarkTrainingDoneModal
                    visible={modalDoneVisible}
                    plannedData={editingSession}
                    onSave={handleSaveDone}
                    onCancel={() => setModalDoneVisible(false)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 8, paddingTop: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 26,
    textAlign: 'center',
    flex: 1,
    color: '#222',
    letterSpacing: 1,
  },
  weekdaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 2,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: '#888',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 16, // aumentar o espaçamento entre as células
    paddingHorizontal: 8, // garantir espaçamento lateral
  },
  dayContainer: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#fff',
    borderRadius: 18, // mais arredondado
    borderWidth: 2,
    borderColor: '#e0e0e0',
    padding: 14, // mais espaço interno
    minHeight: 170, // levemente menor para responsividade
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 0, // removido para usar gap
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // sombra um pouco mais visível
    shadowRadius: 6,
    elevation: 3,
  },
  dayText: {
    fontWeight: 'bold',
    fontSize: 24, // ainda maior para destaque
    marginBottom: 6,
    color: '#222',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  todayHighlight: {
    color: '#1976d2',
    textShadowColor: '#b3d1f7',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    fontWeight: 'bold',
    fontSize: 26,
    textAlign: 'center',
  },
  trainingContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  trainingMainText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    marginBottom: 2,
  },
  chip: {
    marginTop: 6,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  detailsBlock: {
    marginVertical: 4,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLine: {
    fontSize: 15,
    color: '#222',
    textAlign: 'center',
    marginBottom: 1,
    letterSpacing: 0.2,
  },
  detailValue: {
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: 0.2,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    minHeight: 38,
    marginHorizontal: 0,
    elevation: 0,
  },
  actionButtonLabelOutline: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    letterSpacing: 0.5,
  },
  actionButtonLabelContained: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  plannedLabel: {
    color: '#FFD600',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 2,
    marginTop: 2,
    letterSpacing: 0.5,
  },
}); 