import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Card, Text, Button, ActivityIndicator, TextInput, Modal, Portal } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import WeeklyReflectionModal, { WeeklyReflectionAnswers } from '../training/WeeklyReflectionModal';
import { useCheckinStore } from '../../stores/checkin';

type DailyCheckinModalProps = {
  visible: boolean;
  onSave: (data: { sleepQuality: number; fatigue: number; stress: number; soreness: number; notes: string }) => void;
  onCancel: () => void;
  initialValues?: {
    sleepQuality?: number;
    fatigue?: number;
    stress?: number;
    soreness?: number;
    notes?: string;
  };
};

function DailyCheckinModal({ visible, onSave, onCancel, initialValues }: DailyCheckinModalProps) {
  const [sleepQuality, setSleepQuality] = useState(initialValues?.sleepQuality ?? 4);
  const [fatigue, setFatigue] = useState(initialValues?.fatigue ?? 4);
  const [stress, setStress] = useState(initialValues?.stress ?? 4);
  const [soreness, setSoreness] = useState(initialValues?.soreness ?? 4);
  const [notes, setNotes] = useState(initialValues?.notes ?? '');

  const handleSave = () => {
    onSave({ sleepQuality, fatigue, stress, soreness, notes });
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onCancel} contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 12, maxHeight: '80%' }}>
        <Text variant="titleLarge" style={{ marginBottom: 16 }}>Check-in Diário</Text>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Qualidade do Sono (1 = Péssima, 7 = Excelente)</Text>
        <Slider minimumValue={1} maximumValue={7} step={1} value={sleepQuality} onValueChange={setSleepQuality} style={{ width: '100%' }} />
        <Text style={{ marginBottom: 12, textAlign: 'center' }}>{sleepQuality}/7</Text>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Fadiga (1 = Nenhuma, 7 = Extrema)</Text>
        <Slider minimumValue={1} maximumValue={7} step={1} value={fatigue} onValueChange={setFatigue} style={{ width: '100%' }} />
        <Text style={{ marginBottom: 12, textAlign: 'center' }}>{fatigue}/7</Text>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Estresse (1 = Relaxado, 7 = Muito Estressado)</Text>
        <Slider minimumValue={1} maximumValue={7} step={1} value={stress} onValueChange={setStress} style={{ width: '100%' }} />
        <Text style={{ marginBottom: 12, textAlign: 'center' }}>{stress}/7</Text>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Dores Musculares (1 = Nenhuma, 7 = Fortes)</Text>
        <Slider minimumValue={1} maximumValue={7} step={1} value={soreness} onValueChange={setSoreness} style={{ width: '100%' }} />
        <Text style={{ marginBottom: 12, textAlign: 'center' }}>{soreness}/7</Text>
        <TextInput label="Notas/Observações" value={notes} onChangeText={setNotes} multiline numberOfLines={3} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
          <Button onPress={onCancel}>Cancelar</Button>
          <Button mode="contained" onPress={handleSave} style={{ marginLeft: 8 }}>Salvar</Button>
        </View>
      </Modal>
    </Portal>
  );
}

export default function DailyCheckinScreen() {
  const todayCheckin = useCheckinStore(s => s.todayCheckin);
  const hasCheckedInToday = useCheckinStore(s => s.hasCheckedInToday);
  const isSubmitting = useCheckinStore(s => s.isSubmitting);
  const submitCheckin = useCheckinStore(s => s.submitCheckin);
  const loadTodayCheckin = useCheckinStore(s => s.loadTodayCheckin);
  const submitWeeklyReflection = useCheckinStore(s => s.submitWeeklyReflection);

  // Estados do wizard
  const [step, setStep] = useState(0);
  const [sleepQuality, setSleepQuality] = useState(4);
  const [fatigue, setFatigue] = useState(4);
  const [stress, setStress] = useState(4);
  const [soreness, setSoreness] = useState(4);
  const [notes, setNotes] = useState('');
  const [formMode, setFormMode] = useState<'form' | 'view'>('form');

  // Estado para modal semanal
  const [weeklyReflectionVisible, setWeeklyReflectionVisible] = useState(false);
  // Novo estado para o modal de check-in diário
  const [dailyCheckinVisible, setDailyCheckinVisible] = useState(false);

  // Preencher dados ao editar
  useEffect(() => {
    if (hasCheckedInToday && todayCheckin) {
      setFormMode('view');
      setSleepQuality(todayCheckin.sleep_quality_score ?? 4);
      setFatigue(todayCheckin.fatigue_score ?? 4);
      setStress(todayCheckin.stress_score ?? 4);
      setSoreness(todayCheckin.soreness_score ?? 4);
      setNotes(todayCheckin.notes || '');
    } else {
      setFormMode('form');
      setSleepQuality(4);
      setFatigue(4);
      setStress(4);
      setSoreness(4);
      setNotes('');
    }
    setStep(0);
  }, [hasCheckedInToday, todayCheckin]);

  // Submissão final
  const handleSubmit = async () => {
    const today = new Date().toISOString().split('T')[0];
    await submitCheckin({
      date: today,
      mood_score: 0,
      energy_score: 0,
      sleep_hours: 0,
      sleep_quality: sleepQuality,
      fatigue_score: fatigue,
      stress_score: stress,
      soreness_score: soreness,
      notes,
    });
    await loadTodayCheckin();
    setFormMode('view');
  };

  // Função para obter o início da semana (domingo)
  function getWeekStart(date: Date) {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  }
  // Só permite reflexão semanal aos domingos
  const isSunday = new Date().getDay() === 0;
  const handleSaveWeeklyReflection = async (answers: WeeklyReflectionAnswers) => {
    const weekStart = getWeekStart(new Date());
    await submitWeeklyReflection({
      enjoyment: answers.enjoyment,
      progress: answers.progress,
      confidence: answers.confidence,
      week_start: weekStart,
    });
    setWeeklyReflectionVisible(false);
  };

  if (isSubmitting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (formMode === 'view' && todayCheckin) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
        <Card>
          <Card.Title title="Seu Check-in de Hoje" />
          <Card.Content>
            <Text style={{ marginBottom: 8 }}>Qualidade do Sono: {todayCheckin.sleep_quality_score}/7</Text>
            <Text style={{ marginBottom: 8 }}>Fadiga: {todayCheckin.fatigue_score}/7</Text>
            <Text style={{ marginBottom: 8 }}>Estresse: {todayCheckin.stress_score}/7</Text>
            <Text style={{ marginBottom: 8 }}>Dores Musculares: {todayCheckin.soreness_score}/7</Text>
            <Text style={{ marginBottom: 8 }}>Notas: {todayCheckin.notes || '-'}</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => setFormMode('form')}>Editar Check-in</Button>
          </Card.Actions>
        </Card>
      </View>
    );
  }

  // Wizard de perguntas baseadas no Índice de Hooper
  const steps = [
    {
      label: 'Como foi sua noite de sono?',
      content: (
        <>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>Avalie de 1 (Péssima) a 7 (Excelente)</Text>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 24 }}>{sleepQuality}/7</Text>
          </View>
          <Slider
            minimumValue={1}
            maximumValue={7}
            step={1}
            value={sleepQuality}
            onValueChange={setSleepQuality}
            style={{ width: '100%' }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12 }}>Péssima</Text>
            <Text style={{ fontSize: 12 }}>Excelente</Text>
          </View>
        </>
      ),
    },
    {
      label: 'Qual seu nível de fadiga geral hoje?',
      content: (
        <>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>1 = Nenhuma Fadiga, 7 = Fadiga Extrema</Text>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 24 }}>{fatigue}/7</Text>
          </View>
          <Slider
            minimumValue={1}
            maximumValue={7}
            step={1}
            value={fatigue}
            onValueChange={setFatigue}
            style={{ width: '100%' }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12 }}>Nenhuma Fadiga</Text>
            <Text style={{ fontSize: 12 }}>Fadiga Extrema</Text>
          </View>
        </>
      ),
    },
    {
      label: 'Qual seu nível de estresse geral hoje?',
      content: (
        <>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>1 = Totalmente Relaxado, 7 = Muito Estressado</Text>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 24 }}>{stress}/7</Text>
          </View>
          <Slider
            minimumValue={1}
            maximumValue={7}
            step={1}
            value={stress}
            onValueChange={setStress}
            style={{ width: '100%' }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12 }}>Totalmente Relaxado</Text>
            <Text style={{ fontSize: 12 }}>Muito Estressado</Text>
          </View>
        </>
      ),
    },
    {
      label: 'Qual seu nível de dores musculares?',
      content: (
        <>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>1 = Nenhuma Dor, 7 = Dores Fortes</Text>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 24 }}>{soreness}/7</Text>
          </View>
          <Slider
            minimumValue={1}
            maximumValue={7}
            step={1}
            value={soreness}
            onValueChange={setSoreness}
            style={{ width: '100%' }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12 }}>Nenhuma Dor</Text>
            <Text style={{ fontSize: 12 }}>Dores Fortes</Text>
          </View>
        </>
      ),
    },
    {
      label: 'Notas (opcional)',
      content: (
        <TextInput
          label="Notas"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={{ marginBottom: 12 }}
        />
      ),
    },
  ];

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
      {/* Card do Check-in Diário */}
      <Card style={{ marginBottom: 24 }}>
        <Card.Title title="Check-in Diário" />
        <Card.Content>
          <Text style={{ marginBottom: 8 }}>
            Responda seu check-in diário para acompanhar seu bem-estar.
          </Text>
          <Button
            mode="contained"
            onPress={() => setDailyCheckinVisible(true)}
          >
            Responder Check-in Diário
          </Button>
        </Card.Content>
      </Card>
      <DailyCheckinModal
        visible={dailyCheckinVisible}
        onSave={async ({ sleepQuality, fatigue, stress, soreness, notes }) => {
          const today = new Date().toISOString().split('T')[0];
          await submitCheckin({
            date: today,
            mood_score: 0,
            energy_score: 0,
            sleep_hours: 0,
            sleep_quality: sleepQuality,
            fatigue_score: fatigue,
            stress_score: stress,
            soreness_score: soreness,
            notes,
          });
          await loadTodayCheckin();
          setDailyCheckinVisible(false);
        }}
        onCancel={() => setDailyCheckinVisible(false)}
      />
      {/* Card da Reflexão Semanal */}
      <Card style={{ marginBottom: 24, opacity: isSunday ? 1 : 0.5 }}>
        <Card.Title title="Reflexão Semanal" />
        <Card.Content>
          <Text style={{ marginBottom: 8 }}>
            Responda a reflexão semanal para acompanhar seu progresso psicológico.
          </Text>
          <Button
            mode="contained"
            onPress={() => setWeeklyReflectionVisible(true)}
            disabled={!isSunday}
          >
            {isSunday ? 'Responder Reflexão Semanal' : 'Disponível apenas aos domingos'}
          </Button>
        </Card.Content>
      </Card>
      <WeeklyReflectionModal
        visible={weeklyReflectionVisible}
        onSave={handleSaveWeeklyReflection}
        onCancel={() => setWeeklyReflectionVisible(false)}
      />
    </View>
  );
}