import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { useCheckinStore } from '../../stores/checkin';

export default function InsightsScreen() {
  const insights = useCheckinStore(state => state.insights);
  const isLoading = useCheckinStore(state => state.isLoading);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      <FlatList
        data={insights}
        keyExtractor={(item, idx) => idx.toString()}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>💡</Text>
              <Text style={{ fontSize: 16, flex: 1 }}>{item}</Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={{ color: '#888', fontSize: 16, textAlign: 'center' }}>
              Seus insights personalizados aparecerão aqui após alguns check-ins!
            </Text>
          </View>
        }
        contentContainerStyle={insights.length === 0 ? { flex: 1 } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    elevation: 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 