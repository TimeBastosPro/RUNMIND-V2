import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Portal, Modal, Card, TextInput, RadioButton, Button, Divider, List } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useCheckinStore } from '../../stores/checkin';
// Adicione no topo do arquivo para evitar erro de tipagem do MaterialCommunityIcons
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MarkTrainingDoneModal from './MarkTrainingDoneModal';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getFirstMonday(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfWeek = first.getDay() === 0 ? 7 : first.getDay();
  const diff = dayOfWeek === 1 ? 0 : (1 - dayOfWeek < 0 ? 7 + (1 - dayOfWeek) : 1 - dayOfWeek);
  const firstMonday = new Date(first);
  firstMonday.setDate(first.getDate() + diff);
  return firstMonday;
}

function generateCalendarGrid(date: Date) {
  const firstMonday = getFirstMonday(date);
  const days: Date[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(firstMonday);
    d.setDate(firstMonday.getDate() + i);
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

function CustomDay({ day, displayMonth, onPressPlan, onPressDone, training }: any) {
  const isOtherMonth = day.getMonth() !== displayMonth;
  const today = new Date();
  const isToday = isSameDay(day, today);
  const isCompleted = training && training.status === 'completed';
  // Corrigir lógica de missed: comparar apenas ano, mês, dia
  const trainingDate = training ? new Date(training.training_date) : null;
  const isMissed = training && training.status !== 'completed' && trainingDate &&
    (trainingDate.getFullYear() < today.getFullYear() ||
      (trainingDate.getFullYear() === today.getFullYear() && trainingDate.getMonth() < today.getMonth()) ||
      (trainingDate.getFullYear() === today.getFullYear() && trainingDate.getMonth() === today.getMonth() && trainingDate.getDate() < today.getDate()));
  const borderColor = training ? (isCompleted ? '#43a047' : isMissed ? '#e53935' : '#ffd600') : '#e0e0e0';
  const shadowColor = isCompleted ? '#43a047' : isMissed ? '#e53935' : training ? '#ffd600' : '#e0e0e0';
  return (
    <Pressable
      onPress={() => !training && onPressPlan(day)}
      style={{
        flex: 1,
        aspectRatio: 1,
        borderWidth: 1.5,
        borderColor: borderColor,
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#fff',
        minHeight: 100,
        padding: 2,
        position: 'relative',
        margin: 2,
        borderRadius: 12,
        shadowColor: shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: training ? 0.25 : 0.1,
        shadowRadius: 6,
        elevation: training ? 4 : 1,
      }}
    >
      {/* Número do dia */}
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        {isToday ? (
          <View style={{ backgroundColor: '#1976d2', borderRadius: 16, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{day.getDate()}</Text>
          </View>
        ) : (
          <Text style={{ color: isOtherMonth ? '#bbb' : '#222', fontWeight: 'bold', fontSize: 16, opacity: isOtherMonth ? 0.5 : 1 }}>{day.getDate()}</Text>
        )}
      </View>
      {/* Card de treino expandido */}
      {training && (
        <View style={{
          flex: 1,
          width: '98%',
          marginTop: 6,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: borderColor,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 6,
          paddingHorizontal: 4,
          shadowColor: shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 6,
          elevation: 3,
        }}>
          <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#222', textAlign: 'center' }} numberOfLines={2}>{training.title}</Text>
          <Text style={{ fontSize: 12, color: '#333', textAlign: 'center' }} numberOfLines={1}>{training.training_type} {training.distance_km ? `- ${training.distance_km}km` : training.duration_minutes ? `- ${training.duration_minutes}min` : ''}</Text>
          {training.elevation_gain_meters ? <Text style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>Altimetria: {training.elevation_gain_meters}m</Text> : null}
          {training.avg_heart_rate ? <Text style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>FC Média: {training.avg_heart_rate}</Text> : null}
          <Text style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>Esforço: {training.perceived_effort || '-'}</Text>
          {training.notes ? <Text style={{ fontSize: 11, color: '#555', textAlign: 'center' }} numberOfLines={2}>Notas: {training.notes}</Text> : null}
          <Text style={{ fontSize: 11, color: isCompleted ? '#43a047' : isMissed ? '#e53935' : '#ffd600', fontWeight: 'bold', marginTop: 2 }}>{isCompleted ? 'Realizado' : isMissed ? 'Perdido' : 'Planejado'}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 6 }}>
            <Button
              mode="outlined"
              compact
              style={{ marginRight: 4, borderRadius: 8, borderColor: '#1976d2' }}
              labelStyle={{ fontSize: 12, color: '#1976d2', fontWeight: 'bold' }}
              onPress={e => { e.stopPropagation && e.stopPropagation(); onPressPlan(day, training); }}
            >
              Treino
            </Button>
            <Button
              mode="contained"
              compact
              style={{ borderRadius: 8, backgroundColor: '#43a047' }}
              labelStyle={{ fontSize: 12, color: '#fff', fontWeight: 'bold' }}
              onPress={e => { e.stopPropagation && e.stopPropagation(); onPressDone(day, training); }}
            >
              Realizado
            </Button>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function TrainingScreen() {
  const trainingSessions = useCheckinStore(s => s.trainingSessions);
  const fetchTrainingSessions = useCheckinStore(s => s.fetchTrainingSessions);

  // Estado do mês exibido
  const [displayDate, setDisplayDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalPlanVisible, setModalPlanVisible] = useState(false);
  const [modalDoneVisible, setModalDoneVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editingDone, setEditingDone] = useState<any>(null);

  // Form states
  const [trainingType, setTrainingType] = useState('long');
  const [title, setTitle] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [elevation, setElevation] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [effort, setEffort] = useState(5);
  const [satisfaction, setSatisfaction] = useState(3);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const submitTrainingSession = useCheckinStore(s => s.saveTrainingSession || s.submitTrainingSession);

  // Estados para gavetas
  const [expanded, setExpanded] = useState<string | null>(null);
  const handleAccordion = (panel: string) => setExpanded(expanded === panel ? null : panel);
  const [durationType, setDurationType] = useState('Livre');
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [distanceM, setDistanceM] = useState('');

  React.useEffect(() => {
    setLoading(true);
    fetchTrainingSessions().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geração da grade de 4 semanas
  const days = useMemo(() => generateCalendarGrid(displayDate), [displayDate]);

  // Mapeamento rápido de treinos por data
  const trainingByDate = useMemo(() => {
    const map: Record<string, any> = {};
    trainingSessions.forEach(t => {
      map[t.training_date] = t;
    });
    return map;
  }, [trainingSessions]);

  // Cabeçalho do mês
  const monthLabel = `${MONTHS_PT[displayDate.getMonth()]} / ${displayDate.getFullYear()}`;

  // Navegação
  const goPrevMonth = () => {
    const prev = new Date(displayDate);
    prev.setMonth(displayDate.getMonth() - 1);
    setDisplayDate(prev);
  };
  const goNextMonth = () => {
    const next = new Date(displayDate);
    next.setMonth(displayDate.getMonth() + 1);
    setDisplayDate(next);
  };

  // Modal handlers
  const handleOpenPlan = (day: Date, training?: any) => {
    setSelectedDay(day);
    setEditingPlan(training || null);
    if (training) {
      fillFormFromSession(training);
    } else {
      clearForm();
    }
    setModalPlanVisible(true);
  };
  const handleOpenDone = (day: Date, training?: any) => {
    setSelectedDay(day);
    setEditingDone(training || null);
    if (training) {
      fillFormFromSession(training);
    } else {
      clearForm();
    }
    setModalDoneVisible(true);
  };

  function clearForm() {
    setTrainingType('long');
    setTitle('');
    setDistance('');
    setDuration('');
    setElevation('');
    setAvgHeartRate('');
    setEffort(5);
    setSatisfaction(3);
    setNotes('');
  }
  function fillFormFromSession(session: any) {
    setTrainingType(session.training_type || 'long');
    setTitle(session.title || '');
    setDistance(session.distance_km ? String(session.distance_km) : '');
    setDuration(session.duration_minutes ? String(session.duration_minutes) : '');
    setElevation(session.elevation_gain_meters ? String(session.elevation_gain_meters) : '');
    setAvgHeartRate(session.avg_heart_rate ? String(session.avg_heart_rate) : '');
    setEffort(session.perceived_effort || 5);
    setSatisfaction(session.session_satisfaction || 3);
    setNotes(session.notes || '');
  }

  // Renderização das semanas com cabeçalho em cada uma e espaço entre elas
  const weeks = [];
  for (let i = 0; i < 4; i++) {
    weeks.push(days.slice(i * 7, (i + 1) * 7));
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Button onPress={goPrevMonth} compact>Anterior</Button>
        <Text style={{ fontWeight: 'bold', fontSize: 22 }}>{monthLabel}</Text>
        <Button onPress={goNextMonth} compact>Próximo</Button>
      </View>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 32 }}>
          <ActivityIndicator size="large" color="#1976d2" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {weeks.map((week, idx) => (
            <View key={idx} style={{ marginBottom: 16 }}>
              {/* Cabeçalho dos dias da semana em cada semana */}
              <View style={{ flexDirection: 'row', backgroundColor: '#f5f5f5', height: 32, alignItems: 'center', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                {WEEKDAYS.map((d, i) => (
                  <Text key={i} style={{ flex: 1, textAlign: 'center', color: '#888', fontWeight: 'bold', fontSize: 13 }}>{d}</Text>
                ))}
              </View>
              <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                {week.map((day, j) => (
                  <CustomDay
                    key={day.toISOString()}
                    day={day}
                    displayMonth={displayDate.getMonth()}
                    training={trainingByDate[formatDate(day)]}
                    onPressPlan={handleOpenPlan}
                    onPressDone={handleOpenDone}
                  />
                ))}
              </View>
              <Divider style={{ height: 1, backgroundColor: '#e0e0e0' }} />
            </View>
          ))}
        </ScrollView>
      )}
      {/* Modal de treino planejado (gavetas compactas, seleção visual) */}
      <Portal>
        <Modal visible={modalPlanVisible} onDismiss={() => setModalPlanVisible(false)} contentContainerStyle={{
          margin: 0,
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 0,
          width: '95%',
          maxWidth: 420,
          alignSelf: 'center',
          maxHeight: 600,
        }}>
          <Card>
            <Card.Title
              title={editingPlan ? 'Editar Treino Planejado' : 'Cadastrar Treino Planejado'}
              style={{ paddingBottom: 0, paddingTop: 8 }}
              titleStyle={{ fontSize: 17 }}
            />
            <Card.Content style={{ paddingBottom: 0, paddingTop: 0 }}>
              <ScrollView style={{ maxHeight: 500, paddingHorizontal: 4 }}>
                <List.Section>
                  <List.Accordion
                    title="Modalidade"
                    expanded={expanded === 'modalidade'}
                    onPress={() => handleAccordion('modalidade')}
                  >
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {['corrida', 'bike', 'forca', 'educativo', 'flexibilidade'].map(opt => (
                        <Pressable
                          key={opt}
                          onPress={() => setTrainingType(opt)}
                          style={{
                            backgroundColor: trainingType === opt ? '#1976d2' : '#f0f0f0',
                            borderRadius: 8,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            marginBottom: 4,
                            marginRight: 4,
                          }}
                        >
                          <Text style={{ color: trainingType === opt ? '#fff' : '#222', fontWeight: 'bold' }}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </List.Accordion>
                  <List.Accordion
                    title="Esforço"
                    expanded={expanded === 'esforco'}
                    onPress={() => handleAccordion('esforco')}
                  >
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {['Leve', 'Moderado', 'Forte'].map((opt, idx) => (
                        <Pressable
                          key={opt}
                          onPress={() => setEffort(idx+1)}
                          style={{
                            backgroundColor: effort === idx+1 ? '#1976d2' : '#f0f0f0',
                            borderRadius: 8,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            marginBottom: 4,
                            marginRight: 4,
                          }}
                        >
                          <Text style={{ color: effort === idx+1 ? '#fff' : '#222', fontWeight: 'bold' }}>{opt}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </List.Accordion>
                  <List.Accordion
                    title="Percurso"
                    expanded={expanded === 'percurso'}
                    onPress={() => handleAccordion('percurso')}
                  >
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {['Plano', 'Ligeira inclinação', 'Muita inclinação'].map(opt => (
                        <Pressable
                          key={opt}
                          onPress={() => setElevation(opt)}
                          style={{
                            backgroundColor: elevation === opt ? '#1976d2' : '#f0f0f0',
                            borderRadius: 8,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            marginBottom: 4,
                            marginRight: 4,
                          }}
                        >
                          <Text style={{ color: elevation === opt ? '#fff' : '#222', fontWeight: 'bold' }}>{opt}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </List.Accordion>
                  <List.Accordion
                    title="Terreno"
                    expanded={expanded === 'terreno'}
                    onPress={() => handleAccordion('terreno')}
                  >
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {['Asfalto', 'Trilha/montanha', 'Estradão', 'Pista', 'Esteira'].map(opt => (
                        <Pressable
                          key={opt}
                          onPress={() => setAvgHeartRate(opt)}
                          style={{
                            backgroundColor: avgHeartRate === opt ? '#1976d2' : '#f0f0f0',
                            borderRadius: 8,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            marginBottom: 4,
                            marginRight: 4,
                          }}
                        >
                          <Text style={{ color: avgHeartRate === opt ? '#fff' : '#222', fontWeight: 'bold' }}>{opt}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </List.Accordion>
                  <List.Accordion
                    title="Tipo de Treino"
                    expanded={expanded === 'tipo'}
                    onPress={() => handleAccordion('tipo')}
                  >
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {['Contínuo', 'Intervalado', 'Fartlek', 'Tiro', 'Longo', 'Regenerativo', 'Prova'].map(opt => (
                        <Pressable
                          key={opt}
                          onPress={() => setTitle(opt)}
                          style={{
                            backgroundColor: title === opt ? '#1976d2' : '#f0f0f0',
                            borderRadius: 8,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            marginBottom: 4,
                            marginRight: 4,
                          }}
                        >
                          <Text style={{ color: title === opt ? '#fff' : '#222', fontWeight: 'bold' }}>{opt}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </List.Accordion>
                  <List.Accordion
                    title="Duração"
                    expanded={expanded === 'duracao'}
                    onPress={() => handleAccordion('duracao')}
                  >
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {['Livre', 'Tempo', 'Distância'].map(opt => (
                        <Pressable
                          key={opt}
                          onPress={() => setDurationType(opt)}
                          style={{
                            backgroundColor: durationType === opt ? '#1976d2' : '#f0f0f0',
                            borderRadius: 8,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            marginBottom: 4,
                            marginRight: 4,
                          }}
                        >
                          <Text style={{ color: durationType === opt ? '#fff' : '#222', fontWeight: 'bold' }}>{opt}</Text>
                        </Pressable>
                      ))}
                    </View>
                    {durationType === 'Tempo' && (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <TextInput
                          label="Horas"
                          value={durationHours}
                          onChangeText={setDurationHours}
                          keyboardType="numeric"
                          style={{ flex: 1, marginRight: 4, height: 40, fontSize: 14 }}
                          mode="outlined"
                          dense
                        />
                        <TextInput
                          label="Minutos"
                          value={durationMinutes}
                          onChangeText={setDurationMinutes}
                          keyboardType="numeric"
                          style={{ flex: 1, marginLeft: 4, height: 40, fontSize: 14 }}
                          mode="outlined"
                          dense
                        />
                      </View>
                    )}
                    {durationType === 'Distância' && (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <TextInput
                          label="Km"
                          value={distanceKm}
                          onChangeText={setDistanceKm}
                          keyboardType="numeric"
                          style={{ flex: 1, marginRight: 4, height: 40, fontSize: 14 }}
                          mode="outlined"
                          dense
                        />
                        <TextInput
                          label="Metros"
                          value={distanceM}
                          onChangeText={setDistanceM}
                          keyboardType="numeric"
                          style={{ flex: 1, marginLeft: 4, height: 40, fontSize: 14 }}
                          mode="outlined"
                          dense
                        />
                      </View>
                    )}
                  </List.Accordion>
                  <List.Accordion
                    title="Intensidade"
                    expanded={expanded === 'intensidade'}
                    onPress={() => handleAccordion('intensidade')}
                  >
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {['Z1', 'Z2', 'Z3', 'Z4', 'Z5'].map((opt, idx) => (
                        <Pressable
                          key={opt}
                          onPress={() => setSatisfaction(idx+1)}
                          style={{
                            backgroundColor: satisfaction === idx+1 ? '#1976d2' : '#f0f0f0',
                            borderRadius: 8,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            marginBottom: 4,
                            marginRight: 4,
                          }}
                        >
                          <Text style={{ color: satisfaction === idx+1 ? '#fff' : '#222', fontWeight: 'bold' }}>{opt}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </List.Accordion>
                  <List.Accordion
                    title="Observações"
                    expanded={expanded === 'obs'}
                    onPress={() => handleAccordion('obs')}
                  >
                    <TextInput
                      label="Observações"
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={2}
                      style={{ fontSize: 13, height: 48 }}
                      mode="outlined"
                      dense
                    />
                  </List.Accordion>
                </List.Section>
              </ScrollView>
              <Button
                mode="contained"
                onPress={async () => {
                  // Mapeamento para campos obrigatórios do banco
                  const trainingData = {
                    training_date: selectedDay ? formatDate(selectedDay) : new Date().toISOString().split('T')[0],
                    title: title,
                    training_type: trainingType,
                    distance_km: distanceKm !== '' ? Number(distanceKm) : null,
                    duration_minutes: durationMinutes !== '' ? Number(durationMinutes) : null,
                    elevation_gain_meters: elevation === 'Plano' ? 0 : elevation === 'Ligeira inclinação' ? 50 : elevation === 'Muita inclinação' ? 150 : null,
                    avg_heart_rate: avgHeartRate !== '' && !isNaN(Number(avgHeartRate)) ? Number(avgHeartRate) : null,
                    perceived_effort: effort,
                    notes: notes,
                    status: 'planned',
                    // Extras customizados
                    modalidade: trainingType,
                    effort_level: effort,
                    percurso: elevation,
                    terreno: avgHeartRate,
                    treino_tipo: title,
                    duracao_tipo: durationType,
                    duracao_horas: durationHours !== '' ? Number(durationHours) : null,
                    duracao_minutos: durationMinutes !== '' ? Number(durationMinutes) : null,
                    distancia_m: distanceM !== '' ? Number(distanceM) : null,
                    intensidade: satisfaction,
                    observacoes: notes,
                  };
                  await useCheckinStore.getState().submitTrainingSession(trainingData);
                  setModalPlanVisible(false);
                  fetchTrainingSessions();
                }}
                style={{
                  marginTop: 8,
                  borderRadius: 8,
                  height: 48,
                  width: '100%',
                  alignSelf: 'center',
                }}
                labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
              >
                Salvar Treino Planejado
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
      {/* Substituir o modal antigo de treino realizado pelo novo: */}
      <MarkTrainingDoneModal
        visible={modalDoneVisible}
        plannedData={editingDone}
        onSave={async (dadosRealizados) => {
          if (!editingDone) return;
          // Sanitize: converter "" para null em campos numéricos
          const sanitized = {
            ...dadosRealizados,
            distance_km: dadosRealizados.distance_km === '' ? null : Number(dadosRealizados.distance_km),
            duration_minutes: dadosRealizados.duration_minutes === '' ? null : Number(dadosRealizados.duration_minutes),
            elevation_gain_meters: dadosRealizados.elevation_gain_meters === '' ? null : Number(dadosRealizados.elevation_gain_meters),
            avg_heart_rate: dadosRealizados.avg_heart_rate === '' ? null : Number(dadosRealizados.avg_heart_rate),
            perceived_effort: Number(dadosRealizados.perceived_effort),
            session_satisfaction: Number(dadosRealizados.session_satisfaction),
          };
          console.log('Enviando treino realizado para o Supabase:', sanitized);
          try {
            await useCheckinStore.getState().markTrainingAsCompleted(editingDone.id, sanitized);
            setModalDoneVisible(false);
            fetchTrainingSessions();
          } catch (err: any) {
            console.error('Erro ao marcar treino como realizado:', err);
            alert('Erro ao marcar treino como realizado: ' + (err?.message || JSON.stringify(err)));
          }
        }}
        onCancel={() => setModalDoneVisible(false)}
      />
    </View>
  );
} 