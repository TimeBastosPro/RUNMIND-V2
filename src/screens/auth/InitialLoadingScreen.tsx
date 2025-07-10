import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useAuthStore } from '../../stores/auth';

interface InitialLoadingScreenProps {
  navigation: any;
}

export default function InitialLoadingScreen({ navigation }: InitialLoadingScreenProps) {
  const { profile } = useAuthStore();
  const [showSnackbar, setShowSnackbar] = useState(false);

  function isProfileComplete(profile: any) {
    if (!profile) return false;
    return (
      !!profile.date_of_birth &&
      !!profile.weight_kg &&
      !!profile.height_cm
    );
  }

  useEffect(() => {
    if (!profile) return;
    if (isProfileComplete(profile)) {
      navigation.replace('Main');
    } else {
      setShowSnackbar(true);
      setTimeout(() => {
        navigation.replace('Main', { screen: 'Profile' });
      }, 1200);
    }
  }, [profile, navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16 }}>Verificando seu perfil...</Text>
      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={1200}
        style={{ bottom: 32 }}
      >
        Complete seu perfil para obter insights mais precisos!
      </Snackbar>
    </View>
  );
} 