import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, RadioButton, Divider } from 'react-native-paper';

interface WeeklyReflectionModalProps {
  visible: boolean;
  onSave: (answers: WeeklyReflectionAnswers) => void;
  onCancel: () => void;
}

export interface WeeklyReflectionAnswers {
  enjoyment: number;
  progress: number;
  confidence: number;
}

export default function WeeklyReflectionModal({ visible, onSave, onCancel }: WeeklyReflectionModalProps) {
  const [enjoyment, setEnjoyment] = useState<number>(5);
  const [progress, setProgress] = useState<string>('Mais ou menos');
  const [confidence, setConfidence] = useState<string>('Média');

  const handleSave = () => {
    const progressMap: { [key: string]: number } = {
      'Sim, claramente': 3,
      'Mais ou menos': 2,
      'Não, senti-me estagnado(a)': 1,
    };
    const confidenceMap: { [key: string]: number } = {
      'Alta': 3,
      'Média': 2,
      'Baixa': 1,
    };
    onSave({
      enjoyment,
      progress: progressMap[progress],
      confidence: confidenceMap[confidence],
    });
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onCancel} contentContainerStyle={{ backgroundColor: 'white', padding: 16, margin: 10, borderRadius: 12, maxHeight: '90%', width: '95%', alignSelf: 'center' }}>
        <ScrollView>
          <Text variant="titleLarge" style={{ marginBottom: 16 }}>Reflexão Semanal</Text>

          {/* Pergunta 1 */}
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>1. Numa escala de 1 a 10, qual foi o seu nível de prazer/diversão com os seus treinos esta semana?</Text>
          <RadioButton.Group onValueChange={val => setEnjoyment(Number(val))} value={String(enjoyment)}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <RadioButton.Item key={num} label={String(num)} value={String(num)} style={{width: 60}} />
              ))}
            </View>
          </RadioButton.Group>

          <Divider style={{ marginVertical: 8 }} />

          {/* Pergunta 2 */}
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>2. Esta semana, você sentiu que progrediu em direção aos seus objetivos?</Text>
          <RadioButton.Group onValueChange={val => setProgress(val)} value={progress}>
            <RadioButton.Item label="Sim, claramente" value="Sim, claramente" />
            <RadioButton.Item label="Mais ou menos" value="Mais ou menos" />
            <RadioButton.Item label="Não, senti-me estagnado(a)" value="Não, senti-me estagnado(a)" />
          </RadioButton.Group>

          <Divider style={{ marginVertical: 8 }} />

          {/* Pergunta 3 */}
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>3. Como está a sua confiança para cumprir os treinos da próxima semana?</Text>
          <RadioButton.Group onValueChange={val => setConfidence(val)} value={confidence}>
            <RadioButton.Item label="Baixa" value="Baixa" />
            <RadioButton.Item label="Média" value="Média" />
            <RadioButton.Item label="Alta" value="Alta" />
          </RadioButton.Group>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
            <Button onPress={onCancel}>Cancelar</Button>
            <Button mode="contained" onPress={handleSave} style={{ marginLeft: 8 }}>Salvar</Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
} 