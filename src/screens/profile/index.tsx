import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, SegmentedButtons, TextInput, RadioButton, Checkbox } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useAuthStore } from '../../stores/auth';

const experienceOptions = [
  { label: 'Iniciante', value: 'beginner' },
  { label: 'Intermediário', value: 'intermediate' },
  { label: 'Avançado', value: 'advanced' },
];
const goalOptions = [
  { label: 'Saúde', value: 'health' },
  { label: 'Performance', value: 'performance' },
  { label: 'Perda de peso', value: 'weight_loss' },
  { label: 'Diversão', value: 'fun' },
];
const contextOptions = [
  { label: 'Sozinho', value: 'solo' },
  { label: 'Orientado por treinador', value: 'coached' },
  { label: 'Híbrido', value: 'hybrid' },
];

export default function ProfileScreen() {
  const { signOut, profile, updateProfile } = useAuthStore();
  const [tab, setTab] = useState('dados');
  // 2. Estado do formulário para todos os campos
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth || '');
  const [weightKg, setWeightKg] = useState(profile?.weight_kg ? String(profile.weight_kg) : '');
  const [heightCm, setHeightCm] = useState(profile?.height_cm ? String(profile.height_cm) : '');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(profile?.experience_level || 'beginner');
  const [mainGoal, setMainGoal] = useState<'health' | 'performance' | 'weight_loss' | 'fun'>(profile?.main_goal || 'health');
  const [contextType, setContextType] = useState<'solo' | 'coached' | 'hybrid'>(profile?.context_type || 'solo');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [parqAnswers, setParqAnswers] = useState<{
    q1: string | null;
    q2: string | null;
    q3: string | null;
    q4: string | null;
    q5: string | null;
    q6: string | null;
    q7: string | null;
  }>({
    q1: profile?.parq_answers?.q1 ?? null,
    q2: profile?.parq_answers?.q2 ?? null,
    q3: profile?.parq_answers?.q3 ?? null,
    q4: profile?.parq_answers?.q4 ?? null,
    q5: profile?.parq_answers?.q5 ?? null,
    q6: profile?.parq_answers?.q6 ?? null,
    q7: profile?.parq_answers?.q7 ?? null,
  });
  const [preferences, setPreferences] = useState({
    trainingDays: profile?.training_days || [],
    trainingPeriod: profile?.preferred_training_period || '',
    terrainType: profile?.terrain_preference || '',
    workIntensity: profile?.work_stress_level || 3,
    sleepQuality: profile?.sleep_consistency || '',
    wakeFeeling: profile?.wakeup_feeling || '',
    hydration: profile?.hydration_habit || '',
    recoveryTechniques: profile?.recovery_habit || '',
    stressManagement: profile?.stress_management || [],
  });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // 5. Função de salvar (unificada)
  const handleUpdateProfile = async () => {
    setIsSaving(true);
    const updates: any = {
      full_name: fullName,
      date_of_birth: dateOfBirth,
      weight_kg: weightKg ? Number(weightKg) : null,
      height_cm: heightCm ? Number(heightCm) : null,
      experience_level: experienceLevel,
      main_goal: mainGoal,
      context_type: contextType,
      // Preferências
      training_days: preferences.trainingDays,
      preferred_training_period: preferences.trainingPeriod,
      terrain_preference: preferences.terrainType,
      work_stress_level: preferences.workIntensity,
      sleep_consistency: preferences.sleepQuality,
      wakeup_feeling: preferences.wakeFeeling,
      hydration_habit: preferences.hydration,
      recovery_habit: preferences.recoveryTechniques,
      stress_management: preferences.stressManagement,
      // Anamnese (PAR-Q+)
      parq_answers: parqAnswers,
    };
    try {
      await updateProfile(updates);
      Alert.alert('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Erro ao atualizar perfil', error.message || String(error));
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Função de cancelar edição (unificada)
  const handleCancel = () => {
    setFullName(profile?.full_name || '');
    setDateOfBirth(profile?.date_of_birth || '');
    setWeightKg(profile?.weight_kg ? String(profile.weight_kg) : '');
    setHeightCm(profile?.height_cm ? String(profile.height_cm) : '');
    setExperienceLevel(profile?.experience_level || 'beginner');
    setMainGoal(profile?.main_goal || 'health');
    setContextType(profile?.context_type || 'solo');
    setParqAnswers({
      q1: profile?.parq_answers?.q1 ?? null,
      q2: profile?.parq_answers?.q2 ?? null,
      q3: profile?.parq_answers?.q3 ?? null,
      q4: profile?.parq_answers?.q4 ?? null,
      q5: profile?.parq_answers?.q5 ?? null,
      q6: profile?.parq_answers?.q6 ?? null,
      q7: profile?.parq_answers?.q7 ?? null,
    });
    setPreferences({
      trainingDays: profile?.training_days || [],
      trainingPeriod: profile?.preferred_training_period || '',
      terrainType: profile?.terrain_preference || '',
      workIntensity: profile?.work_stress_level || 3,
      sleepQuality: profile?.sleep_consistency || '',
      wakeFeeling: profile?.wakeup_feeling || '',
      hydration: profile?.hydration_habit || '',
      recoveryTechniques: profile?.recovery_habit || '',
      stressManagement: profile?.stress_management || [],
    });
    setIsEditing(false);
  };

  const renderTabContent = () => {
    switch (tab) {
      case 'dados':
        return (
          <Card style={{ marginBottom: 24 }}>
            <Card.Title title="Dados do Perfil" />
            <Card.Content>
              {/* 1. Todos os campos do perfil */}
              <TextInput
                label="Nome Completo"
                value={fullName}
                onChangeText={setFullName}
                style={{ marginBottom: 12 }}
                mode="outlined"
                disabled={!isEditing}
              />
              <TextInput
                label="Data de Nascimento"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                style={{ marginBottom: 12 }}
                mode="outlined"
                placeholder="AAAA-MM-DD"
                disabled={!isEditing}
              />
              <TextInput
                label="Peso (kg)"
                value={weightKg}
                onChangeText={setWeightKg}
                style={{ marginBottom: 12 }}
                mode="outlined"
                keyboardType="numeric"
                disabled={!isEditing}
              />
              <TextInput
                label="Altura (cm)"
                value={heightCm}
                onChangeText={setHeightCm}
                style={{ marginBottom: 12 }}
                mode="outlined"
                keyboardType="numeric"
                disabled={!isEditing}
              />
              <Text style={{ marginTop: 8, marginBottom: 4 }}>Nível de Experiência</Text>
              <RadioButton.Group
                onValueChange={value => setExperienceLevel(value as any)}
                value={experienceLevel}
              >
                {experienceOptions.map(opt => (
                  <RadioButton.Item key={opt.value} label={opt.label} value={opt.value} disabled={!isEditing} />
                ))}
              </RadioButton.Group>
              <Text style={{ marginTop: 8, marginBottom: 4 }}>Principal Objetivo</Text>
              <RadioButton.Group
                onValueChange={value => setMainGoal(value as any)}
                value={mainGoal}
              >
                {goalOptions.map(opt => (
                  <RadioButton.Item key={opt.value} label={opt.label} value={opt.value} disabled={!isEditing} />
                ))}
              </RadioButton.Group>
              <Text style={{ marginTop: 8, marginBottom: 4 }}>Contexto de Treino</Text>
              <RadioButton.Group
                onValueChange={value => setContextType(value as any)}
                value={contextType}
              >
                {contextOptions.map(opt => (
                  <RadioButton.Item key={opt.value} label={opt.label} value={opt.value} disabled={!isEditing} />
                ))}
              </RadioButton.Group>
            </Card.Content>
          </Card>
        );
      case 'anamnese':
        return (
          <ScrollView style={{ flex: 1 }}>
            <Card style={{ marginBottom: 24 }}>
              <Card.Title title="Questionário de Prontidão para Atividade Física (PAR-Q+)" />
              <Card.Content>
                <Text style={{ marginBottom: 16 }}>
                  Para sua segurança, por favor, responda 'Sim' ou 'Não' às seguintes perguntas.
                </Text>
                {/* Pergunta 1 */}
                <Text style={{ marginBottom: 4 }}>
                  1. Algum médico já disse que você possui um problema de coração e que só deveria realizar atividade física sob supervisão médica?
                </Text>
                <RadioButton.Group
                  onValueChange={value => setParqAnswers(a => ({ ...a, q1: value }))}
                  value={parqAnswers.q1 ?? ''}
                >
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <RadioButton.Item label="Sim" value="sim" style={{ flex: 1 }} />
                    <RadioButton.Item label="Não" value="nao" style={{ flex: 1 }} />
                  </View>
                </RadioButton.Group>
                {/* Pergunta 2 */}
                <Text style={{ marginBottom: 4 }}>
                  2. Você sente dor no peito ao realizar atividade física?
                </Text>
                <RadioButton.Group
                  onValueChange={value => setParqAnswers(a => ({ ...a, q2: value }))}
                  value={parqAnswers.q2 ?? ''}
                >
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <RadioButton.Item label="Sim" value="sim" style={{ flex: 1 }} />
                    <RadioButton.Item label="Não" value="nao" style={{ flex: 1 }} />
                  </View>
                </RadioButton.Group>
                {/* Pergunta 3 */}
                <Text style={{ marginBottom: 4 }}>
                  3. No último mês, você sentiu dor no peito ao realizar atividade física?
                </Text>
                <RadioButton.Group
                  onValueChange={value => setParqAnswers(a => ({ ...a, q3: value }))}
                  value={parqAnswers.q3 ?? ''}
                >
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <RadioButton.Item label="Sim" value="sim" style={{ flex: 1 }} />
                    <RadioButton.Item label="Não" value="nao" style={{ flex: 1 }} />
                  </View>
                </RadioButton.Group>
                {/* Pergunta 4 */}
                <Text style={{ marginBottom: 4 }}>
                  4. Você apresenta desequilíbrio devido à tontura e/ou perda de consciência?
                </Text>
                <RadioButton.Group
                  onValueChange={value => setParqAnswers(a => ({ ...a, q4: value }))}
                  value={parqAnswers.q4 ?? ''}
                >
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <RadioButton.Item label="Sim" value="sim" style={{ flex: 1 }} />
                    <RadioButton.Item label="Não" value="nao" style={{ flex: 1 }} />
                  </View>
                </RadioButton.Group>
                {/* Pergunta 5 */}
                <Text style={{ marginBottom: 4 }}>
                  5. Você possui algum problema ósseo ou articular que poderia ser piorado pela atividade física?
                </Text>
                <RadioButton.Group
                  onValueChange={value => setParqAnswers(a => ({ ...a, q5: value }))}
                  value={parqAnswers.q5 ?? ''}
                >
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <RadioButton.Item label="Sim" value="sim" style={{ flex: 1 }} />
                    <RadioButton.Item label="Não" value="nao" style={{ flex: 1 }} />
                  </View>
                </RadioButton.Group>
                {/* Pergunta 6 */}
                <Text style={{ marginBottom: 4 }}>
                  6. Você toma atualmente algum medicamento para pressão arterial ou problema de coração?
                </Text>
                <RadioButton.Group
                  onValueChange={value => setParqAnswers(a => ({ ...a, q6: value }))}
                  value={parqAnswers.q6 ?? ''}
                >
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <RadioButton.Item label="Sim" value="sim" style={{ flex: 1 }} />
                    <RadioButton.Item label="Não" value="nao" style={{ flex: 1 }} />
                  </View>
                </RadioButton.Group>
                {/* Pergunta 7 */}
                <Text style={{ marginBottom: 4 }}>
                  7. Sabe de alguma outra razão pela qual você não deveria realizar atividade física?
                </Text>
                <RadioButton.Group
                  onValueChange={value => setParqAnswers(a => ({ ...a, q7: value }))}
                  value={parqAnswers.q7 ?? ''}
                >
                  <View style={{ flexDirection: 'row', marginBottom: 24 }}>
                    <RadioButton.Item label="Sim" value="sim" style={{ flex: 1 }} />
                    <RadioButton.Item label="Não" value="nao" style={{ flex: 1 }} />
                  </View>
                </RadioButton.Group>
              </Card.Content>
            </Card>
          </ScrollView>
        );
      case 'preferencias':
        return (
          <ScrollView style={{ flex: 1 }}>
            {/* Card 1: Sua Corrida */}
            <Card style={{ marginBottom: 24 }}>
              <Card.Title title="Sua Corrida" />
              <Card.Content>
                <Text style={{ marginBottom: 8 }}>Quais dias da semana você costuma treinar?</Text>
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                  <Checkbox.Item
                    key={day}
                    label={day}
                    status={preferences.trainingDays.includes(day) ? 'checked' : 'unchecked'}
                    onPress={() => {
                      setPreferences(p => ({
                        ...p,
                        trainingDays: p.trainingDays.includes(day)
                          ? p.trainingDays.filter(d => d !== day)
                          : [...p.trainingDays, day],
                      }));
                    }}
                    disabled={!isEditing}
                  />
                ))}
                <Text style={{ marginTop: 16, marginBottom: 4 }}>Qual seu período preferido para treinar?</Text>
                <RadioButton.Group
                  onValueChange={value => setPreferences(p => ({ ...p, trainingPeriod: value }))}
                  value={preferences.trainingPeriod}
                  disabled={!isEditing}
                >
                  <RadioButton.Item label="Manhã" value="manha" />
                  <RadioButton.Item label="Tarde" value="tarde" />
                  <RadioButton.Item label="Noite" value="noite" />
                </RadioButton.Group>
                <Text style={{ marginTop: 16, marginBottom: 4 }}>Qual o seu principal tipo de terreno de corrida?</Text>
                <RadioButton.Group
                  onValueChange={value => setPreferences(p => ({ ...p, terrainType: value }))}
                  value={preferences.terrainType}
                  disabled={!isEditing}
                >
                  <RadioButton.Item label="Asfalto/Rua" value="asfalto" />
                  <RadioButton.Item label="Trilha/Montanha" value="trilha" />
                  <RadioButton.Item label="Pista de Atletismo" value="pista" />
                  <RadioButton.Item label="Misto" value="misto" />
                </RadioButton.Group>
              </Card.Content>
            </Card>
            {/* Card 2: Sua Rotina e Bem-Estar */}
            <Card style={{ marginBottom: 24 }}>
              <Card.Title title="Sua Rotina e Bem-Estar" />
              <Card.Content>
                <Text style={{ marginBottom: 8 }}>Como você descreveria a intensidade do seu trabalho/estudos?</Text>
                <Slider
                  minimumValue={1}
                  maximumValue={5}
                  step={1}
                  value={preferences.workIntensity}
                  onValueChange={value => setPreferences(p => ({ ...p, workIntensity: value }))}
                  style={{ width: '100%', marginBottom: 8 }}
                  disabled={!isEditing}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text>Leve</Text>
                  <Text>Muito Intenso</Text>
                </View>
                <Text style={{ marginBottom: 4 }}>Seu sono durante a semana é geralmente:</Text>
                <RadioButton.Group
                  onValueChange={value => setPreferences(p => ({ ...p, sleepQuality: value }))}
                  value={preferences.sleepQuality}
                  disabled={!isEditing}
                >
                  <RadioButton.Item label="Regular e consistente" value="regular" />
                  <RadioButton.Item label="Varia um pouco" value="varia" />
                  <RadioButton.Item label="Irregular e insuficiente" value="irregular" />
                </RadioButton.Group>
                <Text style={{ marginTop: 16, marginBottom: 4 }}>Como você se sente ao acordar na maioria dos dias?</Text>
                <RadioButton.Group
                  onValueChange={value => setPreferences(p => ({ ...p, wakeFeeling: value }))}
                  value={preferences.wakeFeeling}
                  disabled={!isEditing}
                >
                  <RadioButton.Item label="Descansado e com energia" value="descansado" />
                  <RadioButton.Item label="Um pouco cansado" value="pouco_cansado" />
                  <RadioButton.Item label="Cansado e sem energia" value="cansado" />
                </RadioButton.Group>
              </Card.Content>
            </Card>
            {/* Card 3: Seus Hábitos */}
            <Card style={{ marginBottom: 24 }}>
              <Card.Title title="Seus Hábitos" />
              <Card.Content>
                <Text style={{ marginBottom: 8 }}>Como é sua hidratação ao longo do dia?</Text>
                <RadioButton.Group
                  onValueChange={value => setPreferences(p => ({ ...p, hydration: value }))}
                  value={preferences.hydration}
                  disabled={!isEditing}
                >
                  <RadioButton.Item label="Bebo água constantemente" value="constante" />
                  <RadioButton.Item label="Bebo quando sinto sede" value="sede" />
                  <RadioButton.Item label="Esqueço de beber água" value="esqueço" />
                </RadioButton.Group>
                <Text style={{ marginTop: 16, marginBottom: 4 }}>Você pratica alguma técnica de recuperação (ex: alongamento, rolo) após os treinos?</Text>
                <RadioButton.Group
                  onValueChange={value => setPreferences(p => ({ ...p, recoveryTechniques: value }))}
                  value={preferences.recoveryTechniques}
                  disabled={!isEditing}
                >
                  <RadioButton.Item label="Sim, regularmente" value="regular" />
                  <RadioButton.Item label="Às vezes" value="as_vezes" />
                  <RadioButton.Item label="Raramente/Nunca" value="nunca" />
                </RadioButton.Group>
                <Text style={{ marginTop: 16, marginBottom: 4 }}>Como você gerencia seu estresse fora dos treinos?</Text>
                {['Hobbies/Lazer', 'Meditação/Mindfulness', 'Atividade Social', 'Não tenho um método definido'].map(option => (
                  <Checkbox.Item
                    key={option}
                    label={option}
                    status={preferences.stressManagement.includes(option) ? 'checked' : 'unchecked'}
                    onPress={() => {
                      setPreferences(p => ({
                        ...p,
                        stressManagement: p.stressManagement.includes(option)
                          ? p.stressManagement.filter(o => o !== option)
                          : [...p.stressManagement, option],
                      }));
                    }}
                    disabled={!isEditing}
                  />
                ))}
              </Card.Content>
            </Card>
          </ScrollView>
        );
      case 'integracoes':
        return (
          <Card style={{ marginBottom: 24 }}>
            <Card.Title title="Integrações" />
            <Card.Content>
              <Button mode="outlined" disabled style={{ marginBottom: 12 }}>
                Conectar com Strava
              </Button>
              <Button mode="outlined" disabled>
                Conectar com Garmin
              </Button>
            </Card.Content>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        buttons={[
          { value: 'dados', label: 'Dados' },
          { value: 'anamnese', label: 'Anamnese' },
          { value: 'preferencias', label: 'Preferências' },
          { value: 'integracoes', label: 'Integrações' },
        ]}
        style={{ marginBottom: 16 }}
      />
      {/* Botões de ação unificados */}
      {!isEditing ? (
        <Button mode="contained" onPress={() => setIsEditing(true)} style={{ marginBottom: 16 }}>
          Editar
        </Button>
      ) : (
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <Button
            mode="contained"
            onPress={handleUpdateProfile}
            loading={isSaving}
            disabled={isSaving}
            style={{ flex: 1, marginRight: 8 }}
          >
            Salvar Alterações
          </Button>
          <Button
            mode="outlined"
            onPress={handleCancel}
            disabled={isSaving}
            style={{ flex: 1 }}
          >
            Cancelar
          </Button>
        </View>
      )}
      <ScrollView style={{ flex: 1 }}>
        {renderTabContent()}
      </ScrollView>
      <Button mode="outlined" onPress={signOut} style={{ marginTop: 16 }}>
        Sair da conta
      </Button>
    </View>
  );
} 