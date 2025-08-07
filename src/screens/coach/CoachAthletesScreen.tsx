import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Chip, Portal, Modal, TextInput, HelperText, SegmentedButtons } from 'react-native-paper';
import { useCoachStore } from '../../stores/coach';
import { useAuthStore } from '../../stores/auth';

interface CoachAthletesScreenProps {
  navigation: any;
}

type TabType = 'overview' | 'active' | 'pending' | 'all';

export default function CoachAthletesScreen({ navigation }: CoachAthletesScreenProps) {
  const { 
    loadCoachRelationships,
    deactivateRelationship,
    isLoading,
    relationships,
    activeRelationships,
    teams,
    clearError 
  } = useCoachStore();
  
  const { user, signOut } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('👥 Carregando atletas...');
      await Promise.all([
        loadCoachRelationships(),
        useCoachStore.getState().loadTeams()
      ]);
      
      // Pegar dados atualizados do store
      const { relationships: storeRelationships, activeRelationships: storeActiveRelationships, teams: storeTeams } = useCoachStore.getState();
      
      console.log('👥 Dados carregados:', { 
        relationshipsCount: storeRelationships?.length || 0,
        activeRelationshipsCount: storeActiveRelationships?.length || 0,
        teamsCount: storeTeams?.length || 0,
        relationships: storeRelationships?.map(r => ({ id: r.id, athlete_id: r.athlete_id, status: r.status })),
        activeRelationships: storeActiveRelationships?.map(r => ({ id: r.id, athlete_id: r.athlete_id, status: r.status }))
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

  const handleDeactivateAthlete = async () => {
    if (!selectedAthlete) return;
    
    try {
      await deactivateRelationship(selectedAthlete.id);
      setShowDeactivateModal(false);
      setSelectedAthlete(null);
      setDeactivateReason('');
      await loadData();
    } catch (error) {
      console.error('Erro ao desativar atleta:', error);
    }
  };

  const openDeactivateModal = (athlete: any) => {
    setSelectedAthlete(athlete);
    setShowDeactivateModal(true);
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

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return 'Sem equipe';
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Equipe não encontrada';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'approved':
        return '#2196F3';
      case 'rejected':
        return '#F44336';
      case 'inactive':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'inactive':
        return 'Inativo';
      default:
        return status;
    }
  };

  // Separar corretamente os atletas por status
  const activeAthletes = relationships.filter(r => r.status === 'active') || [];
  const pendingAthletes = relationships.filter(r => r.status === 'pending') || [];
  const approvedAthletes = relationships.filter(r => r.status === 'approved') || [];
  const allAthletes = relationships;

  const renderAthleteCard = (athlete: any, showActions: boolean = true) => (
    <Card key={athlete.id} style={styles.athleteCard}>
      <Card.Content>
        <View style={styles.athleteHeader}>
          <Avatar.Text 
            size={50} 
            label={getInitials(athlete.athlete_name)}
            style={styles.athleteAvatar}
          />
          <View style={styles.athleteInfo}>
            <Text variant="titleMedium" style={styles.athleteName}>
              {athlete.athlete_name || 'Nome não informado'}
            </Text>
            <Text variant="bodySmall" style={styles.athleteEmail}>
              {athlete.athlete_email || 'Email não informado'}
            </Text>
            {athlete.team_id && (
              <Text variant="bodySmall" style={styles.athleteTeam}>
                🏆 {getTeamName(athlete.team_id)}
              </Text>
            )}
            <Text variant="bodySmall" style={styles.athleteDate}>
              📅 {athlete.status === 'pending' ? 'Solicitado' : 'Vinculado'} em {new Date(athlete.approved_at || athlete.requested_at).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <Chip 
            style={[styles.statusChip, { 
              backgroundColor: getStatusColor(athlete.status) + '20',
              borderColor: getStatusColor(athlete.status)
            }]}
            textStyle={{ color: getStatusColor(athlete.status) }}
            mode="outlined"
            compact
          >
            {getStatusLabel(athlete.status)}
          </Chip>
        </View>

        {athlete.notes && (
          <Text variant="bodyMedium" style={styles.athleteNotes}>
            💬 {athlete.notes}
          </Text>
        )}

        {showActions && (
          <View style={styles.athleteActions}>
            {athlete.status === 'active' && (
              <Button 
                mode="outlined" 
                onPress={() => openDeactivateModal(athlete)}
                style={[styles.actionButton, styles.deactivateButton]}
                icon="account-remove"
                textColor="#F44336"
              >
                Desativar
              </Button>
            )}
            {athlete.status === 'pending' && (
              <Button 
                mode="outlined" 
                onPress={() => navigation.navigate('CoachRequests')}
                style={styles.actionButton}
                icon="account-check"
              >
                Gerenciar
              </Button>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderOverviewTab = () => (
    <>
      {/* Estatísticas */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.statsTitle}>
            📊 Resumo
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={[styles.statNumber, { color: '#4CAF50' }]}>
                {activeAthletes.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Ativos
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={[styles.statNumber, { color: '#FF9800' }]}>
                {pendingAthletes.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Pendentes
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={[styles.statNumber, { color: '#2196F3' }]}>
                {approvedAthletes.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Aprovados
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Atletas Ativos */}
      <Card style={styles.athletesCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.athletesTitle}>
            👥 Atletas Ativos ({activeAthletes.length})
          </Text>

          {activeAthletes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                Nenhum atleta ativo
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Os atletas aparecerão aqui após aprovar suas solicitações
              </Text>
            </View>
          ) : (
            activeAthletes.slice(0, 3).map((athlete) => renderAthleteCard(athlete))
          )}

          {activeAthletes.length > 3 && (
            <Button 
              mode="text" 
              onPress={() => setActiveTab('active')}
              style={styles.viewMoreButton}
              icon="chevron-right"
            >
              Ver todos os atletas ativos ({activeAthletes.length})
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Solicitações Pendentes */}
      {pendingAthletes.length > 0 && (
        <Card style={styles.athletesCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.athletesTitle}>
              ⏳ Solicitações Pendentes ({pendingAthletes.length})
            </Text>
            
            {pendingAthletes.slice(0, 2).map((athlete) => renderAthleteCard(athlete, false))}

            {pendingAthletes.length > 2 && (
              <Button 
                mode="text" 
                onPress={() => setActiveTab('pending')}
                style={styles.viewMoreButton}
                icon="chevron-right"
              >
                Ver todas as solicitações ({pendingAthletes.length})
              </Button>
            )}

            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('CoachRequests')}
              style={styles.manageRequestsButton}
              icon="account-check"
            >
              Gerenciar Solicitações
            </Button>
          </Card.Content>
        </Card>
      )}
    </>
  );

  const renderActiveTab = () => (
    <Card style={styles.athletesCard}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.athletesTitle}>
          👥 Atletas Ativos ({activeAthletes.length})
        </Text>

        {activeAthletes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              Nenhum atleta ativo
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Os atletas aparecerão aqui após aprovar suas solicitações
            </Text>
          </View>
        ) : (
          activeAthletes.map((athlete) => renderAthleteCard(athlete))
        )}
      </Card.Content>
    </Card>
  );

  const renderPendingTab = () => (
    <Card style={styles.athletesCard}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.athletesTitle}>
          ⏳ Solicitações Pendentes ({pendingAthletes.length})
        </Text>

        {pendingAthletes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              Nenhuma solicitação pendente
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Novas solicitações aparecerão aqui
            </Text>
          </View>
        ) : (
          <>
            {pendingAthletes.map((athlete) => renderAthleteCard(athlete, false))}
            
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('CoachRequests')}
              style={styles.manageRequestsButton}
              icon="account-check"
            >
              Gerenciar Solicitações
            </Button>
          </>
        )}
      </Card.Content>
    </Card>
  );

  const renderAllTab = () => (
    <Card style={styles.athletesCard}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.athletesTitle}>
          📋 Todos os Relacionamentos ({allAthletes.length})
        </Text>

        {allAthletes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              Nenhum relacionamento encontrado
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Os relacionamentos aparecerão aqui
            </Text>
          </View>
        ) : (
          allAthletes.map((athlete) => renderAthleteCard(athlete, false))
        )}
      </Card.Content>
    </Card>
  );

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
              👥 Meus Atletas
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Gerencie os atletas vinculados ao seu perfil
            </Text>
          </Card.Content>
        </Card>

        {/* Abas de Navegação */}
        <Card style={styles.tabsCard}>
          <Card.Content>
            <SegmentedButtons
              value={activeTab}
              onValueChange={setActiveTab as (value: string) => void}
              buttons={[
                { value: 'overview', label: 'Visão Geral', icon: 'view-dashboard' },
                { value: 'active', label: `Ativos (${activeAthletes.length})`, icon: 'account-check' },
                { value: 'pending', label: `Pendentes (${pendingAthletes.length})`, icon: 'clock' },
                { value: 'all', label: 'Todos', icon: 'format-list-bulleted' },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Conteúdo das Abas */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'active' && renderActiveTab()}
        {activeTab === 'pending' && renderPendingTab()}
        {activeTab === 'all' && renderAllTab()}

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

      {/* Modal para desativar atleta */}
      <Portal>
        <Modal
          visible={showDeactivateModal}
          onDismiss={() => setShowDeactivateModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Desativar Vínculo
              </Text>
              
              {selectedAthlete && (
                <View style={styles.modalAthleteInfo}>
                  <Avatar.Text 
                    size={40} 
                    label={getInitials(selectedAthlete.athlete_name)}
                    style={styles.modalAthleteAvatar}
                  />
                  <View style={styles.modalAthleteDetails}>
                    <Text variant="titleMedium" style={styles.modalAthleteName}>
                      {selectedAthlete.athlete_name || 'Nome não informado'}
                    </Text>
                    <Text variant="bodySmall" style={styles.modalAthleteEmail}>
                      {selectedAthlete.athlete_email || 'Email não informado'}
                    </Text>
                  </View>
                </View>
              )}
              
              <TextInput
                label="Motivo da desativação (opcional)"
                value={deactivateReason}
                onChangeText={setDeactivateReason}
                style={styles.modalInput}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="Explique o motivo da desativação..."
              />
              
              <HelperText type="info">
                O atleta será notificado da desativação e poderá solicitar vínculo novamente no futuro.
              </HelperText>
              
              <View style={styles.modalActions}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowDeactivateModal(false)}
                  style={styles.modalButton}
                >
                  Cancelar
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleDeactivateAthlete}
                  style={[styles.modalButton, styles.deactivateButton]}
                  loading={isLoading}
                >
                  Desativar
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
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  statsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
  },
  athletesCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  athletesTitle: {
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
  athleteCard: {
    marginBottom: 16,
    elevation: 1,
    borderRadius: 8,
  },
  athleteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    marginBottom: 2,
  },
  athleteTeam: {
    color: '#666',
    marginBottom: 2,
  },
  athleteDate: {
    color: '#666',
    fontSize: 12,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  athleteNotes: {
    marginBottom: 12,
    fontStyle: 'italic',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  athleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    borderRadius: 8,
  },
  deactivateButton: {
    borderColor: '#F44336',
  },
  viewMoreButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  manageRequestsButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  modalContainer: {
    margin: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalAthleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  modalAthleteAvatar: {
    marginRight: 12,
  },
  modalAthleteDetails: {
    flex: 1,
  },
  modalAthleteName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modalAthleteEmail: {
    color: '#666',
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
  segmentedButtons: {
    marginBottom: 16,
  },
  tabsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
}); 