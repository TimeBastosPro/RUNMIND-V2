import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, Divider, RadioButton, Checkbox } from 'react-native-paper';
import type { TrainingSession } from '../../types/database'; // Importação do tipo correto

// --- Opções do formulário ---
const sensacoesOpcoes = [
  'Senti-me Forte / Com Energia',
  'Mentalmente Focado(a)',
  'Senti-me Fadigado(a) / Desgastado(a)',
  'Senti Dores ou Desconforto',
  'Mentalmente Disperso(a)',
];
const climaOpcoes = [
  'Agradável',
  'Calor',
  'Frio',
  'Chuva',
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
  const [distanceKm, setDistanceKm] = useState('');
  const [distanceM, setDistanceM] = useState('');
  const [durationH, setDurationH] = useState('0');
  const [durationM, setDurationM] = useState('0');
  const [elevPos, setElevPos] = useState('');
  const [elevNeg, setElevNeg] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [effort, setEffort] = useState('5');
  const [satisfaction, setSatisfaction] = useState('3');
  const [sensacoes, setSensacoes] = useState<string[]>([]);
  const [clima, setClima] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (plannedData) {
      setDistanceKm(plannedData.distance_km ? String(plannedData.distance_km) : '');
      setDistanceM(plannedData.distancia_m ? String(plannedData.distancia_m) : '');
      setDurationH(plannedData.duracao_horas ? String(plannedData.duracao_horas) : '0');
      setDurationM(plannedData.duracao_minutos ? String(plannedData.duracao_minutos) : '0');
      setEffort(plannedData.intensidade ? String(plannedData.intensidade) : '5');
      setAvgHeartRate(plannedData.avg_heart_rate ? String(plannedData.avg_heart_rate) : '');
      setNotes(plannedData.observacoes || '');
    }
  }, [plannedData]);

  const handleSave = () => {
    const dataToSave: Partial<TrainingSession> = {
      status: 'completed',
      distance_km: distanceKm ? Number(distanceKm) : undefined,
      distancia_m: distanceM || undefined,
      duracao_horas: durationH || undefined,
      duracao_minutos: durationM || undefined,
      elevation_gain_meters: elevPos ? Number(elevPos) : undefined,
      avg_heart_rate: avgHeartRate ? Number(avgHeartRate) : undefined,
      perceived_effort: effort ? Number(effort) : undefined,
      session_satisfaction: satisfaction ? Number(satisfaction) : undefined,
      observacoes: notes,
    };
    onSave(dataToSave);
  };

  const containerStyle = {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: 600,
    maxWidth: 700
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onCancel} contentContainerStyle={containerStyle}>
        <ScrollView>
          <Text variant="titleLarge" style={{ marginBottom: 10 }}>
            Editar Treino Realizado
          </Text>

          {/* Duração / Distância */}
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Duração / Distância</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
            <TextInput label="Distância (km)" value={distanceKm} onChangeText={setDistanceKm} keyboardType="numeric" style={{flex: 1, marginRight: 8}} mode="outlined" dense />
            <TextInput label="Metros" value={distanceM} onChangeText={setDistanceM} keyboardType="numeric" style={{flex: 1, marginRight: 8}} mode="outlined" dense />
            <TextInput label="Horas" value={durationH} onChangeText={setDurationH} keyboardType="numeric" style={{flex: 1, marginRight: 8}} mode="outlined" dense />
            <TextInput label="Minutos" value={durationM} onChangeText={setDurationM} keyboardType="numeric" style={{flex: 1}} mode="outlined" dense />
          </View>

          {/* Altimetria */}
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Altimetria</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
            <TextInput label="Positiva (m)" value={elevPos} onChangeText={setElevPos} keyboardType="numeric" style={{flex: 1, marginRight: 8}} mode="outlined" dense />
            <TextInput label="Negativa (m)" value={elevNeg} onChangeText={setElevNeg} keyboardType="numeric" style={{flex: 1}} mode="outlined" dense />
          </View>

          {/* FC Média */}
          <TextInput label="FC Média (bpm)" value={avgHeartRate} onChangeText={setAvgHeartRate} keyboardType="numeric" mode="outlined" dense style={{ marginBottom: 12 }} />

          {/* PSE */}
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Percepção de Esforço (PSE)</Text>
          <RadioButton.Group onValueChange={setEffort} value={effort}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {[1,2,3,4,5,6,7,8,9,10].map(opt => (
                <View key={opt} style={{flex:1}}>
                  <RadioButton.Item label={String(opt)} value={String(opt)} style={{margin:0, padding:0}} />
                </View>
              ))}
            </View>
          </RadioButton.Group>

          {/* Satisfação */}
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Satisfação com o Treino</Text>
          <RadioButton.Group onValueChange={setSatisfaction} value={satisfaction}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {[1,2,3,4,5].map(opt => (
                <View key={opt} style={{flex:1}}>
                  <RadioButton.Item label={String(opt)} value={String(opt)} style={{margin:0, padding:0}} />
                </View>
              ))}
            </View>
          </RadioButton.Group>

          {/* Sensação Geral */}
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Sensação Geral</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, gap: 0, justifyContent: 'space-between' }}>
            {sensacoesOpcoes.map((option, idx) => (
              <View key={option} style={{minWidth: 300, flex: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                <RadioButton.Item
                  label={option}
                  value={option}
                  status={sensacoes.includes(option) ? 'checked' : 'unchecked'}
                  onPress={() => setSensacoes(prev => prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option])}
                  mode="android"
                  position="leading"
                  style={{margin:0, padding:0}}
                />
              </View>
            ))}
          </View>

          {/* Clima */}
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Clima</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, gap: 0, justifyContent: 'space-between' }}>
            {climaOpcoes.map((option, idx) => (
              <View key={option} style={{minWidth: 300, flex: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                <RadioButton.Item
                  label={option}
                  value={option}
                  status={clima.includes(option) ? 'checked' : 'unchecked'}
                  onPress={() => setClima(prev => prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option])}
                  mode="android"
                  position="leading"
                  style={{margin:0, padding:0}}
                />
              </View>
            ))}
          </View>

          {/* Observações */}
          <TextInput label="Observações" value={notes} onChangeText={setNotes} multiline numberOfLines={3} mode="outlined" style={{marginBottom: 12}}/>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
            <Button onPress={onCancel}>Cancelar</Button>
            <Button mode="contained" onPress={handleSave} style={{ marginLeft: 8 }}>
              Salvar Treino
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}