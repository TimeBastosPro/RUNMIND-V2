import React from 'react';
import { View, Alert } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useCheckinStore } from '../../stores/checkin';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const todayReadinessScore = useCheckinStore(s => s.todayReadinessScore);
  const hasCheckedInToday = useCheckinStore(s => s.hasCheckedInToday);
  const navigation = useNavigation();

  let feedbackMsg = '';
  let readinessPercent = todayReadinessScore !== null ? Math.round((1 - (todayReadinessScore / 28)) * 100) : null;
  if (todayReadinessScore !== null) {
    if (todayReadinessScore < 10) {
      feedbackMsg = '✅ Prontidão Excelente. Você está bem recuperado.';
    } else if (todayReadinessScore <= 18) {
      feedbackMsg = '👍 Prontidão Normal. Seu corpo está respondendo bem.';
    } else {
      feedbackMsg = '⚠️ Atenção à Recuperação. Sua pontuação está mais alta que o normal. Considere um dia mais leve.';
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>Como você está hoje?</Text>
      <Button
        mode="contained"
        style={{ padding: 18, borderRadius: 12, marginBottom: 24 }}
        labelStyle={{ fontSize: 18 }}
        onPress={() => navigation.navigate('Check-in' as never)}
      >
        Fazer Check-in Diário
      </Button>
      <Card style={{ marginBottom: 24 }}>
        <Card.Content style={{ alignItems: 'center' }}>
          <Text variant="headlineMedium">Análise RunMind</Text>
          <Text style={{ fontSize: 32, fontWeight: 'bold', marginVertical: 12 }}>
            {readinessPercent !== null ? `Corpo ${readinessPercent}% pronto` : 'Sem dados'}
          </Text>
          <Text style={{ fontSize: 18, textAlign: 'center', marginTop: 8 }}>{feedbackMsg}</Text>
        </Card.Content>
      </Card>
      <Button
        mode="outlined"
        style={{ marginBottom: 16 }}
        onPress={() => Alert.alert('Saiba Mais', 'Aqui você verá uma explicação detalhada sobre sua prontidão e recomendações personalizadas.')}
      >
        Saiba Mais
      </Button>
      <Button
        mode="contained"
        style={{ marginTop: 8 }}
        onPress={() => navigation.navigate('Calendar' as never)}
      >
        Acessar Calendário
      </Button>
    </View>
  );
} 