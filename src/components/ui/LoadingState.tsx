import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

interface LoadingStateProps {
  message?: string;
  icon?: string;
  size?: 'small' | 'large';
  color?: string;
}

export default function LoadingState({
  message = 'Carregando dados...',
  icon = 'loading',
  size = 'large',
  color = '#2196F3'
}: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name={icon as any} 
        size={isMobile ? 32 : 40} 
        color={color} 
      />
      <ActivityIndicator 
        size={size} 
        color={color} 
        style={styles.spinner}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  spinner: {
    marginVertical: 16,
  },
  message: {
    fontSize: isMobile ? 14 : 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});
