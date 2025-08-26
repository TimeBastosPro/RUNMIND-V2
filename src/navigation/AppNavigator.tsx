import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Card, TextInput, Button, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PasswordStrengthIndicator } from '../components/ui/PasswordStrengthIndicator';
import { Logo } from '../components/ui/Logo';
// Temporariamente desabilitado para resolver erro do React
// import { NotificationToast } from '../components/NotificationToast';
// import { useNotificationsStore } from '../stores/notifications';

import { useAuthStore } from '../stores/auth';
import { useCoachStore } from '../stores/coach';
import { supabase, clearCorruptedSession } from '../services/supabase';

// Screens
import DailyCheckinScreen from '../screens/checkin/DailyCheckinScreen';
import HomeScreen from '../screens/home';
import InsightsScreen from '../screens/insights';
import ProfileScreen from '../screens/profile';
import InitialLoadingScreen from '../screens/auth/InitialLoadingScreen';
import TrainingScreen from '../screens/training/TrainingScreen';
import AcademyScreen from '../screens/academy/AcademyScreen';
import GlossaryScreen from '../screens/academy/GlossaryScreen';
import GuidesScreen from '../screens/academy/GuidesScreen';
import ChatScreen from '../screens/academy/ChatScreen';
import ComparativeChartsScreen from '../screens/analysis/ComparativeChartsScreen';
import SportsProfileScreen from '../screens/SportsProfileScreen';

// Coach Screens
import CoachDashboardScreen from '../screens/coach/CoachDashboardScreen';
import CoachProfileScreen from '../screens/coach/CoachProfileScreen';
import CoachRequestsScreen from '../screens/coach/CoachRequestsScreen';
import CoachTeamsScreen from '../screens/coach/CoachTeamsScreen';
import CoachAthletesScreen from '../screens/coach/CoachAthletesScreen';
import CoachAthleteDetailScreen from '../screens/coach/CoachAthleteDetailScreen';
import CoachViewAthleteScreen from '../screens/coach/CoachViewAthleteScreen';
import CoachProfileSetupScreen from '../screens/auth/CoachProfileSetupScreen';
import UserTypeSelectionScreen from '../screens/auth/UserTypeSelectionScreen';
import UserNotRegisteredScreen from '../screens/auth/UserNotRegisteredScreen';

// Athlete Screens
import CoachSearchScreen from '../screens/athlete/CoachSearchScreen';
import { useViewStore } from '../stores/view';
import { useCyclesStore } from '../stores/cycles';

// Types
type TabParamList = {
  Home: undefined;
  'Check-in': undefined;
  Insights: undefined;
  Treinos: undefined;
  Análise: undefined;
  Profile: undefined;
  Academy: undefined;
  'Perfil Esportivo': undefined;
  'Buscar Treinador': undefined;
};

type CoachTabParamList = {
  'CoachHome': undefined;
  'CoachAthletes': undefined;
  'CoachTeams': undefined;
  'CoachAnalytics': undefined;
  'CoachProfile': undefined;
};

type StackParamList = {
  Main: undefined;
  Auth: undefined;
  InitialLoading: undefined;
  UserTypeSelection: undefined;
  CoachProfileSetup: undefined;
  CoachMain: undefined;
  CoachProfile: undefined;
  CoachRequests: undefined;
  CoachTeams: undefined;
  CoachAthletes: undefined;
  CoachAthleteDetail: { relationshipId: string; athleteId: string };
  CoachViewAthlete: { athleteId: string; relationshipId?: string; athleteName?: string; athleteEmail?: string };
  CoachAthleteHome: { athleteId: string };
  CoachAthleteTrainings: { athleteId: string };
  CoachAthleteSportsProfile: { athleteId: string };
  CoachAthleteAnalysis: { athleteId: string };
  CoachAthleteInsights: { athleteId: string };
  Calendar: undefined;
  UserNotRegistered: undefined;
};

type NavigationProps = {
  navigation?: any;
};

import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

function AuthScreen({ onCoachSelected }: { onCoachSelected?: () => void }) {
  const { signIn, signUp, isLoading, resetPassword } = useAuthStore();
  const { currentCoach, loadCoachProfile } = useCoachStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showUserTypeSelection, setShowUserTypeSelection] = useState(false);
  const [isCoachSignUp, setIsCoachSignUp] = useState(false);

  // ✅ CORRIGIDO: Usar um schema unificado para evitar recriação do formulário
  const unifiedSchema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    fullName: z.string().optional(),
    cref: z.string().optional(), // ✅ NOVO: Campo CREF para treinadores
  });

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof unifiedSchema>>({
    resolver: zodResolver(unifiedSchema),
    defaultValues: { email: '', password: '', fullName: '', cref: '' }, // ✅ NOVO: Incluir cref
    mode: 'onBlur', // ✅ CORRIGIDO: Mudança de 'onChange' para 'onBlur' para reduzir re-renders
    reValidateMode: 'onBlur', // ✅ NOVO: Revalidação apenas no blur
  });

  // ✅ NOVO: Função para alternar entre login/signup sem resetar o email
  const toggleLoginMode = (newIsLogin: boolean) => {
    const currentEmail = control._formValues.email || '';
    setIsLogin(newIsLogin);
    
    // ✅ CORRIGIDO: Manter o email quando alternar entre modos
    if (currentEmail) {
      // ✅ NOVO: Usar requestAnimationFrame para evitar conflitos de renderização
      requestAnimationFrame(() => {
        reset({ 
          email: currentEmail, 
          password: '', 
          fullName: '',
          cref: '' // ✅ NOVO: Resetar cref também
        });
      });
    }
  };

  // ✅ NOVO: Função para alternar para modo treinador
  const toggleCoachMode = () => {
    const currentEmail = control._formValues.email || '';
    setIsCoachSignUp(true);
    setIsLogin(false);
    
    // ✅ CORRIGIDO: Manter o email quando alternar para modo treinador
    if (currentEmail) {
      requestAnimationFrame(() => {
        reset({ 
          email: currentEmail, 
          password: '', 
          fullName: '',
          cref: '' // ✅ NOVO: Resetar cref também
        });
      });
    }
  };

  // ✅ NOVO: Função para voltar para modo atleta
  const toggleAthleteMode = () => {
    const currentEmail = control._formValues.email || '';
    setIsLogin(true);
    setIsCoachSignUp(false);
    
    // ✅ CORRIGIDO: Manter o email quando voltar para modo atleta
    if (currentEmail) {
      requestAnimationFrame(() => {
        reset({ 
          email: currentEmail, 
          password: '', 
          fullName: '',
          cref: '' // ✅ NOVO: Resetar cref também
        });
      });
    }
  };

  // ✅ REMOVIDO: useEffect que estava causando reset desnecessário

  const onSubmit = async (data: any) => {
    try {
      if (isLogin) {
        await signIn(data.email, data.password);
        // Após login, carregar perfil de treinador e seguir para área correta
        try {
          await loadCoachProfile();
        } catch (error) {
          console.log('⚠️ Erro ao carregar perfil de coach após login:', error);
          // Não falhar o login por erro no carregamento do coach
        }
      } else {
        // ✅ CORRIGIDO: Validar se fullName está presente para signup
        if (!data.fullName || data.fullName.trim() === '') {
          setError('fullName', { message: 'Nome completo é obrigatório' });
          return;
        }
        
        // ✅ NOVO: Validar CREF para treinadores
        if (isCoachSignUp) {
          if (!data.cref || data.cref.trim() === '') {
            setError('cref', { message: 'CREF é obrigatório para treinadores' });
            return;
          }
          
          // ✅ NOVO: Validar formato do CREF (123456-GMG ou 123456-PSP)
          const crefRegex = /^\d{6}-[PG][A-Z]{2}$/;
          if (!crefRegex.test(data.cref.trim())) {
            setError('cref', { message: 'CREF deve estar no formato: 123456-GMG ou 123456-PSP' });
            return;
          }
        }
        
        await signUp(data.email, data.password, data.fullName, { 
          isCoach: isCoachSignUp,
          cref: isCoachSignUp ? data.cref.trim() : undefined // ✅ NOVO: Passar CREF
        });
        if (isCoachSignUp) {
          // Cadastro de treinador: carregar perfil e enviar imediatamente para CoachMain
          try {
            await loadCoachProfile();
          } catch (error) {
            console.log('⚠️ Erro ao carregar perfil de coach após signup:', error);
            // Não falhar o signup por erro no carregamento do coach
          }
          try {
            // @ts-ignore
            (props as any)?.navigation?.reset?.({ index: 0, routes: [{ name: 'CoachMain' }] });
          } catch {}
          onCoachSelected?.();
        } else {
          // Cadastro de atleta: voltar para login
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.error('🔍 Erro na autenticação:', error);
      
      // ✅ MELHORADO: Tratamento específico de erros para mobile
      let errorMessage = 'Erro ao autenticar.';
      
      if (error.message) {
        // ✅ NOVO: Verificar se é erro de usuário não cadastrado
        if (error.message.includes('Usuário não cadastrado') || 
            error.message.includes('não está cadastrado') ||
            error.message.includes('Crie uma conta primeiro')) {
          // ✅ NOVO: Mostrar mensagem específica para usuário não cadastrado
          errorMessage = 'Usuário não cadastrado no sistema. Crie uma conta primeiro.';
        }
        
        // ✅ NOVO: Mensagens mais específicas para mobile
        if (error.message.includes('Email ou senha incorretos')) {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
        } else if (error.message.includes('Confirme seu email')) {
          errorMessage = 'Confirme seu email antes de fazer login.';
        } else if (error.message.includes('já está cadastrado')) {
          errorMessage = 'Este email já está cadastrado. Tente fazer login.';
        } else if (error.message.includes('pelo menos 6 caracteres')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (error.message.includes('Email inválido')) {
          errorMessage = 'Email inválido. Verifique o formato.';
        } else if (error.message.includes('Muitas tentativas')) {
          errorMessage = 'Muitas tentativas de login. Aguarde alguns minutos.';
        } else if (error.message.includes('Erro de conexão')) {
          errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Confirme seu email antes de fazer login.';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado. Tente fazer login.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Email inválido. Verifique o formato.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError('root', { message: errorMessage });
    }
  };

  // ✅ NOVO: Função para reset de senha
  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email);
      setError('root', { 
        message: 'Email de reset enviado! Verifique sua caixa de entrada.',
        type: 'success'
      });
      setShowResetPassword(false);
    } catch (error: any) {
      setError('root', { message: error.message });
    }
  };

  // Componente de seleção de tipo de usuário (mantido para compatibilidade)
  if (showUserTypeSelection) {
    return (
      <UserTypeSelectionScreen 
        navigation={{ goBack: () => setShowUserTypeSelection(false) }}
        onSelectUserType={(userType) => {
          if (userType === 'coach') {
            // Navegar para configuração de perfil de treinador
            setShowUserTypeSelection(false);
            onCoachSelected?.();
          } else {
            // Atleta - voltar para login
            setShowUserTypeSelection(false);
            setIsLogin(true);
          }
        }}
      />
    );
  }

  // Componente de reset de senha
  if (showResetPassword) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <Card>
          <Card.Content>
            <Text variant="headlineMedium" style={{ textAlign: 'center', marginBottom: 24 }}>
              🔐 Reset de Senha
            </Text>
            <Text variant="bodyLarge" style={{ textAlign: 'center', marginBottom: 24 }}>
              Digite seu email para receber o link de reset
            </Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput
                    label="Email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ marginBottom: 16 }}
                    mode="outlined"
                  />
                  <HelperText type="error" visible={!!errors.email}>
                    {errors.email?.message}
                  </HelperText>
                </>
              )}
            />

            <HelperText 
              type={errors.root?.type === 'success' ? 'info' : 'error'} 
              visible={!!errors.root}
              style={{ 
                color: errors.root?.type === 'success' ? '#4CAF50' : undefined 
              }}
            >
              {errors.root?.message}
            </HelperText>

            <Button
              mode="contained"
              onPress={() => handleResetPassword(control._formValues.email)}
              loading={isLoading}
              disabled={isLoading || !control._formValues.email}
              style={{ marginBottom: 16 }}
              contentStyle={{ paddingVertical: 8 }}
            >
              Enviar Email de Reset
            </Button>

            <Button mode="text" onPress={() => setShowResetPassword(false)}>
              Voltar para Login
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Card>
        <Card.Content>
          <Logo size="large" showText={false} style={{ marginBottom: 24 }} />
          <Text variant="bodyLarge" style={{ textAlign: 'center', marginBottom: 24 }}>
            {isLogin ? 'Entre na sua conta' : (isCoachSignUp ? 'Crie sua conta de Treinador' : 'Crie sua conta de Atleta')}
          </Text>
          
          {!isLogin && isCoachSignUp && (
            <Text variant="bodySmall" style={{ textAlign: 'center', marginBottom: 16, color: '#666', fontStyle: 'italic' }}>
              Complete seu perfil profissional após o cadastro
            </Text>
          )}

          {!isLogin && (
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput
                    label="Nome completo"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    style={{ marginBottom: 4 }}
                    mode="outlined"
                  />
                  <HelperText type="error" visible={
                    !isLogin &&
                    typeof errors === 'object' &&
                    'fullName' in errors &&
                    !!(errors as any).fullName
                  }>
                    {(!isLogin && typeof errors === 'object' && 'fullName' in errors && (errors as any).fullName?.message) || ''}
                  </HelperText>
                </>
              )}
            />
          )}

          {/* ✅ NOVO: Campo CREF apenas para treinadores */}
          {!isLogin && isCoachSignUp && (
            <Controller
              control={control}
              name="cref"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput
                    label="CREF (Conselho Regional de Educação Física)"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="123456-SP"
                    style={{ marginBottom: 4 }}
                    mode="outlined"
                  />
                  <HelperText type="info" visible={true}>
                    Formato: 123456-SP (6 dígitos + hífen + 2 letras do estado)
                  </HelperText>
                  <HelperText type="error" visible={
                    !isLogin &&
                    typeof errors === 'object' &&
                    'cref' in errors &&
                    !!(errors as any).cref
                  }>
                    {(!isLogin && typeof errors === 'object' && 'cref' in errors && (errors as any).cref?.message) || ''}
                  </HelperText>
                </>
              )}
            />
          )}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  style={{ marginBottom: 4 }}
                  mode="outlined"
                  dense
                />
                <HelperText type="error" visible={!!errors.email}>
                  {errors.email?.message}
                </HelperText>
              </>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  label="Senha"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  style={{ marginBottom: 4 }}
                  mode="outlined"
                />
                {!isLogin && value && (
                  <PasswordStrengthIndicator 
                    password={value} 
                    showRequirements={true}
                    style={{ marginBottom: 8 }}
                  />
                )}
                {!isLogin && !value && (
                  <HelperText type="info" visible={true}>
                    A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, números e símbolos
                  </HelperText>
                )}
                <HelperText type="error" visible={!!errors.password}>
                  {errors.password?.message}
                </HelperText>
              </>
            )}
          />

          {/* ✅ MELHORADO: Mensagem de sucesso para cadastro */}
          <HelperText 
            type={errors.root?.type === 'success' ? 'info' : 'error'} 
            visible={!!errors.root}
            style={{ 
              color: errors.root?.type === 'success' ? '#4CAF50' : undefined 
            }}
          >
            {errors.root?.message}
          </HelperText>

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={{ marginBottom: 16 }}
            contentStyle={{ paddingVertical: 8 }}
          >
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </Button>

          {isLogin ? (
            <>
              <Button mode="text" onPress={() => toggleLoginMode(false)}>
                Não tem conta? Criar conta de Atleta
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={() => {
                  toggleCoachMode();
                }}
                style={{ marginBottom: 8 }}
                contentStyle={{ paddingVertical: 8 }}
              >
                👨‍💼 Criar conta de Treinador
              </Button>
            </>
          ) : (
            <Button mode="text" onPress={toggleAthleteMode}>
              Já tem conta? Entrar
            </Button>
          )}

          {isLogin && (
            <Button mode="text" onPress={() => setShowResetPassword(true)}>
              Esqueci minha senha
            </Button>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<StackParamList>();
const CoachTabsNav = createBottomTabNavigator<CoachTabParamList>();

function CoachTabsComponent() {
  return (
    <CoachTabsNav.Navigator
      initialRouteName="CoachAthletes"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let icon: keyof typeof MaterialCommunityIcons.glyphMap = 'account-group';
          if (route.name === 'CoachAthletes') icon = 'account-group';
          if (route.name === 'CoachProfile') icon = 'account-cog';
          return <MaterialCommunityIcons name={icon} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      {/* Visão Geral removida a pedido */}
      <CoachTabsNav.Screen name="CoachAthletes" component={CoachAthletesScreen} options={{ title: 'Atletas' }} />
      <CoachTabsNav.Screen name="CoachProfile" component={CoachProfileScreen} options={{ title: 'Perfil' }} />
    </CoachTabsNav.Navigator>
  );
}
const AcademyStack = createStackNavigator();

function AcademyNavigator() {
  return (
    <AcademyStack.Navigator>
      <AcademyStack.Screen name="Academy" component={AcademyScreen} options={{ title: 'Academy' }} />
      <AcademyStack.Screen name="Glossary" component={GlossaryScreen} options={{ title: 'Glossário' }} />
      <AcademyStack.Screen name="Guides" component={GuidesScreen} options={{ title: 'Guias de Treino' }} />
      <AcademyStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat com IA' }} />
    </AcademyStack.Navigator>
  );
}

function MainTabs() {
  const { isCoachView } = useViewStore();
  const { currentCoach } = useCoachStore();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Check-in') {
            iconName = 'clipboard-check';
          } else if (route.name === 'Insights') {
            iconName = 'lightbulb';
          } else if (route.name === 'Treinos') {
            iconName = 'run';
          } else if (route.name === 'Análise') {
            iconName = 'chart-line';
          } else if (route.name === 'Profile') {
            iconName = 'account';
          } else if (route.name === 'Academy') {
            iconName = 'school';
          } else if (route.name === 'Perfil Esportivo') {
            iconName = 'run-fast';
          } else if (route.name === 'Buscar Treinador') {
            iconName = 'account-search';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      {(!isCoachView && !currentCoach) && <Tab.Screen name="Check-in" component={DailyCheckinScreen} />}
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Treinos" component={TrainingScreen} />
      <Tab.Screen name="Análise" component={ComparativeChartsScreen} />
      {(!isCoachView && !currentCoach) && <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />}
      <Tab.Screen name="Perfil Esportivo" component={SportsProfileScreen} options={{ title: 'Perfil Esportivo' }} />
      {(!isCoachView && !currentCoach) && <Tab.Screen name="Academy" component={AcademyNavigator} options={{ title: 'Academy' }} />}
      {(!isCoachView && !currentCoach) && <Tab.Screen name="Buscar Treinador" component={CoachSearchScreen} options={{ title: 'Treinador' }} />}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { 
    user, 
    isAuthenticated, 
    isInitializing, 
    isLoading, 
    loadProfile, 
    setInitializing 
  } = useAuthStore();
  
  const { currentCoach, loadCoachProfile, isLoading: coachLoading } = useCoachStore();
  const [showCoachProfileSetup, setShowCoachProfileSetup] = useState(false);
  const [hasPushedCoachMain, setHasPushedCoachMain] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // ✅ MELHORADO: Timeout de segurança aumentado para melhor experiência
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Timeout de segurança: forçando saída da tela de carregamento');
      setLoadingTimeout(true);
      useAuthStore.setState({ isInitializing: false });
    }, 30000); // 30 segundos - tempo mais adequado para conexões lentas

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // ✅ MELHORADO: Inicialização com verificação de sessão corrompida
    const initializeAuth = async () => {
      try {
        console.log('🔍 Inicializando autenticação...');
        
        // ✅ NOVO: LIMPEZA IMEDIATA ANTES DE QUALQUER VERIFICAÇÃO
        console.log('🧹 LIMPEZA IMEDIATA no carregamento da aplicação...');
        await useAuthStore.getState().clearAllLocalData();
        
        // ✅ NOVO: Verificar e reparar sessão corrompida
        const sessionValid = await useAuthStore.getState().checkAndRepairSession();
        
        if (!sessionValid) {
          console.log('🔍 Sessão corrompida detectada - limpando dados');
          useAuthStore.setState({ isInitializing: false });
          return;
        }
        
        // Verificar sessão atual de forma mais simples
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('🔍 Usuário autenticado encontrado:', session.user.id);
          
          // ✅ NOVO: VALIDAÇÃO CRÍTICA DE SESSÃO
          console.log('🔍 Validando sessão antes de permitir acesso...');
          const isSessionValid = await useAuthStore.getState().validateSession();
          
          if (!isSessionValid) {
            console.error('❌ Sessão inválida detectada - redirecionando para login');
            useAuthStore.setState({
              user: null,
              profile: null,
              isAuthenticated: false,
              isInitializing: false,
            });
            return;
          }
          
          console.log('✅ Sessão validada - permitindo acesso');
          useAuthStore.setState({
            user: session.user,
            isAuthenticated: true,
            isInitializing: false,
          });
          
          // ✅ NOVO: Iniciar validação periódica de sessão
          const stopValidation = useAuthStore.getState().startSessionValidation();
          
          // ✅ NOVO: Limpar validação quando o componente for desmontado
          return () => {
            stopValidation();
          };
          
          // ✅ MELHORADO: Carregar perfis em sequência para evitar conflitos
          try {
            await loadCoachProfile();
          } catch (e) {
            console.log('Perfil de treinador ausente');
          }
          
          // ✅ MELHORADO: Sempre carregar perfil de atleta de forma segura se não for treinador
          if (!useCoachStore.getState().currentCoach) {
            try { 
              console.log('🔍 Carregando perfil de atleta após inicialização...');
              await useAuthStore.getState().loadProfileSafely(); 
              
              // ✅ NOVO: Carregar dados de ciclos após o perfil
              console.log('🔍 Carregando dados de ciclos...');
              const { fetchMacrociclos, fetchMesociclos } = useCyclesStore.getState();
              await Promise.all([
                fetchMacrociclos(),
                fetchMesociclos()
              ]);
              console.log('✅ Dados de ciclos carregados com sucesso');
            } catch (e) { 
              console.log('Perfil de atleta ausente'); 
            }
          }
        } else {
          console.log('🔍 Sem sessão válida');
          useAuthStore.setState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isInitializing: false,
          });
        }
      } catch (error) {
        console.error('🔍 Erro na inicialização:', error);
        useAuthStore.setState({
          user: null,
          profile: null,
          isAuthenticated: false,
          isInitializing: false,
        });
      }
    };

    initializeAuth();

    // Listener para mudanças futuras
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 Auth state change:', event, session?.user?.id);
      
      try {
        if (session?.user) {
          // ✅ NOVO: Verificação imediata de perfil incorreto
          console.log('🔍 Verificando se o perfil carregado está correto...');
          
          useAuthStore.setState({
            user: session.user,
            isAuthenticated: true,
            isInitializing: false
          });
          
          // ✅ MELHORADO: Carregar perfis em sequência para evitar conflitos
          try {
            await loadCoachProfile();
          } catch (e) {
            console.log('Perfil de treinador ausente');
          }
          
          // Só carregar perfil de atleta se não for treinador
          if (!useCoachStore.getState().currentCoach) {
            try { 
              console.log('🔍 Carregando perfil de atleta após inicialização...');
              await useAuthStore.getState().loadProfileSafely(); 
              
              // ✅ NOVO: Carregar dados de ciclos após o perfil
              console.log('🔍 Carregando dados de ciclos...');
              const { fetchMacrociclos, fetchMesociclos } = useCyclesStore.getState();
              await Promise.all([
                fetchMacrociclos(),
                fetchMesociclos()
              ]);
              console.log('✅ Dados de ciclos carregados com sucesso');
            } catch (e) { 
              console.log('Perfil de atleta ausente'); 
            }
          }
          
          // ✅ NOVO: Verificação adicional após carregamento
          const currentProfile = useAuthStore.getState().profile;
          if (currentProfile && currentProfile.email !== session.user.email) {
            console.warn('⚠️ PERFIL INCORRETO DETECTADO - limpando e recarregando');
            await useAuthStore.getState().clearAllLocalData();
            await useAuthStore.getState().loadProfileSafely();
          }
          
          if (useCoachStore.getState().currentCoach) {
            setShowCoachProfileSetup(false);
          }
        } else {
          useAuthStore.setState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isInitializing: false
          });
          try { useViewStore.getState().exitCoachView(); } catch {}
        }
      } catch (error) {
        console.error('🔍 Erro no auth state change:', error);
        useAuthStore.setState({
          user: null,
          profile: null,
          isAuthenticated: false,
          isInitializing: false
        });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [loadProfile, loadCoachProfile, setInitializing]);

  // ✅ MELHORADO: Condição de carregamento com timeout
  if ((isInitializing || isLoading) && !loadingTimeout) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 16 }}>Carregando RunMind...</Text>
        {loadingTimeout && (
          <TouchableOpacity 
            style={{ 
              marginTop: 20, 
              padding: 10, 
              backgroundColor: '#2196F3', 
              borderRadius: 5 
            }}
            onPress={() => {
              setLoadingTimeout(false);
              useAuthStore.setState({ isInitializing: false });
            }}
          >
            <Text style={{ color: 'white' }}>Continuar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Redirecionamento defensivo: se autenticado e é treinador, garantir CoachMain na primeira renderização
  if (isAuthenticated && currentCoach && !hasPushedCoachMain) {
    setHasPushedCoachMain(true);
  }

  const isCoachUser = !!(user && (user as any).user_metadata && (user as any).user_metadata.user_type === 'coach');
  const showCoachStack = isAuthenticated && (isCoachUser || !!currentCoach);
  const navigatorKey = `${isAuthenticated ? 'auth' : 'no'}-${showCoachStack ? 'coach' : 'ath'}`;
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator key={navigatorKey} screenOptions={{ headerShown: false }} initialRouteName={isAuthenticated ? (showCoachStack ? 'CoachMain' : 'Main') : 'Auth'}>
        {isAuthenticated ? (
          showCoachStack ? (
            // Usuário é treinador
            <>
              <Stack.Screen name="CoachMain" component={CoachTabsComponent} />
              <Stack.Screen name="CoachProfile" component={CoachProfileScreen} />
              {/* Habilita navegação para as abas do atleta em modo treinador */}
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="CoachRequests" component={CoachRequestsScreen} />
              <Stack.Screen name="CoachTeams" component={CoachTeamsScreen} />
              <Stack.Screen name="CoachAthletes" component={CoachAthletesScreen} />
              <Stack.Screen name="CoachAthleteDetail" component={CoachAthleteDetailScreen} />
              <Stack.Screen name="CoachViewAthlete" component={CoachViewAthleteScreen} />
              <Stack.Screen name="CoachAthleteHome" component={CoachViewAthleteScreen as any} />
              <Stack.Screen name="CoachAthleteTrainings" component={CoachViewAthleteScreen as any} />
              <Stack.Screen name="CoachAthleteSportsProfile" component={CoachViewAthleteScreen as any} />
              <Stack.Screen name="CoachAthleteAnalysis" component={CoachViewAthleteScreen as any} />
              <Stack.Screen name="CoachAthleteInsights" component={CoachViewAthleteScreen as any} />
            </>
          ) : (
            // Usuário é atleta
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="InitialLoading" component={InitialLoadingScreen} />
            </>
          )
        ) : (
          <>
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen}
            />
            <Stack.Screen 
              name="UserNotRegistered" 
              component={UserNotRegisteredScreen} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}