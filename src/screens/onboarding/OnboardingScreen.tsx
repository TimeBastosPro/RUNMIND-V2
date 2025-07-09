import React from 'react';
import { View } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function OnboardingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Card>
        <Card.Content style={{ alignItems: 'center' }}>
          <Text variant="headlineMedium">🚀 Onboarding</Text>
          <Text variant="bodyLarge" style={{ textAlign: 'center', marginTop: 16 }}>
            Bem-vindo ao onboarding! Personalize sua experiência RunMind aqui.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
} 