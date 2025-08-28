import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
  iconColor?: string;
  iconSize?: number;
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  actionText,
  onAction,
  iconColor = '#ccc',
  iconSize = isMobile ? 36 : 48
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name={icon as any} 
        size={iconSize} 
        color={iconColor} 
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionText && onAction && (
        <Button 
          mode="contained" 
          onPress={onAction}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          {actionText}
        </Button>
      )}
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
  title: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: isMobile ? 14 : 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionButton: {
    borderRadius: 8,
  },
  actionButtonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
