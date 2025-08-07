import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, Avatar, Chip, Portal, Modal, TextInput, HelperText, IconButton } from 'react-native-paper';
import { useCoachStore } from '../../stores/coach';
import { useAuthStore } from '../../stores/auth';

interface CoachTeamsScreenProps {
  navigation: any;
}

export default function CoachTeamsScreen({ navigation }: CoachTeamsScreenProps) {
  const { 
    loadTeams,
    updateTeam,
    deleteTeam,
    loadCoachRelationships,
    isLoading,
    teams,
    relationships,
    clearError 
  } = useCoachStore();
  
  const { user, signOut } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🏆 Carregando equipes...');
      await Promise.all([
        loadTeams(),
        loadCoachRelationships()
      ]);
      console.log('🏆 Dados carregados:', { 
        teamsCount: teams?.length || 0, 
        relationshipsCount: relationships?.length || 0 
      });
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
    if (!teamName.trim()) return;
    
    try {
      // Usar a função createTeam do store
      await useCoachStore.getState().createTeam({
        name: teamName.trim(),
        description: teamDescription.trim() || undefined
      });
      
      setShowCreateModal(false);
      setTeamName('');
      setTeamDescription('');
      await loadData();
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
    }
  };

  const handleEditTeam = async () => {
    if (!selectedTeam || !teamName.trim()) return;
    
    try {
      await updateTeam(selectedTeam.id, {
        name: teamName.trim(),
        description: teamDescription.trim() || undefined
      });
      
      setShowEditModal(false);
      setSelectedTeam(null);
      setTeamName('');
      setTeamDescription('');
      await loadData();
    } catch (error) {
      console.error('Erro ao editar equipe:', error);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;
    
    try {
      await deleteTeam(selectedTeam.id);
      setShowDeleteModal(false);
      setSelectedTeam(null);
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar equipe:', error);
    }
  };

  const openEditModal = (team: any) => {
    setSelectedTeam(team);
    setTeamName(team.name);
    setTeamDescription(team.description || '');
    setShowEditModal(true);
  };

  const openDeleteModal = (team: any) => {
    setSelectedTeam(team);
    setShowDeleteModal(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') {
      return '??';
    }
    
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTeamAthletes = (teamId: string) => {
    return relationships.filter(r => r.team_id === teamId && r.status === 'active');
  };

  const activeTeams = teams.filter(team => team.is_active);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              🏆 Minhas Equipes
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Gerencie suas equipes e visualize os atletas vinculados
            </Text>
          </Card.Content>
        </Card>

        {/* Botão Criar Equipe */}
        <Card style={styles.createCard}>
          <Card.Content>
            <Button 
              mode="contained" 
              onPress={() => setShowCreateModal(true)}
              style={styles.createButton}
              icon="plus"
            >
              Criar Nova Equipe
            </Button>
          </Card.Content>
        </Card>

        {/* Lista de Equipes */}
        <Card style={styles.teamsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.teamsTitle}>
              Equipes Ativas ({activeTeams.length})
            </Text>

            {activeTeams.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  Nenhuma equipe criada
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Crie sua primeira equipe para começar a organizar seus atletas
                </Text>
              </View>
            ) : (
              activeTeams.map((team) => {
                const teamAthletes = getTeamAthletes(team.id);
                return (
                  <Card key={team.id} style={styles.teamCard}>
                    <Card.Content>
                      <View style={styles.teamHeader}>
                        <View style={styles.teamInfo}>
                          <Text variant="titleMedium" style={styles.teamName}>
                            {team.name}
                          </Text>
                          {team.description && (
                            <Text variant="bodySmall" style={styles.teamDescription}>
                              {team.description}
                            </Text>
                          )}
                          <Text variant="bodySmall" style={styles.teamStats}>
                            📊 {teamAthletes.length} atleta{teamAthletes.length !== 1 ? 's' : ''} vinculado{teamAthletes.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        <View style={styles.teamActions}>
                          <IconButton
                            icon="pencil"
                            size={20}
                            onPress={() => openEditModal(team)}
                            style={styles.actionIcon}
                          />
                          <IconButton
                            icon="delete"
                            size={20}
                            onPress={() => openDeleteModal(team)}
                            style={[styles.actionIcon, styles.deleteIcon]}
                          />
                        </View>
                      </View>

                      {/* Lista de Atletas da Equipe */}
                      {teamAthletes.length > 0 && (
                        <View style={styles.athletesSection}>
                          <Text variant="titleSmall" style={styles.athletesTitle}>
                            Atletas da Equipe
                          </Text>
                          {teamAthletes.map((athlete) => (
                            <View key={athlete.id} style={styles.athleteItem}>
                              <Avatar.Text 
                                size={32} 
                                label={getInitials(athlete.athlete_name)}
                                style={styles.athleteAvatar}
                              />
                              <View style={styles.athleteInfo}>
                                <Text variant="bodyMedium" style={styles.athleteName}>
                                  {athlete.athlete_name || 'Nome não informado'}
                                </Text>
                                <Text variant="bodySmall" style={styles.athleteEmail}>
                                  {athlete.athlete_email || 'Email não informado'}
                                </Text>
                              </View>
                              <Chip 
                                style={styles.statusChip}
                                textStyle={{ color: '#4CAF50' }}
                                mode="outlined"
                                compact
                              >
                                Ativo
                              </Chip>
                            </View>
                          ))}
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                );
              })
            )}
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

      {/* Modal para criar equipe */}
      <Portal>
        <Modal
          visible={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Criar Nova Equipe
              </Text>
              
              <TextInput
                label="Nome da Equipe *"
                value={teamName}
                onChangeText={setTeamName}
                style={styles.modalInput}
                mode="outlined"
              />
              
              <TextInput
                label="Descrição (opcional)"
                value={teamDescription}
                onChangeText={setTeamDescription}
                style={styles.modalInput}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.modalActions}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowCreateModal(false)}
                  style={styles.modalButton}
                >
                  Cancelar
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleCreateTeam}
                  style={styles.modalButton}
                  disabled={!teamName.trim()}
                  loading={isLoading}
                >
                  Criar Equipe
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Modal para editar equipe */}
      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => setShowEditModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Editar Equipe
              </Text>
              
              <TextInput
                label="Nome da Equipe *"
                value={teamName}
                onChangeText={setTeamName}
                style={styles.modalInput}
                mode="outlined"
              />
              
              <TextInput
                label="Descrição (opcional)"
                value={teamDescription}
                onChangeText={setTeamDescription}
                style={styles.modalInput}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.modalActions}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowEditModal(false)}
                  style={styles.modalButton}
                >
                  Cancelar
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleEditTeam}
                  style={styles.modalButton}
                  disabled={!teamName.trim()}
                  loading={isLoading}
                >
                  Salvar Alterações
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Modal para confirmar exclusão */}
      <Portal>
        <Modal
          visible={showDeleteModal}
          onDismiss={() => setShowDeleteModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Confirmar Exclusão
              </Text>
              
              <Text variant="bodyMedium" style={styles.deleteWarning}>
                Tem certeza que deseja excluir a equipe "{selectedTeam?.name}"?
              </Text>
              
              <Text variant="bodySmall" style={styles.deleteInfo}>
                ⚠️ Esta ação não pode ser desfeita. Os atletas vinculados à equipe não serão excluídos, mas perderão a associação com esta equipe.
              </Text>
              
              <View style={styles.modalActions}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowDeleteModal(false)}
                  style={styles.modalButton}
                >
                  Cancelar
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleDeleteTeam}
                  style={[styles.modalButton, styles.deleteButton]}
                  loading={isLoading}
                >
                  Excluir Equipe
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
  headerCard: {
    margin: 16,
    elevation: 2,
    borderRadius: 12,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  createCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  createButton: {
    borderRadius: 8,
  },
  teamsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  teamsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
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
    marginBottom: 16,
    elevation: 1,
    borderRadius: 8,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teamDescription: {
    color: '#666',
    marginBottom: 4,
  },
  teamStats: {
    color: '#666',
    fontSize: 12,
  },
  teamActions: {
    flexDirection: 'row',
  },
  actionIcon: {
    margin: 0,
  },
  deleteIcon: {
    backgroundColor: '#ffebee',
  },
  athletesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  athletesTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  athleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  athleteAvatar: {
    marginRight: 12,
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  athleteEmail: {
    color: '#666',
    fontSize: 12,
  },
  statusChip: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  modalContainer: {
    margin: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  deleteWarning: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  deleteInfo: {
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
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