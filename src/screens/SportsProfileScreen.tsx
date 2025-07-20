import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, TextInput, Modal, Portal, Text, SegmentedButtons } from 'react-native-paper';
import { useAuthStore } from '../stores/auth';
import { 
  calculateIMC, 
  calculateVO2maxFromRaceTime, 
  calculateVAM, 
  calculateTrainingZones,
  calculateVo2maxFromCooper,
  calculateVo2maxFrom3km,
  calculateVo2maxFromRockport,
  calculateVo2maxFromRace,
  calculateVamFromVo2max,
  calculateKarvonenZones,
  TrainingZone
} from '../utils/sportsCalculations';

interface TestProtocol {
  name: string;
  label: string;
  fields: string[];
}

const TEST_PROTOCOLS: TestProtocol[] = [
  { name: 'cooper', label: 'Teste de Cooper (12 min)', fields: ['distance'] },
  { name: '3km', label: 'Teste de 3km', fields: ['time'] },
  { name: 'rockport', label: 'Teste de Caminhada (Rockport)', fields: ['time', 'heartRate'] },
  { name: 'race', label: 'Resultado de Prova', fields: ['distance', 'time'] }
];

export default function SportsProfileScreen() {
  const { profile, loadProfile, fitnessTests, fetchFitnessTests, saveFitnessTest } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<string>('');
  const [testData, setTestData] = useState({
    distance: '',
    time: '',
    heartRate: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
    fetchFitnessTests();
  }, [loadProfile, fetchFitnessTests]);

  const handleSaveTest = async () => {
    if (!selectedProtocol || !profile) return;

    setLoading(true);
    try {
      let vo2max = 0;
      const currentDate = new Date().toISOString().split('T')[0];

      switch (selectedProtocol) {
        case 'cooper':
          if (!testData.distance) throw new Error('Distância é obrigatória');
          vo2max = calculateVo2maxFromCooper(Number(testData.distance));
          break;

        case '3km':
          if (!testData.time) throw new Error('Tempo é obrigatório');
          vo2max = calculateVo2maxFrom3km(parseTimeToSeconds(testData.time));
          break;

                 case 'rockport':
           if (!testData.time || !testData.heartRate || !profile.weight_kg || !profile.date_of_birth || !profile.gender) {
             throw new Error('Todos os campos são obrigatórios para o teste Rockport');
           }
           const age = profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : 0;
           vo2max = calculateVo2maxFromRockport(
             profile.weight_kg,
             age,
             profile.gender,
             parseTimeToSeconds(testData.time),
             Number(testData.heartRate)
           );
           break;

        case 'race':
          if (!testData.distance || !testData.time) throw new Error('Distância e tempo são obrigatórios');
          vo2max = calculateVo2maxFromRace(Number(testData.distance), parseTimeToSeconds(testData.time));
          break;

        default:
          throw new Error('Protocolo inválido');
      }

      const vam = calculateVamFromVo2max(vo2max);

      await saveFitnessTest({
        protocol_name: TEST_PROTOCOLS.find(p => p.name === selectedProtocol)?.label || selectedProtocol,
        test_date: currentDate,
        distance_meters: testData.distance ? Number(testData.distance) : undefined,
        time_seconds: testData.time ? parseTimeToSeconds(testData.time) : undefined,
        final_heart_rate: testData.heartRate ? Number(testData.heartRate) : undefined,
        calculated_vo2max: vo2max,
        calculated_vam: vam
      });

      // Atualizar perfil com novos valores
      await loadProfile();
      
      Alert.alert('Sucesso', 'Teste registrado com sucesso!');
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao salvar teste');
    } finally {
      setLoading(false);
    }
  };

  const parseTimeToSeconds = (timeString: string): number => {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return Number(timeString);
  };

  const resetForm = () => {
    setSelectedProtocol('');
    setTestData({ distance: '', time: '', heartRate: '' });
  };

  const renderProtocolFields = () => {
    const protocol = TEST_PROTOCOLS.find(p => p.name === selectedProtocol);
    if (!protocol) return null;

    return (
      <View style={styles.fieldsContainer}>
        {protocol.fields.includes('distance') && (
          <TextInput
            label="Distância (metros)"
            value={testData.distance}
            onChangeText={(text) => setTestData(prev => ({ ...prev, distance: text }))}
            keyboardType="numeric"
            style={styles.input}
          />
        )}
        
        {protocol.fields.includes('time') && (
          <TextInput
            label="Tempo (HH:MM:SS)"
            value={testData.time}
            onChangeText={(text) => setTestData(prev => ({ ...prev, time: text }))}
            placeholder="00:15:30"
            style={styles.input}
          />
        )}
        
        {protocol.fields.includes('heartRate') && (
          <TextInput
            label="Frequência Cardíaca Final"
            value={testData.heartRate}
            onChangeText={(text) => setTestData(prev => ({ ...prev, heartRate: text }))}
            keyboardType="numeric"
            style={styles.input}
          />
        )}
      </View>
    );
  };

  const imc = profile?.weight_kg && profile?.height_cm ? calculateIMC(profile.weight_kg, profile.height_cm) : 0;
  const vo2max = 0; // Será calculado a partir dos testes
  const vam = 0; // Será calculado a partir dos testes
  const trainingZones = profile?.max_heart_rate && profile?.resting_heart_rate 
    ? calculateKarvonenZones(profile.max_heart_rate, profile.resting_heart_rate)
    : [];

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Dados Fisiológicos</Title>
                     <View style={styles.row}>
             <TextInput
               label="Altura (cm)"
               value={profile?.height_cm?.toString() || ''}
               keyboardType="numeric"
               style={styles.halfInput}
             />
             <TextInput
               label="Peso (kg)"
               value={profile?.weight_kg?.toString() || ''}
               keyboardType="numeric"
               style={styles.halfInput}
             />
           </View>
           <View style={styles.row}>
             <TextInput
               label="Data de Nascimento"
               value={profile?.date_of_birth || ''}
               style={styles.halfInput}
             />
             <TextInput
               label="Gênero"
               value={profile?.gender || ''}
               style={styles.halfInput}
             />
           </View>
          <View style={styles.row}>
            <TextInput
              label="FC Máxima"
              value={profile?.max_heart_rate?.toString() || ''}
              keyboardType="numeric"
              style={styles.halfInput}
            />
            <TextInput
              label="FC Repouso"
              value={profile?.resting_heart_rate?.toString() || ''}
              keyboardType="numeric"
              style={styles.halfInput}
            />
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Resultados Calculados</Title>
          <View style={styles.resultsContainer}>
                         <View style={styles.resultItem}>
               <Text style={styles.resultLabel}>IMC:</Text>
               <Text style={styles.resultValue}>{imc ? imc.toFixed(1) : '--'}</Text>
             </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>VO2max:</Text>
              <Text style={styles.resultValue}>{vo2max.toFixed(1)} ml/kg/min</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>VAM:</Text>
              <Text style={styles.resultValue}>{vam.toFixed(1)} km/h</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Zonas de Treino (Karvonen)</Title>
          {trainingZones.map((zone) => (
            <View key={zone.zone} style={styles.zoneItem}>
              <Text style={styles.zoneText}>
                Zona {zone.zone} ({zone.description}): {zone.minHeartRate}-{zone.maxHeartRate} bpm
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Testes de Performance</Title>
          <Button 
            mode="contained" 
            onPress={() => setModalVisible(true)}
            style={styles.button}
          >
            Registrar Novo Teste
          </Button>
          
          {fitnessTests.map((test) => (
            <View key={test.id} style={styles.testItem}>
              <Text style={styles.testTitle}>{test.protocol_name}</Text>
              <Text style={styles.testDate}>{new Date(test.test_date).toLocaleDateString('pt-BR')}</Text>
              <Text style={styles.testResult}>VO2max: {test.calculated_vo2max.toFixed(1)} ml/kg/min</Text>
              <Text style={styles.testResult}>VAM: {test.calculated_vam.toFixed(1)} km/h</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>Registrar Novo Teste</Title>
          
          <Text style={styles.modalLabel}>Protocolo do Teste:</Text>
          <SegmentedButtons
            value={selectedProtocol}
            onValueChange={setSelectedProtocol}
            buttons={TEST_PROTOCOLS.map(protocol => ({
              value: protocol.name,
              label: protocol.label,
            }))}
            style={styles.segmentedButtons}
          />

          {selectedProtocol && renderProtocolFields()}

          <View style={styles.modalButtons}>
            <Button 
              mode="outlined" 
              onPress={() => {
                setModalVisible(false);
                resetForm();
              }}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveTest}
              loading={loading}
              disabled={!selectedProtocol || loading}
              style={styles.modalButton}
            >
              Calcular e Salvar
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  halfInput: {
    flex: 0.48,
  },
  resultsContainer: {
    marginTop: 8,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultLabel: {
    fontWeight: 'bold',
  },
  resultValue: {
    color: '#2196F3',
  },
  zoneItem: {
    marginBottom: 4,
  },
  zoneText: {
    fontSize: 14,
  },
  button: {
    marginTop: 8,
  },
  testItem: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  testTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  testDate: {
    color: '#666',
    fontSize: 12,
  },
  testResult: {
    marginTop: 4,
    color: '#2196F3',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  fieldsContainer: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.48,
  },
}); 