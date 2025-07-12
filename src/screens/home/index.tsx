import React from 'react';
import { View } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useCheckinStore } from '../../stores/checkin';

export default function HomeScreen() {
  const todayReadinessScore = useCheckinStore(s => s.todayReadinessScore);
  const hasCheckedInToday = useCheckinStore(s => s.hasCheckedInToday);

  let feedbackMsg = '';
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
      {!hasCheckedInToday ? (
        <Button mode="contained" style={{ padding: 24, borderRadius: 12 }} labelStyle={{ fontSize: 20 }} onPress={() => {/* navegação para check-in */}}>
          Fazer Check-in Diário
        </Button>
      ) : (
        <Card>
          <Card.Content style={{ alignItems: 'center' }}>
            <Text variant="headlineMedium">Sua Prontidão Hoje</Text>
            <Text style={{ fontSize: 32, fontWeight: 'bold', marginVertical: 12 }}>
              Pontuação: {todayReadinessScore} / 28
            </Text>
            <Text style={{ fontSize: 18, textAlign: 'center', marginTop: 8 }}>{feedbackMsg}</Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );
} 