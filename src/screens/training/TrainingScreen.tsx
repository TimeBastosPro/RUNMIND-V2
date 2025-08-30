import React, { useState, useMemo, useEffect } from 'react';
import { View, Pressable, ActivityIndicator, ScrollView, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { Portal, Modal, TextInput, Button, Text, Checkbox, RadioButton, List, Chip, SegmentedButtons } from 'react-native-paper';
import { useCheckinStore } from '../../stores/checkin';
import { useCoachStore } from '../../stores/coach';
import { useCyclesStore } from '../../stores/cycles';
import type { TrainingSession } from '../../types/database';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MarkTrainingDoneModal from './MarkTrainingDoneModal';
import Slider from '@react-native-community/slider';
import { UniversalDocumentPicker } from '../../components/ui/UniversalDocumentPicker';
import Papa from 'papaparse';
import { useAuthStore } from '../../stores/auth';
import { useViewStore } from '../../stores/view';
import { resetToCoachMain } from '../../navigation/navigationRef';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';
import CreateMacrocicloModal from './CreateMacrocicloModal';
import CreateMesocicloModal from './CreateMesocicloModal';
import CyclesOverview from './CyclesOverview';
import type { Macrociclo, Mesociclo, Microciclo } from '../../types/database';
import { getWeekStart, getWeekEnd, formatWeekPeriod } from '../../utils/weekCalculation';

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
  let dayOfWeek = startOfMonth.getDay();
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

function groupDaysByWeek(days: Date[]): Date[][] {
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

function getDateKey(dateString: string): string {
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

function CustomDay({ day, displayMonth, training, onOpenPlanModal, onOpenRealizadoModal, onLongPress }: CustomDayProps & { onOpenPlanModal: (day: Date, training?: TrainingSession | null) => void, onOpenRealizadoModal: (day: Date, training?: TrainingSession | null) => void, onLongPress: (day: Date, training: TrainingSession) => void }) {
    const isOtherMonth = day.getMonth() !== displayMonth;
    const isToday = isSameDay(day, new Date());

    let dynamicStyle: any = { backgroundColor: '#fff', borderColor: '#e0e0e0' };
    let status = '';
    if (training) {
        if (training.status === 'completed') {
            dynamicStyle = { ...dynamicStyle, borderColor: '#4CAF50', boxShadow: '0 0 8px #4CAF50' };
            status = 'realizado';
        } else if (training.status === 'planned') {
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

    const hasPlanned = training && training.status === 'planned';
    const treinoButtonTitle = hasPlanned ? 'Editar' : 'Criar';

    return (
        <Pressable 
            style={[styles.dayContainer, dynamicStyle]}
            onLongPress={() => {
              console.log('👆 Long press detectado no card:', { 
                day: day.getDate(), 
                training: training ? {
                  id: training.id,
                  title: training.title,
                  status: training.status,
                  training_date: training.training_date
                } : null
              });
              if (training) {
                onLongPress(day, training);
              }
            }}
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
            <View style={styles.trainingContent}>
                {training ? (
                    <>
                        {training.status === 'completed' ? (
                            <>
                                <View style={styles.cardRow}><Text style={styles.cardLabel}>Duração: </Text><Text style={styles.cardText}>{training.distance_km ? `${training.distance_km} km` : `${training.duracao_horas || '0'}h ${training.duracao_minutos || '0'}min`}</Text></View>
                                                                 <View style={styles.cardRow}><Text style={styles.cardLabel}>Altimetria: </Text><Text style={styles.cardText}>{
                                   (() => {
                                     const gain = training.elevation_gain_meters || 0;
                                     const loss = training.elevation_loss_meters || 0;
                                     
                                     if (gain !== null && gain !== undefined || loss !== null && loss !== undefined) {
                                       const gainText = gain > 0 ? `+${gain}m` : gain === 0 ? '+0m' : '';
                                       const lossText = loss > 0 ? `-${loss}m` : loss === 0 ? '-0m' : '';
                                       const separator = (gain > 0 || gain === 0) && (loss > 0 || loss === 0) ? ' / ' : '';
                                       return `${gainText}${separator}${lossText}`;
                                     }
                                     return '-';
                                   })()
                                 }</Text></View>
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
                    <View style={{ marginTop: 16 }}>
                        <MaterialCommunityIcons name="run" size={28} color="#e0e0e0" />
                    </View>
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
                    style={[
                        styles.actionButton, 
                        { 
                            backgroundColor: '#4CAF50',
                            elevation: training && training.status === 'completed' ? 0 : 3,
                        }
                    ]}
                    labelStyle={styles.actionButtonLabelContained}
                    onPress={() => onOpenRealizadoModal(day, training || null)}
                >
                    Realizado
                </Button>
            </View>
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
      deleteTrainingSession,
      submitWeeklyReflection,
      triggerAssimilationInsight
    } = useCheckinStore(s => s);
    const navigation = useNavigation();
    const { isCoachView, exitCoachView, viewAsAthleteId } = useViewStore();
    const [athleteName, setAthleteName] = useState<string | null>(null);

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
    
    // Estados para ciclos de treinamento
    const [showCycles, setShowCycles] = useState(false);
    const [macrocicloModalVisible, setMacrocicloModalVisible] = useState(false);

    const [mesocicloModalVisible, setMesocicloModalVisible] = useState(false);
    const [selectedMacrocicloId, setSelectedMacrocicloId] = useState<string>('');
    const [macrocicloToEdit, setMacrocicloToEdit] = useState<Macrociclo | null>(null);
  
    const [mesocicloToEdit, setMesocicloToEdit] = useState<Mesociclo | null>(null);
    
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
    const { width } = useWindowDimensions();
    const isMobile = width < 600;
    
    // Store de ciclos
    const { 
      macrociclos, 
      microciclos, 
      cycleTrainingSessions,
      fetchMacrociclos, 
      fetchMicrociclos, 
      fetchCycleTrainingSessions,
      getCurrentCycle 
    } = useCyclesStore();

    useEffect(() => {
        setLoading(true);
        fetchTrainingSessions().finally(() => {
            setLoading(false);
            console.log('📊 Todos os treinos carregados:', trainingSessions.map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                date: t.training_date,
                modalidade: t.modalidade,
                terreno: t.terreno,
                treino_tipo: t.treino_tipo,
                intensidade: t.intensidade
            })));
        });
    }, [fetchTrainingSessions, isCoachView, viewAsAthleteId, displayDate]);

    // Carregar ciclos de treinamento
    useEffect(() => {
        if (userId) {
            fetchMacrociclos(isCoachView && viewAsAthleteId ? viewAsAthleteId : undefined);
            fetchMicrociclos(undefined, isCoachView && viewAsAthleteId ? viewAsAthleteId : undefined);
        }
    }, [userId, fetchMacrociclos, fetchMicrociclos, isCoachView, viewAsAthleteId]);

    // Carregar nome do atleta para cabeçalho no modo treinador
    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (isCoachView && viewAsAthleteId) {
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', viewAsAthleteId)
                    .maybeSingle();
                if (isMounted) setAthleteName(data?.full_name || data?.email || null);
            } else {
                if (isMounted) setAthleteName(null);
            }
        })();
        return () => { isMounted = false; };
    }, [isCoachView, viewAsAthleteId]);

    const handleExitCoachMode = () => {
        exitCoachView();
        try { resetToCoachMain(); } catch { /* noop */ }
        // Recarregar contexto do treinador em background
        try {
          const { loadCoachProfile, loadCoachRelationships } = useCoachStore.getState();
          loadCoachProfile();
          loadCoachRelationships();
        } catch {}
    };

    // ✅ CORREÇÃO: Usar função padronizada para cálculo de semanas
    function getWeekStartString(date: Date) {
      const weekStart = getWeekStart(date);
      return weekStart.toISOString().split('T')[0];
    }

    useEffect(() => {
      const today = new Date();
      const weekStart = getWeekStart(today);
      if (today.getDay() === 0) {
        setWeeklyReflectionVisible(true);
      }
    }, []);

    const handleSaveWeeklyReflection = async (answers: any) => {
      console.log('Reflexão semanal (modo teste):', answers);
      setWeeklyReflectionVisible(false);
    };

    const calendarDays = useMemo(() => generateCalendarDays(displayDate), [displayDate]);
    const weeks = useMemo(() => groupDaysByWeek(calendarDays), [calendarDays]);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

    useEffect(() => {
      // ✅ CORRIGIDO: Encontrar a semana que contém o dia atual
      const today = new Date();
      const todayString = formatDate(today);
      
      // Encontrar qual semana contém o dia de hoje
      let weekIndex = 0;
      for (let i = 0; i < weeks.length; i++) {
        const weekDays = weeks[i].map(day => formatDate(day));
        if (weekDays.includes(todayString)) {
          weekIndex = i;
          break;
        }
      }
      
      setCurrentWeekIndex(weekIndex);
    }, [displayDate, weeks]);

    const trainingSessionsByDate = useMemo(() => {
        const map: Record<string, TrainingSession> = {};
        trainingSessions.filter(t => t.status === 'completed').forEach(t => {
            const dateKey = getDateKey(t.training_date);
            map[dateKey] = t;
        });
        trainingSessions.filter(t => t.status === 'planned').forEach(t => {
            const dateKey = getDateKey(t.training_date);
            if (!map[dateKey]) map[dateKey] = t;
        });
        return map;
    }, [trainingSessions]);

    const handleOpenRealizadoModal = (day: Date, training?: TrainingSession | null) => {
        console.log('Abrindo modal de treino realizado', { day, training });
        let session = training;
        if (!session) {
            session = {
                user_id: userId || '',
                training_date: formatDate(day),
                title: 'Treino Realizado',
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

    const handleDayPress = handleOpenRealizadoModal;
    const handleEditTraining = handleOpenRealizadoModal;
    const handleMarkCompleted = handleOpenRealizadoModal;

    const handleDayLongPress = async (day: Date, training: TrainingSession) => {
      console.log('🔍 handleDayLongPress chamado:', { 
        day: day.getDate(), 
        training: {
          id: training.id,
          title: training.title,
          status: training.status,
          training_date: training.training_date,
          modalidade: training.modalidade,
          terreno: training.terreno,
          treino_tipo: training.treino_tipo,
          intensidade: training.intensidade
        }
      });
      
      return new Promise<void>((resolve) => {
        Alert.alert(
          "Excluir Treino",
          `Deseja realmente excluir o treino "${training.title}"?\n\nData: ${training.training_date}\nModalidade: ${training.modalidade || 'N/A'}\nStatus: ${training.status}`,
          [
            { text: "Cancelar", style: "cancel", onPress: () => {
              console.log('❌ Usuário cancelou a exclusão');
              resolve();
            }},
            { text: "Excluir", style: "destructive", onPress: async () => {
                try {
                  console.log('🚀 Iniciando exclusão do treino:', {
                    id: training.id,
                    title: training.title,
                    status: training.status,
                    date: training.training_date
                  });
                  
                  if (!training.id) {
                    console.error('❌ ID do treino é null/undefined');
                    throw new Error('ID do treino não encontrado');
                  }
                  
                  console.log('📋 Tipo do ID:', typeof training.id);
                  console.log('📋 Valor do ID:', training.id);
                  
                  const result = await deleteTrainingSession(training.id);
                  console.log('✅ Resultado da exclusão:', result);
                  
                  await fetchTrainingSessions();
                  console.log('🔄 Dados recarregados após exclusão');
                  
                  Alert.alert('✅ Sucesso', 'Treino excluído com sucesso!');
                } catch (error) {
                  console.error('❌ Erro ao excluir treino:', error);
                  console.error('❌ Detalhes do erro:', {
                    message: error instanceof Error ? error.message : 'Erro desconhecido',
                    stack: error instanceof Error ? error.stack : 'N/A'
                  });
                  Alert.alert('❌ Erro', `Não foi possível excluir o treino.\n\nErro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                }
                resolve();
              }
            }
          ]
        );
      });
    };
    
    const [isSavingPlan, setIsSavingPlan] = useState(false);

    const handleSavePlan = async () => {
        console.log('🔍 handleSavePlan iniciado');
        if (!selectedDay) {
            Alert.alert("Erro", "Selecione um dia para planejar o treino.");
            return;
        }
        const trainingData: Partial<TrainingSession> = {
            training_date: formatDate(selectedDay),
            title: 'Treino Planejado',
            training_type: 'planned',
            status: 'planned',
            modalidade: planningState.modalidade || undefined,
            esforco: planningState.esforco || undefined,
            percurso: planningState.percurso || undefined,
            terreno: planningState.terreno || undefined,
            treino_tipo: planningState.treino_tipo || undefined,
            intensidade: planningState.intensidade || undefined,
            // CORREÇÃO: Usar os campos que realmente existem no banco
            distance_km: planningState.distance_km && planningState.distance_km !== '' ? 
              (isNaN(Number(planningState.distance_km)) ? 0 : Number(planningState.distance_km)) : 
              undefined,
            duracao_horas: planningState.duracao_horas && planningState.duracao_horas !== '' ? 
              planningState.duracao_horas : undefined,
            duracao_minutos: planningState.duracao_minutos && planningState.duracao_minutos !== '' ? 
              planningState.duracao_minutos : undefined,
            distance_m: (planningState as any).distancia_m || undefined,
            observacoes: planningState.observacoes || undefined,
        };
        try {
            setIsSavingPlan(true);
            console.log('🔍 DEBUG - Salvando treino planejado:', {
                ...trainingData,
                'distance_km': trainingData.distance_km,
                'duracao_horas': trainingData.duracao_horas,
                'duracao_minutos': trainingData.duracao_minutos,
                'planningState.distance_km': planningState.distance_km,
                'planningState.duracao_horas': planningState.duracao_horas,
                'planningState.duracao_minutos': planningState.duracao_minutos,
                'tipos dos dados': {
                    'distance_km type': typeof trainingData.distance_km,
                    'duracao_horas type': typeof trainingData.duracao_horas,
                    'duracao_minutos type': typeof trainingData.duracao_minutos,
                    'planningState.distance_km type': typeof planningState.distance_km,
                    'planningState.duracao_horas type': typeof planningState.duracao_horas,
                    'planningState.duracao_minutos type': typeof planningState.duracao_minutos
                }
            });
            console.log('🔍 Chamando saveTrainingSession...');
            await saveTrainingSession(trainingData);
            console.log('✅ Treino planejado salvo com sucesso no banco');
            console.log('🔍 Fechando modal...');
            // Fecha o modal imediatamente para feedback visual
            setModalPlanVisible(false);
            console.log('✅ Modal fechado');
            // Recarrega em background para atualizar cards
            console.log('🔍 Recarregando dados...');
            await fetchTrainingSessions();
            console.log('✅ Dados recarregados');
            Alert.alert("✅ Sucesso", "Treino planejado salvo com sucesso!");
        } catch (err) {
            console.error('❌ Erro ao salvar treino:', err);
            Alert.alert("❌ Erro", "Não foi possível salvar o treino. Tente novamente.");
        } finally {
            console.log('🔍 Finalizando handleSavePlan...');
            setIsSavingPlan(false);
            console.log('✅ handleSavePlan finalizado');
        }
    };

    const handleSaveDone = async (completedData: Partial<TrainingSession>) => {
        if (!editingSession) return;
        try {
            // ✅ CORRIGIDO: Se o treino já existe (tem ID), usar markTrainingAsCompleted
            if (editingSession.id) {
                console.log('🔍 Treino existente encontrado, marcando como realizado:', editingSession.id);
                // ✅ CORRIGIDO: Converter tipos para compatibilidade
                const markData = {
                    perceived_effort: completedData.perceived_effort ? Number(completedData.perceived_effort) : undefined,
                    session_satisfaction: completedData.session_satisfaction ? Number(completedData.session_satisfaction) : undefined,
                    notes: completedData.observacoes || undefined,
                    avg_heart_rate: completedData.avg_heart_rate ? Number(completedData.avg_heart_rate) : undefined,
                    elevation_gain_meters: completedData.elevation_gain_meters ? Number(completedData.elevation_gain_meters) : undefined,
                    distance_km: completedData.distance_km ? Number(completedData.distance_km) : undefined,
                    // ✅ CORRIGIDO: Usar os campos corretos de duração
                    duracao_horas: completedData.duracao_horas || undefined,
                    duracao_minutos: completedData.duracao_minutos || undefined,
                };
                await markTrainingAsCompleted(editingSession.id, markData);
                console.log('✅ Treino marcado como realizado com sucesso');
                
                // ✅ NOVO: Disparar insight após marcar como realizado
                console.log('🔍 Disparando insight de assimilação...');
                try {
                    // Buscar o treino atualizado para passar para o insight
                    const updatedSession = { ...editingSession, ...markData, status: 'completed' as const };
                    await triggerAssimilationInsight(updatedSession);
                    console.log('✅ Insight de assimilação disparado com sucesso');
                } catch (insightError) {
                    console.error('❌ Erro ao disparar insight de assimilação:', insightError);
                }
            } else {
                // ✅ NOVO: Se é um novo treino, usar saveTrainingSession
                const treinoParaSalvar: Partial<TrainingSession> = {
                    ...completedData,
                    training_date: editingSession.training_date,
                    status: 'completed',
                    title: completedData.title || 'Treino Realizado',
                    training_type: completedData.training_type || 'manual',
                };
                
                console.log('🔍 Novo treino, salvando:', treinoParaSalvar);
                await saveTrainingSession(treinoParaSalvar);
                console.log('✅ Novo treino salvo com sucesso');
            }
            
            await fetchTrainingSessions();
            setModalDoneVisible(false); // ✅ CORRIGIDO: Fechar modal após sucesso
            Alert.alert('✅ Sucesso', 'Treino realizado salvo com sucesso!');
        } catch (err: any) {
            console.error('Erro ao salvar treino realizado:', err);
            Alert.alert('❌ Erro', 'Erro ao salvar treino: ' + (err.message || String(err)));
            // ✅ CORRIGIDO: Não fechar modal em caso de erro
        }
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

    const handleImportCSV = async (file: File | Blob) => {
        setImporting(true);
        try {
            Papa.parse(file as any, {
                header: true,
                complete: async (results: any) => {
                    console.log('CSV importado (modo teste):', results.data);
                    Alert.alert('✅ Sucesso', 'CSV processado! (Modo teste - não salvo no servidor)');
                    setImportModalVisible(false);
                },
                error: (err: any) => {
                    Alert.alert('❌ Erro', 'Falha ao processar CSV: ' + err.message);
                },
            });
        } catch (err: any) {
            Alert.alert('❌ Erro', 'Falha ao importar CSV: ' + err.message);
        } finally {
            setImporting(false);
        }
    };

    // Funções para gerenciar ciclos
    const handleOpenMacrocicloModal = () => {
        setMacrocicloModalVisible(true);
    };


    const handleOpenMesocicloModal = (macrocicloId: string) => {
    setSelectedMacrocicloId(macrocicloId);
    setMesocicloModalVisible(true);
  };

    const handleCycleSuccess = async () => {
        try {
            console.log('🔄 DEBUG - TrainingScreen: Recarregando ciclos após criação...');
            // Recarregar ciclos após criação
            await fetchMacrociclos(isCoachView && viewAsAthleteId ? viewAsAthleteId : undefined);
            console.log('✅ DEBUG - TrainingScreen: Ciclos recarregados com sucesso');
        } catch (error) {
            console.error('❌ DEBUG - TrainingScreen: Erro ao recarregar ciclos:', error);
        }
    };

    // Guard: treinador sem atleta selecionado
    if (isCoachView && !viewAsAthleteId) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Chip icon="shield-account" mode="outlined" style={{ marginBottom: 12 }}>Visualizando como Treinador</Chip>
          <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 12 }}>
            Selecione um atleta em Meus Atletas → Ver Perfil para gerenciar treinos.
          </Text>
          <Button mode="contained" onPress={() => { try { resetToCoachMain(); } catch {} }}>Ir para Meus Atletas</Button>
        </View>
      );
    }

    return (
        <ScrollView style={{ flex: 1 }}>
            {isCoachView && (
              <View style={{ padding: 10, margin: 12, borderRadius: 8, backgroundColor: '#EDE7F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip icon="shield-account" mode="outlined">Visualizando como Treinador</Chip>
                <Button mode="text" onPress={handleExitCoachMode}>Sair do modo treinador</Button>
              </View>
            )}
            <View style={[styles.headerContainer, isMobile && styles.headerContainerMobile]}>
                <Button onPress={() => isMobile ? setCurrentWeekIndex(i => Math.max(i - 1, 0)) : setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1))}>
                    Anterior
                </Button>
                <Text style={[styles.headerTitle, isMobile && styles.headerTitleMobile]}>
                    {MONTHS_PT[displayDate.getMonth()]} {displayDate.getFullYear()}
                </Text>
                <Button onPress={() => isMobile ? setCurrentWeekIndex(i => Math.min(i + 1, weeks.length - 1)) : setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1))}>
                    Próximo
                </Button>
                <Button onPress={() => setImportModalVisible(true)} style={[styles.importButton, isMobile && styles.importButtonMobile]}>
                    Importar Planilha (.csv)
                </Button>
            </View>
            
            {/* Botões de Ciclos */}
            <View style={styles.cyclesButtonsContainer}>
                <Button
                    mode="outlined"
                    onPress={() => setShowCycles(!showCycles)}
                    style={styles.cyclesToggleButton}
                    icon={showCycles ? "calendar-remove" : "calendar-plus"}
                >
                    {showCycles ? "Ocultar Ciclos" : "Gerenciar Ciclos"}
                </Button>
            </View>
            {!isMobile && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 12 }}>
                    {WEEKDAYS.map((d, i) => (
                        <Text key={i} style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#888' }}>{d}</Text>
                    ))}
                </View>
            )}
            {isMobile ? (
                <View style={{ flexDirection: 'column', margin: 8 }}>
                    {weeks[currentWeekIndex]?.map((day, idx) => {
                        const dateKey = formatDate(day);
                        const training = trainingSessionsByDate[dateKey] || null;
                        return (
                            <View key={dateKey} style={{ marginVertical: 4 }}>
                                <CustomDay
                                    day={day}
                                    displayMonth={displayDate.getMonth()}
                                    training={training}
                                    onOpenPlanModal={handleOpenPlanModal}
                                    onOpenRealizadoModal={handleOpenRealizadoModal}
                                    onPress={() => {}}
                                    onLongPress={handleDayLongPress}
                                />
                            </View>
                        );
                    })}
                </View>
            ) : (
                weeks.map((week, wIdx) => (
                    <View key={wIdx} style={{ flexDirection: 'row', marginVertical: 2 }}>
                        {week.map((day, idx) => {
                            const dateKey = formatDate(day);
                            const training = trainingSessionsByDate[dateKey] || null;
                            return (
                                <View key={dateKey} style={{ flex: 1, marginHorizontal: 2 }}>
                                    <CustomDay
                                        day={day}
                                        displayMonth={displayDate.getMonth()}
                                        training={training}
                                        onOpenPlanModal={handleOpenPlanModal}
                                        onOpenRealizadoModal={handleOpenRealizadoModal}
                                        onPress={() => {}}
                                        onLongPress={handleDayLongPress}
                                    />
                                </View>
                            );
                        })}
                    </View>
                ))
            )}

            <Portal>
                <Modal visible={modalPlanVisible} onDismiss={() => setModalPlanVisible(false)} contentContainerStyle={{ width: '95%', alignSelf: 'center', marginVertical: 10, borderRadius: 12, padding: 16, backgroundColor: 'white', maxHeight: '90%' }}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text variant="titleLarge" style={{ marginBottom: 10, textAlign: 'left', fontWeight: 'bold' }}>
                          {editingSession ? 'Editar Treino Planejado' : 'Planejar Novo Treino'}
                        </Text>
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
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Duração / Distância</Text>
                        <View style={{marginBottom: 12}}>
                          <View style={{flexDirection: 'row', marginBottom: 8}}>
                            <TextInput label="Distância (km)" value={planningState.distance_km} onChangeText={val => setPlanningState(p => ({...p, distance_km: val}))} keyboardType="numeric" style={{flex: 1, marginRight: 8}} mode="outlined" dense />
                            <TextInput label="Metros" value={planningState.distancia_m} onChangeText={val => setPlanningState(p => ({...p, distancia_m: val}))} keyboardType="numeric" style={{flex: 1}} mode="outlined" dense />
                          </View>
                          <View style={{flexDirection: 'row'}}>
                            <TextInput label="Horas" value={planningState.duracao_horas} onChangeText={val => setPlanningState(p => ({...p, duracao_horas: val}))} keyboardType="numeric" style={{flex: 1, marginRight: 8}} mode="outlined" dense />
                            <TextInput label="Minutos" value={planningState.duracao_minutos} onChangeText={val => setPlanningState(p => ({...p, duracao_minutos: val}))} keyboardType="numeric" style={{flex: 1}} mode="outlined" dense />
                          </View>
                        </View>
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
                        <TextInput label="Observações" value={planningState.observacoes} onChangeText={val => setPlanningState(p => ({...p, observacoes: val}))} multiline numberOfLines={3} mode="outlined" style={{marginBottom: 12}}/>
                        <View style={{ marginTop: 10 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Button onPress={() => setModalPlanVisible(false)}>Cancelar</Button>
                            <Button mode="contained" onPress={handleSavePlan} disabled={isCoachView && !viewAsAthleteId}>
                              {editingSession ? 'Salvar Alterações' : 'Salvar Treino'}
                            </Button>
                            {(isCoachView && !viewAsAthleteId) && (
                              <Text style={{ color: '#d32f2f', marginLeft: 12 }}>Selecione um atleta para planejar treinos</Text>
                            )}
                          </View>
                          {editingSession && (
                            <Button 
                              textColor='red' 
                              onPress={async () => {
                                try {
                                  console.log('🚀 Excluindo treino via modal:', {
                                    id: editingSession?.id,
                                    title: editingSession?.title,
                                    status: editingSession?.status,
                                    date: editingSession?.training_date,
                                    modalidade: editingSession?.modalidade
                                  });
                                  
                                  if (!editingSession?.id) {
                                    console.error('❌ ID do treino é null/undefined no modal');
                                    throw new Error('ID do treino não encontrado');
                                  }
                                  
                                  console.log('📋 Tipo do ID (modal):', typeof editingSession.id);
                                  console.log('📋 Valor do ID (modal):', editingSession.id);
                                  
                                  const result = await deleteTrainingSession(editingSession.id);
                                  console.log('✅ Resultado da exclusão via modal:', result);
                                  
                                  await fetchTrainingSessions();
                                  console.log('🔄 Dados recarregados após exclusão via modal');
                                  
                                  Alert.alert('✅ Sucesso', 'Treino excluído com sucesso!');
                                  setEditingSession(null);
                                  setSelectedDay(null);
                                  setModalPlanVisible(false);
                                } catch (error) {
                                  console.error('❌ Erro ao excluir treino via modal:', error);
                                  console.error('❌ Detalhes do erro (modal):', {
                                    message: error instanceof Error ? error.message : 'Erro desconhecido',
                                    stack: error instanceof Error ? error.stack : 'N/A'
                                  });
                                  Alert.alert('❌ Erro', `Não foi possível excluir o treino.\n\nErro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                                }
                              }} 
                              style={{ alignSelf: 'center' }}
                            >
                              Excluir Treino
                            </Button>
                          )}
                        </View>
                    </ScrollView>
                </Modal>
            </Portal>
            <Portal>
                <Modal visible={importModalVisible} onDismiss={() => setImportModalVisible(false)} contentContainerStyle={{ width: '95%', alignSelf: 'center', marginVertical: 10, borderRadius: 12, padding: 16, backgroundColor: 'white' }}>
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

            {/* Visualização de Ciclos */}
            {showCycles && (
                <CyclesOverview
                    onOpenMacrocicloModal={handleOpenMacrocicloModal}
                    onOpenMesocicloModal={handleOpenMesocicloModal}
                    athleteId={isCoachView && viewAsAthleteId ? viewAsAthleteId : undefined}
                />
            )}

            {/* Modais de Ciclos */}
            <CreateMacrocicloModal
                visible={macrocicloModalVisible}
                onDismiss={() => setMacrocicloModalVisible(false)}
                onSuccess={handleCycleSuccess}
                athleteId={isCoachView && viewAsAthleteId ? viewAsAthleteId : undefined}
            />
            <CreateMesocicloModal
                visible={mesocicloModalVisible}
                onDismiss={() => setMesocicloModalVisible(false)}
                onSuccess={handleCycleSuccess}
                selectedMacrocicloId={selectedMacrocicloId}
                mesocicloToEdit={mesocicloToEdit}
                athleteId={isCoachView && viewAsAthleteId ? viewAsAthleteId : undefined}
            />
        </ScrollView>
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
    gap: 16,
    paddingHorizontal: 8,
  },
  dayContainer: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    padding: 14,
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  dayText: {
    fontWeight: 'bold',
    fontSize: 24,
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
  cardLabel: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#222',
  },
  cardButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 6,
    gap: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 12,
  },
  headerContainerMobile: {
    marginTop: 50,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerTitleMobile: {
    fontSize: 14,
  },
  importButton: {
    marginLeft: 8,
  },
  importButtonMobile: {
    marginLeft: 4,
    fontSize: 12,
  },
  cyclesButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  cyclesToggleButton: {
    borderColor: '#2196F3',
    borderWidth: 1,
  },
}); 