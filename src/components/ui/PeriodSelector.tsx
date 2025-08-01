import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type PeriodType = '7d' | '30d' | '90d' | '180d' | '365d' | 'custom';

export interface PeriodSelectorProps {
  selectedPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (startDate: Date, endDate: Date) => void;
}

const PERIOD_OPTIONS = [
  { label: '7 dias', value: '7d', icon: 'calendar-week' },
  { label: '30 dias', value: '30d', icon: 'calendar-month' },
  { label: '90 dias', value: '90d', icon: 'calendar' },
  { label: '180 dias', value: '180d', icon: 'calendar-blank' },
  { label: '1 ano', value: '365d', icon: 'calendar-year' },
  { label: 'Personalizado', value: 'custom', icon: 'calendar-edit' },
];

export default function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
}: PeriodSelectorProps) {
  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="calendar-range" size={20} color="#333" />
          <Text style={styles.title}>Período de Análise</Text>
        </View>
        <View style={styles.periodGrid}>
          {PERIOD_OPTIONS.map((period) => (
            <Chip
              key={period.value}
              selected={selectedPeriod === period.value}
              onPress={() => onPeriodChange(period.value as PeriodType)}
              style={[
                styles.periodChip,
                selectedPeriod === period.value && { backgroundColor: '#4CAF50' + '20' }
              ]}
              textStyle={[
                styles.periodChipText,
                selectedPeriod === period.value && { color: '#4CAF50', fontWeight: 'bold' }
              ]}
              icon={period.icon}
            >
              {period.label}
            </Chip>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodChip: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  periodChipText: {
    color: '#333',
  },
}); 