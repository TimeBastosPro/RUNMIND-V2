import React from 'react';
import { ScrollView } from 'react-native';
import { List } from 'react-native-paper';

const termos = [
  {
    termo: 'Índice de Hooper',
    definicao:
      'Uma ferramenta cientificamente validada para monitorar o bem-estar de um atleta. Ele combina pontuações subjetivas de qualidade do sono, fadiga, estresse e dores musculares para avaliar a prontidão para o treino.',
  },
  {
    termo: 'Percepção de Esforço (PSE)',
    definicao:
      'Uma escala subjetiva, geralmente de 1 a 10, usada pelo atleta para quantificar o quão difícil ele sentiu um treino. É um indicador poderoso do estresse fisiológico e mental real.',
  },
  {
    termo: 'Overtraining',
    definicao:
      'Um estado de fadiga crônica causado por um desequilíbrio entre o volume/intensidade do treino e a recuperação. Leva a uma queda no desempenho e pode levar semanas ou meses para ser revertido.',
  },
  {
    termo: 'DOMS (Dor Muscular Tardia)',
    definicao:
      'A dor e rigidez muscular sentida entre 24 e 72 horas após um exercício intenso ou não habitual. É um sinal de microlesões musculares, que fazem parte do processo de adaptação e fortalecimento.',
  },
];

export default function GlossaryScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16 }}>
      <List.Section title="Glossário de Termos">
        {termos.map((item, idx) => (
          <List.Accordion
            key={item.termo}
            title={item.termo}
            style={{ backgroundColor: '#f5f5f5', marginBottom: 8 }}
          >
            <List.Item
              title={item.definicao}
              titleNumberOfLines={10}
            />
          </List.Accordion>
        ))}
      </List.Section>
    </ScrollView>
  );
} 