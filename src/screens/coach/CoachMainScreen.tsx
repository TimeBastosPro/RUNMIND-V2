import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Chip, FAB, Portal, Modal, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCoachStore } from '../../stores/coach';
import { useAuthStore } from '../../stores/auth';

interface CoachMainScreenProps {
  navigation: any;
}

export default function CoachMainScreen({ navigation }: CoachMainScreenProps) {
  const { 
    currentCoach, 
    teams, 
    activeRelationships, 
    loadCoachProfile, 
    loadTeams, 
    loadCoachRelationships,
    createTeam,
    isLoading 
  } = useCoachStore();
  
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadCoachProfile(),
        loadTeams(),
        loadCoachRelationships()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    try {
      if (!currentCoach?.id) {
        throw new Error('Perfil de treinador não encontrado');
      }
      
      await createTeam({
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined,
        is_active: true,
        coach_id: currentCoach.id,
      });
      setShowCreateTeamModal(false);
      setNewTeamName('');
      setNewTeamDescription('');
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'rejected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      default: return 'Inativo';
    }
  };

  if (!currentCoach) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando perfil de treinador...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header do Treinador */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.profileHeader}>
              <Avatar.Text 
                size={60} 
                label={currentCoach.full_name.split(' ').map(n => n[0]).join('').toUpperCase()} 
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.coachName}>
                  {currentCoach.full_name}
                </Text>
                <Text variant="bodyMedium" style={styles.coachEmail}>
                  {currentCoach.email}
                </Text>
                {currentCoach.experience_years && (
                  <Text variant="bodySmall" style={styles.experience}>
                    {currentCoach.experience_years} anos de experiência
                  </Text>
                )}
              </View>
            </View>
            
            {currentCoach.specialties && currentCoach.specialties.length > 0 && (
              <View style={styles.specialtiesContainer}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Especialidades:
                </Text>
                <View style={styles.chipContainer}>
                  {currentCoach.specialties.slice(0, 3).map((specialty, index) => (
                    <Chip key={index} style={styles.chip} mode="outlined">
                      {specialty}
                    </Chip>
                  ))}
                  {currentCoach.specialties.length > 3 && (
                    <Chip style={styles.chip} mode="outlined">
                      +{currentCoach.specialties.length - 3} mais
                    </Chip>
                  )}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Estatísticas Rápidas */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="account-group" size={32} color="#2196F3" />
              <Text variant="headlineMedium" style={styles.statNumber}>
                {activeRelationships.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Atletas Ativos
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="trophy" size={32} color="#FF9800" />
              <Text variant="headlineMedium" style={styles.statNumber}>
                {teams.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Equipes
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Equipes */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Minhas Equipes
              </Text>
              <Button 
                mode="text" 
                onPress={() => setShowCreateTeamModal(true)}
                icon="plus"
              >
                Nova Equipe
              </Button>
            </View>
            
            {teams.length === 0 ? (
              <Text style={styles.emptyText}>
                Você ainda não tem equipes. Crie sua primeira equipe para começar!
              </Text>
            ) : (
              teams.map((team) => (
                <Card key={team.id} style={styles.teamCard}>
                  <Card.Content>
                    <Text variant="titleMedium" style={styles.teamName}>
                      {team.name}
                    </Text>
                    {team.description && (
                      <Text variant="bodyMedium" style={styles.teamDescription}>
                        {team.description}
                      </Text>
                    )}
                    <Button 
                      mode="outlined" 
                      onPress={() => navigation.navigate('TeamDetails', { teamId: team.id })}
                      style={styles.teamButton}
                    >
                      Ver Detalhes
                    </Button>
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Atletas Recentes */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Atletas Recentes
              </Text>
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('AthletesList')}
              >
                Ver Todos
              </Button>
            </View>
            
            {activeRelationships.length === 0 ? (
              <Text style={styles.emptyText}>
                Você ainda não tem atletas vinculados. Os atletas aparecerão aqui quando solicitarem vinculação.
              </Text>
            ) : (
              activeRelationships.slice(0, 3).map((relationship) => (
                <Card key={relationship.id} style={styles.athleteCard}>
                  <Card.Content>
                    <View style={styles.athleteHeader}>
                      <Avatar.Text 
                        size={40} 
                        label={relationship.athlete_name.split(' ').map(n => n[0]).join('').toUpperCase()} 
                      />
                      <View style={styles.athleteInfo}>
                        <Text variant="titleMedium" style={styles.athleteName}>
                          {relationship.athlete_name}
                        </Text>
                        <Text variant="bodySmall" style={styles.athleteEmail}>
                          {relationship.athlete_email}
                        </Text>
                        {relationship.team_name && (
                          <Chip style={styles.teamChip} mode="outlined">
                            {relationship.team_name}
                          </Chip>
                        )}
                      </View>
                    </View>
                    <Button 
                      mode="outlined" 
                      onPress={() => navigation.navigate('AthleteDetails', { athleteId: relationship.athlete_id })}
                      style={styles.athleteButton}
                    >
                      Ver Perfil
                    </Button>
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB para ações rápidas */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('QuickActions')}
      />

      {/* Modal para criar equipe */}
      <Portal>
        <Modal
          visible={showCreateTeamModal}
          onDismiss={() => setShowCreateTeamModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Nova Equipe
              </Text>
              
              <TextInput
                label="Nome da Equipe"
                value={newTeamName}
                onChangeText={setNewTeamName}
                style={styles.modalInput}
                mode="outlined"
              />
              
              <TextInput
                label="Descrição (opcional)"
                value={newTeamDescription}
                onChangeText={setNewTeamDescription}
                style={styles.modalInput}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.modalButtons}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowCreateTeamModal(false)}
                  style={styles.modalButton}
                >
                  Cancelar
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleCreateTeam}
                  loading={isLoading}
                  disabled={!newTeamName.trim() || isLoading}
                  style={styles.modalButton}
                >
                  Criar
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 12,
  },
  profileContent: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 4,
  },
  experience: {
    color: '#888',
  },
  specialtiesContainer: {
    marginTop: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    elevation: 2,
    borderRadius: 8,
  },
  statContent: {
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
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
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  teamCard: {
    marginBottom: 12,
    elevation: 1,
    borderRadius: 8,
  },
  teamName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teamDescription: {
    color: '#666',
    marginBottom: 12,
  },
  teamButton: {
    alignSelf: 'flex-start',
  },
  athleteCard: {
    marginBottom: 12,
    elevation: 1,
    borderRadius: 8,
  },
  athleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  athleteInfo: {
    flex: 1,
    marginLeft: 12,
  },
  athleteName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  athleteEmail: {
    color: '#666',
    marginBottom: 4,
  },
  teamChip: {
    alignSelf: 'flex-start',
  },
  athleteButton: {
    alignSelf: 'flex-start',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
}); 