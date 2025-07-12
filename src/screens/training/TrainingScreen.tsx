import React, { useState, useMemo, useEffect } from 'react';
import { View, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Portal, Modal, Card, TextInput, Button, Divider, List, Text } from 'react-native-paper';
import { useCheckinStore } from '../../stores/checkin';
import type { TrainingSession } from '../../types/database';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MarkTrainingDoneModal from './MarkTrainingDoneModal';

// --- Constantes e Funções de Data ---
const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getFirstDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function generateCalendarDays(date: Date): Date[] {
    const startOfMonth = getFirstDayOfMonth(date);
    const dayOfWeek = startOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const startDate = new Date(startOfMonth);
    startDate.setDate(startOfMonth.getDate() - dayOfWeek);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) { // 6 semanas para cobrir todos os cenários
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
    }
    return days;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

// --- Componente CustomDay (Lógica de Status Corrigida) ---
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

    let borderColor = '#e0e0e0';
    let statusLabel = '';
    let statusColor = '#e0e0e0';
    let title = training?.title || '';

    if (training) {
        if (training.status === 'completed') {
            borderColor = '#43a047'; // Verde
            statusLabel = 'Realizado';
            statusColor = borderColor;
            title = `${training.distance_completed || 'N/A'} km`;
        } else if (training.status === 'planned') {
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            const trainingDate = new Date(training.training_date);
            trainingDate.setHours(0,0,0,0);
            const [year, month, dayNum] = training.training_date.split('-').map(Number);
            trainingDate.setFullYear(year, month - 1, dayNum);

            if (trainingDate < todayDate) {
                borderColor = '#e53935'; // Vermelho
                statusLabel = 'Perdido';
                statusColor = borderColor;
            } else {
                borderColor = '#ffd600'; // Amarelo
                statusLabel = 'Planejado';
                statusColor = borderColor;
            }
        }
    }

    return (
        <Pressable
            onPress={() => onPress(day, training)}
            onLongPress={() => training && onLongPress(day, training)}
            style={[styles.dayContainer, { borderColor, backgroundColor: isOtherMonth ? '#f7f7f7' : '#fff' }]}
        >
            <Text style={[styles.dayText, { color: isToday ? '#1976d2' : isOtherMonth ? '#ccc' : '#222' }]}>
                {day.getDate()}
            </Text>
            {training && (
                <>
                    <Text style={styles.trainingTitle} numberOfLines={1}>{title}</Text>
                    <Text style={[styles.statusLabel, { backgroundColor: statusColor }]}>{statusLabel}</Text>
                </>
            )}
        </Pressable>
    );
}

// --- Componente Principal ---
export default function TrainingScreen() {
    const trainingSessions = useCheckinStore(s => s.trainingSessions);
    const fetchTrainingSessions = useCheckinStore(s => s.fetchTrainingSessions);
    const planTrainingSession = useCheckinStore(s => s.planTrainingSession);
    const markTrainingAsCompleted = useCheckinStore(s => s.markTrainingAsCompleted);

    const [displayDate, setDisplayDate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    const [modalPlanVisible, setModalPlanVisible] = useState(false);
    const [modalDoneVisible, setModalDoneVisible] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);

    // Estados do Formulário de Planejamento (Corrigidos)
    const [planningTitle, setPlanningTitle] = useState('');
    const [planningModalidade, setPlanningModalidade] = useState('corrida');
    const [planningEffort, setPlanningEffort] = useState(1);
    const [planningPercurso, setPlanningPercurso] = useState('');
    const [planningTerreno, setPlanningTerreno] = useState('');
    const [planningTipoTreino, setPlanningTipoTreino] = useState('');
    const [planningDuration, setPlanningDuration] = useState('');

    useEffect(() => {
        setLoading(true);
        fetchTrainingSessions().finally(() => setLoading(false));
    }, [fetchTrainingSessions]);

    const days = useMemo(() => generateCalendarDays(displayDate), [displayDate]);
    const trainingByDate = useMemo(() => {
        const map: Record<string, TrainingSession> = {};
        trainingSessions.forEach(t => {
            map[t.training_date] = t;
        });
        return map;
    }, [trainingSessions]);

    const handleDayPress = (day: Date, training?: TrainingSession | null) => {
        setSelectedDay(day);
        setEditingSession(training || null);
        if (training) {
            if(training.status === 'planned'){
                setModalDoneVisible(true);
            }
        } else {
            // Limpa o formulário antes de abrir
            setPlanningTitle('');
            setPlanningModalidade('corrida');
            setPlanningEffort(1);
            setPlanningPercurso('');
            setPlanningTerreno('');
            setPlanningTipoTreino('');
            setPlanningDuration('');
            setModalPlanVisible(true);
        }
    };
    
    const handleSavePlan = async () => {
        if (!selectedDay) return;

        const trainingData: Partial<TrainingSession> = {
            training_date: formatDate(selectedDay),
            title: planningTitle,
            status: 'planned',
            user_id: useCheckinStore.getState().user?.id,
            // Campos Corretos
            modalidade: planningModalidade,
            effort_planned: planningEffort,
            percurso: planningPercurso,
            terreno: planningTerreno,
            treino_tipo: planningTipoTreino,
            duration_planned: planningDuration ? Number(planningDuration) : null,
        };
        
        await planTrainingSession(trainingData);
        setModalPlanVisible(false);
        fetchTrainingSessions();
    };

    const handleSaveDone = async (completedData: Partial<TrainingSession>) => {
        if (!editingSession) return;
        await markTrainingAsCompleted(editingSession.id, completedData);
        setModalDoneVisible(false);
        fetchTrainingSessions();
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
                {WEEKDAYS.map(day => <Text key={day} style={styles.weekdayText}>{day}</Text>)}
            </View>
            {loading ? <ActivityIndicator size="large" /> : (
                <View style={styles.calendarGrid}>
                    {days.map(day => (
                        <CustomDay
                            key={day.toISOString()}
                            day={day}
                            displayMonth={displayDate.getMonth()}
                            training={trainingByDate[formatDate(day)] || null}
                            onPress={handleDayPress}
                            onLongPress={() => {}}
                        />
                    ))}
                </View>
            )}

            {/* --- Modal de Planejamento --- */}
            <Portal>
                <Modal visible={modalPlanVisible} onDismiss={() => setModalPlanVisible(false)} contentContainerStyle={styles.modalContainer}>
                    <ScrollView>
                        <Text variant="titleLarge">Planejar Treino</Text>
                        <TextInput label="Título (Opcional)" value={planningTitle} onChangeText={setPlanningTitle} mode="outlined" dense style={{marginTop: 10}}/>
                        <TextInput label="Duração Planejada (min)" value={planningDuration} onChangeText={setPlanningDuration} keyboardType="numeric" mode="outlined" dense style={{marginTop: 10}}/>

                        <Text variant="titleMedium" style={{marginTop: 15}}>Tipo de Treino</Text>
                        <TextInput value={planningTipoTreino} onChangeText={setPlanningTipoTreino} mode="outlined" dense/>
                        
                        <Text variant="titleMedium" style={{marginTop: 15}}>Terreno</Text>
                        <TextInput value={planningTerreno} onChangeText={setPlanningTerreno} mode="outlined" dense/>
                        
                        <View style={{flexDirection: 'row', justifyContent: 'space-around', marginTop: 20}}>
                             <Button onPress={() => setModalPlanVisible(false)}>Cancelar</Button>
                             <Button mode="contained" onPress={handleSavePlan}>Salvar</Button>
                        </View>
                    </ScrollView>
                </Modal>
            </Portal>

            {/* --- Modal para Marcar como Realizado --- */}
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

// --- Estilos ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 8 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    headerText: { fontWeight: 'bold', fontSize: 20 },
    weekdaysContainer: { flexDirection: 'row', marginBottom: 4 },
    weekdayText: { flex: 1, textAlign: 'center', color: '#888', fontWeight: 'bold' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayContainer: {
        width: `${100 / 7}%`,
        height: 90,
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderWidth: 1,
        padding: 2,
    },
    dayText: { fontWeight: 'bold', fontSize: 14 },
    trainingTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 4, textAlign: 'center' },
    statusLabel: {
        fontSize: 10,
        color: 'white',
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 4,
        overflow: 'hidden',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
    }
});