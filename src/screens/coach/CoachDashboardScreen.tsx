import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Chip, FAB, Portal, Modal, TextInput, HelperText } from 'react-native-paper';
import { useCoachStore } from '../../stores/coach';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../services/supabase';

interface CoachDashboardScreenProps {
  navigation: any;
}

export default function CoachDashboardScreen({ navigation }: CoachDashboardScreenProps) {
  const { 
    currentCoach, 
    teams, 
    activeRelationships, 
    isLoading,
    loadCoachProfile, 
    loadTeams, 
    loadCoachRelationships,
    createTeam,
    clearError 
  } = useCoachStore();
  
  const { user, signOut } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        loadCoachProfile(),
        loadTeams(),
        loadCoachRelationships()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    try {
      await createTeam({
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined
      });
      setShowCreateTeamModal(false);
      setNewTeamName('');
      setNewTeamDescription('');
      await loadTeams();
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
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
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header com informações do treinador */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Text 
                size={60} 
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
            
            {currentCoach.bio && (
              <Text variant="bodyMedium" style={styles.bio}>
                {currentCoach.bio}
              </Text>
            )}

            <View style={styles.specialtiesContainer}>
              {currentCoach.specialties?.map((specialty, index) => (
                <Chip key={index} style={styles.specialtyChip} mode="outlined">
                  {specialty}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Estatísticas rápidas */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {activeRelationships.length}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Atletas Ativos
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {teams.length}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Equipes
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {currentCoach.experience_years || 0}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Anos Exp.
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Seção de Equipes */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                🏆 Minhas Equipes
              </Text>
              <Button 
                mode="contained" 
                onPress={() => setShowCreateTeamModal(true)}
                style={styles.addButton}
              >
                + Nova Equipe
              </Button>
            </View>

            {teams.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  Você ainda não tem equipes criadas
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Crie sua primeira equipe para começar a organizar seus atletas
                </Text>
              </View>
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
                    <View style={styles.teamStats}>
                      <Text variant="bodySmall">
                        📊 {activeRelationships.filter(r => r.team_id === team.id).length} atletas
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Seção de Atletas Recentes */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              👥 Atletas Recentes
            </Text>

            {activeRelationships.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  Nenhum atleta vinculado ainda
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Os atletas aparecerão aqui quando se vincularem a você
                </Text>
              </View>
            ) : (
              activeRelationships.slice(0, 5).map((relationship) => (
                <Card key={relationship.id} style={styles.athleteCard}>
                  <Card.Content>
                    <View style={styles.athleteInfo}>
                      <Avatar.Text 
                        size={40} 
                        label={getInitials(relationship.athlete_name)}
                        style={styles.athleteAvatar}
                      />
                      <View style={styles.athleteDetails}>
                        <Text variant="titleMedium" style={styles.athleteName}>
                          {relationship.athlete_name}
                        </Text>
                        <Text variant="bodySmall" style={styles.athleteEmail}>
                          {relationship.athlete_email}
                        </Text>
                        {relationship.team_name && (
                          <Chip style={styles.teamChip} mode="outlined" compact>
                            {relationship.team_name}
                          </Chip>
                        )}
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}

            {activeRelationships.length > 5 && (
              <Button 
                mode="outlined" 
                onPress={() => navigation.navigate('CoachAthletes')}
                style={styles.viewAllButton}
              >
                Ver todos os atletas ({activeRelationships.length})
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Ações rápidas */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              ⚡ Ações Rápidas
            </Text>
            
            <View style={styles.actionsContainer}>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('CoachAthletes')}
                style={styles.actionButton}
                icon="account-group"
              >
                Gerenciar Atletas
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
                onPress={() => navigation.navigate('CoachRequests')}
                style={styles.actionButton}
                icon="account-plus"
              >
                Solicitações ({activeRelationships.filter(r => r.status === 'pending').length})
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={() => navigation.navigate('CoachProfile')}
                style={styles.actionButton}
                icon="account-cog"
              >
                Meu Perfil
              </Button>
            </View>
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

      {/* Modal para criar nova equipe */}
      <Portal>
        <Modal
          visible={showCreateTeamModal}
          onDismiss={() => setShowCreateTeamModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Criar Nova Equipe
              </Text>
              
              <TextInput
                label="Nome da Equipe *"
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
              
              <View style={styles.modalActions}>
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
                  style={styles.modalButton}
                  disabled={!newTeamName.trim()}
                >
                  Criar Equipe
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
    marginBottom: 2,
  },
  coachPhone: {
    color: '#666',
  },
  bio: {
    marginBottom: 16,
    fontStyle: 'italic',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyChip: {
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    elevation: 2,
    borderRadius: 8,
  },
  statNumber: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2196F3',
  },
  statLabel: {
    textAlign: 'center',
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
  addButton: {
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#666',
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
    marginBottom: 8,
  },
  teamStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  athleteCard: {
    marginBottom: 12,
    elevation: 1,
    borderRadius: 8,
  },
  athleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  athleteAvatar: {
    marginRight: 12,
  },
  athleteDetails: {
    flex: 1,
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
  viewAllButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  modalContainer: {
    margin: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
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