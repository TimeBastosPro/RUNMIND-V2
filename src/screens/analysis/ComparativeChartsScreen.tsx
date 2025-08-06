import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text } from 'react-native-paper';

// Tabs que vamos criar
import WellbeingChartsTab from './tabs/WellbeingChartsTab';
import TrainingChartsTab from './tabs/TrainingChartsTab';
import CrossAnalysisTab from './tabs/CrossAnalysisTab';
import TrainingLoadTab from './tabs/TrainingLoadTab';

const Tab = createMaterialTopTabNavigator();
const { width: screenWidth } = Dimensions.get('window');

// Determinar se é um dispositivo móvel
const isMobile = screenWidth < 768;
const isTablet = screenWidth >= 768 && screenWidth < 1024;

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
          tabBarLabelStyle: { 
            fontSize: isMobile ? 10 : 12, 
            fontWeight: 'bold',
            textTransform: 'none',
          },
          tabBarStyle: { 
            backgroundColor: '#fff',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
          tabBarScrollEnabled: isMobile, // Scroll apenas em mobile
          tabBarItemStyle: {
            minWidth: isMobile ? 80 : 100,
            paddingHorizontal: isMobile ? 4 : 8,
          },
          tabBarPressColor: 'rgba(33, 150, 243, 0.1)',
          tabBarPressOpacity: 0.8,
        }}
      >
        <Tab.Screen 
          name="Wellbeing" 
          component={WellbeingChartsTab}
          options={{ 
            tabBarLabel: isMobile ? 'Bem-estar' : 'Bem-estar',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 16 }}>😴</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Training" 
          component={TrainingChartsTab}
          options={{ 
            tabBarLabel: isMobile ? 'Treinos' : 'Treinos',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 16 }}>🏃</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="TrainingLoad" 
          component={TrainingLoadTab}
          options={{ 
            tabBarLabel: isMobile ? 'Carga' : 'Carga de Treino',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 16 }}>⚡</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="CrossAnalysis" 
          component={CrossAnalysisTab}
          options={{ 
            tabBarLabel: isMobile ? 'Correlação' : 'Correlação',
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 16 }}>📈</Text>
            ),
          }}
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