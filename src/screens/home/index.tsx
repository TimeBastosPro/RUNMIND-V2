import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Button, Chip, IconButton, Surface, Avatar } from 'react-native-paper';
import { useCheckinStore } from '../../stores/checkin';
import { useAuthStore } from '../../stores/auth';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const motivationalQuotes = [
  {
    text: "O sucesso não é acidental. É trabalho duro, perseverança, aprendizado, estudo, sacrifício e, acima de tudo, amor pelo que você está fazendo.",
    author: "Pelé"
  },
  {
    text: "A diferença entre o possível e o impossível está na determinação.",
    author: "Tommy Lasorda"
  },
  {
    text: "Você nunca é velho demais para estabelecer um novo objetivo ou sonhar um novo sonho.",
    author: "C.S. Lewis"
  },
  {
    text: "A dor é temporária. Pode durar um minuto, uma hora, um dia ou um ano, mas eventualmente ela vai embora e algo diferente toma seu lugar. Se eu desistir, porém, ela dura para sempre.",
    author: "Lance Armstrong"
  },
  {
    text: "O que você consegue alcançar está limitado apenas pelo que você consegue sonhar.",
    author: "Mia Hamm"
  },
  {
    text: "Não é sobre ser o melhor. É sobre ser melhor do que você era ontem.",
    author: "Desconhecido"
  },
  {
    text: "A disciplina é a ponte entre metas e realizações.",
    author: "Jim Rohn"
  },
  {
    text: "Cada treino é uma oportunidade de se tornar mais forte.",
    author: "Desconhecido"
  }
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { 
    todayReadinessScore, 
    hasCheckedInToday, 
    trainingSessions,
    loadRecentCheckins,
    fetchTrainingSessions
  } = useCheckinStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [motivationalQuote, setMotivationalQuote] = useState(motivationalQuotes[0]);

  useEffect(() => {
    loadRecentCheckins();
    fetchTrainingSessions();
    
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, [loadRecentCheckins, fetchTrainingSessions]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setMotivationalQuote(motivationalQuotes[randomIndex]);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Funções para converter números em textos
  const getTerrenoText = (terreno: string) => {
    const terrenoMap: { [key: string]: string } = {
      '1': 'Asfalto',
      '2': 'Esteira',
      '3': 'Trilha/Montanha',
      '4': 'Pista',
      '5': 'Outro'
    };
    return terrenoMap[terreno] || terreno;
  };

  const getEsforcoText = (esforco: string) => {
    const esforcoMap: { [key: string]: string } = {
      '1': 'Muito Leve',
      '2': 'Leve',
      '3': 'Moderado',
      '4': 'Forte',
      '5': 'Muito Forte'
    };
    return esforcoMap[esforco] || esforco;
  };

  const getPercursoText = (percurso: string) => {
    const percursoMap: { [key: string]: string } = {
      '1': 'Plano',
      '2': 'Ligeira Inclinação',
      '3': 'Moderada',
      '4': 'Forte',
      '5': 'Muita Inclinação'
    };
    return percursoMap[percurso] || percurso;
  };

  const readinessPercent = todayReadinessScore !== null ? Math.round((1 - (todayReadinessScore / 28)) * 100) : null;
  
  // Buscar treino para hoje
  const today = new Date().toISOString().split('T')[0];
  
  const todayTraining = trainingSessions?.find(session => 
    session.training_date === today
  );
  
  // Buscar o próximo treino planejado (hoje ou próximo dia)
  const nextPlannedTraining = trainingSessions?.find(session => 
    session.status === 'planned' && session.training_date >= today
  );
  
  // Lógica do próximo treino: se há treino planejado para hoje, mostra ele. Se não, mostra o próximo planejado
  const nextTraining = nextPlannedTraining;
  
  // Verificar se o treino de hoje não foi realizado e já passou do dia
  const isTodayPast = new Date().getHours() >= 22; // Considera "passou do dia" após 22h
  const todayTrainingNotCompleted = todayTraining && todayTraining.status === 'planned' && isTodayPast;

  // Buscar o último treino realizado (ordenar por data mais recente)
  const completedTrainings = trainingSessions?.filter(session => session.status === 'completed') || [];
  
  // Ordenar por data mais recente primeiro
  const sortedCompletedTrainings = completedTrainings.sort((a, b) => {
    const dateA = new Date(a.training_date);
    const dateB = new Date(b.training_date);
    return dateB.getTime() - dateA.getTime();
  });
  
  const lastCompletedTraining = sortedCompletedTrainings[0];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.user_metadata?.full_name || 'Atleta'}! 👋</Text>
          </View>
          <Avatar.Text 
            size={50} 
            label={(user?.user_metadata?.full_name || 'A').charAt(0).toUpperCase()} 
            style={styles.avatar}
          />
        </View>
        <Text style={styles.date}>{format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}</Text>
      </Surface>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Status do Check-in</Text>
            {hasCheckedInToday ? (
              <Chip icon="check-circle" mode="flat" style={styles.successChip}>
                Concluído
              </Chip>
            ) : (
              <Chip icon="alert-circle" mode="flat" style={styles.warningChip}>
                Pendente
              </Chip>
            )}
          </View>
          
          {hasCheckedInToday ? (
            <View style={styles.checkinSuccess}>
              <Text style={styles.successMessage}>🎉 Parabéns! Você já fez seu check-in hoje.</Text>
              <Text style={styles.successSubtitle}>Continue assim para acompanhar seu progresso!</Text>
            </View>
          ) : (
            <View style={styles.checkinPending}>
              <Text style={styles.pendingMessage}>📝 Ainda não fez seu check-in hoje?</Text>
              <Text style={styles.pendingSubtitle}>Reserve 2 minutos para avaliar como está se sentindo.</Text>
              <Button 
                mode="contained" 
                style={styles.checkinButton}
                onPress={() => navigation.navigate('Check-in' as never)}
              >
                Fazer Check-in Agora
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {readinessPercent !== null && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Sua Prontidão Hoje</Text>
              <IconButton icon="heart-pulse" size={24} />
            </View>
            
            <View style={styles.readinessContainer}>
              <Text style={styles.readinessScore}>{readinessPercent}%</Text>
              <Text style={styles.readinessLabel}>Corpo pronto para treinar</Text>
            </View>

            {readinessPercent >= 80 ? (
              <Text style={styles.readinessFeedback}>🚀 Excelente! Você está bem recuperado e pronto para treinos intensos.</Text>
            ) : readinessPercent >= 60 ? (
              <Text style={styles.readinessFeedback}>👍 Bom! Seu corpo está respondendo bem. Mantenha a consistência.</Text>
            ) : (
              <Text style={styles.readinessFeedback}>⚠️ Atenção! Considere um treino mais leve ou descanso hoje.</Text>
            )}
          </Card.Content>
        </Card>
      )}

      {nextTraining && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Próximo Treino Planejado</Text>
              <Chip icon="calendar-check" mode="flat" style={styles.successChip}>
                Planejado
              </Chip>
            </View>
            
            <View style={styles.trainingInfo}>
              <Text style={styles.trainingType}>{nextTraining.modalidade ? nextTraining.modalidade.charAt(0).toUpperCase() + nextTraining.modalidade.slice(1) : 'Treino'}</Text>
              
              {nextTraining.treino_tipo && (
                <Text style={styles.trainingDetails}>🎯 Tipo: {nextTraining.treino_tipo.charAt(0).toUpperCase() + nextTraining.treino_tipo.slice(1)}</Text>
              )}
              
              {nextTraining.terreno && (
                <Text style={styles.trainingDetails}>🏃 Terreno: {getTerrenoText(nextTraining.terreno)}</Text>
              )}
              
              {nextTraining.distance_km && (
                <Text style={styles.trainingDetails}>📏 Distância: {nextTraining.distance_km}km</Text>
              )}
              
              {(nextTraining.duracao_horas || nextTraining.duracao_minutos) && (
                <Text style={styles.trainingDetails}>⏱️ Duração: {nextTraining.duracao_horas || '0'}h {nextTraining.duracao_minutos || '0'}min</Text>
              )}
              
              {nextTraining.duration_minutes && !nextTraining.duracao_horas && !nextTraining.duracao_minutos && (
                <Text style={styles.trainingDetails}>⏱️ Duração: {nextTraining.duration_minutes}min</Text>
              )}
              
              {nextTraining.intensidade && (
                <Text style={styles.trainingDetails}>⚡ Intensidade: {nextTraining.intensidade}</Text>
              )}
              
              {nextTraining.esforco && (
                <Text style={styles.trainingDetails}>💪 Esforço: {getEsforcoText(nextTraining.esforco)}</Text>
              )}
              
              {nextTraining.percurso && (
                <Text style={styles.trainingDetails}>🛣️ Percurso: {getPercursoText(nextTraining.percurso)}</Text>
              )}
              
              {nextTraining.observacoes && (
                <Text style={styles.trainingDetails}>📝 Observações: {nextTraining.observacoes}</Text>
              )}
              
              <Text style={styles.trainingDate}>
                📅 {format(new Date(nextTraining.training_date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
              </Text>
            </View>

            <Button 
              mode="outlined" 
              style={styles.trainingButton}
              onPress={() => navigation.navigate('Training' as never)}
            >
              Ver Todos os Treinos
            </Button>
          </Card.Content>
        </Card>
      )}

      {lastCompletedTraining && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Último Treino Realizado</Text>
              <Chip icon="check-circle" mode="flat" style={styles.successChip}>
                Concluído
              </Chip>
            </View>
            
            <View style={styles.trainingInfo}>
              <Text style={styles.trainingType}>{lastCompletedTraining.modalidade ? lastCompletedTraining.modalidade.charAt(0).toUpperCase() + lastCompletedTraining.modalidade.slice(1) : 'Treino'}</Text>
              
              {lastCompletedTraining.treino_tipo && (
                <Text style={styles.trainingDetails}>🎯 Tipo: {lastCompletedTraining.treino_tipo.charAt(0).toUpperCase() + lastCompletedTraining.treino_tipo.slice(1)}</Text>
              )}
              
              {lastCompletedTraining.distance_km && (
                <Text style={styles.trainingDetails}>📏 Distância: {lastCompletedTraining.distance_km}km</Text>
              )}
              
              {lastCompletedTraining.duration_minutes && (
                <Text style={styles.trainingDetails}>⏱️ Duração: {lastCompletedTraining.duration_minutes}min</Text>
              )}
              
              {lastCompletedTraining.elevation_gain_meters && (
                <Text style={styles.trainingDetails}>⛰️ Altimetria: +{lastCompletedTraining.elevation_gain_meters}m</Text>
              )}
              
              {lastCompletedTraining.avg_heart_rate && (
                <Text style={styles.trainingDetails}>❤️ FC Média: {lastCompletedTraining.avg_heart_rate}bpm</Text>
              )}
              
              {lastCompletedTraining.perceived_effort && (
                <Text style={styles.trainingDetails}>💪 PSE: {lastCompletedTraining.perceived_effort}/10</Text>
              )}
              
              <Text style={styles.trainingDate}>
                📅 {format(new Date(lastCompletedTraining.training_date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
              </Text>
            </View>

            <Button 
              mode="outlined" 
              style={styles.trainingButton}
              onPress={() => navigation.navigate('Training' as never)}
            >
              Ver Todos os Treinos
            </Button>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Inspiração do Dia</Text>
            <IconButton icon="lightbulb" size={24} />
          </View>
          
          <Text style={styles.quoteText}>&ldquo;{motivationalQuote.text}&rdquo;</Text>
          <Text style={styles.quoteAuthor}>— {motivationalQuote.author}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Ações Rápidas</Text>
          
          <View style={styles.quickActions}>
            <Button 
              mode="contained-tonal" 
              style={styles.actionButton}
              icon="chart-line"
              onPress={() => navigation.navigate('Analysis' as never)}
            >
              Análises
            </Button>
            
            <Button 
              mode="contained-tonal" 
              style={styles.actionButton}
              icon="lightbulb-outline"
              onPress={() => navigation.navigate('Insights' as never)}
            >
              Insights
            </Button>
            
            <Button 
              mode="contained-tonal" 
              style={styles.actionButton}
              icon="account"
              onPress={() => navigation.navigate('SportsProfile' as never)}
            >
              Perfil
            </Button>
            
            <Button 
              mode="contained-tonal" 
              style={styles.actionButton}
              icon="school"
              onPress={() => navigation.navigate('Academy' as never)}
            >
              Academia
            </Button>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 18,
    color: 'white',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  date: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  successChip: {
    backgroundColor: '#4CAF50',
  },
  warningChip: {
    backgroundColor: '#FF9800',
  },
  errorChip: {
    backgroundColor: '#F44336',
  },
  checkinSuccess: {
    alignItems: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  checkinPending: {
    alignItems: 'center',
  },
  pendingMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    textAlign: 'center',
    marginBottom: 4,
  },
  pendingSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  checkinButton: {
    borderRadius: 8,
  },
  readinessContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  readinessScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  readinessLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  readinessFeedback: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  trainingInfo: {
    marginBottom: 16,
  },
  trainingType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  trainingDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  trainingDate: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  trainingButton: {
    borderRadius: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: '#FF9800',
    textAlign: 'center',
    marginBottom: 8,
  },
  completedInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  completedDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  quoteText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    width: '48%',
    marginBottom: 8,
    borderRadius: 8,
  },
  bottomSpace: {
    height: 20,
  },
}); 