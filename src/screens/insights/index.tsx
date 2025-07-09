import React from 'react';
import { View } from 'react-native';
import { Card, Text } from 'react-native-paper';

export default function InsightsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Card>
        <Card.Content style={{ alignItems: 'center' }}>
          <Text variant="headlineMedium">💡 Insights</Text>
          <Text variant="bodyLarge" style={{ textAlign: 'center', marginTop: 16 }}>
            Seus insights personalizados aparecerão aqui após alguns check-ins!
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
} 