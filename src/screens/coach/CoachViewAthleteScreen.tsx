import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, Chip } from 'react-native-paper';
import { useViewStore } from '../../stores/view';

type Props = { route: { params: { athleteId: string; relationshipId?: string; athleteName?: string; athleteEmail?: string } }; navigation: any };

export default function CoachViewAthleteScreen({ route, navigation }: Props) {
  const { athleteId, relationshipId, athleteName, athleteEmail } = route.params;
  const initials = (name?: string) => (name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '??');
  const { enterCoachView } = useViewStore();

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.headerCard}>
          <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar.Text size={56} label={initials(athleteName)} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text variant="titleLarge">{athleteName || 'Atleta'}</Text>
              <Text variant="bodySmall">{athleteEmail || ''}</Text>
              <Chip style={{ alignSelf: 'flex-start', marginTop: 8 }} mode="outlined">Visualizando como Treinador</Chip>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Acessos</Text>
            <View style={styles.actionsRow}>
              <Button mode="outlined" style={styles.actionButton} icon="home" onPress={() => { enterCoachView(athleteId); navigation.navigate('Main'); }}>Início (visualização)</Button>
              <Button mode="contained" style={styles.actionButton} icon="run" onPress={() => { enterCoachView(athleteId); navigation.navigate('Treinos' as never); }}>Treinos (editar)</Button>
              <Button mode="contained" style={styles.actionButton} icon="medal-outline" onPress={() => { enterCoachView(athleteId); navigation.navigate('Perfil Esportivo' as never); }}>Perfil Esportivo (editar)</Button>
              <Button mode="outlined" style={styles.actionButton} icon="chart-line" onPress={() => { enterCoachView(athleteId); navigation.navigate('Análise' as never); }}>Análise (visualização)</Button>
              <Button mode="outlined" style={styles.actionButton} icon="lightbulb" onPress={() => { enterCoachView(athleteId); navigation.navigate('Insights' as never); }}>Insights (visualização)</Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerCard: { margin: 16, borderRadius: 12, elevation: 2 },
  sectionCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, elevation: 2 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 12 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionButton: { marginRight: 8, marginBottom: 8 },
});