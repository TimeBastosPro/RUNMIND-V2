import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: any;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  showText = false, 
  style 
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40 };
      case 'large':
        return { width: 80, height: 80 };
      default:
        return { width: 60, height: 60 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'titleMedium';
      case 'large':
        return 'headlineLarge';
      default:
        return 'headlineMedium';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.logoContainer, getSize()]}>
        <Image 
          source={require('../../../assets/logo-montanhas.png')}
          style={[styles.logoImage, getSize()]}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <Text 
          variant={getTextSize() as any} 
          style={styles.brandText}
        >
          RunMind
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandText: {
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
  },
});
