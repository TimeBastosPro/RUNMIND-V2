import React, { useState, useEffect } from 'react';
import { View, Platform, Alert } from 'react-native';
import { Card, Text, Button, ActivityIndicator, TextInput, Modal, Portal } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import WeeklyReflectionModal, { WeeklyReflectionAnswers } from '../training/WeeklyReflectionModal';
import { useCheckinStore } from '../../stores/checkin';
import { useAuthStore } from '../../stores/auth';
import { useNavigation } from '@react-navigation/native';

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
      <Modal visible={visible} onDismiss={onCancel} contentContainerStyle={{ backgroundColor: 'white', padding: 16, margin: 10, borderRadius: 12, maxHeight: '90%', width: '95%', alignSelf: 'center' }}>
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
  const navigation = useNavigation();
  const todayCheckin = useCheckinStore(s => s.todayCheckin);
  const hasCheckedInToday = useCheckinStore(s => s.hasCheckedInToday);
  const isSubmitting = useCheckinStore(s => s.isSubmitting);
  const submitCheckin = useCheckinStore(s => s.submitCheckin);
  const loadTodayCheckin = useCheckinStore(s => s.loadTodayCheckin);
  const submitWeeklyReflection = useCheckinStore(s => s.submitWeeklyReflection);
  const saveDailyCheckin = useCheckinStore(s => s.saveDailyCheckin);
  const recentCheckins = useCheckinStore(s => s.recentCheckins);
  const trainingSessions = useCheckinStore(s => s.trainingSessions);
  const userProfile = useAuthStore(s => s.profile);

  // Estados do wizard
  const [step, setStep] = useState(0);
  const [sleepQuality, setSleepQuality] = useState(4);
  const [soreness, setSoreness] = useState(4);
  const [emotion, setEmotion] = useState<number | null>(null); // 1-5 para emojis
  const [motivation, setMotivation] = useState(3);
  const [focus, setFocus] = useState(3);
  const [confidence, setConfidence] = useState(3);
  const [notes, setNotes] = useState('');
  // Remover formMode e estados duplicados

  // Estado para modal semanal
  const [weeklyReflectionVisible, setWeeklyReflectionVisible] = useState(false);
  // Estado para o modal de check-in diário (wizard)
  const [dailyCheckinVisible, setDailyCheckinVisible] = useState(false);

  // Resetar o passo do wizard ao abrir o modal
  useEffect(() => {
    if (dailyCheckinVisible) setStep(0);
  }, [dailyCheckinVisible]);

  // Submissão final do check-in diário
  const handleSubmit = async () => {
    const checkinData = {
      sleep_quality: sleepQuality,     // 1-7 (qualidade do sono)
      soreness,                        // 1-7
      motivation: emotion ?? 3,        // 1-5 (estado emocional/motivação)
      focus,                           // 1-5
      confidence,                      // 1-5
    };
    try {
      console.log('🔍 Iniciando submissão do check-in:', checkinData);
      
      // ✅ MELHORADO: Salvar check-in com feedback visual
      await saveDailyCheckin(checkinData);
      console.log('✅ Check-in salvo com sucesso');
      
      // ✅ MELHORADO: Fechar modal imediatamente
      setDailyCheckinVisible(false);
      console.log('✅ Modal fechado');
      
      // ✅ MELHORADO: Recarregar dados em background
      setTimeout(async () => {
        try {
          await loadTodayCheckin();
          console.log('✅ Dados recarregados');
        } catch (reloadError) {
          console.error('⚠️ Erro ao recarregar dados:', reloadError);
        }
      }, 100);
      
      // ✅ MELHORADO: Mostrar mensagem de sucesso
      Alert.alert(
        'Check-in Concluído! ✅', 
        'Seu check-in foi salvo e um insight personalizado foi gerado automaticamente. Você pode visualizá-lo na aba de Insights.',
        [
          {
            text: 'Ver Insights',
            onPress: () => {
              try {
                // @ts-ignore
                navigation.navigate('Insights' as never);
              } catch (navError) {
                console.error('⚠️ Erro na navegação:', navError);
              }
            }
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
      
    } catch (err) {
      console.error('❌ Erro ao salvar check-in:', err);
      Alert.alert(
        'Erro ao Salvar', 
        err instanceof Error ? err.message : 'Erro desconhecido ao salvar check-in'
      );
    }
  };

  // Submissão da reflexão semanal
  const handleSaveWeeklyReflection = async (answers: WeeklyReflectionAnswers) => {
    const weekStart = getWeekStart(new Date());
    try {
      await submitWeeklyReflection({
        enjoyment: answers.enjoyment,
        progress: String(answers.progress),
        confidence: String(answers.confidence),
        week_start: weekStart,
      });
      setWeeklyReflectionVisible(false);
      Alert.alert('Reflexão salva com sucesso!');
    } catch (err) {
      Alert.alert('Erro ao salvar reflexão semanal', err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao salvar reflexão semanal:', err);
    }
  };

  // Wizard steps para o modal de check-in diário
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
      label: 'Dores Musculares (1 = Nenhuma, 7 = Fortes)',
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
        <>
          <Text style={{ marginBottom: 12, textAlign: 'center' }}>Avalie seu estado emocional de 1 (Ruim) a 5 (Ótimo)</Text>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 24 }}>{emotion ?? 3}/5</Text>
          </View>
          <SliderUniversal
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={emotion ?? 3}
            onValueChange={setEmotion}
            style={{ width: '100%' }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12 }}>Ruim</Text>
            <Text style={{ fontSize: 12 }}>Ótimo</Text>
          </View>
        </>
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

  // Função para obter o início da semana (domingo)
  function getWeekStart(date: Date) {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  }
  // Só permite reflexão semanal aos domingos
  const isSunday = new Date().getDay() === 0;

  if (isSubmitting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
      {/* Card da Reflexão Semanal - TOPO */}
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
      {/* Modal do wizard de check-in diário */}
      <Modal visible={dailyCheckinVisible} onDismiss={() => setDailyCheckinVisible(false)} contentContainerStyle={{ backgroundColor: 'white', padding: 16, margin: 10, borderRadius: 12, maxHeight: '90%', width: '95%', alignSelf: 'center' }}>
        <Text variant="titleLarge" style={{ marginBottom: 16 }}>Check-in Diário</Text>
        <Text style={{ marginBottom: 8, color: 'gray', textAlign: 'center' }}>Passo {step+1} de {steps.length}</Text>
        <Text style={{ marginBottom: 8 }}>{steps[step].label}</Text>
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
              Salvar
            </Button>
          )}
        </View>
      </Modal>
      {/* Modal da Reflexão Semanal */}
      <WeeklyReflectionModal
        visible={weeklyReflectionVisible}
        onSave={handleSaveWeeklyReflection}
        onCancel={() => setWeeklyReflectionVisible(false)}
      />
    </View>
  );
}