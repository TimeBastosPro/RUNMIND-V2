import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Modal, Card, Text, TextInput, Button, Checkbox, RadioButton, Portal, Divider, List } from 'react-native-paper';

interface MarkTrainingDoneModalProps {
  visible: boolean;
  plannedData?: {
    distance_km?: number;
    duration_minutes?: number;
    elevation_gain_meters?: number;
    avg_heart_rate?: number;
    perceived_effort?: number;
    session_satisfaction?: number;
    notes?: string;
  };
  onSave: (data: any) => void;
  onCancel: () => void;
}

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
const alimentacaoOpcoes = [
  'Apenas bebida',
  'Apenas comida',
  'Bebida + comida',
  'Jejum',
];
const hidratacaoOpcoes = [
  'Pré',
  'Durante',
  'Pós',
];
const esforcoOpcoes = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
const satisfacaoOpcoes = Array.from({ length: 5 }, (_, i) => (i + 1).toString());

export default function MarkTrainingDoneModal({ visible, plannedData, onSave, onCancel }: MarkTrainingDoneModalProps) {
  // Objetivos
  const [distance, setDistance] = useState(plannedData?.distance_km ? String(plannedData.distance_km) : '');
  const [duration, setDuration] = useState(plannedData?.duration_minutes ? String(plannedData.duration_minutes) : '');
  const [elevation, setElevation] = useState(plannedData?.elevation_gain_meters ? String(plannedData.elevation_gain_meters) : '');
  const [avgHeartRate, setAvgHeartRate] = useState(plannedData?.avg_heart_rate ? String(plannedData.avg_heart_rate) : '');
  // Subjetivos
  const [effort, setEffort] = useState((plannedData?.perceived_effort || 5).toString());
  const [satisfaction, setSatisfaction] = useState((plannedData?.session_satisfaction || 3).toString());
  const [sensacoes, setSensacoes] = useState<string[]>([]);
  const [condicoes, setCondicoes] = useState<string[]>([]);
  const [alimentacao, setAlimentacao] = useState('Apenas bebida');
  const [hidratacao, setHidratacao] = useState('Pré');
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState<string | null>('objetivas');
  const handleAccordion = (panel: string) => setExpanded(expanded === panel ? null : panel);

  const toggleSensacao = (opcao: string) => {
    setSensacoes(sensacoes.includes(opcao)
      ? sensacoes.filter(s => s !== opcao)
      : [...sensacoes, opcao]);
  };
  const toggleCondicao = (opcao: string) => {
    setCondicoes(condicoes.includes(opcao)
      ? condicoes.filter(c => c !== opcao)
      : [...condicoes, opcao]);
  };

  const handleSave = () => {
    onSave({
      distance_km: distance !== '' ? Number(distance) : null,
      duration_minutes: duration !== '' ? Number(duration) : null,
      elevation_gain_meters: elevation !== '' ? Number(elevation) : null,
      avg_heart_rate: avgHeartRate !== '' ? Number(avgHeartRate) : null,
      perceived_effort: Number(effort),
      session_satisfaction: Number(satisfaction),
      sensacoes,
      condicoes,
      alimentacao,
      hidratacao,
      notes,
    });
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onCancel} contentContainerStyle={{ margin: 0, backgroundColor: '#f8f6fa' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Card style={{ width: '95%', maxWidth: 420, borderRadius: 16, elevation: 4, padding: 0, maxHeight: 620, backgroundColor: '#fff' }}>
            <Card.Title title="Marcar Treino Realizado" titleStyle={{ fontSize: 18, fontWeight: 'bold' }} style={{ paddingBottom: 0, paddingTop: 12 }} />
            <Divider style={{ height: 1, backgroundColor: '#e0e0e0' }} />
            <Card.Content style={{ paddingTop: 0, paddingBottom: 0 }}>
              <ScrollView style={{ maxHeight: 500, paddingHorizontal: 4 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
                <List.Section>
                  <List.Accordion
                    title="Métricas Objetivas"
                    expanded={expanded === 'objetivas'}
                    onPress={() => handleAccordion('objetivas')}
                  >
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <TextInput
                        label="Distância (km)"
                        value={distance}
                        onChangeText={setDistance}
                        keyboardType="numeric"
                        style={{ flex: 1, marginRight: 4, height: 44, fontSize: 14 }}
                        mode="outlined"
                        dense
                      />
                      <TextInput
                        label="Duração (min)"
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="numeric"
                        style={{ flex: 1, marginLeft: 4, height: 44, fontSize: 14 }}
                        mode="outlined"
                        dense
                      />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <TextInput
                        label="Altimetria (m)"
                        value={elevation}
                        onChangeText={setElevation}
                        keyboardType="numeric"
                        style={{ flex: 1, marginRight: 4, height: 44, fontSize: 14 }}
                        mode="outlined"
                        dense
                      />
                      <TextInput
                        label="FC Média"
                        value={avgHeartRate}
                        onChangeText={setAvgHeartRate}
                        keyboardType="numeric"
                        style={{ flex: 1, marginLeft: 4, height: 44, fontSize: 14 }}
                        mode="outlined"
                        dense
                      />
                    </View>
                  </List.Accordion>
                  <List.Accordion
                    title="Percepção de Esforço"
                    expanded={expanded === 'esforco'}
                    onPress={() => handleAccordion('esforco')}
                  >
                    <RadioButton.Group onValueChange={setEffort} value={effort}>
                      {esforcoOpcoes.map(opt => (
                        <RadioButton.Item key={opt} label={opt} value={opt} labelStyle={{ fontSize: 13 }} style={{ paddingVertical: 0, marginVertical: 0 }} />
                      ))}
                    </RadioButton.Group>
                  </List.Accordion>
                  <List.Accordion
                    title="Satisfação com o Treino"
                    expanded={expanded === 'satisfacao'}
                    onPress={() => handleAccordion('satisfacao')}
                  >
                    <RadioButton.Group onValueChange={setSatisfaction} value={satisfaction}>
                      {satisfacaoOpcoes.map(opt => (
                        <RadioButton.Item key={opt} label={opt} value={opt} labelStyle={{ fontSize: 13 }} style={{ paddingVertical: 0, marginVertical: 0 }} />
                      ))}
                    </RadioButton.Group>
                  </List.Accordion>
                  <List.Accordion
                    title="Sensação Geral"
                    expanded={expanded === 'sensacao'}
                    onPress={() => handleAccordion('sensacao')}
                  >
                    <View style={{ marginBottom: 8 }}>
                      {sensacoesOpcoes.map(opcao => (
                        <Checkbox.Item
                          key={opcao}
                          label={opcao}
                          status={sensacoes.includes(opcao) ? 'checked' : 'unchecked'}
                          onPress={() => toggleSensacao(opcao)}
                          style={{ paddingVertical: 0, marginVertical: 0 }}
                          labelStyle={{ fontSize: 13 }}
                        />
                      ))}
                    </View>
                  </List.Accordion>
                  <List.Accordion
                    title="Nível de Alimentação"
                    expanded={expanded === 'alimentacao'}
                    onPress={() => handleAccordion('alimentacao')}
                  >
                    <RadioButton.Group onValueChange={setAlimentacao} value={alimentacao}>
                      {alimentacaoOpcoes.map(opt => (
                        <RadioButton.Item key={opt} label={opt} value={opt} labelStyle={{ fontSize: 13 }} style={{ paddingVertical: 0, marginVertical: 0 }} />
                      ))}
                    </RadioButton.Group>
                  </List.Accordion>
                  <List.Accordion
                    title="Nível de Hidratação"
                    expanded={expanded === 'hidratacao'}
                    onPress={() => handleAccordion('hidratacao')}
                  >
                    <RadioButton.Group onValueChange={setHidratacao} value={hidratacao}>
                      {hidratacaoOpcoes.map(opt => (
                        <RadioButton.Item key={opt} label={opt} value={opt} labelStyle={{ fontSize: 13 }} style={{ paddingVertical: 0, marginVertical: 0 }} />
                      ))}
                    </RadioButton.Group>
                  </List.Accordion>
                  <List.Accordion
                    title="Condições do Treino"
                    expanded={expanded === 'condicoes'}
                    onPress={() => handleAccordion('condicoes')}
                  >
                    <View style={{ marginBottom: 8 }}>
                      {condicoesOpcoes.map(opcao => (
                        <Checkbox.Item
                          key={opcao}
                          label={opcao}
                          status={condicoes.includes(opcao) ? 'checked' : 'unchecked'}
                          onPress={() => toggleCondicao(opcao)}
                          style={{ paddingVertical: 0, marginVertical: 0 }}
                          labelStyle={{ fontSize: 13 }}
                        />
                      ))}
                    </View>
                  </List.Accordion>
                  <List.Accordion
                    title="Notas Livres"
                    expanded={expanded === 'notas'}
                    onPress={() => handleAccordion('notas')}
                  >
                    <TextInput
                      label="Notas Livres"
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                      style={{ marginBottom: 12, marginTop: 8, fontSize: 13, minHeight: 48 }}
                      mode="outlined"
                      dense
                    />
                  </List.Accordion>
                </List.Section>
              </ScrollView>
            </Card.Content>
            <Card.Actions style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 0, paddingHorizontal: 8, paddingBottom: 12 }}>
              <Button mode="text" onPress={onCancel} style={{ flex: 1, marginRight: 8, borderRadius: 8, height: 44 }} labelStyle={{ fontSize: 15 }}>
                Cancelar
              </Button>
              <Button mode="contained" onPress={handleSave} style={{ flex: 2, borderRadius: 8, height: 44, backgroundColor: '#1976d2' }} labelStyle={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>
                Salvar Treino Realizado
              </Button>
            </Card.Actions>
          </Card>
        </View>
      </Modal>
    </Portal>
  );
} 