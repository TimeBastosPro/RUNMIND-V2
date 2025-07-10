import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text, RadioButton, Button, Card } from 'react-native-paper';
import { useAuthStore } from '../../stores/auth';
import type { Profile } from '../../types/database';

const experienceOptions: Profile['experience_level'][] = ['beginner', 'intermediate', 'advanced'];
const goalOptions: Profile['main_goal'][] = ['health', 'performance', 'weight_loss', 'fun'];
const contextOptions: Profile['context_type'][] = ['solo', 'coached', 'hybrid'];

export default function OnboardingProfileScreen() {
  const profile = useAuthStore(state => state.profile);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const [experience, setExperience] = useState<Profile['experience_level']>(profile?.experience_level || 'beginner');
  const [goal, setGoal] = useState<Profile['main_goal']>(profile?.main_goal || 'health');
  const [context, setContext] = useState<Profile['context_type']>(profile?.context_type || 'solo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateProfile({
        experience_level: experience,
        main_goal: goal,
        context_type: context,
        onboarding_completed: true,
      });
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Card>
        <Card.Content>
          <Text variant="headlineMedium" style={{ textAlign: 'center', marginBottom: 24 }}>
            Olá, {profile?.full_name || 'Usuário'}! Vamos personalizar sua experiência.
          </Text>

          <Text variant="titleMedium" style={{ marginTop: 8 }}>Experiência com corrida</Text>
          <RadioButton.Group onValueChange={value => setExperience(value as Profile['experience_level'])} value={experience}>
            {experienceOptions.map(opt => (
              <RadioButton.Item key={opt} label={
                opt === 'beginner' ? 'Iniciante' :
                opt === 'intermediate' ? 'Intermediário' :
                'Avançado'
              } value={opt} />
            ))}
          </RadioButton.Group>

          <Text variant="titleMedium" style={{ marginTop: 16 }}>Principal objetivo</Text>
          <RadioButton.Group onValueChange={value => setGoal(value as Profile['main_goal'])} value={goal}>
            {goalOptions.map(opt => (
              <RadioButton.Item key={opt} label={
                opt === 'health' ? 'Saúde' :
                opt === 'performance' ? 'Performance' :
                opt === 'weight_loss' ? 'Perda de peso' :
                'Diversão'
              } value={opt} />
            ))}
          </RadioButton.Group>

          <Text variant="titleMedium" style={{ marginTop: 16 }}>Contexto de treino</Text>
          <RadioButton.Group onValueChange={value => setContext(value as Profile['context_type'])} value={context}>
            {contextOptions.map(opt => (
              <RadioButton.Item key={opt} label={
                opt === 'solo' ? 'Sozinho' :
                opt === 'coached' ? 'Orientado por treinador' :
                'Híbrido'
              } value={opt} />
            ))}
          </RadioButton.Group>

          {error && <Text style={{ color: 'red', marginTop: 8, textAlign: 'center' }}>{error}</Text>}

          <Button
            mode="contained"
            onPress={handleSaveProfile}
            loading={loading}
            disabled={loading}
            style={{ marginTop: 24 }}
            contentStyle={{ paddingVertical: 8 }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : 'Salvar e Continuar'}
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
} 