import React from 'react';
import { View } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Card>
        <Card.Content style={{ alignItems: 'center' }}>
          <Text variant="headlineMedium">🏠 Home</Text>
          <Text variant="bodyLarge" style={{ textAlign: 'center', marginTop: 16 }}>
            Bem-vindo ao RunMind! Sua tela inicial será implementada em breve.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
} 