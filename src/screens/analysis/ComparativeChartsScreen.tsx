import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import WellbeingChartsTab from './tabs/WellbeingChartsTab';
import PsychologicalChartsTab from './tabs/PsychologicalChartsTab';
import CrossAnalysisTab from './tabs/CrossAnalysisTab';

const Tab = createMaterialTopTabNavigator();

export default function ComparativeChartsScreen() {
  return (
    <View style={styles.container}>
      <Surface style={styles.filterContainer} elevation={2}>
        <Text style={styles.filterText}>Filtro de Período (Semana, Mês, 3 Meses)</Text>
      </Surface>
      <View style={styles.tabsContainer}>
        <Tab.Navigator
          screenOptions={{
            tabBarLabelStyle: { fontWeight: 'bold', fontSize: 14 },
            tabBarIndicatorStyle: { backgroundColor: '#1976d2' },
            tabBarActiveTintColor: '#1976d2',
            tabBarInactiveTintColor: '#888',
            tabBarStyle: { backgroundColor: '#fff' },
          }}
        >
          <Tab.Screen name="Bem-Estar" component={WellbeingChartsTab} />
          <Tab.Screen name="Evolução" component={WellbeingChartsTab} />
          <Tab.Screen name="Treino" component={PsychologicalChartsTab} />
          <Tab.Screen name="Análise Cruzada" component={CrossAnalysisTab} />
        </Tab.Navigator>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  filterText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  tabsContainer: {
    flex: 1,
  },
}); 