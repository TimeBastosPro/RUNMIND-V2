import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Card, Text, Button, ActivityIndicator, TextInput } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useCheckinStore } from '../../stores/checkin';

const moodEmojis = ['😞', '😕', '😐', '🙂', '😊', '😃', '😄', '😁', '🤩', '😍'];

export default function DailyCheckinScreen() {
  const todayCheckin = useCheckinStore(s => s.todayCheckin);
  const hasCheckedInToday = useCheckinStore(s => s.hasCheckedInToday);
  const isSubmitting = useCheckinStore(s => s.isSubmitting);
  const submitCheckin = useCheckinStore(s => s.submitCheckin);
  const loadTodayCheckin = useCheckinStore(s => s.loadTodayCheckin);

  // Estados do wizard
  const [step, setStep] = useState(0);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [fatigue, setFatigue] = useState(4);
  const [stress, setStress] = useState(4);
  const [soreness, setSoreness] = useState(4);
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState('');
  const [formMode, setFormMode] = useState<'form' | 'view'>('form');

  // Preencher dados ao editar
  useEffect(() => {
    if (hasCheckedInToday && todayCheckin) {
      setFormMode('view');
      setSleepQuality(todayCheckin.sleep_quality ?? 3);
      setFatigue(todayCheckin.fatigue_score ?? 4);
      setStress(todayCheckin.stress_score ?? 4);
      setSoreness(todayCheckin.soreness_score ?? 4);
      setMood(todayCheckin.mood_score ?? 5);
      setNotes(todayCheckin.notes ?? '');
    } else {
      setFormMode('form');
      setSleepQuality(3);
      setFatigue(4);
      setStress(4);
      setSoreness(4);
      setMood(5);
      setNotes('');
    }
    setStep(0);
  }, [hasCheckedInToday, todayCheckin]);

  // Submissão final
  const handleSubmit = async () => {
    await submitCheckin({
      sleep_quality: sleepQuality,
      fatigue_score: fatigue,
      stress_score: stress,
      soreness_score: soreness,
      mood_score: mood,
      notes,
    });
    await loadTodayCheckin();
    setFormMode('view');
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
            <Text style={{ marginBottom: 8 }}>Qualidade do Sono: {todayCheckin.sleep_quality} ⭐</Text>
            <Text style={{ marginBottom: 8 }}>Fadiga: {todayCheckin.fatigue_score}/7</Text>
            <Text style={{ marginBottom: 8 }}>Estresse: {todayCheckin.stress_score}/7</Text>
            <Text style={{ marginBottom: 8 }}>Dores Musculares: {todayCheckin.soreness_score}/7</Text>
            <Text style={{ marginBottom: 8 }}>Humor: {moodEmojis[(todayCheckin.mood_score ?? 5) - 1]} {todayCheckin.mood_score}/10</Text>
            <Text style={{ marginBottom: 8 }}>Notas: {todayCheckin.notes || '-'}</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => setFormMode('form')}>Editar Check-in</Button>
          </Card.Actions>
        </Card>
      </View>
    );
  }

  // Wizard de perguntas
  const steps = [
    {
      label: 'Como você avalia a qualidade do seu sono?',
      content: (
        <>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>Arraste para avaliar de 1 a 5 estrelas.</Text>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 32 }}>{'⭐'.repeat(sleepQuality)}{'☆'.repeat(5 - sleepQuality)}</Text>
            <Text style={{ fontSize: 16, color: '#888' }}>{sleepQuality}/5</Text>
          </View>
          <Slider
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={sleepQuality}
            onValueChange={setSleepQuality}
            style={{ width: '100%' }}
          />
        </>
      ),
    },
    {
      label: 'Qual seu nível de fadiga hoje?',
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
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>1 = Totalmente Relaxado, 7 = Extremamente Estressado</Text>
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
            <Text style={{ fontSize: 12 }}>Extremamente Estressado</Text>
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
      label: 'Como está seu humor hoje?',
      content: (
        <>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>Arraste para avaliar de 1 a 10</Text>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 32 }}>{moodEmojis[mood - 1]}</Text>
            <Text style={{ fontSize: 16, color: '#888' }}>{mood}/10</Text>
          </View>
          <Slider
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={mood}
            onValueChange={setMood}
            style={{ width: '100%' }}
          />
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
      <Card>
        <Card.Title title={steps[step].label} />
        <Card.Content>
          {steps[step].content}
        </Card.Content>
        <Card.Actions style={{ justifyContent: 'flex-end' }}>
          {step > 0 && (
            <Button onPress={() => setStep(step - 1)} style={{ marginRight: 8 }}>
              Voltar
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button mode="contained" onPress={() => setStep(step + 1)}>
              Próximo
            </Button>
          ) : (
            <Button mode="contained" onPress={handleSubmit} loading={isSubmitting}>
              Finalizar Check-in
            </Button>
          )}
        </Card.Actions>
      </Card>
    </View>
  );
}