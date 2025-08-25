// src/utils/notifications.ts

export interface NotificationMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number; // em milissegundos, undefined = não fecha automaticamente
  action?: {
    label: string;
    onPress: () => void;
  };
}

export interface WelcomeMessage {
  title: string;
  message: string;
  tips: string[];
}

/**
 * Gera mensagem de boas-vindas personalizada baseada no tipo de usuário
 */
export const generateWelcomeMessage = (
  fullName: string, 
  userType: 'athlete' | 'coach'
): WelcomeMessage => {
  const firstName = fullName.split(' ')[0];
  
  if (userType === 'coach') {
    return {
      title: `Bem-vindo(a), ${firstName}! 🏃‍♂️`,
      message: `Parabéns por se juntar ao RunMind como treinador! Você agora tem acesso a ferramentas poderosas para acompanhar e orientar seus atletas com base na ciência do treinamento esportivo.`,
      tips: [
        'Complete seu perfil profissional para ser encontrado por atletas',
        'Configure suas especialidades e metodologia de treinamento',
        'Explore as ferramentas de análise de performance',
        'Conecte-se com atletas que compartilham seus objetivos'
      ]
    };
  }
  
  return {
    title: `Bem-vindo(a), ${firstName}! 🏃‍♀️`,
    message: `Parabéns por dar o primeiro passo em sua jornada de corrida! O RunMind vai te ajudar a treinar de forma inteligente, evitando lesões e maximizando seus resultados.`,
    tips: [
      'Complete seu perfil para receber treinos personalizados',
      'Configure suas preferências de treinamento',
      'Faça seu primeiro check-in diário',
      'Explore as análises de carga de treino'
    ]
  };
};

/**
 * Gera mensagem de confirmação de cadastro
 */
export const generateSignupConfirmation = (
  email: string,
  userType: 'athlete' | 'coach'
): NotificationMessage => {
  return {
    id: `signup-confirmation-${Date.now()}`,
    type: 'success',
    title: '🎉 Cadastro realizado com sucesso!',
    message: userType === 'coach' 
      ? `Sua conta de treinador foi criada! Agora você pode começar a usar todas as ferramentas do RunMind para orientar seus atletas.`
      : `Sua conta foi criada com sucesso! Agora você pode começar sua jornada de treinamento inteligente.`,
    duration: 8000, // 8 segundos
    action: {
      label: 'Começar',
      onPress: () => {
        // Ação será definida no componente que usa a notificação
        console.log('Usuário clicou em "Começar"');
      }
    }
  };
};

/**
 * Gera mensagem de onboarding
 */
export const generateOnboardingMessage = (
  userType: 'athlete' | 'coach'
): NotificationMessage => {
  return {
    id: `onboarding-${Date.now()}`,
    type: 'info',
    title: '📋 Vamos configurar seu perfil?',
    message: userType === 'coach'
      ? 'Complete seu perfil profissional para ser encontrado por atletas e começar a usar todas as ferramentas disponíveis.'
      : 'Complete seu perfil para receber treinos personalizados e começar sua jornada de treinamento.',
    duration: undefined, // Não fecha automaticamente
    action: {
      label: 'Configurar Perfil',
      onPress: () => {
        console.log('Usuário quer configurar perfil');
      }
    }
  };
};

/**
 * Gera dicas de uso da plataforma
 */
export const generatePlatformTips = (
  userType: 'athlete' | 'coach'
): string[] => {
  if (userType === 'coach') {
    return [
      '💡 Use as análises de carga para orientar seus atletas com precisão',
      '💡 Configure suas especialidades para ser encontrado por atletas',
      '💡 Monitore o progresso dos seus atletas em tempo real',
      '💡 Utilize os insights automáticos para dar feedback personalizado'
    ];
  }
  
  return [
    '💡 Faça check-in diário para acompanhar seu bem-estar',
    '💡 Registre seus treinos para análises de performance',
    '💡 Monitore sua carga de treino para evitar lesões',
    '💡 Use os insights automáticos para otimizar seus treinos'
  ];
};

/**
 * Gera mensagem de primeiro acesso
 */
export const generateFirstAccessMessage = (
  fullName: string,
  userType: 'athlete' | 'coach'
): NotificationMessage => {
  const firstName = fullName.split(' ')[0];
  
  return {
    id: `first-access-${Date.now()}`,
    type: 'info',
    title: `Olá, ${firstName}! 👋`,
    message: userType === 'coach'
      ? 'Bem-vindo ao RunMind! Vamos configurar seu perfil profissional para que você possa começar a orientar atletas com excelência.'
      : 'Bem-vindo ao RunMind! Vamos configurar seu perfil para que você possa começar sua jornada de treinamento inteligente.',
    duration: undefined,
    action: {
      label: 'Vamos lá!',
      onPress: () => {
        console.log('Usuário quer começar configuração');
      }
    }
  };
};
