// src/components/ui/PasswordStrengthIndicator.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calculatePasswordStrength, PasswordStrength } from '../../utils/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  style?: any;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
  style
}) => {
  const strength = calculatePasswordStrength(password);
  
  if (!password) {
    return null;
  }

  const getColor = (color: PasswordStrength['color']) => {
    switch (color) {
      case 'red': return '#ff4444';
      case 'orange': return '#ff8800';
      case 'yellow': return '#ffcc00';
      case 'lightgreen': return '#88cc00';
      case 'green': return '#44cc44';
      default: return '#cccccc';
    }
  };

  const getBarWidth = (score: number) => {
    return `${(score / 4) * 100}%`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Barra de força */}
      <View style={styles.strengthBar}>
        <View style={styles.barBackground}>
          <View 
            style={[
              styles.barFill, 
              { 
                width: getBarWidth(strength.score),
                backgroundColor: getColor(strength.color)
              }
            ]} 
          />
        </View>
        <Text style={[styles.strengthLabel, { color: getColor(strength.color) }]}>
          {strength.label}
        </Text>
      </View>

      {/* Requisitos */}
      {showRequirements && (
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Requisitos de senha:</Text>
          
          <View style={styles.requirementItem}>
            <View style={[
              styles.requirementDot, 
              { backgroundColor: strength.requirements.length ? '#44cc44' : '#cccccc' }
            ]} />
            <Text style={[
              styles.requirementText,
              { color: strength.requirements.length ? '#44cc44' : '#666666' }
            ]}>
              Pelo menos 8 caracteres
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <View style={[
              styles.requirementDot, 
              { backgroundColor: strength.requirements.lowercase ? '#44cc44' : '#cccccc' }
            ]} />
            <Text style={[
              styles.requirementText,
              { color: strength.requirements.lowercase ? '#44cc44' : '#666666' }
            ]}>
              Uma letra minúscula
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <View style={[
              styles.requirementDot, 
              { backgroundColor: strength.requirements.uppercase ? '#44cc44' : '#cccccc' }
            ]} />
            <Text style={[
              styles.requirementText,
              { color: strength.requirements.uppercase ? '#44cc44' : '#666666' }
            ]}>
              Uma letra maiúscula
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <View style={[
              styles.requirementDot, 
              { backgroundColor: strength.requirements.number ? '#44cc44' : '#cccccc' }
            ]} />
            <Text style={[
              styles.requirementText,
              { color: strength.requirements.number ? '#44cc44' : '#666666' }
            ]}>
              Um número
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <View style={[
              styles.requirementDot, 
              { backgroundColor: strength.requirements.special ? '#44cc44' : '#cccccc' }
            ]} />
            <Text style={[
              styles.requirementText,
              { color: strength.requirements.special ? '#44cc44' : '#666666' }
            ]}>
              Um caractere especial (!@#$%^&*)
            </Text>
          </View>
        </View>
      )}

      {/* Dicas de segurança */}
      {password.length > 0 && strength.score < 3 && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Dicas para uma senha mais forte:</Text>
          <Text style={styles.tipText}>
            • Use pelo menos 12 caracteres
          </Text>
          <Text style={styles.tipText}>
            • Evite informações pessoais (nome, data de nascimento)
          </Text>
          <Text style={styles.tipText}>
            • Use uma frase que você lembre facilmente
          </Text>
          <Text style={styles.tipText}>
            • Considere usar um gerenciador de senhas
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  strengthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },
  requirementsContainer: {
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  requirementText: {
    fontSize: 11,
    flex: 1,
  },
  tipsContainer: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    padding: 12,
    borderRadius: 4,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 11,
    color: '#856404',
    marginBottom: 4,
    lineHeight: 16,
  },
});

export default PasswordStrengthIndicator;
