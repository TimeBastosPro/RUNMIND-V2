import React from 'react';
import { View } from 'react-native';
import { Card, Text, List } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';

// Define os tipos para as rotas da sua navegação.
// Isso ajuda o TypeScript a entender para quais telas você pode navegar.
type RootStackParamList = {
  Academy: undefined; // A tela Academy não recebe parâmetros
  Glossary: undefined;
  Guides: undefined;
  Chat: undefined;
  // Adicione outras rotas da sua stack principal aqui
};

// Define os tipos das props que a tela AcademyScreen recebe.
type AcademyScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Academy'>;
};

// Componente principal, agora com a tipagem correta.
export default function AcademyScreen({ navigation }: AcademyScreenProps) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>
        Central de Conhecimento RunMind
      </Text>
      <Card style={{ marginBottom: 16 }}>
        <List.Item
          title="Glossário de Termos"
          description="Entenda os principais conceitos"
          left={props => <List.Icon {...props} icon="book-open-variant" />}
          onPress={() => navigation.navigate('Glossary')}
        />
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <List.Item
          title="Guias de Treinamento"
          description="Dicas para seus treinos e recuperação"
          left={props => <List.Icon {...props} icon="file-document-outline" />}
          onPress={() => navigation.navigate('Guides')}
        />
      </Card>
      <Card>
        <List.Item
          title="Chat com Especialista IA"
          description="Tire suas dúvidas com nossa IA"
          left={props => <List.Icon {...props} icon="robot" />}
          onPress={() => navigation.navigate('Chat')}
        />
      </Card>
    </View>
  );
}