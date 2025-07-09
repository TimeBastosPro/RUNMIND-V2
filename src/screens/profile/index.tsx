import React from 'react';
import { View } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useAuthStore } from '../../stores/auth';

export default function ProfileScreen() {
  const { signOut, profile } = useAuthStore();
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Card>
        <Card.Content style={{ alignItems: 'center' }}>
          <Text variant="headlineMedium">👤 Perfil</Text>
          <Text variant="bodyLarge" style={{ textAlign: 'center', marginTop: 16 }}>
            Olá, {profile?.full_name || 'Usuário'}!
          </Text>
          <Text variant="bodyMedium" style={{ textAlign: 'center', marginTop: 8, opacity: 0.7 }}>
            {profile?.email}
          </Text>
          <View style={{ marginTop: 24 }}>
            <Text variant="bodyMedium">Nível: {profile?.experience_level}</Text>
            <Text variant="bodyMedium">Objetivo: {profile?.main_goal}</Text>
          </View>
        </Card.Content>
        <Card.Actions style={{ justifyContent: 'center', marginTop: 16 }}>
          <Button mode="outlined" onPress={signOut}>
            Sair da conta
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
} 