import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text } from 'react-native-paper';

// Tabs que vamos criar
import WellbeingChartsTab from './tabs/WellbeingChartsTab';
import TrainingChartsTab from './tabs/TrainingChartsTab';
import CrossAnalysisTab from './tabs/CrossAnalysisTab';

const Tab = createMaterialTopTabNavigator();

export default function ComparativeChartsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Análise de Dados</Text>
        <Text style={styles.headerSubtitle}>Monitore sua evolução esportiva</Text>
      </View>
      
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: '#666',
          tabBarIndicatorStyle: { backgroundColor: '#2196F3' },
          tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
          tabBarStyle: { backgroundColor: '#fff' },
        }}
      >
        <Tab.Screen 
          name="Wellbeing" 
          component={WellbeingChartsTab}
          options={{ tabBarLabel: 'Bem-estar' }}
        />
        <Tab.Screen 
          name="Training" 
          component={TrainingChartsTab}
          options={{ tabBarLabel: 'Treinos' }}
        />
        <Tab.Screen 
          name="CrossAnalysis" 
          component={CrossAnalysisTab}
          options={{ tabBarLabel: 'Correlação' }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
}); 