import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, Chip, TextInput, HelperText } from 'react-native-paper';
import { useCoachStore } from '../../stores/coach';
import { useAuthStore } from '../../stores/auth';

interface CoachProfileScreenProps {
  navigation: any;
}

export default function CoachProfileScreen({ navigation }: CoachProfileScreenProps) {
  const { currentCoach, updateCoachProfile, isLoading } = useCoachStore();
  const { signOut } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: currentCoach?.full_name || '',
    phone: currentCoach?.phone || '',
    bio: currentCoach?.bio || '',
    experience_years: currentCoach?.experience_years?.toString() || '',
  });

  const handleSave = async () => {
    try {
      await updateCoachProfile({
        full_name: formData.full_name,
        phone: formData.phone || undefined,
        bio: formData.bio || undefined,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  const handleLogout = async () => {
    try {
      try {
        const { useViewStore } = require('../../stores/view');
        useViewStore.getState().exitCoachView();
      } catch {}
      await signOut();
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!currentCoach) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={80} 
              label={getInitials(currentCoach.full_name)}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.coachName}>
                {currentCoach.full_name}
              </Text>
              <Text variant="bodyMedium" style={styles.coachEmail}>
                {currentCoach.email}
              </Text>
              {currentCoach.phone && (
                <Text variant="bodySmall" style={styles.coachPhone}>
                  📞 {currentCoach.phone}
                </Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Informações do Perfil */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              📋 Informações do Perfil
            </Text>
            <Button 
              mode={isEditing ? "outlined" : "text"}
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editButton}
            >
              {isEditing ? 'Cancelar' : 'Editar'}
            </Button>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                label="Nome completo"
                value={formData.full_name}
                onChangeText={(text) => setFormData({...formData, full_name: text})}
                style={styles.input}
                mode="outlined"
              />
              
              <TextInput
                label="Telefone"
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
              />
              
              <TextInput
                label="Biografia"
                value={formData.bio}
                onChangeText={(text) => setFormData({...formData, bio: text})}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={4}
              />
              
              <TextInput
                label="Anos de experiência"
                value={formData.experience_years}
                onChangeText={(text) => setFormData({...formData, experience_years: text})}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              
              <Button 
                mode="contained" 
                onPress={handleSave}
                loading={isLoading}
                style={styles.saveButton}
              >
                Salvar Alterações
              </Button>
            </View>
          ) : (
            <View style={styles.infoDisplay}>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.infoLabel}>Nome:</Text>
                <Text variant="bodyMedium" style={styles.infoValue}>{currentCoach.full_name}</Text>
              </View>
              
              {currentCoach.phone && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Telefone:</Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>{currentCoach.phone}</Text>
                </View>
              )}
              
              {currentCoach.bio && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Biografia:</Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>{currentCoach.bio}</Text>
                </View>
              )}
              
              {currentCoach.experience_years && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Experiência:</Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>{currentCoach.experience_years} anos</Text>
                </View>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Especialidades */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            🎯 Especialidades
          </Text>
          <View style={styles.specialtiesContainer}>
            {currentCoach.specialties?.map((specialty, index) => (
              <Chip key={index} style={styles.specialtyChip} mode="outlined">
                {specialty}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Certificações */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            🏆 Certificações
          </Text>
          <View style={styles.certificationsContainer}>
            {currentCoach.certifications?.map((certification, index) => (
              <Chip key={index} style={styles.certificationChip} mode="outlined">
                {certification}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Estatísticas */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            📊 Estatísticas
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {currentCoach.experience_years || 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Anos de Experiência
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {currentCoach.specialties?.length || 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Especialidades
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {currentCoach.certifications?.length || 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Certificações
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Ações */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            ⚙️ Ações
          </Text>
          
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('CoachMain')}
            style={styles.actionButton}
            icon="dashboard"
          >
            Voltar ao Dashboard
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('CoachTeams')}
            style={styles.actionButton}
            icon="trophy"
          >
            Gerenciar Equipes
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('CoachMain', { screen: 'CoachAthletes' })}
            style={styles.actionButton}
            icon="account-group"
          >
            Gerenciar Atletas
          </Button>
        </Card.Content>
      </Card>

      {/* Logout */}
      <Card style={styles.logoutCard}>
        <Card.Content>
          <Button 
            mode="outlined" 
            onPress={handleLogout}
            style={styles.logoutButton}
            icon="logout"
            textColor="#F44336"
          >
            Sair da Conta
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  coachName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  coachEmail: {
    color: '#666',
    marginBottom: 2,
  },
  coachPhone: {
    color: '#666',
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  editButton: {
    borderRadius: 8,
  },
  editForm: {
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  infoDisplay: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    flex: 2,
    textAlign: 'right',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyChip: {
    marginBottom: 8,
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certificationChip: {
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 8,
  },
  logoutCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
    borderRadius: 12,
  },
  logoutButton: {
    borderRadius: 8,
    borderColor: '#F44336',
  },
}); 