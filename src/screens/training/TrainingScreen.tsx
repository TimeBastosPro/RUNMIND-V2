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
import { UniversalDocumentPicker } from '../../components/ui/UniversalDocumentPicker';
import Papa from 'papaparse';
import { useAuthStore } from '../../stores/auth';

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

function CustomDay({ day, displayMonth, training, onOpenPlanModal, onOpenRealizadoModal }: CustomDayProps & { onOpenPlanModal: (day: Date, training?: TrainingSession | null) => void, onOpenRealizadoModal: (day: Date, training?: TrainingSession | null) => void }) {
    const isOtherMonth = day.getMonth() !== displayMonth;
    const isToday = isSameDay(day, new Date());

    // Lógica de cor/status
    let dynamicStyle: any = { backgroundColor: '#fff', borderColor: '#e0e0e0' };
    let status = '';
    if (training) {
        if (training.status === 'completed') {
            dynamicStyle = { ...dynamicStyle, borderColor: '#4CAF50', boxShadow: '0 0 8px #4CAF50' };
            status = 'realizado';
        } else if (training.status === 'planned') {
            // Verificar se o dia já passou
            const now = new Date();
            const cardDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
            const isPast = cardDate < now && !isSameDay(day, now);
            if (isPast) {
                dynamicStyle = { ...dynamicStyle, borderColor: '#D32F2F', boxShadow: '0 0 8px #D32F2F' };
                status = 'perdido';
            } else {
                dynamicStyle = { ...dynamicStyle, borderColor: '#FFD600', boxShadow: '0 0 8px #FFD600' };
                status = 'planejado';
            }
        }
    }
    if (isOtherMonth) {
        dynamicStyle.opacity = 0.5;
        dynamicStyle.backgroundColor = '#f5f5f5';
    }

    // Determinar se existe treino planejado
    const hasPlanned = training && training.status === 'planned';
    const treinoButtonTitle = hasPlanned ? 'Editar' : 'Criar';

    return (
        <View style={[styles.dayContainer, dynamicStyle]}>
            <Text
                style={[
                    styles.dayText,
                    isToday && styles.todayHighlight,
                    { color: isToday ? '#1976d2' : isOtherMonth ? '#ccc' : '#222' }
                ]}
            >
                {day.getDate()}
            </Text>
            <View style={styles.trainingContent}>
                {training ? (
                    <>
                        {training.status === 'completed' ? (
                            <>
                                <View style={styles.cardRow}><Text style={styles.cardLabel}>Duração: </Text><Text style={styles.cardText}>{training.distance_km ? `${training.distance_km} km` : `${training.duracao_horas || '0'}h ${training.duracao_minutos || '0'}min`}</Text></View>
                                <View style={styles.cardRow}><Text style={styles.cardLabel}>Altimetria: </Text><Text style={styles.cardText}>+{training.elevation_gain_meters || '0'} / -{('elevation_loss_meters' in training && training.elevation_loss_meters != null) ? training.elevation_loss_meters : 0}</Text></View>
                                <View style={styles.cardRow}><Text style={styles.cardLabel}>FC Média: </Text><Text style={styles.cardText}>{training.avg_heart_rate || '-'}</Text></View>
                                <View style={styles.cardRow}><Text style={styles.cardLabel}>PSE: </Text><Text style={styles.cardText}>{training.perceived_effort || '-'}</Text></View>
                            </>
                        ) : (
                            <>
                                <View style={styles.cardRow}><Text style={styles.cardLabel}>Modalidade: </Text><Text style={styles.cardText}>{training.modalidade ? training.modalidade.charAt(0).toUpperCase() + training.modalidade.slice(1) : '-'}</Text></View>
                                <View style={styles.cardRow}><Text style={styles.cardLabel}>Terreno: </Text><Text style={styles.cardText}>{training.terreno ? training.terreno.charAt(0).toUpperCase() + training.terreno.slice(1) : '-'}</Text></View>
                                <View style={styles.cardRow}><Text style={styles.cardLabel}>Tipo de treino: </Text><Text style={styles.cardText}>{training.treino_tipo ? training.treino_tipo.charAt(0).toUpperCase() + training.treino_tipo.slice(1) : '-'}</Text></View>
                                <View style={styles.cardRow}><Text style={styles.cardLabel}>Duração: </Text><Text style={styles.cardText}>{(training.duracao_horas || training.duracao_minutos) ? `${training.duracao_horas || '0'}h ${training.duracao_minutos || '0'}min` : (training.distance_km ? `${training.distance_km}km` : '-')}</Text></View>
                                <View style={styles.cardRow}><Text style={styles.cardLabel}>Intensidade: </Text><Text style={styles.cardText}>{training.intensidade || '-'}</Text></View>
                            </>
                        )}
                    </>
                ) : (
                    <MaterialCommunityIcons name="run" size={28} color="#e0e0e0" style={{ marginTop: 16 }} />
                )}
            </View>
            <View style={styles.cardButtonRow}>
                <Button
                    mode="outlined"
                    style={styles.actionButton}
                    labelStyle={styles.actionButtonLabelOutline}
                    onPress={() => onOpenPlanModal(day, hasPlanned ? training : null)}
                >
                    {treinoButtonTitle}
                </Button>
                <Button
                    mode="contained"
                    style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                    labelStyle={styles.actionButtonLabelContained}
                    onPress={() => onOpenRealizadoModal(day, training || null)}
                >
                    Realizado
                </Button>
            </View>
        </View>
    );
}

// --- Componente Principal ---
export default function TrainingScreen() {
    const {
      trainingSessions,
      fetchTrainingSessions,
      saveTrainingSession,
      markTrainingAsCompleted,
      deleteTrainingSession,
      submitWeeklyReflection
    } = useCheckinStore(s => s);

    const [displayDate, setDisplayDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [modalPlanVisible, setModalPlanVisible] = useState(false);
    const [modalDoneVisible, setModalDoneVisible] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
    const [planningTitle, setPlanningTitle] = useState('');
    const [planningType, setPlanningType] = useState('rodagem');
    const [weeklyReflectionVisible, setWeeklyReflectionVisible] = useState(false);
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [importing, setImporting] = useState(false);

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

    const userId = useAuthStore(s => s.user?.id);

    useEffect(() => {
        setLoading(true);
        fetchTrainingSessions().finally(() => setLoading(false));
    }, [fetchTrainingSessions]);

    // Função para obter o início da semana (domingo)
    function getWeekStart(date: Date) {
      const d = new Date(date);
      d.setHours(0,0,0,0);
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().split('T')[0];
    }

    // useEffect para sugerir a reflexão semanal ao abrir o app no domingo
    useEffect(() => {
      const today = new Date();
      const weekStart = getWeekStart(today);
      // Aqui você pode buscar na base se já respondeu essa semana (exemplo simplificado: sempre mostra no domingo)
      if (today.getDay() === 0) {
        setWeeklyReflectionVisible(true);
      }
    }, []);

    const handleSaveWeeklyReflection = async (answers: any) => {
      const weekStart = getWeekStart(new Date());
      await submitWeeklyReflection({
        enjoyment: answers.enjoyment,
        progress: answers.progress,
        confidence: answers.confidence,
        week_start: weekStart,
      });
      setWeeklyReflectionVisible(false);
    };

    const days = useMemo(() => generateCalendarDays(displayDate), [displayDate]);
    const weeks = useMemo(() => groupDaysByWeek(days), [days]);
    // Agrupar treinos por data, priorizando o realizado
    const trainingByDate = useMemo(() => {
        const map: Record<string, TrainingSession> = {};
        // Primeiro, pegar todos os realizados
        trainingSessions.filter(t => t.status === 'completed').forEach(t => {
            const dateKey = getDateKey(t.training_date);
            map[dateKey] = t;
        });
        // Depois, preencher os planejados só se não houver realizado
        trainingSessions.filter(t => t.status === 'planned').forEach(t => {
            const dateKey = getDateKey(t.training_date);
            if (!map[dateKey]) map[dateKey] = t;
        });
        return map;
    }, [trainingSessions]);

    // Handler para abrir SEMPRE o modal de treino realizado (editável)
    const handleOpenRealizadoModal = (day: Date, training?: TrainingSession | null) => {
        console.log('Abrindo modal de treino realizado', { day, training });
        let session = training;
        if (!session) {
            session = {
                user_id: userId || '', // Preencher com o user_id correto se disponível
                training_date: formatDate(day),
                title: '',
                training_type: '',
                status: 'completed',
                modalidade: '',
                treino_tipo: '',
                terreno: '',
                duracao_horas: '',
                duracao_minutos: '',
                distance_km: undefined,
                observacoes: '',
            } as TrainingSession;
        }
        setSelectedDay(day);
        setEditingSession(session);
        setModalDoneVisible(true);
    };

    // Handler do card e dos botões
    const handleDayPress = handleOpenRealizadoModal;
    const handleEditTraining = handleOpenRealizadoModal;
    const handleMarkCompleted = handleOpenRealizadoModal;

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
        if (!editingSession) return;
        if (editingSession.id) {
            // Atualiza treino existente
            const safeCompletedData: any = { ...completedData };
            if ('avg_heart_rate' in safeCompletedData && (safeCompletedData.avg_heart_rate == null)) delete safeCompletedData.avg_heart_rate;
            if ('elevation_gain_meters' in safeCompletedData && (safeCompletedData.elevation_gain_meters == null)) delete safeCompletedData.elevation_gain_meters;
            if ('distance_km' in safeCompletedData && (safeCompletedData.distance_km == null)) delete safeCompletedData.distance_km;
            if ('duration_minutes' in safeCompletedData && (safeCompletedData.duration_minutes == null)) delete safeCompletedData.duration_minutes;
            await markTrainingAsCompleted(editingSession.id, safeCompletedData);
        } else {
            try {
                // Garante todos os campos obrigatórios para criar treino realizado do zero
                const treinoParaSalvar: Partial<TrainingSession> = {
                    ...completedData,
                    user_id: userId,
                    training_date: editingSession.training_date,
                    status: 'completed',
                    title: completedData.title || 'Treino Realizado',
                    training_type: completedData.training_type || 'manual',
                };
                console.log('Tentando criar treino realizado:', treinoParaSalvar);
                await saveTrainingSession(treinoParaSalvar);
                Alert.alert('Sucesso', 'Treino realizado cadastrado!');
            } catch (err: any) {
                Alert.alert('Erro ao salvar treino', err.message || String(err));
                console.error('Erro ao salvar treino realizado:', err);
            }
        }
        setModalDoneVisible(false);
        await fetchTrainingSessions();
    };

    const monthLabel = `${MONTHS_PT[displayDate.getMonth()]} / ${displayDate.getFullYear()}`;
    const goPrevMonth = () => setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
    const goNextMonth = () => setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));

    const handleOpenPlanModal = (day: Date, training?: TrainingSession | null) => {
      setSelectedDay(day);
      setEditingSession(training || null);
      setModalPlanVisible(true);
    };
    const handleOpenDoneModal = (day: Date, training?: TrainingSession | null) => {
      setSelectedDay(day);
      setEditingSession(training || null);
      setModalDoneVisible(true);
    };

    // Função para importar CSV
    const handleImportCSV = async (file: File | Blob) => {
        setImporting(true);
        try {
            Papa.parse(file, {
                header: true,
                complete: async (results: any) => {
                    // results.data é um array de objetos
                    // Adapte para o formato de treino necessário
                    const treinos = results.data;
                    for (const treino of treinos) {
                        // Exemplo: ajuste os campos conforme seu modelo
                        await saveTrainingSession({
                            training_date: treino.data,
                            status: 'planned',
                            modalidade: treino.modalidade,
                            treino_tipo: treino.treino_tipo,
                            terreno: treino.terreno,
                            duracao_horas: treino.duracao_horas,
                            duracao_minutos: treino.duracao_minutos,
                            distance_km: treino.distance_km,
                            observacoes: treino.observacoes,
                        });
                    }
                    await fetchTrainingSessions();
                    Alert.alert('Sucesso', 'Treinos importados com sucesso!');
                    setImportModalVisible(false);
                },
                error: (err: any) => {
                    Alert.alert('Erro', 'Falha ao importar CSV: ' + err.message);
                },
            });
        } catch (err: any) {
            Alert.alert('Erro', 'Falha ao importar CSV: ' + err.message);
        } finally {
            setImporting(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Button onPress={goPrevMonth}>Anterior</Button>
                <Text style={styles.headerText}>{monthLabel}</Text>
                <Button onPress={goNextMonth}>Próximo</Button>
                <Button mode="outlined" onPress={() => setImportModalVisible(true)} style={{ marginLeft: 8 }}>
                    Importar Planilha (.csv)
                </Button>
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
                                return (
                                    <CustomDay
                                        key={day.toISOString()}
                                        day={day}
                                        displayMonth={displayDate.getMonth()}
                                        training={training}
                                        onPress={handleDayPress}
                                        onLongPress={handleDayLongPress}
                                        onOpenPlanModal={handleOpenPlanModal}
                                        onOpenRealizadoModal={handleOpenRealizadoModal}
                                    />
                                );
                            })}
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Modais permanecem iguais */}
            <Portal>
                <Modal visible={modalPlanVisible} onDismiss={() => setModalPlanVisible(false)} contentContainerStyle={{ width: '90%', alignSelf: 'center', marginVertical: 20, borderRadius: 12, padding: 20, backgroundColor: 'white', maxWidth: 600, maxHeight: '90%' }}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text variant="titleLarge" style={{ marginBottom: 10, textAlign: 'left', fontWeight: 'bold' }}>
                          {editingSession ? 'Editar Treino Planejado' : 'Planejar Novo Treino'}
                        </Text>
                        {/* Modalidade */}
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Modalidade</Text>
                        <RadioButton.Group onValueChange={val => setPlanningState(p => ({...p, modalidade: val}))} value={planningState.modalidade}>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                            {['corrida', 'forca', 'educativo', 'flexibilidade', 'bike'].map((opt, idx) => (
                              <View key={opt} style={{flexDirection: 'row', alignItems: 'center', marginRight: 16}}>
                                <RadioButton value={opt} />
                                <Text style={{marginRight: 8}}>{['Corrida', 'Força', 'Educativo', 'Flexibilidade', 'Bike'][idx]}</Text>
                              </View>
                            ))}
                          </View>
                        </RadioButton.Group>
                        {/* Esforço */}
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Esforço</Text>
                        <RadioButton.Group onValueChange={val => setPlanningState(p => ({...p, esforco: val}))} value={planningState.esforco}>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                            {[1,2,3,4,5].map(opt => (
                              <View key={opt} style={{flexDirection: 'row', alignItems: 'center', marginRight: 16}}>
                                <RadioButton value={String(opt)} />
                                <Text style={{marginRight: 8}}>{['Muito Leve', 'Leve', 'Moderado', 'Forte', 'Muito Forte'][opt-1]}</Text>
                              </View>
                            ))}
                          </View>
                        </RadioButton.Group>
                        {/* Percurso */}
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Percurso</Text>
                        <RadioButton.Group onValueChange={val => setPlanningState(p => ({...p, percurso: val}))} value={planningState.percurso}>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                            {[1,2,3,4,5].map(opt => (
                              <View key={opt} style={{flexDirection: 'row', alignItems: 'center', marginRight: 16}}>
                                <RadioButton value={String(opt)} />
                                <Text style={{marginRight: 8}}>{['Plano', 'Ligeira Inclinação', 'Moderada', 'Forte', 'Muita Inclinação'][opt-1]}</Text>
                              </View>
                            ))}
                          </View>
                        </RadioButton.Group>
                        {/* Terreno */}
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Terreno</Text>
                        <RadioButton.Group onValueChange={val => setPlanningState(p => ({...p, terreno: val}))} value={planningState.terreno}>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                            {[1,2,3,4,5].map(opt => (
                              <View key={opt} style={{flexDirection: 'row', alignItems: 'center', marginRight: 16}}>
                                <RadioButton value={String(opt)} />
                                <Text style={{marginRight: 8}}>{['Asfalto', 'Esteira', 'Trilha/Montanha', 'Pista', 'Outro'][opt-1]}</Text>
                              </View>
                            ))}
                          </View>
                        </RadioButton.Group>
                        {/* Tipo de Treino */}
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Tipo de Treino</Text>
                        <RadioButton.Group onValueChange={val => setPlanningState(p => ({...p, treino_tipo: val}))} value={planningState.treino_tipo}>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                            {['continuo', 'intervalado', 'longo', 'fartlek', 'tiro', 'ritmo', 'regenerativo'].map((opt, idx) => (
                              <View key={opt} style={{flexDirection: 'row', alignItems: 'center', marginRight: 16}}>
                                <RadioButton value={opt} />
                                <Text style={{marginRight: 8}}>{['Contínuo', 'Intervalado', 'Longo', 'Fartlek', 'Tiro', 'Ritmo', 'Regenerativo'][idx]}</Text>
                              </View>
                            ))}
                          </View>
                        </RadioButton.Group>
                        {/* Duração/Distância */}
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Duração / Distância</Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                          <TextInput label="Distância (km)" value={planningState.distance_km} onChangeText={val => setPlanningState(p => ({...p, distance_km: val}))} keyboardType="numeric" style={{flex: 1, marginRight: 8}} mode="outlined" dense />
                          <TextInput label="Metros" value={planningState.distancia_m} onChangeText={val => setPlanningState(p => ({...p, distancia_m: val}))} keyboardType="numeric" style={{flex: 1, marginRight: 8}} mode="outlined" dense />
                          <TextInput label="Horas" value={planningState.duracao_horas} onChangeText={val => setPlanningState(p => ({...p, duracao_horas: val}))} keyboardType="numeric" style={{flex: 1, marginRight: 8}} mode="outlined" dense />
                          <TextInput label="Minutos" value={planningState.duracao_minutos} onChangeText={val => setPlanningState(p => ({...p, duracao_minutos: val}))} keyboardType="numeric" style={{flex: 1}} mode="outlined" dense />
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
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                             <Button onPress={() => setModalPlanVisible(false)}>Cancelar</Button>
                             <Button mode="contained" onPress={handleSavePlan} style={{ marginLeft: 8 }}>
                               {editingSession ? 'Salvar Alterações' : 'Salvar Treino'}
                             </Button>
                             {editingSession && (
                               <Button 
                                 textColor='red' 
                                 onPress={async () => {
                                   if (editingSession.id) {
                                     await deleteTrainingSession(editingSession.id);
                                     await fetchTrainingSessions();
                                     setEditingSession(null);
                                     setSelectedDay(null);
                                     setModalPlanVisible(false);
                                   }
                                 }} 
                                 style={{ marginLeft: 8 }}
                               >
                                 Excluir Treino
                               </Button>
                             )}
                        </View>
                    </ScrollView>
                </Modal>
            </Portal>
            <Portal>
                <Modal visible={importModalVisible} onDismiss={() => setImportModalVisible(false)} contentContainerStyle={{ width: '90%', alignSelf: 'center', marginVertical: 20, borderRadius: 12, padding: 20, backgroundColor: 'white', maxWidth: 600 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Importar Treinos via CSV</Text>
                    <UniversalDocumentPicker onPick={handleImportCSV} loading={importing} />
                    <Button onPress={() => setImportModalVisible(false)} style={{ marginTop: 8 }}>Cancelar</Button>
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
    minHeight: 24,
    marginHorizontal: 2,
    elevation: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonLabelOutline: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1976d2',
    letterSpacing: 0.5,
  },
  actionButtonLabelContained: {
    fontSize: 10,
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
  // Adicionar estilos padronizados para os textos dos cards
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  cardText: {
    fontSize: 11,
    color: '#222',
    textAlign: 'left',
    flexShrink: 1,
  },
  // Novo estilo para o título do campo
  cardLabel: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#222',
  },
  // Novo estilo para a linha dos botões
  cardButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 6,
    gap: 4,
  },
}); 