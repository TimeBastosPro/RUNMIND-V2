import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Card, Text, TextInput, RadioButton, Button } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useCheckinStore } from '../../stores/checkin';

const trainingTypes = [
  { label: 'Regenerativo', value: 'regenerativo' },
  { label: 'Longo', value: 'longo' },
  { label: 'Rodagem', value: 'rodagem' },
  { label: 'Fartlek', value: 'fartlek' },
  { label: 'Tiro', value: 'tiro' },
  { label: 'Trail', value: 'trail' },
];

export default function LogTrainingScreen() {
  const [trainingDate, setTrainingDate] = useState('');
  const [title, setTitle] = useState('');
  const [trainingType, setTrainingType] = useState('regenerativo');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [elevation, setElevation] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [effort, setEffort] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const submitTrainingSession = useCheckinStore(s => s.submitTrainingSession);

  const handleSaveTraining = async () => {
    setIsSaving(true);
    try {
      const trainingData = {
        training_date: trainingDate,
        title,
        training_type: trainingType,
        distance_km: distance ? Number(distance) : null,
        duration_minutes: duration ? Number(duration) : null,
        elevation_gain_meters: elevation ? Number(elevation) : null,
        avg_heart_rate: avgHeartRate ? Number(avgHeartRate) : null,
        perceived_effort: effort,
        notes,
        source: 'manual',
      };
      await submitTrainingSession(trainingData);
      Alert.alert('Treino salvo com sucesso!');
      // Opcional: resetar campos ou navegar
    } catch (error: any) {
      Alert.alert('Erro ao salvar treino', error.message || String(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      {/* Seção 1: Detalhes do Treino */}
      <Card style={{ marginBottom: 24 }}>
        <Card.Title title="Detalhes do Treino" />
        <Card.Content>
          <TextInput
            label="Data do Treino"
            value={trainingDate}
            onChangeText={setTrainingDate}
            placeholder="AAAA-MM-DD"
            style={{ marginBottom: 12 }}
            mode="outlined"
          />
          <TextInput
            label="Título do Treino"
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Corrida na chuva"
            style={{ marginBottom: 12 }}
            mode="outlined"
          />
          <Text style={{ marginBottom: 4 }}>Tipo de Treino</Text>
          <RadioButton.Group
            onValueChange={setTrainingType}
            value={trainingType}
          >
            {trainingTypes.map(opt => (
              <RadioButton.Item key={opt.value} label={opt.label} value={opt.value} />
            ))}
          </RadioButton.Group>
        </Card.Content>
      </Card>
      {/* Seção 2: Métricas do Treino */}
      <Card style={{ marginBottom: 24 }}>
        <Card.Title title="Métricas do Treino" />
        <Card.Content>
          <TextInput
            label="Distância (km)"
            value={distance}
            onChangeText={setDistance}
            keyboardType="numeric"
            style={{ marginBottom: 12 }}
            mode="outlined"
          />
          <TextInput
            label="Duração (minutos)"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            style={{ marginBottom: 12 }}
            mode="outlined"
          />
          <TextInput
            label="Altimetria (metros)"
            value={elevation}
            onChangeText={setElevation}
            keyboardType="numeric"
            style={{ marginBottom: 12 }}
            mode="outlined"
          />
          <TextInput
            label="Frequência Cardíaca Média"
            value={avgHeartRate}
            onChangeText={setAvgHeartRate}
            keyboardType="numeric"
            style={{ marginBottom: 12 }}
            mode="outlined"
          />
        </Card.Content>
      </Card>
      {/* Seção 3: Feedback e Sensações */}
      <Card style={{ marginBottom: 24 }}>
        <Card.Title title="Feedback e Sensações" />
        <Card.Content>
          <Text style={{ marginBottom: 8 }}>Percepção de Esforço</Text>
          <Slider
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={effort}
            onValueChange={setEffort}
            style={{ width: '100%', marginBottom: 8 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text>Muito Leve</Text>
            <Text>Esforço Máximo</Text>
          </View>
          <TextInput
            label="Notas sobre o treino"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={{ marginBottom: 12 }}
            mode="outlined"
          />
        </Card.Content>
      </Card>
      <Button
        mode="contained"
        onPress={handleSaveTraining}
        style={{ marginBottom: 32 }}
        loading={isSaving}
        disabled={isSaving}
      >
        Salvar Treino
      </Button>
    </ScrollView>
  );
} 