import React from 'react';
import { View } from 'react-native';
import { Card, Text, List } from 'react-native-paper';

export default function AcademyScreen({ navigation }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>
        Central de Conhecimento RunMind
      </Text>
      <Card style={{ marginBottom: 16 }}>
        <List.Item
          title="Glossário de Termos"
          left={props => <List.Icon {...props} icon="book-open-variant" />}
          onPress={() => navigation.navigate('Glossary')}
        />
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <List.Item
          title="Guias de Treinamento"
          left={props => <List.Icon {...props} icon="file-document-outline" />}
          onPress={() => navigation.navigate('Guides')}
        />
      </Card>
      <Card>
        <List.Item
          title="Chat com Especialista IA"
          left={props => <List.Icon {...props} icon="robot" />}
          onPress={() => navigation.navigate('Chat')}
        />
      </Card>
    </View>
  );
} 