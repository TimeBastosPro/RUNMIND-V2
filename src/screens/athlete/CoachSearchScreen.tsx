import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, Avatar, Chip, Searchbar, TextInput } from 'react-native-paper';
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
    athleteUnlinkRelationship,
    isLoading,
  } = useCoachStore();
  
  const { signOut } = useAuthStore();
  const [relationships, setRelationships] = useState<any[]>([]);
  const [pendingRelationships, setPendingRelationships] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [teamNameQuery, setTeamNameQuery] = useState('');
  const [selectedModalities, setSelectedModalities] = useState<string[]>(['Corrida de Rua']);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar todos os relacionamentos (ativos, pendentes, aprovados)
      await loadAthleteRelationships();
      const { relationships: storeRelationships } = useCoachStore.getState();
      
      // Separar relacionamentos por status
      const activeRelationships = (storeRelationships || []).filter((r: any) => 
        r.status === 'active' || r.status === 'approved'
      );
      const pendingRelationships = (storeRelationships || []).filter((r: any) => 
        r.status === 'pending'
      );
      
      console.log('🔍 Relacionamentos carregados:', {
        total: storeRelationships?.length || 0,
        active: activeRelationships.length,
        pending: pendingRelationships.length,
        all: storeRelationships?.map((r: any) => ({ id: r.id, status: r.status, coach_name: r.coach_name }))
      });
      
      setRelationships(activeRelationships);
      setPendingRelationships(pendingRelationships);
    } catch (error) {
      console.error('Erro ao carregar vínculos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') return '??';
    return name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleUnlink = async (relationshipId: string) => {
    console.log('🔍 handleUnlink chamado com relationshipId:', relationshipId);
    
    Alert.alert(
      'Desvincular Treinador',
      'Tem certeza que deseja se desvincular deste treinador? Você poderá solicitar novamente depois.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔍 Iniciando processo de desvincular...');
              console.log('🔍 RelationshipId:', relationshipId);
              
              await athleteUnlinkRelationship(relationshipId);
              console.log('🔍 Desvincular concluído com sucesso');
              
              await loadData();
              console.log('🔍 Dados recarregados');
              
              Alert.alert('Sucesso', 'Treinador desvinculado com sucesso!');
            } catch (e: any) {
              console.error('❌ Erro ao desvincular:', e);
              Alert.alert('Erro', `Não foi possível desvincular: ${e?.message || 'Erro desconhecido'}`);
            }
          }
        }
      ]
    );
  };

  const handleSearch = async () => {
    try {
      console.log('🔍 Iniciando busca de treinadores...');
      console.log('🔍 Parâmetros de busca:', {
        search: searchQuery.trim() || 'vazio',
        team_name: teamNameQuery.trim() || 'vazio',
        is_active: true
      });
      
      const results = await searchCoaches({
        is_active: true,
        search: searchQuery.trim() || undefined,
        team_name: teamNameQuery.trim() || undefined,
      });
      
      console.log('🔍 Resultados da busca:', results?.length || 0, 'treinadores encontrados');
      if (results && results.length > 0) {
        console.log('🔍 Treinadores encontrados:', results.map(c => ({ id: c.id, name: c.full_name, email: c.email })));
      }
      
             setCoaches(results || []);
       
       // Se encontrou treinadores, selecionar o primeiro automaticamente
       if (results && results.length > 0) {
         console.log('🔍 Selecionando o primeiro treinador encontrado');
         setSelectedCoach(results[0]);
       } else {
         setSelectedCoach(null);
       }
      
      // ✅ MELHORADO: Feedback visual para o usuário
      if (results && results.length === 0) {
        Alert.alert(
          'Nenhum treinador encontrado', 
          'Tente ajustar os critérios de busca ou verificar se há treinadores cadastrados no sistema.',
          [{ text: 'OK' }]
        );
      }
    } catch (e: any) {
      console.error('❌ Erro na busca de treinadores:', e);
      Alert.alert('Erro', `Não foi possível buscar treinadores: ${e?.message || 'Erro desconhecido'}`);
    }
  };

  const toggleModality = (m: string) => {
    setSelectedModalities(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const handleRequestRelationship = async (coachId: string) => {
    try {
      if (!selectedModalities || selectedModalities.length === 0) {
        Alert.alert('Selecione ao menos uma modalidade');
        return;
      }
      
      console.log('🔍 Iniciando solicitação de vínculo:', { coachId, selectedModalities });
      
      // Enviar em lote por modalidade
      // @ts-ignore acessar função do store
      const { requestCoachRelationshipsBulk } = useCoachStore.getState() as any;
      const result = await requestCoachRelationshipsBulk(coachId, selectedModalities);
      
      console.log('🔍 Resultado da solicitação:', result);
      
      // Recarregar dados para mostrar o novo relacionamento
      await loadData();
      
      // Limpar seleção após sucesso
      setSelectedCoach(null);
      setSelectedModalities(['Corrida de Rua']);
      
      // ✅ MELHORADO: Mensagem mais informativa baseada no resultado
      if (result.failures > 0 && result.successes > 0) {
        Alert.alert(
          'Vínculo Parcialmente Solicitado!', 
          `${result.successes} modalidade(s) foram solicitadas com sucesso. ${result.failures} modalidade(s) não puderam ser solicitadas.`,
          [{ text: 'OK' }]
        );
      } else if (result.failures > 0) {
        Alert.alert(
          'Erro na Solicitação', 
          'Nenhuma modalidade pôde ser solicitada. Verifique se você já possui vínculos ativos ou pendentes.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Vínculo Solicitado!', 
          'Sua solicitação foi enviada ao treinador. Você receberá uma notificação quando for aprovada.',
          [{ text: 'OK' }]
        );
      }
    } catch (e: any) {
      console.error('❌ Erro na solicitação de vínculo:', e);
      Alert.alert('Erro', e?.message || 'Não foi possível enviar a solicitação.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Buscar Treinadores com filtro por nome e por equipe */}
        <Card style={styles.searchCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.relationshipsTitle}>Buscar Treinadores</Text>
            <Searchbar
              placeholder="Buscar por nome do treinador"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ marginBottom: 8 }}
              onSubmitEditing={handleSearch}
            />
            <TextInput
              mode="outlined"
              label="Filtrar por nome da equipe"
              placeholder="Ex.: Equipe Elite"
              value={teamNameQuery}
              onChangeText={setTeamNameQuery}
              style={{ marginBottom: 8 }}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button 
                mode="outlined" 
                onPress={async () => {
                  try {
                    console.log('🔍 Buscando todos os treinadores ativos...');
                    const results = await searchCoaches({ is_active: true });
                    setCoaches(results || []);
                    console.log('🔍 Total de treinadores ativos:', results?.length || 0);
                  } catch (e: any) {
                    console.error('❌ Erro ao buscar todos os treinadores:', e);
                    Alert.alert('Erro', `Não foi possível buscar treinadores: ${e?.message || 'Erro desconhecido'}`);
                  }
                }}
                style={{ flex: 1 }}
              >
                Ver Todos
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSearch} 
                loading={isLoading}
                style={{ flex: 1 }}
              >
                Buscar
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Relacionamentos Pendentes */}
        {pendingRelationships.length > 0 && (
          <Card style={styles.relationshipsCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.relationshipsTitle}>
                Solicitações Pendentes
              </Text>
              {pendingRelationships.map((relationship) => (
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
                          {relationship.coach_name || 'Nome não informado'}
                        </Text>
                        <Text variant="bodySmall" style={styles.relationshipEmail}>
                          {relationship.coach_email || 'Email não informado'}
                        </Text>
                        <Chip style={{ alignSelf: 'flex-start', backgroundColor: '#FFF3E0' }} mode="outlined">
                          Aguardando Aprovação
                        </Chip>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>
        )}

        

        {/* Vínculo atual (somente dados do treinador vinculado) */}
        <Card style={styles.relationshipsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.relationshipsTitle}>
              Meu Treinador
            </Text>

                         {relationships.length === 0 ? (
               <View style={styles.emptyState}>
                 {selectedCoach ? (
                   <>
                     {/* Seletor de treinador quando há múltiplos resultados */}
                     {coaches.length > 1 && (
                       <>
                         <Text style={{ marginBottom: 8, color: '#666', fontWeight: 'bold' }}>
                           Treinadores encontrados ({coaches.length})
                         </Text>
                         <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                           {coaches.map((coach) => (
                             <Chip
                               key={coach.id}
                               selected={selectedCoach?.id === coach.id}
                               onPress={() => setSelectedCoach(coach)}
                               style={{ marginBottom: 4 }}
                             >
                               {coach.full_name}
                             </Chip>
                           ))}
                         </View>
                       </>
                     )}
                     
                     <View style={styles.relationshipHeader}>
                       <Avatar.Text size={40} label={getInitials(selectedCoach.full_name)} style={styles.relationshipAvatar} />
                       <View style={styles.relationshipInfo}>
                         <Text variant="titleMedium" style={styles.relationshipName}>{selectedCoach.full_name}</Text>
                         <Text variant="bodySmall" style={styles.relationshipEmail}>{selectedCoach.email}</Text>
                       </View>
                     </View>
                     <Text style={{ marginBottom: 8, color: '#666' }}>Selecione uma ou mais modalidades</Text>
                     <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                       {['Corrida de Rua','Trail Running','Força','Flexibilidade'].map(m => (
                         <Chip
                           key={m}
                           selected={selectedModalities.includes(m)}
                           onPress={() => toggleModality(m)}
                         >
                           {m}
                         </Chip>
                       ))}
                     </View>
                     <Button 
                       mode="contained" 
                       icon="account-plus" 
                       onPress={() => handleRequestRelationship(selectedCoach.id)}
                       style={styles.vincularButton}
                     >
                       Vincular
                     </Button>
                   </>
                 ) : (
                   <>
                     <Text variant="bodyLarge" style={styles.emptyText}>Nenhum treinador vinculado</Text>
                     <Text variant="bodyMedium" style={styles.emptySubtext}>Busque e selecione um treinador para vincular.</Text>
                   </>
                 )}
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
                          {relationship.coach_name || 'Nome não informado'}
                        </Text>
                        <Text variant="bodySmall" style={styles.relationshipEmail}>
                          {relationship.coach_email || 'Email não informado'}
                        </Text>
                        <Chip style={{ alignSelf: 'flex-start' }} mode="outlined">Ativo</Chip>
                      </View>
                    </View>

                    {/* Ações */}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <Button
                        mode="outlined"
                        icon="link-off"
                        onPress={() => {
                          console.log('🔍 Botão Desvincular clicado para relationship:', relationship);
                          console.log('🔍 Relationship ID:', relationship.id);
                          handleUnlink(relationship.id);
                        }}
                        style={styles.desvincularButton}
                        disabled={isLoading}
                        loading={isLoading}
                      >
                        {isLoading ? 'Desvinculando...' : 'Desvincular'}
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  relationshipsCard: { margin: 16, marginBottom: 16, elevation: 2, borderRadius: 12 },
  searchCard: { margin: 16, marginBottom: 8, elevation: 2, borderRadius: 12 },
  relationshipsTitle: { fontWeight: 'bold', marginBottom: 16 },
  relationshipCard: { marginBottom: 12, elevation: 1, borderRadius: 8 },
  relationshipHeader: { flexDirection: 'row', alignItems: 'center' },
  relationshipAvatar: { marginRight: 12 },
  relationshipInfo: { flex: 1 },
  relationshipName: { fontWeight: 'bold', marginBottom: 2 },
  relationshipEmail: { color: '#666', marginBottom: 4 },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyText: { fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { textAlign: 'center', color: '#666' },
  vincularButton: { 
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginTop: 8
  },
  desvincularButton: { 
    borderColor: '#FF9800',
    borderRadius: 8
  },
}); 