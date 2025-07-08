import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useCheckinStore } from '../../stores/checkin';
import { useAuthStore } from '../../stores/auth';

// Definindo tipos para melhor TypeScript
interface CheckinData {
  date: string;
  mood_score: number;
  energy_score: number;
  sleep_hours: number;
  sleep_quality: number;
  notes?: string;
}

interface NavigationProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

const moodEmojis = ['😢', '😟', '😐', '🙂', '😊', '😄', '😆', '🤩', '🤗', '🥳'];
const energyEmojis = ['😴', '😪', '😑', '🙂', '😊', '😄', '💪', '⚡', '🔥', '🚀'];

export default function DailyCheckinScreen({ navigation }: NavigationProps) {
  const { submitCheckin, hasCheckedInToday, isSubmitting, loadTodayCheckin } = useCheckinStore();
  const { isAuthenticated } = useAuthStore();
  
  const [moodScore, setMoodScore] = useState<number>(5);
  const [energyScore, setEnergyScore] = useState<number>(5);
  const [sleepHours, setSleepHours] = useState<string>('7');
  const [sleepQuality, setSleepQuality] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadTodayCheckin();
    }
  }, [isAuthenticated, loadTodayCheckin]);

  const handleSubmit = async (): Promise<void> => {
    if (hasCheckedInToday) {
      Alert.alert('Ops!', 'Você já fez o check-in hoje! 😊');
      return;
    }

    const sleepHoursNum = parseFloat(sleepHours);
    if (isNaN(sleepHoursNum) || sleepHoursNum < 0 || sleepHoursNum > 24) {
      Alert.alert('Erro', 'Por favor, insira um número válido de horas de sono (0-24)');
      return;
    }

    setIsLoading(true);
    try {
      const checkinData: CheckinData = {
        date: new Date().toISOString().split('T')[0],
        mood_score: moodScore,
        energy_score: energyScore,
        sleep_hours: sleepHoursNum,
        sleep_quality: sleepQuality,
        notes: notes.trim() || undefined,
      };

      await submitCheckin(checkinData);

      Alert.alert(
        '✅ Check-in realizado!', 
        'Obrigado! Seus dados foram salvos e já estamos gerando insights personalizados.',
        [
          { 
            text: 'Ver Insights', 
            onPress: () => navigation.navigate('Insights')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao fazer check-in');
    } finally {
      setIsLoading(false);
    }
  };

  if (hasCheckedInToday) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <Card>
          <Card.Content style={{ alignItems: 'center', padding: 30 }}>
            <Text variant="headlineMedium">✅ Check-in Completo!</Text>
            <Text variant="bodyLarge" style={{ textAlign: 'center', marginVertical: 16 }}>
              Você já fez seu check-in hoje. Volte amanhã para continuar acompanhando seu bem-estar!
            </Text>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('Insights')}
              style={{ marginTop: 16 }}
            >
              Ver Meus Insights
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineMedium" style={{ marginBottom: 24, textAlign: 'center' }}>
        🏃‍♂️ Check-in Diário
      </Text>
      
      <Text variant="bodyLarge" style={{ marginBottom: 16, textAlign: 'center', opacity: 0.7 }}>
        Como você está se sentindo hoje?
      </Text>

      {/* Mood Score */}
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>
            😊 Humor Geral
          </Text>
          <View style={{ alignItems: 'center', marginVertical: 16 }}>
            <Text variant="displaySmall">{moodEmojis[moodScore - 1]}</Text>
            <Text variant="bodyLarge">{moodScore}/10</Text>
          </View>
          <Slider
            value={moodScore}
            onValueChange={setMoodScore}
            minimumValue={1}
            maximumValue={10}
            step={1}
            style={{ width: '100%', height: 40 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text variant="bodySmall">Muito baixo</Text>
            <Text variant="bodySmall">Excelente</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Energy Score */}
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>
            ⚡ Energia Física
          </Text>
          <View style={{ alignItems: 'center', marginVertical: 16 }}>
            <Text variant="displaySmall">{energyEmojis[energyScore - 1]}</Text>
            <Text variant="bodyLarge">{energyScore}/10</Text>
          </View>
          <Slider
            value={energyScore}
            onValueChange={setEnergyScore}
            minimumValue={1}
            maximumValue={10}
            step={1}
            style={{ width: '100%', height: 40 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text variant="bodySmall">Exausto</Text>
            <Text variant="bodySmall">Energizado</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Sleep */}
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>
            💤 Sono
          </Text>
          
          <TextInput
            label="Horas de sono"
            value={sleepHours}
            onChangeText={setSleepHours}
            keyboardType="numeric"
            style={{ marginBottom: 16 }}
            right={<TextInput.Affix text="h" />}
          />

          <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
            Qualidade do sono:
          </Text>
          <View style={{ alignItems: 'center', marginVertical: 16 }}>
            <Text variant="headlineSmall">
              {'⭐'.repeat(sleepQuality)}{'☆'.repeat(5 - sleepQuality)}
            </Text>
            <Text variant="bodyLarge">{sleepQuality}/5</Text>
          </View>
          <Slider
            value={sleepQuality}
            onValueChange={setSleepQuality}
            minimumValue={1}
            maximumValue={5}
            step={1}
            style={{ width: '100%', height: 40 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text variant="bodySmall">Péssimo</Text>
            <Text variant="bodySmall">Excelente</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Notes */}
      <Card style={{ marginBottom: 24 }}>
        <Card.Content>
          <TextInput
            label="Notas do dia (opcional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder="Como foi seu dia? Algo específico aconteceu?"
            mode="outlined"
          />
        </Card.Content>
      </Card>

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading || isSubmitting}
        disabled={isLoading || isSubmitting}
        style={{ marginBottom: 32 }}
        contentStyle={{ paddingVertical: 8 }}
      >
        {isLoading || isSubmitting ? 'Salvando...' : 'Finalizar Check-in'}
      </Button>
    </ScrollView>
  );
}