import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, Divider, RadioButton, Checkbox } from 'react-native-paper';
import type { TrainingSession } from '../../types/database'; // Importação do tipo correto

// --- Opções do formulário (mantidas do seu código original) ---
const sensacoesOpcoes = [
  'Senti-me forte',
  'Fadigado desde o início',
  'Tive altos e baixos',
  'Senti um leve desconforto',
  'Mentalmente disperso',
];
const condicoesOpcoes = [
  'Calor Intenso',
  'Frio/Chuva',
  'Vento Forte',
  'Treinei em Jejum',
  'Treinei Acompanhado',
];

// --- Interface de Props Corrigida ---
interface MarkTrainingDoneModalProps {
  visible: boolean;
  plannedData?: TrainingSession | null; // Usando o tipo forte e permitindo null
  onSave: (data: Partial<TrainingSession>) => void; // Callback também usa o tipo forte
  onCancel: () => void;
}

export default function MarkTrainingDoneModal({ visible, plannedData, onSave, onCancel }: MarkTrainingDoneModalProps) {
  // --- Estados do Componente ---
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [elevation, setElevation] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [effort, setEffort] = useState('5');
  const [satisfaction, setSatisfaction] = useState('3');
  const [sensacoes, setSensacoes] = useState<string[]>([]);
  const [condicoes, setCondicoes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Efeito para popular o formulário quando os dados planejados mudam
  useEffect(() => {
    if (plannedData) {
      setDistance(plannedData.distance_planned ? String(plannedData.distance_planned) : '');
      setDuration(plannedData.duration_planned ? String(plannedData.duration_planned) : '');
      setEffort(plannedData.effort_planned ? String(plannedData.effort_planned) : '5');
      setNotes(plannedData.notes || '');
    }
  }, [plannedData]);


  const toggleSelection = (option: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(prevList =>
      prevList.includes(option)
        ? prevList.filter(item => item !== option)
        : [...prevList, option]
    );
  };

  const handleSave = () => {
    const dataToSave: Partial<TrainingSession> = {
      // Campos do treino realizado
      status: 'completed',
      distance_completed: distance ? Number(distance) : null,
      duration_completed: duration ? Number(duration) : null,
      elevation_gain_completed: elevation ? Number(elevation) : null,
      avg_heart_rate_completed: avgHeartRate ? Number(avgHeartRate) : null,
      perceived_effort: effort ? Number(effort) : null,
      session_satisfaction: satisfaction ? Number(satisfaction) : null,
      session_sensations: sensacoes,
      session_conditions: condicoes,
      notes: notes,
    };
    onSave(dataToSave);
  };

  const containerStyle = { backgroundColor: 'white', margin: 20, borderRadius: 16, padding: 0 };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onCancel} contentContainerStyle={containerStyle}>
        {/* Usando ScrollView para um formulário direto e sem accordions */}
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text variant="titleLarge" style={{ marginBottom: 20 }}>
            Como foi o seu treino?
          </Text>

          {/* --- Seção de Métricas Objetivas --- */}
          <Text variant="titleMedium">Métricas Objetivas</Text>
          <TextInput label="Distância (km)" value={distance} onChangeText={setDistance} keyboardType="numeric" mode="outlined" dense style={{ marginTop: 8 }} />
          <TextInput label="Duração (min)" value={duration} onChangeText={setDuration} keyboardType="numeric" mode="outlined" dense style={{ marginTop: 8 }} />
          <TextInput label="Altimetria (m)" value={elevation} onChangeText={setElevation} keyboardType="numeric" mode="outlined" dense style={{ marginTop: 8 }} />
          <TextInput label="FC Média (bpm)" value={avgHeartRate} onChangeText={setAvgHeartRate} keyboardType="numeric" mode="outlined" dense style={{ marginTop: 8 }} />

          <Divider style={{ marginVertical: 20 }} />

          {/* --- Seção de Percepção de Esforço --- */}
          <Text variant="titleMedium">Percepção de Esforço (1-10)</Text>
          <RadioButton.Group onValueChange={setEffort} value={effort}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {Array.from({ length: 10 }, (_, i) => String(i + 1)).map(opt => <RadioButton.Item key={opt} label={opt} value={opt} />)}
            </View>
          </RadioButton.Group>

          <Divider style={{ marginVertical: 20 }} />

          {/* --- Seção de Satisfação --- */}
          <Text variant="titleMedium">Satisfação com o Treino (1-5)</Text>
          <RadioButton.Group onValueChange={setSatisfaction} value={satisfaction}>
             <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {Array.from({ length: 5 }, (_, i) => String(i + 1)).map(opt => <RadioButton.Item key={opt} label={opt} value={opt} />)}
            </View>
          </RadioButton.Group>

          <Divider style={{ marginVertical: 20 }} />

          {/* --- Seção de Sensações --- */}
          <Text variant="titleMedium">Sensação Geral</Text>
          {sensacoesOpcoes.map(option => (
            <Checkbox.Item
              key={option}
              label={option}
              status={sensacoes.includes(option) ? 'checked' : 'unchecked'}
              onPress={() => toggleSelection(option, sensacoes, setSensacoes)}
            />
          ))}

          <Divider style={{ marginVertical: 20 }} />

           {/* --- Seção de Condições do Treino --- */}
          <Text variant="titleMedium">Condições do Treino</Text>
           {condicoesOpcoes.map(option => (
            <Checkbox.Item
              key={option}
              label={option}
              status={condicoes.includes(option) ? 'checked' : 'unchecked'}
              onPress={() => toggleSelection(option, condicoes, setCondicoes)}
            />
          ))}

          <Divider style={{ marginVertical: 20 }} />

          {/* --- Seção de Notas Livres --- */}
          <Text variant="titleMedium">Notas Livres</Text>
          <TextInput label="Como você se sentiu? Algum detalhe importante?" value={notes} onChangeText={setNotes} multiline numberOfLines={4} mode="outlined" style={{ marginTop: 8 }}/>

          {/* --- Botões de Ação --- */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }}>
            <Button onPress={onCancel} style={{ flex: 1, marginRight: 8 }}>Cancelar</Button>
            <Button onPress={handleSave} mode="contained" style={{ flex: 2 }}>Salvar Treino</Button>
          </View>

        </ScrollView>
      </Modal>
    </Portal>
  );
}