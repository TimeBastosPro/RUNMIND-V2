import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, Avatar, Chip, Portal, Modal, TextInput, HelperText, SegmentedButtons, ActivityIndicator, Snackbar, Appbar } from 'react-native-paper';
import { useCoachStore } from '../../stores/coach';
import { useAuthStore } from '../../stores/auth';
import { useViewStore } from '../../stores/view';
import { AthleteCoachRelationship } from '../../types/database';

interface CoachAthletesScreenProps {
  navigation: any;
  route?: { params?: { initialTab?: TabType } };
}

type TabType = 'overview' | 'active' | 'pending' | 'all';

// Tipo estendido para incluir campos processados pelo store
interface ExtendedRelationship extends AthleteCoachRelationship {
  athlete_name?: string;
  athlete_email?: string;
  coach_name?: string;
  coach_email?: string;
  team_name?: string;
}

export default function CoachAthletesScreen({ navigation, route }: CoachAthletesScreenProps) {
  const { 
    loadCoachRelationships,
    deactivateRelationship,
    approveRelationship,
    rejectRelationship,
    relationships,
    isLoading,
    clearError,
    error,
    loadTeams,
    teams 
  } = useCoachStore();

  const { signOut } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('overview');
  const [selectedAthlete, setSelectedAthlete] = useState<ExtendedRelationship | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'deactivate'>('approve');
  const [actionNotes, setActionNotes] = useState('');
  const [isActing, setIsActing] = useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Filtros
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedModality, setSelectedModality] = useState<string>('all');

  useEffect(() => {
    const init = async () => {
      try {
        if (!useCoachStore.getState().currentCoach) {
          await useCoachStore.getState().loadCoachProfile();
        }
        await Promise.all([loadRelationships(), loadTeams()]);
        if (route?.params?.initialTab) {
          setSelectedTab(route.params.initialTab);
        }
      } catch (e) {
        console.error('❌ Erro ao inicializar tela de atletas:', e);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (error) {
      console.error('❌ Erro na tela de atletas:', error);
      Alert.alert('Erro', error);
      clearError();
    }
  }, [error]);

  const loadRelationships = async () => {
    try {
      await loadCoachRelationships();
      console.log('✅ Relacionamentos carregados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar relacionamentos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRelationships(), loadTeams()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Fazendo logout...');
              await signOut();
              console.log('✅ Logout realizado com sucesso');
            } catch (error) {
              console.error('❌ Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Não foi possível sair da conta. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  const handleAction = async () => {
    if (!selectedAthlete) return;
    setIsActing(selectedAthlete.id);
    try {
      console.log(`🔄 Executando ação: ${actionType}`, { athleteId: selectedAthlete.id, notes: actionNotes });
      let result;
      switch (actionType) {
        case 'approve':
          result = await approveRelationship(selectedAthlete.id, undefined, actionNotes);
          break;
        case 'reject':
          result = await rejectRelationship(selectedAthlete.id, actionNotes);
          break;
        case 'deactivate':
          result = await deactivateRelationship(selectedAthlete.id);
          break;
      }
      if (result) {
        setShowActionModal(false);
        setSelectedAthlete(null);
        setActionNotes('');
        const actionText = { approve: 'aprovado', reject: 'rejeitado', deactivate: 'desativado' }[actionType];
        setSuccessMessage(`Atleta ${actionText} com sucesso!`);
        setShowSuccessSnackbar(true);
      }
    } catch (error: any) {
      console.error(`❌ Erro ao executar ação ${actionType}:`, error);
      Alert.alert('Erro', `Não foi possível ${actionType === 'approve' ? 'aprovar' : actionType === 'reject' ? 'rejeitar' : 'desativar'} o atleta. Tente novamente.`);
    } finally {
      setIsActing(null);
    }
  };

  const openActionModal = (athlete: ExtendedRelationship, type: 'approve' | 'reject' | 'deactivate') => {
    setSelectedAthlete(athlete);
    setActionType(type);
    setActionNotes('');
    setShowActionModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'rejected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'Ativo';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      default: return 'Inativo';
    }
  };

  const getInitials = (nameOrEmail: string | undefined | null) => {
    const source = (nameOrEmail && typeof nameOrEmail === 'string' && nameOrEmail.trim()) ? nameOrEmail : '??';
    return source
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActiveStatus = (status: string) => ['active', 'approved'].includes(status);

  // Filtros aplicados
  const getFilteredRelationships = () => {
    const extendedRelationships = (relationships as ExtendedRelationship[])
      .filter(r => (selectedTeamId ? r.team_id === selectedTeamId : true))
      .filter(r => (selectedModality !== 'all' ? (r as any).modality === selectedModality : true));

    switch (selectedTab) {
      case 'active':
        return extendedRelationships.filter(r => isActiveStatus((r.status as string)));
      case 'pending':
        return extendedRelationships.filter(r => r.status === 'pending');
      case 'all':
        return extendedRelationships;
      default:
        return extendedRelationships;
    }
  };

  const filteredRelationships = getFilteredRelationships();

  // Estatísticas para a tab overview (considera filtros)
  const activeCount = relationships.filter(r => isActiveStatus((r.status as string))).length;
  const pendingCount = relationships.filter(r => r.status === 'pending').length;
  const totalCount = relationships.length;

  // Modalidades disponíveis (derivadas)
  const availableModalities = Array.from(new Set((relationships as any[]).map(r => r.modality).filter(Boolean))) as string[];

  const getActionButtonText = (type: 'approve' | 'reject' | 'deactivate') => {
    switch (type) {
      case 'approve': return 'Aprovar';
      case 'reject': return 'Rejeitar';
      case 'deactivate': return 'Desativar';
    }
  };

  const getActionModalTitle = (type: 'approve' | 'reject' | 'deactivate') => {
    switch (type) {
      case 'approve': return '✅ Aprovar Atleta';
      case 'reject': return '❌ Rejeitar Atleta';
      case 'deactivate': return '⚠️ Desativar Atleta';
    }
  };

  const getActionModalDescription = (type: 'approve' | 'reject' | 'deactivate') => {
    switch (type) {
      case 'approve': return 'Confirma que deseja aprovar este atleta? Ele terá acesso ao seu perfil e poderá ver seus dados de treino.';
      case 'reject': return 'Confirma que deseja rejeitar este atleta? A solicitação será cancelada e o atleta será notificado.';
      case 'deactivate': return 'Confirma que deseja desativar este atleta? Ele perderá acesso ao seu perfil, mas a relação poderá ser reativada posteriormente.';
    }
  };

  const getActionNotesPlaceholder = (type: 'approve' | 'reject' | 'deactivate') => {
    switch (type) {
      case 'approve': return 'Mensagem de boas-vindas (opcional)...';
      case 'reject': return 'Motivo da rejeição (opcional)...';
      case 'deactivate': return 'Motivo da desativação (opcional)...';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header com botão de logout e atualizar */}
      <Appbar.Header style={styles.header} elevated>
        <Appbar.Content title="Meus Atletas" titleStyle={styles.headerTitle} />
        <Appbar.Action icon="refresh" onPress={onRefresh} iconColor="#FFFFFF" size={24} />
        <Appbar.Action 
          icon="logout" 
          onPress={handleLogout}
          iconColor="#FFFFFF"
          size={24}
        />
      </Appbar.Header>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Tabs de navegação */}
        <View style={styles.tabsContainer}>
          <SegmentedButtons
            value={selectedTab}
            onValueChange={setSelectedTab}
            buttons={[
              { value: 'overview', label: 'Visão Geral' },
              { value: 'active', label: `Ativos (${activeCount})` },
              { value: 'pending', label: `Pendentes (${pendingCount})` },
              { value: 'all', label: `Todos (${totalCount})` },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Filtros por equipe e modalidade */}
        <Card style={styles.filtersCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>Filtros</Text>
            <View style={styles.filtersRow}>
              <View style={styles.filterGroup}>
                <Text variant="bodySmall" style={styles.filterLabel}>Equipe</Text>
                <View style={styles.chipRow}>
                  <Chip
                    selected={!selectedTeamId}
                    onPress={() => setSelectedTeamId(null)}
                    style={styles.filterChip}
                  >
                    Todas
                  </Chip>
                  {teams.map((team) => (
                    <Chip
                      key={team.id}
                      selected={selectedTeamId === team.id}
                      onPress={() => setSelectedTeamId(team.id)}
                      style={styles.filterChip}
                    >
                      {team.name}
                    </Chip>
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text variant="bodySmall" style={styles.filterLabel}>Modalidade</Text>
                <View style={styles.chipRow}>
                  <Chip
                    selected={selectedModality === 'all'}
                    onPress={() => setSelectedModality('all')}
                    style={styles.filterChip}
                  >
                    Todas
                  </Chip>
                  {availableModalities.map((m) => (
                    <Chip
                      key={m}
                      selected={selectedModality === m}
                      onPress={() => setSelectedModality(m)}
                      style={styles.filterChip}
                    >
                      {m}
                    </Chip>
                  ))}
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Conteúdo baseado na tab selecionada */}
        {selectedTab === 'overview' && (
          <View style={styles.overviewContainer}>
            {/* Estatísticas */}
            <View style={styles.statsContainer}>
              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <Text variant="headlineMedium" style={[styles.statNumber, { color: '#4CAF50' }]}>
                    {activeCount}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Atletas Ativos
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <Text variant="headlineMedium" style={[styles.statNumber, { color: '#FF9800' }]}>
                    {pendingCount}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Solicitações Pendentes
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <Text variant="headlineMedium" style={[styles.statNumber, { color: '#2196F3' }]}>
                    {totalCount}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Total de Relacionamentos
                  </Text>
                </Card.Content>
              </Card>
            </View>

            {/* Lista de atletas ativos vinculados */}
            <Card style={styles.sectionCard}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.sectionTitle}>👥 Atletas Ativos Vinculados</Text>
                {relationships.filter(r => isActiveStatus(r.status as string)).length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text variant="bodyLarge" style={styles.emptyText}>Nenhum atleta ativo</Text>
                    <Text variant="bodyMedium" style={styles.emptySubtext}>Aparecerão aqui após as aprovações</Text>
                  </View>
                ) : (
                  relationships.filter(r => isActiveStatus(r.status as string)).map((relationship) => (
                    <Card key={relationship.id} style={styles.athleteCard}>
                      <Card.Content>
                        <View style={styles.athleteHeader}>
                          <Avatar.Text size={40} label={getInitials(((relationship as any).athlete_name || (relationship as any).athlete_email || '??'))} />
                          <View style={styles.athleteInfo}>
                            <Text variant="titleMedium" style={styles.athleteName}>{(relationship as any).athlete_name || 'Sem nome'}</Text>
                            <Text variant="bodySmall" style={styles.athleteEmail}>{(relationship as any).athlete_email || 'Sem email'}</Text>
                            {(relationship as any).team_name && (
                              <Chip style={styles.teamChip} mode="outlined">{(relationship as any).team_name}</Chip>
                            )}
                          </View>
                        </View>

                        {/* Ações rápidas para ativos */}
                        <View style={styles.actionButtons}>
                          {/* Mensageria removida nesta seção para evitar conflito de navegação */}
                          <Button
                            mode="contained"
                            icon="account-off"
                            onPress={() => openActionModal(relationship as any, 'deactivate')}
                            style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                          >
                            Desativar
                          </Button>
                          {/* Ver Perfil habilitado na Visão Geral: abre o perfil esportivo do atleta no fluxo principal */}
                          <Button
                            mode="outlined"
                            icon="account-details"
                            onPress={() => {
                              useViewStore.getState().enterCoachView((relationship as any).athlete_id, (relationship as any).athlete_name || (relationship as any).athlete_email);
                              navigation.navigate('Main', { screen: 'Perfil Esportivo' });
                            }}
                            style={styles.actionButton}
                          >
                            Ver Perfil
                          </Button>
                        </View>
                      </Card.Content>
                    </Card>
                  ))
                )}
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Lista de atletas */}
        {selectedTab !== 'overview' && (
          <View style={styles.listContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Carregando atletas...</Text>
              </View>
            ) : filteredRelationships.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  {selectedTab === 'active' ? 'Nenhum atleta ativo' : 
                   selectedTab === 'pending' ? 'Nenhuma solicitação pendente' : 
                   'Nenhum relacionamento encontrado'}
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  {selectedTab === 'active' ? 'Os atletas aparecerão aqui quando forem aprovados' :
                   selectedTab === 'pending' ? 'As solicitações aparecerão aqui quando atletas solicitarem treinamento' :
                   'Nenhum relacionamento foi encontrado'}
                </Text>
              </View>
            ) : (
              filteredRelationships.map((relationship) => (
                <Card key={relationship.id} style={styles.athleteCard}>
                  <Card.Content>
                    <View style={styles.athleteHeader}>
                      <Avatar.Text 
                        size={50} 
                        label={getInitials((relationship as any).athlete_name || (relationship as any).athlete_email || '??')} 
                        style={styles.avatar}
                      />
                      <View style={styles.athleteInfo}>
                        <Text variant="titleMedium" style={styles.athleteName}>
                          {(relationship as any).athlete_name || 'Sem nome'}
                        </Text>
                        <Text variant="bodySmall" style={styles.athleteEmail}>
                          {(relationship as any).athlete_email || 'Sem email'}
                        </Text>
                        <Chip 
                          style={[styles.statusChip, { backgroundColor: getStatusColor(relationship.status as string) }]}
                          textStyle={styles.statusChipText}
                        >
                          {getStatusText(relationship.status as string)}
                        </Chip>
                      </View>
                    </View>

                    {/* Informações adicionais */}
                    {(relationship as any).team_name && (
                      <View style={styles.infoRow}>
                        <Text variant="bodySmall" style={styles.infoLabel}>
                          Equipe:
                        </Text>
                        <Text variant="bodyMedium" style={styles.infoValue}>
                          {(relationship as any).team_name}
                        </Text>
                      </View>
                    )}

                    {(relationship as any).notes && (
                      <View style={styles.infoRow}>
                        <Text variant="bodySmall" style={styles.infoLabel}>
                          Observações:
                        </Text>
                        <Text variant="bodyMedium" style={styles.infoValue}>
                          {(relationship as any).notes
                          }
                        </Text>
                      </View>
                    )}

                    {/* Botões de ação */}
                    <View style={styles.actionButtons}>
                      {relationship.status === 'pending' && (
                        <>
                          <Button 
                            mode="contained" 
                            onPress={() => openActionModal(relationship as any, 'approve')}
                            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                            icon="check"
                            loading={isActing === relationship.id}
                            disabled={isActing !== null}
                          >
                            Aprovar
                          </Button>
                          <Button 
                            mode="contained" 
                            onPress={() => openActionModal(relationship as any, 'reject')}
                            style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                            icon="close"
                            loading={isActing === relationship.id}
                            disabled={isActing !== null}
                          >
                            Rejeitar
                          </Button>
                          {/* Lote por atleta */}
                          <Button 
                            mode="outlined" 
                            onPress={async () => {
                              try {
                                // @ts-ignore
                                const { approveAllPendingForAthlete } = useCoachStore.getState() as any;
                                await approveAllPendingForAthlete((relationship as any).athlete_id);
                                await loadRelationships();
                              } catch (e) {
                                Alert.alert('Erro', 'Não foi possível aprovar todas as solicitações.');
                              }
                            }}
                            style={styles.actionButton}
                          >
                            Aprovar todas
                          </Button>
                          <Button 
                            mode="outlined" 
                            onPress={async () => {
                              try {
                                // @ts-ignore
                                const { rejectAllPendingForAthlete } = useCoachStore.getState() as any;
                                await rejectAllPendingForAthlete((relationship as any).athlete_id);
                                await loadRelationships();
                              } catch (e) {
                                Alert.alert('Erro', 'Não foi possível rejeitar todas as solicitações.');
                              }
                            }}
                            style={styles.actionButton}
                          >
                            Rejeitar todas
                          </Button>
                          <Button
                            mode="outlined"
                            icon="account-details"
                            onPress={() => {
                              useViewStore.getState().enterCoachView((relationship as any).athlete_id, (relationship as any).athlete_name || (relationship as any).athlete_email);
                              navigation.navigate('Main', { screen: 'Perfil Esportivo' });
                            }}
                            style={styles.actionButton}
                          >
                            Ver Perfil
                          </Button>
                        </>
                      )}

                      {isActiveStatus(relationship.status as string) && (
                        <Button 
                          mode="contained" 
                          onPress={() => openActionModal(relationship as any, 'deactivate')}
                          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                          icon="account-off"
                          loading={isActing === relationship.id}
                          disabled={isActing !== null}
                        >
                          Desativar
                        </Button>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal de ação */}
      <Portal>
        <Modal
          visible={showActionModal}
          onDismiss={() => setShowActionModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {getActionModalTitle(actionType)}
              </Text>
              
              {selectedAthlete && (
                <View style={styles.modalAthleteInfo}>
                  <Avatar.Text 
                    size={40} 
                    label={getInitials(selectedAthlete.athlete_name || selectedAthlete.athlete_email || '??')} 
                  />
                  <View style={styles.modalAthleteDetails}>
                    <Text variant="titleMedium" style={styles.modalAthleteName}>
                      {selectedAthlete.athlete_name || 'Sem nome'}
                    </Text>
                    <Text variant="bodySmall" style={styles.modalAthleteEmail}>
                      {selectedAthlete.athlete_email || 'Sem email'}
                    </Text>
                  </View>
                </View>
              )}

              <Text variant="bodyMedium" style={styles.modalDescription}>
                {getActionModalDescription(actionType)}
              </Text>

              <TextInput
                label="Observações (opcional)"
                value={actionNotes}
                onChangeText={setActionNotes}
                style={styles.modalInput}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder={getActionNotesPlaceholder(actionType)}
              />

              <View style={styles.modalButtons}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowActionModal(false)}
                  style={styles.modalButton}
                  disabled={isActing !== null}
                >
                  Cancelar
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleAction}
                  loading={isActing !== null}
                  disabled={isActing !== null}
                  style={[styles.modalButton, { backgroundColor: actionType === 'approve' ? '#4CAF50' : actionType === 'reject' ? '#F44336' : '#FF9800' }]}
                >
                  {actionType === 'approve' ? 'Aprovar' : actionType === 'reject' ? 'Rejeitar' : 'Desativar'}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Snackbar de sucesso */}
      <Snackbar
        visible={showSuccessSnackbar}
        onDismiss={() => setShowSuccessSnackbar(false)}
        duration={3000}
        style={styles.successSnackbar}
      >
        {successMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  tabsContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  filtersCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
    borderRadius: 12,
  },
  filtersRow: {
    gap: 12,
  },
  filterGroup: {
    marginBottom: 8,
  },
  filterLabel: {
    color: '#666',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderRadius: 16,
  },
  overviewContainer: {
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
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
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
    elevation: 2,
    borderRadius: 12,
  },
  athleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 12,
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  athleteEmail: {
    color: '#666',
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    color: '#666',
  },
  infoValue: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
  modalAthleteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  modalAthleteDetails: {
    marginLeft: 12,
    flex: 1,
  },
  modalAthleteName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modalAthleteEmail: {
    color: '#666',
  },
  modalDescription: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#666',
  },
  modalInput: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
  },
  teamChip: {
    alignSelf: 'flex-start',
  },
  actionButton: {
    borderRadius: 8,
    marginRight: 8,
  },
}); 