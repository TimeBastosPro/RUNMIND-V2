import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, TextInput, Button, HelperText, Chip, SegmentedButtons } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCoachStore } from '../../stores/coach';
import { useAuthStore } from '../../stores/auth';

const coachProfileSchema = z.object({
  full_name: z.string().min(1, 'Nome completo é obrigatório'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
  experience_years: z.number().min(0, 'Anos de experiência deve ser um número positivo').optional(),
  specialties: z.array(z.string()).min(1, 'Selecione pelo menos uma especialidade'),
  certifications: z.array(z.string()).optional(),
});

type CoachProfileForm = z.infer<typeof coachProfileSchema>;

interface CoachProfileSetupScreenProps {
  navigation: any;
}

const SPECIALTIES_OPTIONS = [
  'Corrida de Rua',
  'Maratona',
  'Meia Maratona',
  'Corrida de Montanha',
  'Triatlo',
  'Ciclismo',
  'Natação',
  'Treinamento Funcional',
  'Força e Condicionamento',
  'Recuperação e Reabilitação',
  'Nutrição Esportiva',
  'Psicologia do Esporte',
];

const CERTIFICATION_OPTIONS = [
  'CREF (Conselho Regional de Educação Física)',
  'CBF (Confederação Brasileira de Futebol)',
  'CBAt (Confederação Brasileira de Atletismo)',
  'CBTri (Confederação Brasileira de Triatlo)',
  'FISAF (Federation of International Sports, Aerobics and Fitness)',
  'ACE (American Council on Exercise)',
  'NASM (National Academy of Sports Medicine)',
  'ACSM (American College of Sports Medicine)',
  'Outros',
];

export default function CoachProfileSetupScreen({ navigation }: CoachProfileSetupScreenProps) {
  const { createCoachProfile, isLoading, error, clearError } = useCoachStore();
  const { user } = useAuthStore();
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CoachProfileForm>({
    resolver: zodResolver(coachProfileSchema),
    defaultValues: {
      full_name: user?.user_metadata?.full_name || '',
      phone: '',
      bio: '',
      experience_years: undefined,
      specialties: [],
      certifications: [],
    },
  });

  const toggleSpecialty = (specialty: string) => {
    const newSpecialties = selectedSpecialties.includes(specialty)
      ? selectedSpecialties.filter(s => s !== specialty)
      : [...selectedSpecialties, specialty];
    
    setSelectedSpecialties(newSpecialties);
    setValue('specialties', newSpecialties);
  };

  const toggleCertification = (certification: string) => {
    const newCertifications = selectedCertifications.includes(certification)
      ? selectedCertifications.filter(c => c !== certification)
      : [...selectedCertifications, certification];
    
    setSelectedCertifications(newCertifications);
    setValue('certifications', newCertifications);
  };

  const onSubmit = async (data: CoachProfileForm) => {
    try {
      clearError();
      console.log('🔍 Tentando criar perfil de treinador:', data);
      
      // Verificar se pelo menos uma especialidade foi selecionada
      if (!data.specialties || data.specialties.length === 0) {
        throw new Error('Selecione pelo menos uma especialidade');
      }
      
      const result = await createCoachProfile({
        ...data,
        email: user?.email || '',
        is_active: true,
      });
      
      console.log('✅ Perfil de treinador criado com sucesso:', result);
      
      // O AppNavigator irá detectar automaticamente que o usuário é treinador
      // e mostrar a tela principal do treinador
    } catch (error: any) {
      console.error('❌ Erro ao criar perfil de treinador:', error);
      console.error('❌ Detalhes do erro:', error.message, error.code, error.details);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          👨‍💼 Perfil de Treinador
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Complete seu perfil para começar a gerenciar sua equipe
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  label="Nome completo"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  mode="outlined"
                />
                <HelperText type="error" visible={!!errors.full_name}>
                  {errors.full_name?.message}
                </HelperText>
              </>
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Telefone (opcional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  label="Biografia (opcional)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                />
                <HelperText type="error" visible={!!errors.bio}>
                  {errors.bio?.message}
                </HelperText>
              </>
            )}
          />

          <Controller
            control={control}
            name="experience_years"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  label="Anos de experiência (opcional)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                  onBlur={onBlur}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <HelperText type="error" visible={!!errors.experience_years}>
                  {errors.experience_years?.message}
                </HelperText>
              </>
            )}
          />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Especialidades *
          </Text>
          <Text variant="bodySmall" style={styles.sectionDescription}>
            Selecione suas áreas de especialização
          </Text>
          <View style={styles.chipContainer}>
            {SPECIALTIES_OPTIONS.map((specialty) => (
              <Chip
                key={specialty}
                selected={selectedSpecialties.includes(specialty)}
                onPress={() => toggleSpecialty(specialty)}
                style={styles.chip}
                mode="outlined"
              >
                {specialty}
              </Chip>
            ))}
          </View>
          <HelperText type="error" visible={!!errors.specialties}>
            {errors.specialties?.message}
          </HelperText>

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Certificações (opcional)
          </Text>
          <Text variant="bodySmall" style={styles.sectionDescription}>
            Selecione suas certificações profissionais
          </Text>
          <View style={styles.chipContainer}>
            {CERTIFICATION_OPTIONS.map((certification) => (
              <Chip
                key={certification}
                selected={selectedCertifications.includes(certification)}
                onPress={() => toggleCertification(certification)}
                style={styles.chip}
                mode="outlined"
              >
                {certification}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {error && (
        <HelperText type="error" visible={!!error} style={styles.errorText}>
          {error}
        </HelperText>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
      >
        Criar Perfil de Treinador
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
  },
  card: {
    marginBottom: 20,
    elevation: 4,
    borderRadius: 12,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#666',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginBottom: 8,
  },
  errorText: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
}); 