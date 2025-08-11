import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, TextInput, Modal, Portal, Text, SegmentedButtons, IconButton, Chip, DataTable } from 'react-native-paper';
import { useAuthStore } from '../stores/auth';
import { useViewStore } from '../stores/view';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { Race } from '../types/database';
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
  calculatePaceZones,
  calculateMaxHeartRateTanaka,
  formatPace,
  TrainingZone,
  PaceZone
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
  const { 
    profile, 
    loadProfile, 
    fitnessTests, 
    races,
    fetchFitnessTests, 
    fetchRaces,
    saveFitnessTest, 
    updateFitnessTest, 
    deleteFitnessTest, 
    saveRace,
    updateRace,
    deleteRace,
    updateProfile 
  } = useAuthStore();
  const navigation = useNavigation();
  const { isCoachView, viewAsAthleteId, exitCoachView, athleteName: athleteNameFromStore } = useViewStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<string>('');
  const [testData, setTestData] = useState({
    distance: '',
    time: '',
    heartRate: ''
  });
  const [loading, setLoading] = useState(false);
  const [referenceTest, setReferenceTest] = useState<any>(null);
  const [profileData, setProfileData] = useState({
    height_cm: '',
    weight_kg: '',
    date_of_birth: '',
    gender: '',
    max_heart_rate: '',
    resting_heart_rate: ''
  });
  const [coachFitnessTests, setCoachFitnessTests] = useState<any[]>([]);
  const [coachRaces, setCoachRaces] = useState<any[]>([]);
  const [autoCalculatedMaxHR, setAutoCalculatedMaxHR] = useState(false);
  const [raceModalVisible, setRaceModalVisible] = useState(false);
  const [editingRace, setEditingRace] = useState<Race | null>(null);
  const [raceData, setRaceData] = useState({
    event_name: '',
    city: '',
    start_date: '',
    start_time: '',
    distance_km: ''
  });
  const [athleteName, setAthleteName] = useState<string | null>(athleteNameFromStore || null);

  useEffect(() => {
    if (isCoachView && viewAsAthleteId) {
      (async () => {
        // Carregar perfil do atleta alvo
        const { data: p } = await supabase.from('profiles').select('*').eq('id', viewAsAthleteId).maybeSingle();
        if (p) {
          setAthleteName(athleteNameFromStore || p.full_name || p.email || null);
          setProfileData({
            height_cm: p.height_cm?.toString() || '',
            weight_kg: p.weight_kg?.toString() || '',
            date_of_birth: p.date_of_birth || '',
            gender: p.gender || '',
            max_heart_rate: p.max_heart_rate?.toString() || '',
            resting_heart_rate: p.resting_heart_rate?.toString() || ''
          });
        }
        // Carregar testes
        const { data: tests } = await supabase.from('fitness_tests').select('*').eq('user_id', viewAsAthleteId).order('test_date', { ascending: false });
        setCoachFitnessTests(tests || []);
        // Carregar provas
        const { data: racesData } = await supabase.from('races').select('*').eq('user_id', viewAsAthleteId).order('start_date', { ascending: true });
        setCoachRaces(racesData || []);
      })();
    } else {
      loadProfile();
      fetchFitnessTests();
      fetchRaces();
    }
  }, [isCoachView, viewAsAthleteId, loadProfile, fetchFitnessTests, fetchRaces]);

  const handleExitCoachMode = () => {
    exitCoachView();
    try {
      // @ts-ignore
      navigation.reset({ index: 0, routes: [{ name: 'CoachMain' }] });
    } catch {
      // @ts-ignore
      navigation.navigate('CoachMain');
    }
  };

  // Sincronizar dados do perfil com estado local
  useEffect(() => {
    if (!isCoachView && profile) {
      setProfileData({
        height_cm: profile.height_cm?.toString() || '',
        weight_kg: profile.weight_kg?.toString() || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        max_heart_rate: profile.max_heart_rate?.toString() || '',
        resting_heart_rate: profile.resting_heart_rate?.toString() || ''
      });
    }
  }, [isCoachView, profile]);

  // Encontrar o melhor teste para usar como referência (maior VO2max)
  useEffect(() => {
    if (fitnessTests.length > 0) {
      const bestTest = fitnessTests.reduce((best, current) => 
        current.calculated_vo2max > best.calculated_vo2max ? current : best
      );
      setReferenceTest(bestTest);
    }
  }, [fitnessTests]);

  // Calcular FC Máxima automaticamente quando a data de nascimento for preenchida
  useEffect(() => {
    if (profileData.date_of_birth && !profileData.max_heart_rate) {
      const birthDate = new Date(profileData.date_of_birth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      
      if (age > 0 && age < 120) { // Validação de idade razoável
        const calculatedMaxHeartRate = calculateMaxHeartRateTanaka(age);
        setProfileData(prev => ({
          ...prev,
          max_heart_rate: calculatedMaxHeartRate.toString()
        }));
        setAutoCalculatedMaxHR(true);
      }
    }
  }, [profileData.date_of_birth]);

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

      const testDataToSave = {
        protocol_name: TEST_PROTOCOLS.find(p => p.name === selectedProtocol)?.label || selectedProtocol,
        test_date: currentDate,
        distance_meters: testData.distance ? Number(testData.distance) : undefined,
        time_seconds: testData.time ? parseTimeToSeconds(testData.time) : undefined,
        final_heart_rate: testData.heartRate ? Number(testData.heartRate) : undefined,
        calculated_vo2max: vo2max,
        calculated_vam: vam
      };

      console.log('Dados do teste a serem salvos:', testDataToSave);

      if (isCoachView && viewAsAthleteId) {
        if (editingTest) {
          await supabase.from('fitness_tests').update(testDataToSave).eq('id', editingTest.id).eq('user_id', viewAsAthleteId);
        } else {
          await supabase.from('fitness_tests').insert({ ...testDataToSave, user_id: viewAsAthleteId });
        }
        const { data: tests } = await supabase.from('fitness_tests').select('*').eq('user_id', viewAsAthleteId).order('test_date', { ascending: false });
        setCoachFitnessTests(tests || []);
      } else {
        if (editingTest) {
          await updateFitnessTest(editingTest.id, testDataToSave);
          Alert.alert('Sucesso', 'Teste atualizado com sucesso!');
        } else {
          await saveFitnessTest(testDataToSave);
          Alert.alert('Sucesso', 'Teste registrado com sucesso!');
        }
        await loadProfile();
      }

      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar teste de fitness:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao salvar teste');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTest = (test: any) => {
    setEditingTest(test);
    setSelectedProtocol(TEST_PROTOCOLS.find(p => test.protocol_name.includes(p.label))?.name || '');
    
    // Preencher dados do teste para edição
    setTestData({
      distance: test.distance_meters?.toString() || '',
      time: test.time_seconds ? formatSecondsToTime(test.time_seconds) : '',
      heartRate: test.final_heart_rate?.toString() || ''
    });
    
    setModalVisible(true);
  };

  const handleDeleteTest = (test: any) => {
    console.log('DEBUG - handleDeleteTest chamado com:', test);
    
    // Confirmação simples para web
    const confirmed = window.confirm(`Deseja realmente excluir o teste "${test.protocol_name}"?`);
    
    if (confirmed) {
      console.log('DEBUG - Usuário confirmou exclusão');
      deleteTestAsync(test);
    } else {
      console.log('DEBUG - Usuário cancelou exclusão');
    }
  };

  const deleteTestAsync = async (test: any) => {
    console.log('DEBUG - Iniciando exclusão do teste:', test.id);
    try {
      if (isCoachView && viewAsAthleteId) {
        await supabase.from('fitness_tests').delete().eq('id', test.id).eq('user_id', viewAsAthleteId);
        const { data: tests } = await supabase.from('fitness_tests').select('*').eq('user_id', viewAsAthleteId).order('test_date', { ascending: false });
        setCoachFitnessTests(tests || []);
      } else {
        await deleteFitnessTest(test.id);
      }
      console.log('DEBUG - Teste excluído com sucesso');
      alert('Teste excluído com sucesso!');
    } catch (error) {
      console.error('DEBUG - Erro ao excluir teste:', error);
      alert(`Erro ao excluir teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleSetReferenceTest = (test: any) => {
    setReferenceTest(test);
    Alert.alert('Sucesso', `${test.protocol_name} definido como teste de referência!`);
  };

  const handleSaveProfile = async () => {
    console.log('DEBUG - handleSaveProfile chamado');
    console.log('DEBUG - profileData:', profileData);
    
    try {
      const updates = {
        height_cm: profileData.height_cm ? Number(profileData.height_cm) : undefined,
        weight_kg: profileData.weight_kg ? Number(profileData.weight_kg) : undefined,
        date_of_birth: profileData.date_of_birth || undefined,
        gender: profileData.gender || undefined,
        max_heart_rate: profileData.max_heart_rate ? Number(profileData.max_heart_rate) : undefined,
        resting_heart_rate: profileData.resting_heart_rate ? Number(profileData.resting_heart_rate) : undefined
      };
      
      console.log('DEBUG - updates a serem enviados:', updates);
      if (isCoachView && viewAsAthleteId) {
        await supabase.from('profiles').update(updates).eq('id', viewAsAthleteId);
      } else {
        await updateProfile(updates);
      }
      console.log('DEBUG - updateProfile executado com sucesso');
      Alert.alert('Sucesso', 'Dados fisiológicos atualizados com sucesso!');
    } catch (error) {
      console.error('DEBUG - Erro ao salvar dados fisiológicos:', error);
      Alert.alert('Erro', `Erro ao salvar dados fisiológicos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const formatSecondsToTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    setEditingTest(null);
    setSelectedProtocol('');
    setTestData({ distance: '', time: '', heartRate: '' });
  };

  const resetRaceForm = () => {
    setEditingRace(null);
    setRaceData({
      event_name: '',
      city: '',
      start_date: '',
      start_time: '',
      distance_km: ''
    });
  };

  const handleSaveRace = async () => {
    if (!raceData.event_name || !raceData.city || !raceData.start_date || !raceData.start_time || !raceData.distance_km) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const raceDataToSave = {
        event_name: raceData.event_name,
        city: raceData.city,
        start_date: raceData.start_date,
        start_time: raceData.start_time,
        distance_km: Number(raceData.distance_km)
      };

      if (editingRace) {
        await updateRace(editingRace.id, raceDataToSave);
        Alert.alert('Sucesso', 'Prova atualizada com sucesso!');
      } else {
        await saveRace(raceDataToSave);
        Alert.alert('Sucesso', 'Prova cadastrada com sucesso!');
      }

      setRaceModalVisible(false);
      resetRaceForm();
    } catch (error) {
      console.error('Erro ao salvar prova:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao salvar prova');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRace = (race: Race) => {
    setEditingRace(race);
    setRaceData({
      event_name: race.event_name,
      city: race.city,
      start_date: race.start_date,
      start_time: race.start_time,
      distance_km: race.distance_km.toString()
    });
    setRaceModalVisible(true);
  };

  const handleDeleteRace = (race: Race) => {
    const confirmed = window.confirm(`Deseja realmente excluir a prova "${race.event_name}"?`);
    
    if (confirmed) {
      deleteRaceAsync(race);
    }
  };

  const deleteRaceAsync = async (race: Race) => {
    try {
      if (isCoachView && viewAsAthleteId) {
        await supabase.from('races').delete().eq('id', race.id).eq('user_id', viewAsAthleteId);
        const { data: racesData } = await supabase.from('races').select('*').eq('user_id', viewAsAthleteId).order('start_date', { ascending: true });
        setCoachRaces(racesData || []);
      } else {
        await deleteRace(race.id);
      }
      alert('Prova excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir prova:', error);
      alert(`Erro ao excluir prova: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
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

  // Usar dados do teste de referência para cálculos
  const referenceVo2max = referenceTest?.calculated_vo2max || 0;
  const referenceVam = referenceTest?.calculated_vam || 0;
  
  const imc = profile?.weight_kg && profile?.height_cm ? calculateIMC(profile.weight_kg, profile.height_cm) : 0;
  const vo2max: number = referenceVo2max;
  const vam: number = referenceVam;
  const trainingZones = profile?.max_heart_rate && profile?.resting_heart_rate 
    ? calculateKarvonenZones(profile.max_heart_rate, profile.resting_heart_rate)
    : [];
  const paceZones = vo2max ? calculatePaceZones(vo2max) : [];

  // Combinar zonas de FC com zonas de ritmo
  const combinedZones = trainingZones.length > 0 
    ? trainingZones.map((zone, index) => ({
        zone: `Z${index + 1}`,
        name: zone.name,
        minHR: zone.minHR,
        maxHR: zone.maxHR,
        minHeartRate: zone.minHR,
        maxHeartRate: zone.maxHR,
        description: zone.description,
        pace: paceZones[index] ? `${formatPace(paceZones[index].minPace)} - ${formatPace(paceZones[index].maxPace)}` : '--'
      }))
    : paceZones.length > 0 
      ? paceZones.map((zone) => ({
          zone: zone.zone,
          name: zone.name,
          minHR: 0,
          maxHR: 0,
          minHeartRate: 0,
          maxHeartRate: 0,
          description: zone.description,
          pace: `${formatPace(zone.minPace)} - ${formatPace(zone.maxPace)}`
        }))
      : [];

  const testsList = isCoachView ? coachFitnessTests : fitnessTests;
  const racesList = isCoachView ? coachRaces : races;
  return (
    <ScrollView style={styles.container}>
      {isCoachView && (
        <View style={{ padding: 10, marginBottom: 8, borderRadius: 8, backgroundColor: '#EDE7F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip icon="shield-account" mode="outlined">Visualizando como Treinador{athleteName ? ` — ${athleteName}` : ''}</Chip>
          <Text onPress={handleExitCoachMode} style={{ color: '#1976d2' }}>Sair do modo treinador</Text>
        </View>
      )}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Dados Fisiológicos</Title>
          <Paragraph style={styles.formulaInfo}>
            💡 <Text style={styles.formulaText}>FC Máxima: Calculada automaticamente pela fórmula de Tanaka (208 - 0.7 × idade)</Text>
          </Paragraph>
          <Paragraph style={styles.formulaInfo}>
            💡 <Text style={styles.formulaText}>Zonas de Treino: Calculadas pela fórmula de Karvonen quando FC Repouso estiver preenchida</Text>
          </Paragraph>
          <View style={styles.row}>
            <TextInput
              label="Altura (cm)"
              value={profileData.height_cm}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, height_cm: text }))}
              keyboardType="numeric"
              style={styles.halfInput}
            />
            <TextInput
              label="Peso (kg)"
              value={profileData.weight_kg}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, weight_kg: text }))}
              keyboardType="numeric"
              style={styles.halfInput}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              label="Data de Nascimento"
              value={profileData.date_of_birth}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, date_of_birth: text }))}
              style={styles.halfInput}
            />
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Gênero</Text>
              <View style={styles.genderContainer}>
                <Button
                  mode={profileData.gender === 'masculino' ? 'contained' : 'outlined'}
                  onPress={() => setProfileData(prev => ({ ...prev, gender: 'masculino' }))}
                  style={[
                    styles.genderButton,
                    profileData.gender === 'masculino' && { backgroundColor: '#e0e0e0' }
                  ]}
                  labelStyle={styles.genderButtonLabel}
                  buttonColor={profileData.gender === 'masculino' ? '#e0e0e0' : undefined}
                >
                  Masculino
                </Button>
                <Button
                  mode={profileData.gender === 'feminino' ? 'contained' : 'outlined'}
                  onPress={() => setProfileData(prev => ({ ...prev, gender: 'feminino' }))}
                  style={[
                    styles.genderButton,
                    profileData.gender === 'feminino' && { backgroundColor: '#e0e0e0' }
                  ]}
                  labelStyle={styles.genderButtonLabel}
                  buttonColor={profileData.gender === 'feminino' ? '#e0e0e0' : undefined}
                >
                  Feminino
                </Button>
              </View>
            </View>
          </View>
          <View style={styles.row}>
            <TextInput
              label="FC Máxima"
              value={profileData.max_heart_rate}
              onChangeText={(text) => {
                setProfileData(prev => ({ ...prev, max_heart_rate: text }));
                setAutoCalculatedMaxHR(false); // Reset quando usuário edita manualmente
              }}
              keyboardType="numeric"
              style={styles.halfInput}
              right={autoCalculatedMaxHR ? <TextInput.Icon icon="calculator" /> : undefined}
            />
            <TextInput
              label="FC Repouso"
              value={profileData.resting_heart_rate}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, resting_heart_rate: text }))}
              keyboardType="numeric"
              style={styles.halfInput}
            />
          </View>
          <Button 
            mode="contained" 
            onPress={handleSaveProfile}
            style={styles.button}
          >
            Salvar Dados Fisiológicos
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Resultados Calculados</Title>
          {referenceTest && (
            <View style={styles.referenceInfo}>
              <Text style={styles.referenceText}>
                Baseado no teste: {referenceTest.protocol_name}
              </Text>
            </View>
          )}
          <View style={styles.resultsContainer}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>IMC:</Text>
              <Text style={styles.resultValue}>{imc ? imc.toFixed(1) : '--'}</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>VO2max:</Text>
              <Text style={styles.resultValue}>{vo2max ? `${vo2max.toFixed(1)} ml/kg/min` : '--'}</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>VAM:</Text>
              <Text style={styles.resultValue}>{vam ? `${vam.toFixed(1)} km/h` : '--'}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Zonas de Treino</Title>
          {profile?.resting_heart_rate && (
            <Paragraph style={styles.formulaInfo}>
              💡 <Text style={styles.formulaText}>Usando fórmula de Karvonen: FC Treino = FC Repouso + % × (FC Máxima - FC Repouso)</Text>
            </Paragraph>
          )}
          {referenceTest && (
            <View style={styles.referenceInfo}>
              <Text style={styles.referenceText}>
                Baseado no teste: {referenceTest.protocol_name} (VO2max: {referenceTest.calculated_vo2max.toFixed(1)} ml/kg/min, VAM: {referenceTest.calculated_vam.toFixed(1)} km/h)
              </Text>
            </View>
          )}
          {combinedZones.length > 0 ? (
            <View style={styles.tableContainer}>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title style={styles.zoneColumn}>Zona</DataTable.Title>
                  <DataTable.Title style={styles.descColumn}>Descrição</DataTable.Title>
                  <DataTable.Title style={styles.fcColumn}>FC (bpm)</DataTable.Title>
                  <DataTable.Title style={styles.paceColumn}>Ritmo (min/km)</DataTable.Title>
                </DataTable.Header>
                {combinedZones.map((zone) => (
                  <DataTable.Row key={zone.zone}>
                    <DataTable.Cell style={styles.zoneColumn}>
                      <Text style={styles.zoneNumber}>{zone.zone}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.descColumn}>
                      <Text style={styles.zoneDescription}>{zone.description}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.fcColumn}>
                      <Text style={styles.fcRange}>
                        {zone.minHR > 0 ? `${zone.minHR}-${zone.maxHR}` : '--'}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.paceColumn}>
                      <Text style={styles.paceRange}>{zone.pace}</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </View>
          ) : (
            <View>
              <Text style={styles.noDataText}>
                {!profile?.max_heart_rate || !profile?.resting_heart_rate 
                  ? 'Preencha a Data de Nascimento (FC Máxima será calculada pela fórmula de Tanaka) e FC Repouso para calcular as zonas de FC pela fórmula de Karvonen'
                  : !vo2max || !vam
                    ? 'Complete um teste de performance para calcular as zonas de ritmo'
                    : 'Nenhuma zona calculada'
                }
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Minhas Provas</Title>
          <Button 
            mode="contained" 
            onPress={() => setRaceModalVisible(true)}
            style={styles.button}
          >
            Cadastrar Nova Prova
          </Button>
          
          {racesList.length > 0 ? (
            racesList.map((race) => (
              <View key={race.id} style={styles.raceItem}>
                <View style={styles.raceHeader}>
                  <View style={styles.raceInfo}>
                    <Text style={styles.raceTitle}>{race.event_name}</Text>
                    <Text style={styles.raceDate}>
                      {new Date(race.start_date).toLocaleDateString('pt-BR')} às {race.start_time}
                    </Text>
                  </View>
                  <View style={styles.raceActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => handleEditRace(race)}
                      style={styles.actionButton}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDeleteRace(race)}
                      style={styles.actionButton}
                    />
                  </View>
                </View>
                <Text style={styles.raceDetails}>🏃 {race.city}</Text>
                <Text style={styles.raceDetails}>📏 {race.distance_km}km</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>
              Nenhuma prova cadastrada. Clique em "Cadastrar Nova Prova" para adicionar suas próximas competições.
            </Text>
          )}
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
          
          {testsList.map((test) => (
            <View key={test.id} style={styles.testItem}>
              <View style={styles.testHeader}>
                <View style={styles.testInfo}>
                  <Text style={styles.testTitle}>{test.protocol_name}</Text>
                  <Text style={styles.testDate}>{new Date(test.test_date).toLocaleDateString('pt-BR')}</Text>
                </View>
                <View style={styles.testActions}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => handleEditTest(test)}
                    style={styles.actionButton}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => handleDeleteTest(test)}
                    style={styles.actionButton}
                  />
                </View>
              </View>
              <Text style={styles.testResult}>VO2max: {test.calculated_vo2max ? test.calculated_vo2max.toFixed(1) : '--'} ml/kg/min</Text>
              <Text style={styles.testResult}>VAM: {test.calculated_vam ? test.calculated_vam.toFixed(1) : '--'} km/h</Text>
              <View style={styles.testFooter}>
                <Chip
                  mode={referenceTest?.id === test.id ? "flat" : "outlined"}
                  onPress={() => handleSetReferenceTest(test)}
                  style={styles.referenceChip}
                >
                  {referenceTest?.id === test.id ? 'Referência Atual' : 'Usar como Referência'}
                </Chip>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            resetForm();
          }}
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>
            {editingTest ? 'Editar Teste' : 'Registrar Novo Teste'}
          </Title>
          
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
              {editingTest ? 'Atualizar' : 'Calcular e Salvar'}
            </Button>
          </View>
        </Modal>
      </Portal>
     
      <Portal>
         <Modal
           visible={raceModalVisible}
           onDismiss={() => {
             setRaceModalVisible(false);
             resetRaceForm();
           }}
           contentContainerStyle={styles.modal}
         >
           <Title style={styles.modalTitle}>
             {editingRace ? 'Editar Prova' : 'Cadastrar Nova Prova'}
           </Title>
           
           <TextInput
             label="Nome do Evento"
             value={raceData.event_name}
             onChangeText={(text) => setRaceData(prev => ({ ...prev, event_name: text }))}
             style={styles.input}
           />
           
           <TextInput
             label="Cidade"
             value={raceData.city}
             onChangeText={(text) => setRaceData(prev => ({ ...prev, city: text }))}
             style={styles.input}
           />
           
           <TextInput
             label="Data da Largada (YYYY-MM-DD)"
             value={raceData.start_date}
             onChangeText={(text) => setRaceData(prev => ({ ...prev, start_date: text }))}
             placeholder="2024-12-25"
             style={styles.input}
           />
           
           <TextInput
             label="Hora da Largada (HH:MM)"
             value={raceData.start_time}
             onChangeText={(text) => setRaceData(prev => ({ ...prev, start_time: text }))}
             placeholder="08:00"
             style={styles.input}
           />
           
           <TextInput
             label="Distância (km)"
             value={raceData.distance_km}
             onChangeText={(text) => setRaceData(prev => ({ ...prev, distance_km: text }))}
             keyboardType="numeric"
             style={styles.input}
           />
 
           <View style={styles.modalButtons}>
             <Button 
               mode="outlined" 
               onPress={() => {
                 setRaceModalVisible(false);
                 resetRaceForm();
               }}
               style={styles.modalButton}
             >
               Cancelar
             </Button>
             <Button 
               mode="contained" 
               onPress={async () => {
                 if (!raceData.event_name || !raceData.city || !raceData.start_date || !raceData.start_time || !raceData.distance_km) {
                   Alert.alert('Erro', 'Todos os campos são obrigatórios');
                   return;
                 }
                 setLoading(true);
                 try {
                   const payload = {
                     event_name: raceData.event_name,
                     city: raceData.city,
                     start_date: raceData.start_date,
                     start_time: raceData.start_time,
                     distance_km: Number(raceData.distance_km)
                   };
                   if (isCoachView && viewAsAthleteId) {
                     if (editingRace) {
                       await supabase.from('races').update(payload).eq('id', editingRace.id).eq('user_id', viewAsAthleteId);
                     } else {
                       await supabase.from('races').insert({ ...payload, user_id: viewAsAthleteId });
                     }
                     const { data: racesData } = await supabase.from('races').select('*').eq('user_id', viewAsAthleteId).order('start_date', { ascending: true });
                     setCoachRaces(racesData || []);
                   } else {
                     if (editingRace) {
                       await updateRace(editingRace.id, payload);
                     } else {
                       await saveRace(payload);
                     }
                   }
                   setRaceModalVisible(false);
                   resetRaceForm();
                 } catch (error) {
                   Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao salvar prova');
                 } finally {
                   setLoading(false);
                 }
               }}
               loading={loading}
               disabled={!raceData.event_name || !raceData.city || !raceData.start_date || !raceData.start_time || !raceData.distance_km || loading}
               style={styles.modalButton}
             >
               {editingRace ? 'Atualizar' : 'Salvar'}
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
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  testDate: {
    color: '#666',
    fontSize: 12,
  },
  testActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 8,
  },
  testResult: {
    marginTop: 4,
    color: '#2196F3',
  },
  testFooter: {
    marginTop: 8,
  },
  referenceChip: {
    backgroundColor: '#e0f2f7',
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  referenceInfo: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 4,
  },
  referenceText: {
    fontStyle: 'italic',
    color: '#666',
    fontSize: 12,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
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
  tableContainer: {
    marginTop: 8,
  },
  zoneColumn: {
    flex: 0.15,
  },
  descColumn: {
    flex: 0.35,
  },
  fcColumn: {
    flex: 0.2,
  },
  paceColumn: {
    flex: 0.3,
  },
  zoneNumber: {
    fontWeight: 'bold',
  },
  zoneDescription: {
    fontStyle: 'italic',
  },
  fcRange: {
    color: '#2196F3',
  },
  paceRange: {
    color: '#2196F3',
  },
  inputLabel: {
    marginBottom: 4,
    fontWeight: 'bold',
    fontSize: 12,
    color: '#666',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 4,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  genderButtonLabel: {
    fontSize: 12,
    color: '#333',
  },
  formulaInfo: {
    marginBottom: 8,
    fontSize: 12,
    color: '#666',
  },
  formulaText: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  raceItem: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  raceInfo: {
    flex: 1,
  },
  raceTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  raceDate: {
    color: '#666',
    fontSize: 12,
  },
  raceActions: {
    flexDirection: 'row',
  },
  raceDetails: {
    marginTop: 4,
    color: '#2196F3',
  },
}); 