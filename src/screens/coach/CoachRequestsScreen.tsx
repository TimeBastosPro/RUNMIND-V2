import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Chip, Portal, Modal, TextInput, HelperText } from 'react-native-paper';
import { useCoachStore } from '../../stores/coach';
import { useAuthStore } from '../../stores/auth';

interface CoachRequestsScreenProps {
  navigation: any;
}

export default function CoachRequestsScreen({ navigation }: CoachRequestsScreenProps) {
  const { 
    loadCoachRelationships,
    approveRelationship,
    rejectRelationship,
    isLoading,
    relationships,
    clearError 
  } = useCoachStore();
  
  const { user, signOut } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [responseNotes, setResponseNotes] = useState('');
  const [lastAction, setLastAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('📋 Carregando solicitações...');
      await loadCoachRelationships({ status: 'pending' });
      console.log('📋 Solicitações carregadas:', relationships?.length || 0);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAction = async () => {
    if (!selectedRequest) return;
    
    try {
      console.log('🔍 Processando ação:', { actionType, requestId: selectedRequest.id });
      
      if (actionType === 'approve') {
        await approveRelationship(selectedRequest.id, undefined, responseNotes.trim() || undefined);
        console.log('✅ Solicitação aprovada com sucesso');
        setLastAction('approve');
      } else {
        await rejectRelationship(selectedRequest.id, responseNotes.trim() || undefined);
        console.log('✅ Solicitação rejeitada e removida com sucesso');
        setLastAction('reject');
      }
      
      setShowActionModal(false);
      setSelectedRequest(null);
      setResponseNotes('');
      await loadData();
      
      // Mostrar modal de sucesso com opções de navegação
      setShowSuccessModal(true);
      
      console.log('✅ Ação processada com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao processar solicitação:', error);
      
      // Mostrar erro mais específico para o usuário
      const errorMessage = error.message || 'Erro desconhecido';
      console.error('Mensagem de erro:', errorMessage);
      
      // Aqui você pode adicionar um Alert ou Snackbar para mostrar o erro ao usuário
      // Alert.alert('Erro', errorMessage);
    }
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

  const pendingRequests = relationships.filter(r => r.status === 'pending');

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
              📋 Solicitações de Vínculo
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Gerencie as solicitações de atletas que querem treinar com você
            </Text>
          </Card.Content>
        </Card>

        {/* Lista de solicitações */}
        <Card style={styles.requestsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.requestsTitle}>
              Solicitações Pendentes ({pendingRequests.length})
            </Text>

            {pendingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  Nenhuma solicitação pendente
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Os atletas aparecerão aqui quando solicitarem vínculo
                </Text>
              </View>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.id} style={styles.requestCard}>
                  <Card.Content>
                    <View style={styles.requestHeader}>
                      <Avatar.Text 
                        size={50} 
                        label={getInitials(request.athlete_name)}
                        style={styles.athleteAvatar}
                      />
                      <View style={styles.athleteInfo}>
                        <Text variant="titleMedium" style={styles.athleteName}>
                          {request.athlete_name || 'Nome não informado'}
                        </Text>
                        <Text variant="bodySmall" style={styles.athleteEmail}>
                          {request.athlete_email || 'Email não informado'}
                        </Text>
                        <Text variant="bodySmall" style={styles.requestDate}>
                          {`📅 ${new Date(request.requested_at).toLocaleDateString('pt-BR')}`}
                        </Text>
                      </View>
                    </View>

                    {request.notes && (
                      <Text variant="bodyMedium" style={styles.requestNotes}>
                        {`💬 ${request.notes}`}
                      </Text>
                    )}

                    <View style={styles.requestActions}>
                      <Button 
                        mode="outlined" 
                        onPress={() => {
                          setSelectedRequest(request);
                          setActionType('reject');
                          setShowActionModal(true);
                        }}
                        style={[styles.actionButton, styles.rejectButton]}
                        icon="close"
                        textColor="#F44336"
                      >
                        Rejeitar
                      </Button>
                      <Button 
                        mode="contained" 
                        onPress={() => {
                          setSelectedRequest(request);
                          setActionType('approve');
                          setShowActionModal(true);
                        }}
                        style={[styles.actionButton, styles.approveButton]}
                        icon="check"
                      >
                        Aprovar
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))
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

      {/* Modal para aprovar/rejeitar */}
      <Portal>
        <Modal
          visible={showActionModal}
          onDismiss={() => setShowActionModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {actionType === 'approve' ? 'Aprovar Vínculo' : 'Rejeitar Vínculo'}
              </Text>
              
              {selectedRequest && (
                <View style={styles.modalAthleteInfo}>
                  <Avatar.Text 
                    size={40} 
                    label={getInitials(selectedRequest.athlete_name)}
                    style={styles.modalAthleteAvatar}
                  />
                  <View style={styles.modalAthleteDetails}>
                    <Text variant="titleMedium" style={styles.modalAthleteName}>
                      {selectedRequest.athlete_name || 'Nome não informado'}
                    </Text>
                    <Text variant="bodySmall" style={styles.modalAthleteEmail}>
                      {selectedRequest.athlete_email || 'Email não informado'}
                    </Text>
                  </View>
                </View>
              )}
              
              <TextInput
                label="Mensagem (opcional)"
                value={responseNotes}
                onChangeText={setResponseNotes}
                style={styles.modalInput}
                mode="outlined"
                multiline
                numberOfLines={4}
                placeholder={actionType === 'approve' 
                  ? "Mensagem de boas-vindas para o atleta..." 
                  : "Motivo da rejeição (opcional)..."
                }
              />
              
              <HelperText type="info">
                {actionType === 'approve' 
                  ? "O atleta será notificado da aprovação e poderá começar a treinar com você."
                  : "O atleta será removido da lista e poderá solicitar vínculo a outro treinador."
                }
              </HelperText>
              
              <View style={styles.modalActions}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowActionModal(false)}
                  style={styles.modalButton}
                >
                  Cancelar
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleAction}
                  style={[
                    styles.modalButton, 
                    actionType === 'reject' ? styles.rejectButton : styles.approveButton
                  ]}
                  loading={isLoading}
                >
                  {actionType === 'approve' ? 'Aprovar' : 'Rejeitar'}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>

        {/* Modal de sucesso com opções de navegação */}
        <Modal
          visible={showSuccessModal}
          onDismiss={() => setShowSuccessModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {lastAction === 'approve' ? '✅ Vínculo Aprovado!' : '❌ Vínculo Rejeitado!'}
              </Text>
              
              <Text variant="bodyLarge" style={styles.successMessage}>
                {lastAction === 'approve' 
                  ? 'O atleta foi aprovado com sucesso e agora faz parte da sua equipe!'
                  : 'O atleta foi removido da lista de solicitações e poderá solicitar vínculo a outro treinador.'
                }
              </Text>
              
              <HelperText type="info" style={styles.successInfo}>
                {lastAction === 'approve' 
                  ? "Você pode gerenciar seus atletas na tela 'Meus Atletas'."
                  : "O atleta não poderá mais solicitar vínculo com você, mas pode buscar outros treinadores."
                }
              </HelperText>
              
              <View style={styles.modalActions}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowSuccessModal(false)}
                  style={styles.modalButton}
                >
                  Continuar Aqui
                </Button>
                <Button 
                  mode="contained" 
                  onPress={() => {
                    setShowSuccessModal(false);
                    navigation.navigate('CoachAthletes');
                  }}
                  style={styles.modalButton}
                  icon="account-group"
                >
                  Ir para Meus Atletas
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
  requestsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  requestsTitle: {
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
  requestCard: {
    marginBottom: 16,
    elevation: 1,
    borderRadius: 8,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  requestDate: {
    color: '#666',
    fontSize: 12,
  },
  requestNotes: {
    marginBottom: 12,
    fontStyle: 'italic',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    borderColor: '#F44336',
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
  successMessage: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  successInfo: {
    marginBottom: 16,
    textAlign: 'center',
  },
}); 