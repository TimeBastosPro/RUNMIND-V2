import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, ActivityIndicator, Appbar } from 'react-native-paper';
import { useCoachStore } from '../../stores/coach';
import { useAuthStore } from '../../stores/auth';

interface CoachDashboardScreenProps {
  navigation: any;
}

export default function CoachDashboardScreen({ navigation }: CoachDashboardScreenProps) {
  const { 
    currentCoach,
    loadCoachProfile, 
    loadTeams,
    loadCoachRelationships,
    clearError,
    error 
  } = useCoachStore();
  
  const { signOut } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (error) {
      console.error('❌ Erro no dashboard:', error);
      clearError();
    }
  }, [error]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadCoachProfile(),
        loadTeams(),
        loadCoachRelationships()
      ]);
    } catch (error) {
      console.error('❌ Erro ao carregar dados iniciais:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível sair da conta. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') return '??';
    return name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  if (!currentCoach) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Carregando perfil de treinador...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header} elevated>
        <Appbar.Content title="Dashboard do Treinador" titleStyle={styles.headerTitle} />
        <Appbar.Action icon="logout" onPress={handleLogout} iconColor="#FFFFFF" size={24} />
      </Appbar.Header>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Conteúdo removido conforme solicitado (somente header e refresh) */}
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#666' }}>Área do treinador</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#2196F3' },
  headerTitle: { color: '#FFFFFF' },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
}); 