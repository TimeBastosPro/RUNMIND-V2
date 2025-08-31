import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, Divider, RadioButton, Checkbox } from 'react-native-paper';
import type { TrainingSession } from '../../types/database'; // Importação do tipo correto
import { useCheckinStore } from '../../stores/checkin';

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
  console.log('MarkTrainingDoneModal - plannedData:', plannedData);
  console.log('MarkTrainingDoneModal - plannedData.id:', plannedData?.id);
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
  const { deleteTrainingSession, fetchTrainingSessions } = useCheckinStore();

  useEffect(() => {
    console.log('🔍 MarkTrainingDoneModal - useEffect triggered');
    console.log('🔍 plannedData:', plannedData);
    
    if (plannedData) {
      console.log('🔍 Carregando dados no modal:', {
        distance_km: plannedData.distance_km,
        distance_m: plannedData.distance_m,
        duracao_horas: plannedData.duracao_horas,
        duracao_minutos: plannedData.duracao_minutos,
        intensidade: plannedData.intensidade,
        avg_heart_rate: plannedData.avg_heart_rate,
        observacoes: plannedData.observacoes
      });
      
      setDistanceKm(plannedData.distance_km ? String(plannedData.distance_km) : '');
      setDistanceM(plannedData.distance_m ? String(plannedData.distance_m) : '');
      setDurationH(plannedData.duracao_horas ? String(plannedData.duracao_horas) : '0');
      setDurationM(plannedData.duracao_minutos ? String(plannedData.duracao_minutos) : '0');
      setEffort(plannedData.intensidade ? String(plannedData.intensidade) : '5');
      setAvgHeartRate(plannedData.avg_heart_rate ? String(plannedData.avg_heart_rate) : '');
      setNotes(plannedData.observacoes || '');
      
      console.log('✅ Dados carregados no modal com sucesso');
    } else {
      console.log('❌ Nenhum plannedData fornecido ao modal');
    }
  }, [plannedData]);

  const handleSave = () => {
    console.log('🔍 MarkTrainingDoneModal - handleSave iniciado');
    console.log('🔍 Dados do formulário:', {
      distanceKm,
      durationM,
      effort,
      satisfaction,
      sensacoes,
      clima,
      notes
    });
    
    const dataToSave: Partial<TrainingSession> = {
      status: 'completed',
      distance_km: distanceKm ? Number(distanceKm) : undefined,
      distance_m: distanceM || undefined,
      duracao_horas: durationH || undefined,
      duracao_minutos: durationM || undefined,
      elevation_gain_meters: elevPos ? Number(elevPos) : undefined,
      avg_heart_rate: avgHeartRate ? Number(avgHeartRate) : undefined,
      perceived_effort: effort ? Number(effort) : undefined,
      session_satisfaction: satisfaction ? Number(satisfaction) : undefined,
      observacoes: notes,
    };
    
    console.log('🔍 Dados para salvar:', dataToSave);
    console.log('🔍 Chamando onSave...');
    
    try {
      onSave(dataToSave);
      console.log('✅ onSave chamado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao chamar onSave:', error);
    }
  };

  const handleDelete = async () => {
    console.log('handleDelete chamado!');
    console.log('plannedData:', plannedData);
    console.log('plannedData.id:', plannedData?.id);
    
    if (!plannedData || !plannedData.id) {
      console.error('Não é possível excluir: treino sem ID válido');
      // ✅ CORREÇÃO: Usar Alert.alert em vez de alert
      Alert.alert('Erro', 'Treino sem ID válido para exclusão');
      return;
    }
    
    // Confirmar exclusão com o usuário
    // ✅ CORREÇÃO: Usar Alert.alert em vez de confirm (React Native)
    const confirmed = await new Promise((resolve) => {
      // Para web, usar confirm
      if (typeof window !== 'undefined' && window.confirm) {
        resolve(window.confirm('Tem certeza que deseja excluir este treino?'));
      } else {
        // Para React Native, usar Alert
        Alert.alert(
          'Confirmar exclusão',
          'Tem certeza que deseja excluir este treino?',
          [
            { text: 'Cancelar', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Excluir', onPress: () => resolve(true), style: 'destructive' }
          ]
        );
      }
    });
    
    if (!confirmed) {
      console.log('❌ Exclusão cancelada pelo usuário');
      return;
    }
    
    try {
      console.log('Excluindo treino com ID:', plannedData.id);
      const result = await deleteTrainingSession(plannedData.id);
      console.log('Resultado da exclusão:', result);
      
      if (result) {
        console.log('Recarregando dados...');
        await fetchTrainingSessions();
        onCancel();
        // ✅ CORREÇÃO: Usar Alert.alert em vez de alert
        Alert.alert('Sucesso', 'Treino excluído com sucesso!');
      } else {
        Alert.alert('Erro', 'Falha ao excluir treino');
      }
    } catch (error) {
      console.error('Erro ao excluir treino:', error);
      Alert.alert('Erro', 'Erro ao excluir treino: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Padronização visual: mesmo container do modal planejado
  const containerStyle = {
    width: '90%' as `${number}%`,
    alignSelf: 'center' as 'center',
    marginVertical: 20,
    borderRadius: 12,
    padding: 20,
    backgroundColor: 'white',
    maxWidth: 600,
    maxHeight: '90%' as `${number}%`,
  };

  // Padronização de título, espaçamento e botões
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onCancel} contentContainerStyle={containerStyle}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text variant="titleLarge" style={{ marginBottom: 10, textAlign: 'left', fontWeight: 'bold' }}>
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
            <View style={{ flexDirection: 'row', flexWrap: 'nowrap', marginBottom: 12, justifyContent: 'space-between', alignItems: 'center' }}>
              {[1,2,3,4,5,6,7,8,9,10].map(opt => (
                <View key={opt} style={{flexDirection: 'row', alignItems: 'center', marginRight: 2}}>
                  <RadioButton value={String(opt)} />
                  <Text style={{fontSize: 12, marginRight: 2}}>{opt}</Text>
                </View>
              ))}
            </View>
          </RadioButton.Group>

          {/* Satisfação */}
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Satisfação com o Treino</Text>
          <RadioButton.Group onValueChange={setSatisfaction} value={satisfaction}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {[1,2,3,4,5].map(opt => (
                <View key={opt} style={{flexDirection: 'row', alignItems: 'center', marginRight: 8, marginBottom: 4}}>
                  <RadioButton value={String(opt)} />
                  <Text style={{marginRight: 4}}>{opt}</Text>
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

          {/* Botões padronizados */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
            <Button onPress={onCancel}>Cancelar</Button>
            <Button mode="contained" onPress={handleSave} style={{ marginLeft: 8 }}>
              Salvar Alterações
            </Button>
            {(() => {
              console.log('Renderizando botão excluir - plannedData:', plannedData);
              console.log('Renderizando botão excluir - plannedData.id:', plannedData?.id);
              return plannedData && plannedData.id;
            })() && (
              <Button 
                onPress={() => {
                  console.log('Botão Excluir clicado!');
                  handleDelete();
                }} 
                textColor="red" 
                style={{ marginLeft: 8 }}
                mode="outlined"
              >
                Excluir Treino
              </Button>
            )}
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}