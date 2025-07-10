import React from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useCheckinStore } from '../../stores/checkin';

export default function InsightsScreen() {
  const insights = useCheckinStore(state => state.insights);
  const isLoading = false; // Ajuste aqui se houver loading real no futuro

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : insights.length === 0 ? (
        <Card>
          <Card.Content style={{ alignItems: 'center' }}>
            <Text variant="headlineMedium">💡 Insights</Text>
            <Text variant="bodyLarge" style={{ textAlign: 'center', marginTop: 16 }}>
              Seus insights personalizados aparecerão aqui após alguns check-ins!
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={insights}
          keyExtractor={(item, idx) => idx.toString()}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 16, elevation: 2 }}>
              <Card.Content style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>💡</Text>
                <Text variant="bodyLarge" style={{ flex: 1 }}>{item}</Text>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
} 