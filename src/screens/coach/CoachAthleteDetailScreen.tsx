import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Avatar, Chip, Button } from 'react-native-paper';
import { useCoachStore } from '../../stores/coach';

type Props = { route: { params: { relationshipId: string; athleteId: string } }; navigation: any };

export default function CoachAthleteDetailScreen({ route, navigation }: Props) {
  const { relationships, loadCoachRelationships } = useCoachStore();
  const [rel, setRel] = useState<any | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!relationships || relationships.length === 0) {
        await loadCoachRelationships();
      }
      const found = useCoachStore.getState().relationships.find(r => r.id === route.params.relationshipId);
      setRel(found || null);
    };
    init();
  }, [route.params.relationshipId]);

  if (!rel) {
    return (
      <View style={styles.container}><Text>Carregando...</Text></View>
    );
  }

  const initials = (name?: string) => (name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '??');

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar.Text size={56} label={initials(rel.athlete_name)} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text variant="titleLarge">{rel.athlete_name}</Text>
                <Text variant="bodySmall">{rel.athlete_email}</Text>
                <Chip style={{ alignSelf: 'flex-start', marginTop: 8 }} mode="outlined">{rel.status}</Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>Ações</Text>
            <Button mode="contained" icon="message" style={{ marginBottom: 8 }} onPress={() => { /* hook para chat futuro */ }}>Enviar mensagem</Button>
            <Button mode="outlined" icon="chart-line" onPress={() => { /* abrir análises futuras */ }}>Ver análises</Button>
          </Card.Content>
        </Card>

        <Button mode="text" onPress={() => navigation.goBack()} style={{ alignSelf: 'center' }}>Voltar</Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { margin: 16, borderRadius: 12, elevation: 2 },
});

