import React, { useState, useEffect } from 'react';
import { View, Platform, Alert } from 'react-native';
import { Card, Text, Button, ActivityIndicator, TextInput, Modal, Portal } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import WeeklyReflectionModal, { WeeklyReflectionAnswers } from '../training/WeeklyReflectionModal';
import { useCheckinStore } from '../../stores/checkin';
import { generateInsight } from '../../services/gemini';

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
        <SliderUniversal
          minimumValue={1}
          maximumValue={7}
          step={1}
          value={sleepQuality}
          onValueChange={setSleepQuality}
          style={{ width: '100%' }}
        />
        <Text style={{ marginBottom: 12, textAlign: 'center' }}>{sleepQuality}/7</Text>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Fadiga (1 = Nenhuma, 7 = Extrema)</Text>
        <SliderUniversal
          minimumValue={1}
          maximumValue={7}
          step={1}
          value={fatigue}
          onValueChange={setFatigue}
          style={{ width: '100%' }}
        />
        <Text style={{ marginBottom: 12, textAlign: 'center' }}>{fatigue}/7</Text>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Estresse (1 = Relaxado, 7 = Muito Estressado)</Text>
        <SliderUniversal
          minimumValue={1}
          maximumValue={7}
          step={1}
          value={stress}
          onValueChange={setStress}
          style={{ width: '100%' }}
        />
        <Text style={{ marginBottom: 12, textAlign: 'center' }}>{stress}/7</Text>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Dores Musculares (1 = Nenhuma, 7 = Fortes)</Text>
        <SliderUniversal
          minimumValue={1}
          maximumValue={7}
          step={1}
          value={soreness}
          onValueChange={setSoreness}
          style={{ width: '100%' }}
        />
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

// Slider universal compatível com web e mobile
function SliderUniversal(props: any) {
  if (Platform.OS === 'web') {
    return (
      <input
        type="range"
        min={props.minimumValue}
        max={props.maximumValue}
        step={props.step}
        value={props.value}
        onChange={e => props.onValueChange(Number(e.target.value))}
        style={{ width: '100%', ...props.style }}
      />
    );
  }
  return <Slider {...props} />;
}

export default function DailyCheckinScreen() {
  const todayCheckin = useCheckinStore(s => s.todayCheckin);
  const hasCheckedInToday = useCheckinStore(s => s.hasCheckedInToday);
  const isSubmitting = useCheckinStore(s => s.isSubmitting);
  const submitCheckin = useCheckinStore(s => s.submitCheckin);
  const loadTodayCheckin = useCheckinStore(s => s.loadTodayCheckin);
  const submitWeeklyReflection = useCheckinStore(s => s.submitWeeklyReflection);
  const saveDailyCheckin = useCheckinStore(s => s.saveDailyCheckin);
  const updateCheckinWithInsight = useCheckinStore(s => s.updateCheckinWithInsight);

  // Estados do wizard
  const [step, setStep] = useState(0);
  const [sleepQuality, setSleepQuality] = useState(4);
  const [soreness, setSoreness] = useState(4);
  const [emotion, setEmotion] = useState<number | null>(null); // 1-5 para emojis
  const [motivation, setMotivation] = useState(3);
  const [focus, setFocus] = useState(3);
  const [confidence, setConfidence] = useState(3);
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
      setSoreness(todayCheckin.soreness_score ?? 4);
      setEmotion(todayCheckin.mood_score ?? null);
      setMotivation(todayCheckin.energy_score ?? 4);
      setFocus(todayCheckin.focus_score ?? 3);
      setConfidence(todayCheckin.confidence_score ?? 3);
      setNotes(todayCheckin.notes || '');
    } else {
      setFormMode('form');
      setSleepQuality(4);
      setSoreness(4);
      setEmotion(null);
      setMotivation(4);
      setFocus(3);
      setConfidence(3);
      setNotes('');
    }
    setStep(0);
  }, [hasCheckedInToday, todayCheckin]);

  // Submissão final
  const handleSubmit = async () => {
    const checkinData = {
      sleep_quality: sleepQuality,      // 1-7
      soreness,                        // 1-7
      notes,                           // texto
      mood_score: emotion ?? 3,        // 1-5
      motivation,                      // 1-5
      focus,                           // 1-5
      confidence,                      // 1-5
      // NÃO envie fatigue, stress, enjoyment, progress, etc.
    };
    try {
      console.log('Enviando check-in:', checkinData);
      const saved = await saveDailyCheckin(checkinData);
      // 2. Chamar IA
      const athleteData = {
        context_type: 'solo', // ajuste conforme seu fluxo
        last_checkin: checkinData,
        planned_training: null,
      };
      const insight = await generateInsight(athleteData);
      // 3. Exibir insight
      Alert.alert('Insight de Prontidão', insight);
      // 4. Salvar insight no banco
      await updateCheckinWithInsight(saved.id, insight);
      setFormMode('view');
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao salvar check-in:', err);
    }
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
            <Text style={{ marginBottom: 8 }}>Dores/Cansaço Muscular: {todayCheckin.soreness_score}/7</Text>
            <Text style={{ marginBottom: 8 }}>Estado Emocional: {todayCheckin.mood_score ? ['😢','😕','😐','🙂','😄'][todayCheckin.mood_score-1] : '-'}</Text>
            <Text style={{ marginBottom: 8 }}>Motivação: {todayCheckin.energy_score}/7</Text>
            <Text style={{ marginBottom: 8 }}>Foco: {todayCheckin.focus_score ?? '-'}/5</Text>
            <Text style={{ marginBottom: 8 }}>Confiança: {todayCheckin.confidence_score ?? '-'}/5</Text>
            <Text style={{ marginBottom: 8 }}>Notas: {todayCheckin.notes || '-'}</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => setFormMode('form')}>Editar Check-in</Button>
          </Card.Actions>
        </Card>
      </View>
    );
  }

  // Wizard steps
  const steps = [
    {
      label: 'Como foi sua noite de sono?',
      content: (
        <>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>Avalie de 1 (Péssima) a 7 (Excelente)</Text>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 24 }}>{sleepQuality}/7</Text>
          </View>
          <SliderUniversal
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
      label: 'Qual seu nível de dores/cansaço muscular?',
      content: (
        <>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>1 = Nenhuma Dor, 7 = Dores Fortes</Text>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 24 }}>{soreness}/7</Text>
          </View>
          <SliderUniversal
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
      label: 'Como está seu estado emocional hoje?',
      content: (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>Escolha o emoji que melhor representa seu estado emocional:</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
            {[1,2,3,4,5].map(val => (
              <Button
                key={val}
                mode={emotion === val ? 'contained' : 'outlined'}
                onPress={() => setEmotion(val)}
                style={{ marginHorizontal: 4 }}
                labelStyle={{ fontSize: 28 }}
              >
                {['😢','😕','😐','🙂','😄'][val-1]}
              </Button>
            ))}
          </View>
        </View>
      ),
    },
    {
      label: 'Motivação (1 = Baixa, 5 = Alta)',
      content: (
        <>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>Como está sua motivação hoje?</Text>
          <SliderUniversal
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={motivation}
            onValueChange={setMotivation}
            style={{ width: '100%' }}
          />
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>{motivation}/5</Text>
        </>
      ),
    },
    {
      label: 'Foco (1 = Disperso, 5 = Focado)',
      content: (
        <>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>Como está seu foco hoje?</Text>
          <SliderUniversal
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={focus}
            onValueChange={setFocus}
            style={{ width: '100%' }}
          />
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>{focus}/5</Text>
        </>
      ),
    },
    {
      label: 'Confiança (1 = Baixa, 5 = Alta)',
      content: (
        <>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>Como está sua confiança hoje?</Text>
          <SliderUniversal
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={confidence}
            onValueChange={setConfidence}
            style={{ width: '100%' }}
          />
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>{confidence}/5</Text>
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

  // Renderização do wizard
  if (formMode === 'form') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
        <Card>
          <Card.Title title="Check-in Diário" />
          <Card.Content>
            <Text style={{ marginBottom: 8 }}>{steps[step].label}</Text>
            <Text style={{ marginBottom: 8, color: 'gray', textAlign: 'center' }}>Passo {step+1} de {steps.length}</Text>
            {steps[step].content}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
              {step > 0 ? (
                <Button onPress={() => setStep(step-1)} mode="outlined">Voltar</Button>
              ) : <View />}
              {step < steps.length-1 ? (
                <Button onPress={() => setStep(step+1)} mode="contained">Próximo</Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                >
                  Finalizar
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
      {/* Card da Reflexão Semanal - AGORA NO TOPO */}
      <Card style={{ marginBottom: 24 }}>
        <Card.Title title="Reflexão Semanal" />
        <Card.Content>
          <Text style={{ marginBottom: 8 }}>
            Responda a reflexão semanal para acompanhar seu progresso psicológico.
          </Text>
          <Button
            mode="contained"
            onPress={() => setWeeklyReflectionVisible(true)}
          >
            Responder Reflexão Semanal
          </Button>
        </Card.Content>
      </Card>
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
            sleep_quality_score: sleepQuality,
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
      <WeeklyReflectionModal
        visible={weeklyReflectionVisible}
        onSave={handleSaveWeeklyReflection}
        onCancel={() => setWeeklyReflectionVisible(false)}
      />
    </View>
  );
}