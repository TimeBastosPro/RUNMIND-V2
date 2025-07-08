import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme, Card, Button } from 'react-native-paper';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    secondary: '#4CAF50',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            <Text style={styles.title}>🏃‍♂️ RunMind v2</Text>
            <Text style={styles.subtitle}>Sistema funcionando!</Text>
            <Text style={styles.description}>
              ✅ Supabase configurado{'\n'}
              ✅ Gemini AI integrado{'\n'}
              ✅ Stores criados{'\n'}
              ✅ Telas preparadas
            </Text>
            <Button mode="contained" style={styles.button}>
              Próximo: Navegação
            </Button>
          </Card.Content>
        </Card>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 16,
    color: '#666',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    marginTop: 16,
  },
});