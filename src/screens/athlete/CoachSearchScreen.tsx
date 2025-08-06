import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Avatar, Chip, Searchbar, Portal, Modal, TextInput, HelperText } from 'react-native-paper';
import { useCoachStore } from '../../stores/coach';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../services/supabase';

interface CoachSearchScreenProps {
  navigation: any;
}

export default function CoachSearchScreen({ navigation }: CoachSearchScreenProps) {
  const { 
    searchCoaches, 
    requestCoachRelationship,
    loadAthleteRelationships,
    isLoading,
    clearError 
  } = useCoachStore();
  
  const { user, signOut } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [coaches, setCoaches] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  const [requestNotes, setRequestNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔍 Carregando dados iniciais...');
      const [coachesData, relationshipsData] = await Promise.all([
        searchCoaches(),
        loadAthleteRelationships()
      ]);
      console.log('🔍 Dados carregados:', { 
        coachesCount: coachesData?.length || 0, 
        relationshipsCount: relationshipsData?.length || 0 
      });
      setCoaches(coachesData);
      setRelationships(relationshipsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    try {
      console.log('🔍 Executando busca com query:', searchQuery);
      const results = await searchCoaches({
        search: searchQuery.trim()
      });
      console.log('🔍 Resultados da busca:', results?.length || 0);
      setCoaches(results);
    } catch (error) {
      console.error('Erro na busca:', error);
    }
  };

  const handleRequestRelationship = async () => {
    if (!selectedCoach) return;
    
    try {
      await requestCoachRelationship(
        selectedCoach.id,
        undefined, // team_id (será definido pelo treinador)
        requestNotes.trim() || undefined
      );
      setShowRequestModal(false);
      setSelectedCoach(null);
      setRequestNotes('');
      await loadAthleteRelationships();
    } catch (error) {
      console.error('Erro ao solicitar vínculo:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getRelationshipStatus = (coachId: string) => {
    const relationship = relationships.find(r => r.coach_id === coachId);
    if (!relationship) return null;
    
    switch (relationship.status) {
      case 'pending':
        return { status: 'pending', label: 'Solicitação Pendente', color: '#FF9800' };
      case 'approved':
        return { status: 'approved', label: 'Aprovado', color: '#4CAF50' };
      case 'rejected':
        return { status: 'rejected', label: 'Rejeitado', color: '#F44336' };
      case 'active':
        return { status: 'active', label: 'Ativo', color: '#2196F3' };
      default:
        return { status: relationship.status, label: relationship.status, color: '#666' };
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

  const filteredCoaches = coaches.filter(coach => 
    coach.user_id !== user?.id // Não mostrar o próprio usuário
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
              🔍 Buscar Treinadores
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Encontre treinadores especializados e solicite vínculo
            </Text>
          </Card.Content>
        </Card>

        {/* Barra de busca */}
        <Card style={styles.searchCard}>
          <Card.Content>
            <Searchbar
              placeholder="Buscar por nome ou especialidade..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              onIconPress={handleSearch}
              onSubmitEditing={handleSearch}
              style={styles.searchbar}
            />
            <Button 
              mode="contained" 
              onPress={handleSearch}
              style={styles.searchButton}
              loading={isLoading}
            >
              Buscar
            </Button>
          </Card.Content>
        </Card>

        {/* Lista de treinadores */}
        <Card style={styles.resultsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.resultsTitle}>
              Treinadores Encontrados ({filteredCoaches.length})
            </Text>

            {filteredCoaches.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  Nenhum treinador encontrado
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Tente ajustar sua busca ou verifique se há treinadores cadastrados
                </Text>
                <Text variant="bodySmall" style={styles.debugText}>
                  Debug: {coaches.length} treinadores carregados, {relationships.length} relacionamentos
                </Text>
              </View>
            ) : (
              filteredCoaches.map((coach) => {
                const relationshipStatus = getRelationshipStatus(coach.id);
                
                return (
                  <Card key={coach.id} style={styles.coachCard}>
                    <Card.Content>
                      <View style={styles.coachHeader}>
                        <Avatar.Text 
                          size={50} 
                          label={getInitials(coach.full_name)}
                          style={styles.coachAvatar}
                        />
                        <View style={styles.coachInfo}>
                          <Text variant="titleMedium" style={styles.coachName}>
                            {coach.full_name}
                          </Text>
                          <Text variant="bodySmall" style={styles.coachEmail}>
                            {coach.email}
                          </Text>
                          {coach.phone && (
                            <Text variant="bodySmall" style={styles.coachPhone}>
                              📞 {coach.phone}
                            </Text>
                          )}
                        </View>
                      </View>

                      {coach.bio && (
                        <Text variant="bodyMedium" style={styles.coachBio}>
                          {coach.bio}
                        </Text>
                      )}

                      <View style={styles.coachDetails}>
                        {coach.experience_years && (
                          <Chip style={styles.detailChip} mode="outlined" compact>
                            {coach.experience_years} anos de experiência
                          </Chip>
                        )}
                        
                        {coach.specialties && coach.specialties.length > 0 && (
                          <View style={styles.specialtiesContainer}>
                            {coach.specialties.slice(0, 3).map((specialty: string, index: number) => (
                              <Chip key={index} style={styles.specialtyChip} mode="outlined" compact>
                                {specialty}
                              </Chip>
                            ))}
                            {coach.specialties.length > 3 && (
                              <Chip style={styles.specialtyChip} mode="outlined" compact>
                                +{coach.specialties.length - 3} mais
                              </Chip>
                            )}
                          </View>
                        )}
                      </View>

                      {relationshipStatus ? (
                        <View style={styles.relationshipStatus}>
                          <Chip 
                            style={[styles.statusChip, { backgroundColor: relationshipStatus.color + '20' }]}
                            textStyle={{ color: relationshipStatus.color }}
                            mode="outlined"
                          >
                            {relationshipStatus.label}
                          </Chip>
                        </View>
                      ) : (
                        <Button 
                          mode="contained" 
                          onPress={() => {
                            setSelectedCoach(coach);
                            setShowRequestModal(true);
                          }}
                          style={styles.requestButton}
                          icon="account-plus"
                        >
                          Solicitar Vínculo
                        </Button>
                      )}
                    </Card.Content>
                  </Card>
                );
              })
            )}
          </Card.Content>
        </Card>

        {/* Seção de vínculos ativos */}
        <Card style={styles.relationshipsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.relationshipsTitle}>
              Meus Vínculos ({relationships.length})
            </Text>

            {relationships.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  Nenhum vínculo ativo
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Solicite vínculo com treinadores para começar
                </Text>
              </View>
            ) : (
              relationships.map((relationship) => (
                <Card key={relationship.id} style={styles.relationshipCard}>
                  <Card.Content>
                    <View style={styles.relationshipHeader}>
                      <Avatar.Text 
                        size={40} 
                        label={getInitials(relationship.coach_name)}
                        style={styles.relationshipAvatar}
                      />
                      <View style={styles.relationshipInfo}>
                        <Text variant="titleMedium" style={styles.relationshipName}>
                          {relationship.coach_name}
                        </Text>
                        <Text variant="bodySmall" style={styles.relationshipEmail}>
                          {relationship.coach_email}
                        </Text>
                        <Chip 
                          style={[styles.statusChip, { 
                            backgroundColor: getRelationshipStatus(relationship.coach_id)?.color + '20' 
                          }]}
                          textStyle={{ color: getRelationshipStatus(relationship.coach_id)?.color }}
                          mode="outlined"
                          compact
                        >
                          {getRelationshipStatus(relationship.coach_id)?.label}
                        </Chip>
                      </View>
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

      {/* Modal para solicitar vínculo */}
      <Portal>
        <Modal
          visible={showRequestModal}
          onDismiss={() => setShowRequestModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Solicitar Vínculo
              </Text>
              
              {selectedCoach && (
                <View style={styles.modalCoachInfo}>
                  <Avatar.Text 
                    size={40} 
                    label={getInitials(selectedCoach.full_name)}
                    style={styles.modalCoachAvatar}
                  />
                  <View style={styles.modalCoachDetails}>
                    <Text variant="titleMedium" style={styles.modalCoachName}>
                      {selectedCoach.full_name}
                    </Text>
                    <Text variant="bodySmall" style={styles.modalCoachEmail}>
                      {selectedCoach.email}
                    </Text>
                  </View>
                </View>
              )}
              
              <TextInput
                label="Mensagem (opcional)"
                value={requestNotes}
                onChangeText={setRequestNotes}
                style={styles.modalInput}
                mode="outlined"
                multiline
                numberOfLines={4}
                placeholder="Conte um pouco sobre você e por que gostaria de treinar com este treinador..."
              />
              
              <HelperText type="info">
                Sua solicitação será enviada para o treinador. Ele poderá aprovar ou rejeitar o vínculo.
              </HelperText>
              
              <View style={styles.modalActions}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowRequestModal(false)}
                  style={styles.modalButton}
                >
                  Cancelar
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleRequestRelationship}
                  style={styles.modalButton}
                  loading={isLoading}
                >
                  Enviar Solicitação
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
  searchCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  searchbar: {
    marginBottom: 12,
    borderRadius: 8,
  },
  searchButton: {
    borderRadius: 8,
  },
  resultsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  resultsTitle: {
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
  coachCard: {
    marginBottom: 16,
    elevation: 1,
    borderRadius: 8,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  coachAvatar: {
    marginRight: 12,
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  coachEmail: {
    color: '#666',
    marginBottom: 2,
  },
  coachPhone: {
    color: '#666',
  },
  coachBio: {
    marginBottom: 12,
    fontStyle: 'italic',
  },
  coachDetails: {
    marginBottom: 12,
  },
  detailChip: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyChip: {
    marginBottom: 4,
  },
  relationshipStatus: {
    alignItems: 'flex-start',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  requestButton: {
    borderRadius: 8,
  },
  relationshipsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  relationshipsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  relationshipCard: {
    marginBottom: 12,
    elevation: 1,
    borderRadius: 8,
  },
  relationshipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relationshipAvatar: {
    marginRight: 12,
  },
  relationshipInfo: {
    flex: 1,
  },
  relationshipName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  relationshipEmail: {
    color: '#666',
    marginBottom: 4,
  },
  modalContainer: {
    margin: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalCoachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  modalCoachAvatar: {
    marginRight: 12,
  },
  modalCoachDetails: {
    flex: 1,
  },
  modalCoachName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modalCoachEmail: {
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
  debugText: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
}); 