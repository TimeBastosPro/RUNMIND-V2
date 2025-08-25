import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

interface UserNotRegisteredScreenProps {
  email?: string;
  onRetry?: () => void;
  onGoToSignup?: () => void;
}

export const UserNotRegisteredScreen: React.FC<UserNotRegisteredScreenProps> = ({
  email,
  onRetry,
  onGoToSignup
}) => {
  const navigation = useNavigation();

  const handleGoToSignup = () => {
    if (onGoToSignup) {
      onGoToSignup();
    } else {
      navigation.navigate('Auth' as never);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <IconButton
          icon="account-alert"
          size={80}
          iconColor="#FF6B6B"
          style={styles.icon}
        />
        <Text variant="headlineMedium" style={styles.title}>
          Usuário Não Cadastrado
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Este email não está cadastrado no sistema
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            O que aconteceu?
          </Text>
          <Text variant="bodyMedium" style={styles.cardText}>
            O email {email ? `"${email}"` : 'fornecido'} não foi encontrado em nossa base de dados. 
            Isso pode acontecer se:
          </Text>
          
          <View style={styles.bulletPoints}>
            <Text variant="bodyMedium" style={styles.bulletPoint}>
              • Você ainda não criou uma conta
            </Text>
            <Text variant="bodyMedium" style={styles.bulletPoint}>
              • O email foi digitado incorretamente
            </Text>
            <Text variant="bodyMedium" style={styles.bulletPoint}>
              • A conta foi removida do sistema
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            O que você pode fazer?
          </Text>
          
          <View style={styles.options}>
            <View style={styles.option}>
              <IconButton
                icon="account-plus"
                size={24}
                iconColor="#4CAF50"
              />
              <View style={styles.optionText}>
                <Text variant="titleSmall" style={styles.optionTitle}>
                  Criar Nova Conta
                </Text>
                <Text variant="bodySmall" style={styles.optionDescription}>
                  Cadastre-se como atleta ou treinador
                </Text>
              </View>
            </View>
            
            <View style={styles.option}>
              <IconButton
                icon="refresh"
                size={24}
                iconColor="#2196F3"
              />
              <View style={styles.optionText}>
                <Text variant="titleSmall" style={styles.optionTitle}>
                  Tentar Novamente
                </Text>
                <Text variant="bodySmall" style={styles.optionDescription}>
                  Verificar se o email está correto
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleGoToSignup}
          style={[styles.button, styles.primaryButton]}
          contentStyle={styles.buttonContent}
        >
          <IconButton
            icon="account-plus"
            size={20}
            iconColor="white"
            style={styles.buttonIcon}
          />
          Criar Conta
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleRetry}
          style={[styles.button, styles.secondaryButton]}
          contentStyle={styles.buttonContent}
        >
          <IconButton
            icon="refresh"
            size={20}
            iconColor="#2196F3"
            style={styles.buttonIcon}
          />
          Tentar Novamente
        </Button>
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          Precisa de ajuda? Entre em contato conosco
        </Text>
        <Button
          mode="text"
          onPress={() => {/* Implementar contato */}}
          style={styles.contactButton}
        >
          Contatar Suporte
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  card: {
    marginBottom: 20,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  cardText: {
    marginBottom: 16,
    color: '#555',
    lineHeight: 20,
  },
  bulletPoints: {
    marginLeft: 8,
  },
  bulletPoint: {
    marginBottom: 8,
    color: '#555',
    lineHeight: 20,
  },
  options: {
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionText: {
    flex: 1,
    marginLeft: 8,
  },
  optionTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  optionDescription: {
    color: '#666',
    marginTop: 2,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  button: {
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    borderColor: '#2196F3',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  buttonIcon: {
    margin: 0,
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
  },
  contactButton: {
    marginTop: 4,
  },
});

export default UserNotRegisteredScreen;
