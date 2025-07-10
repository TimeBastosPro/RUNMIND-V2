import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, Alert, ScrollView, Dimensions } from 'react-native';
import { Portal, Modal, Card, TextInput, RadioButton, Button } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useCheckinStore } from '../../stores/checkin';

const weekDays = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // Segunda a Domingo
const trainingTypes = [
  { label: 'Longo', value: 'long' },
  { label: 'Tiro', value: 'tiro' },
  { label: 'Regenerativo', value: 'regenerativo' },
  { label: 'Rodagem', value: 'rodagem' },
  { label: 'Fartlek', value: 'fartlek' },
  { label: 'Trail', value: 'trail' },
];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
function formatDateISO(date: Date) {
  return date.toISOString().split('T')[0];
}
function generateWeeks(centerDate: Date, numWeeks: number) {
  const weeks = [];
  const start = startOfWeek(addDays(centerDate, -7 * Math.floor(numWeeks / 2)));
  for (let w = 0; w < numWeeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDays(start, w * 7 + d));
    }
    weeks.push(week);
  }
  return weeks;
}

export default function TrainingScreen() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const weeks = useMemo(() => generateWeeks(today, 10), [today]);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // Trocar o tipo de editingSession para any
  const [editingSession, setEditingSession] = useState<any>(null);

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
  const submitTrainingSession = useCheckinStore(s => s.submitTrainingSession);
  const saveTrainingSession = useCheckinStore(s => s.saveTrainingSession);
  const deleteTrainingSession = useCheckinStore(s => s.deleteTrainingSession);
  const [status, setStatus] = useState<'planned' | 'completed'>('completed');

  const trainingSessions = useCheckinStore(s => s.trainingSessions);
  const fetchTrainingSessions = useCheckinStore(s => s.fetchTrainingSessions);

  // Carregar treinos ao montar a tela (abrange o período exibido)
  useEffect(() => {
    if (weeks.length > 0) {
      const firstDay = weeks[0][0];
      const lastDay = weeks[weeks.length - 1][6];
      fetchTrainingSessions(formatDateISO(firstDay), formatDateISO(lastDay));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeks.length]);

  // Helper para saber se há treino em um dia
  function hasTrainingOn(date: Date) {
    const iso = formatDateISO(date);
    return trainingSessions.some((t) => t.training_date === iso);
  }

  // Função para preencher ou limpar o formulário
  function fillFormFromSession(session: any) {
    if (session) {
      setTrainingType(session.training_type || 'long');
      setTitle(session.title || '');
      setDistance(session.distance_km ? String(session.distance_km) : '');
      setDuration(session.duration_minutes ? String(session.duration_minutes) : '');
      setElevation(session.elevation_gain_meters ? String(session.elevation_gain_meters) : '');
      setAvgHeartRate(session.avg_heart_rate ? String(session.avg_heart_rate) : '');
      setEffort(session.perceived_effort || 5);
      setSatisfaction(session.session_satisfaction || 3);
      setNotes(session.notes || '');
    } else {
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
  }

  // Abrir modal e preencher data
  const handleOpenModal = (date: Date) => {
    setSelectedDate(date);
    const found = trainingSessions.find(t => t.training_date === formatDateISO(date));
    setEditingSession(found || null);
    fillFormFromSession(found);
    setModalVisible(true);
  };
  // Fechar modal e resetar campos (exceto data)
  const handleCloseModal = () => {
    setModalVisible(false);
    setTrainingType('long');
    setTitle('');
    setDistance('');
    setDuration('');
    setElevation('');
    setAvgHeartRate('');
    setEffort(5);
    setSatisfaction(3);
    setNotes('');
  };

  // Salvar treino (upsert)
  const handleSave = async () => {
    if (!selectedDate) return;
    setIsSaving(true);
    try {
      const trainingData: any = {
        training_date: formatDateISO(selectedDate),
        training_type: trainingType,
        title,
        distance_km: distance ? Number(distance) : null,
        duration_minutes: duration ? Number(duration) : null,
        elevation_gain_meters: elevation ? Number(elevation) : null,
        avg_heart_rate: avgHeartRate ? Number(avgHeartRate) : null,
        perceived_effort: effort,
        session_satisfaction: satisfaction,
        notes,
        source: 'manual',
      };
      if (editingSession && editingSession.id) {
        trainingData.id = editingSession.id;
      }
      await saveTrainingSession(trainingData);
      Alert.alert('Sucesso', 'Treino salvo com sucesso!');
      setModalVisible(false);
      await fetchTrainingSessions(formatDateISO(weeks[0][0]), formatDateISO(weeks[weeks.length - 1][6]));
    } catch (error: any) {
      Alert.alert('Erro', error.message || String(error));
    } finally {
      setIsSaving(false);
    }
  };
  // Excluir treino
  const handleDelete = async () => {
    if (!editingSession || !editingSession.id) return;
    setIsSaving(true);
    try {
      await deleteTrainingSession(editingSession.id);
      Alert.alert('Sucesso', 'Treino excluído!');
      setModalVisible(false);
      await fetchTrainingSessions(formatDateISO(weeks[0][0]), formatDateISO(weeks[weeks.length - 1][6]));
    } catch (error: any) {
      Alert.alert('Erro', error.message || String(error));
    } finally {
      setIsSaving(false);
    }
  };

  // No calendário, indicador por status:
  function getTrainingIndicatorColor(date: Date) {
    const iso = formatDateISO(date);
    const session = trainingSessions.find((t) => t.training_date === iso);
    if (!session) return null;
    if (session.status === 'planned') return '#FFD600'; // amarelo
    if (session.status === 'completed') return '#43A047'; // verde
    return null;
  }

  const windowHeight = Dimensions.get('window').height;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Cabeçalho dos dias da semana */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 16, paddingBottom: 8, backgroundColor: '#E3F2FD' }}>
        {weekDays.map((d, idx) => (
          <Text key={idx} style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#2196F3', fontSize: 16 }}>{d}</Text>
        ))}
      </View>
      <FlatList
        data={weeks}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item: week }) => (
          <View style={{ flexDirection: 'row', marginBottom: 4, paddingHorizontal: 8 }}>
            {week.map((date, idx) => {
              const isToday = isSameDay(date, today);
              const indicatorColor = getTrainingIndicatorColor(date);
              return (
                <Pressable
                  key={idx}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    margin: 2,
                    borderRadius: 8,
                    borderWidth: isToday ? 2 : 1,
                    borderColor: isToday ? '#1565C0' : '#E0E0E0',
                    backgroundColor: isToday ? '#E3F2FD' : '#fff',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                  onPress={() => handleOpenModal(date)}
                >
                  <Text style={{ fontSize: 16, color: isToday ? '#1565C0' : '#424242', fontWeight: isToday ? 'bold' : 'normal' }}>{date.getDate()}</Text>
                  {indicatorColor && (
                    <View style={{ position: 'absolute', bottom: 6, left: '50%', transform: [{ translateX: -6 }], width: 12, height: 12, borderRadius: 6, backgroundColor: indicatorColor, borderWidth: 1, borderColor: '#fff' }} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      />
      {/* Modal de registro de treino */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={handleCloseModal}
          contentContainerStyle={{
            margin: 24,
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 0,
            maxHeight: windowHeight * 0.8,
            alignSelf: 'center',
            width: '95%',
          }}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false} style={{ flexGrow: 1 }}>
            <Card>
              <Card.Title title="Registrar Treino Realizado" />
              <Card.Content style={{ paddingBottom: 0 }}>
                <TextInput
                  label="Data do Treino"
                  value={selectedDate ? formatDateISO(selectedDate) : ''}
                  disabled
                  style={{ marginBottom: 12 }}
                  mode="outlined"
                />
                <RadioButton.Group onValueChange={v => setStatus(v as 'planned' | 'completed')} value={status}>
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <RadioButton.Item label="A Realizar" value="planned" style={{ flex: 1 }} position="leading" />
                    <RadioButton.Item label="Realizado" value="completed" style={{ flex: 1 }} position="leading" />
                  </View>
                </RadioButton.Group>
                <Text style={{ marginBottom: 4 }}>Tipo de Treino</Text>
                <RadioButton.Group
                  onValueChange={setTrainingType}
                  value={trainingType}
                >
                  {trainingTypes.map(opt => (
                    <RadioButton.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </RadioButton.Group>
                <TextInput
                  label="Título do Treino"
                  value={title}
                  onChangeText={setTitle}
                  style={{ marginBottom: 12 }}
                  mode="outlined"
                />
                <TextInput
                  label="Distância (km)"
                  value={distance}
                  onChangeText={setDistance}
                  keyboardType="numeric"
                  style={{ marginBottom: 12 }}
                  mode="outlined"
                  disabled={status === 'planned'}
                />
                <TextInput
                  label="Duração (minutos)"
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  style={{ marginBottom: 12 }}
                  mode="outlined"
                  disabled={status === 'planned'}
                />
                <TextInput
                  label="Altimetria (metros)"
                  value={elevation}
                  onChangeText={setElevation}
                  keyboardType="numeric"
                  style={{ marginBottom: 12 }}
                  mode="outlined"
                  disabled={status === 'planned'}
                />
                <TextInput
                  label="FC Média"
                  value={avgHeartRate}
                  onChangeText={setAvgHeartRate}
                  keyboardType="numeric"
                  style={{ marginBottom: 12 }}
                  mode="outlined"
                  disabled={status === 'planned'}
                />
                <Text style={{ marginTop: 12, marginBottom: 4 }}>Percepção de Esforço</Text>
                <Slider
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={effort}
                  onValueChange={setEffort}
                  style={{ width: '100%', marginBottom: 8 }}
                />
                <Text style={{ marginBottom: 4 }}>Satisfação com o Treino</Text>
                <Slider
                  minimumValue={1}
                  maximumValue={5}
                  step={1}
                  value={satisfaction}
                  onValueChange={setSatisfaction}
                  style={{ width: '100%', marginBottom: 8 }}
                />
                <TextInput
                  label="Notas"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  style={{ marginBottom: 12 }}
                  mode="outlined"
                />
                {/* Rodapé de botões */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, marginBottom: 8 }}>
                  <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={isSaving}
                    disabled={isSaving}
                    style={{ flex: 1, marginHorizontal: 4 }}
                  >
                    Salvar Treino
                  </Button>
                  {editingSession && (
                    <Button
                      mode="outlined"
                      onPress={handleDelete}
                      loading={isSaving}
                      disabled={isSaving}
                      style={{ flex: 1, marginHorizontal: 4, borderColor: '#d32f2f' }}
                      textColor="#d32f2f"
                    >
                      Excluir
                    </Button>
                  )}
                  <Button
                    mode="text"
                    onPress={() => setModalVisible(false)}
                    style={{ flex: 1, marginHorizontal: 4 }}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
} 