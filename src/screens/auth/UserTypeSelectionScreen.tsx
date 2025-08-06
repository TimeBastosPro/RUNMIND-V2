import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface UserTypeSelectionScreenProps {
  navigation: any;
  onSelectUserType: (userType: 'athlete' | 'coach') => void;
}

export default function UserTypeSelectionScreen({ 
  navigation, 
  onSelectUserType 
}: UserTypeSelectionScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          🏃‍♂️ RunMind
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Escolha seu tipo de conta
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        {/* Card do Atleta */}
        <Card style={styles.card} onPress={() => onSelectUserType('athlete')}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name="run-fast" 
                size={48} 
                color="#2196F3" 
              />
            </View>
            <Text variant="headlineSmall" style={styles.cardTitle}>
              Atleta
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              Acompanhe seus treinos, check-ins diários e receba insights personalizados sobre seu desempenho e bem-estar.
            </Text>
            <View style={styles.features}>
              <Text variant="bodySmall" style={styles.feature}>
                ✓ Check-ins diários de bem-estar
              </Text>
              <Text variant="bodySmall" style={styles.feature}>
                ✓ Registro de treinos realizados
              </Text>
              <Text variant="bodySmall" style={styles.feature}>
                ✓ Insights e análises personalizadas
              </Text>
              <Text variant="bodySmall" style={styles.feature}>
                ✓ Vinculação com treinador
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Card do Treinador */}
        <Card style={styles.card} onPress={() => onSelectUserType('coach')}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name="account-tie" 
                size={48} 
                color="#FF9800" 
              />
            </View>
            <Text variant="headlineSmall" style={styles.cardTitle}>
              Treinador
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              Gerencie seus atletas, crie treinos planejados e acompanhe o progresso da sua equipe com análises detalhadas.
            </Text>
            <View style={styles.features}>
              <Text variant="bodySmall" style={styles.feature}>
                ✓ Gerenciamento de equipe
              </Text>
              <Text variant="bodySmall" style={styles.feature}>
                ✓ Criação de treinos planejados
              </Text>
              <Text variant="bodySmall" style={styles.feature}>
                ✓ Acompanhamento de atletas
              </Text>
              <Text variant="bodySmall" style={styles.feature}>
                ✓ Análises e insights da equipe
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.footer}>
        <Button 
          mode="text" 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Voltar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
  },
  cardsContainer: {
    flex: 1,
    gap: 20,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardDescription: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    color: '#555',
  },
  features: {
    width: '100%',
  },
  feature: {
    marginBottom: 6,
    color: '#666',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButton: {
    marginTop: 10,
  },
}); 