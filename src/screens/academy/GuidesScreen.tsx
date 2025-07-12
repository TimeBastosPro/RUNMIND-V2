import React from 'react';
import { ScrollView } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';

const guias = [
  {
    titulo: 'A Importância do Treino Regenerativo',
    resumo:
      'Muitos atletas subestimam o poder do descanso. O treino regenerativo não é "perder um dia", mas sim acelerar a recuperação muscular, prevenir lesões e consolidar os ganhos dos treinos mais intensos.',
  },
  {
    titulo: 'Entendendo as Zonas de Frequência Cardíaca',
    resumo:
      'Treinar "pelo coração" é uma das formas mais eficazes de garantir que você está aplicando o estímulo correto. Aprenda a calcular e usar suas zonas de FC para otimizar cada corrida, seja ela um trote leve ou um treino de tiros.',
  },
  {
    titulo: 'Nutrição Pré e Pós-Treino: O Básico',
    resumo:
      'O que você come antes e depois de correr tem um impacto direto no seu desempenho e recuperação. Descubra os princípios básicos de carboidratos para energia e proteínas para a reconstrução muscular.',
  },
];

export default function GuidesScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16 }}>
      <Card style={{ marginBottom: 20 }}>
        <Card.Title
          title="Guias de Treinamento"
          subtitle="Conceitos fundamentais para sua evolução na corrida"
        />
      </Card>
      {guias.map((guia, idx) => (
        <Card key={guia.titulo} style={{ marginBottom: 16, elevation: 2 }}>
          <Card.Title title={guia.titulo} />
          <Card.Content>
            <Text style={{ fontSize: 15, color: '#444' }}>{guia.resumo}</Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => console.log('Ler mais sobre: ' + guia.titulo)}>
              Ler Mais
            </Button>
          </Card.Actions>
        </Card>
      ))}
    </ScrollView>
  );
} 