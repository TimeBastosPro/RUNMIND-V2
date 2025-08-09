import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Card, TextInput, Button, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

// Athlete Screens
import CoachSearchScreen from '../screens/athlete/CoachSearchScreen';
import { useViewStore } from '../stores/view';

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
};

type NavigationProps = {
  navigation?: any;
};

import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});
const signUpSchema = loginSchema.extend({
  fullName: z.string().min(1, 'O nome completo é obrigatório'),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;

function AuthScreen({ onCoachSelected }: { onCoachSelected?: () => void }) {
  const { signIn, signUp, isLoading, resetPassword } = useAuthStore();
  const { currentCoach, loadCoachProfile } = useCoachStore();
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showUserTypeSelection, setShowUserTypeSelection] = useState(false);
  const [isCoachSignUp, setIsCoachSignUp] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginForm | SignUpForm>({
    resolver: zodResolver(isLogin ? loginSchema : signUpSchema),
    defaultValues: { email: '', password: '', fullName: '' },
  });

  const onSubmit = async (data: any) => {
    try {
      if (isLogin) {
        await signIn(data.email, data.password);
        // Após login, carregar perfil de treinador e seguir para área correta
        await loadCoachProfile();
      } else {
        await signUp(data.email, data.password, data.fullName, { isCoach: isCoachSignUp });
        if (isCoachSignUp) {
          // Cadastro de treinador: carregar perfil e enviar imediatamente para CoachMain
          await loadCoachProfile();
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
          <Text variant="headlineMedium" style={{ textAlign: 'center', marginBottom: 24 }}>
            🏃‍♂️ RunMind
          </Text>
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
                  style={{ marginBottom: 4 }}
                  mode="outlined"
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
              <Button mode="text" onPress={() => setIsLogin(false)}>
                Não tem conta? Criar conta de Atleta
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={() => {
                  setIsCoachSignUp(true);
                  setIsLogin(false);
                }}
                style={{ marginBottom: 8 }}
                contentStyle={{ paddingVertical: 8 }}
              >
                👨‍💼 Criar conta de Treinador
              </Button>
            </>
          ) : (
            <Button mode="text" onPress={() => {
              setIsLogin(true);
              setIsCoachSignUp(false);
            }}>
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
      initialRouteName="CoachHome"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let icon: keyof typeof MaterialCommunityIcons.glyphMap = 'view-dashboard';
          if (route.name === 'CoachHome') icon = 'view-dashboard';
          if (route.name === 'CoachAthletes') icon = 'account-group';
          if (route.name === 'CoachTeams') icon = 'trophy';
          if (route.name === 'CoachProfile') icon = 'account-cog';
          return <MaterialCommunityIcons name={icon} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <CoachTabsNav.Screen name="CoachHome" component={CoachDashboardScreen} options={{ title: 'Visão Geral' }} />
      <CoachTabsNav.Screen name="CoachAthletes" component={CoachAthletesScreen} options={{ title: 'Atletas' }} />
      <CoachTabsNav.Screen name="CoachTeams" component={CoachTeamsScreen} options={{ title: 'Equipes' }} />
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
  const { user, profile, isLoading, isInitializing, isAuthenticated, loadProfile, setInitializing } = useAuthStore();
  const { currentCoach, loadCoachProfile, isLoading: coachLoading } = useCoachStore();
  const [showCoachProfileSetup, setShowCoachProfileSetup] = useState(false);
  const [hasPushedCoachMain, setHasPushedCoachMain] = useState(false);

  useEffect(() => {
    // ✅ Inicialização com validação remota do usuário
    const initializeAuth = async () => {
      try {
        console.log('🔍 Inicializando autenticação (validação remota)...');
        // getUser faz chamada de rede; detecta conta removida no servidor
        const { data: { user }, error } = await supabase.auth.getUser();

        if (user && !error) {
          console.log('🔍 Usuário autenticado encontrado:', user.id);
          useAuthStore.setState({
            user,
            isAuthenticated: true,
            isInitializing: true,
          });
          try { await loadProfile(); } catch (e) { console.log('Perfil ausente, seguindo como treinador apenas'); }
          await loadCoachProfile();

          // ✅ Verificação forte de cadastro (profiles ou coaches)
          try {
            const userId = user.id;
            const [profileRes, coachRes] = await Promise.all([
              supabase.from('profiles').select('id').eq('id', userId).maybeSingle(),
              supabase.from('coaches').select('id').eq('user_id', userId).maybeSingle(),
            ]);
            const hasProfile = !!profileRes.data;
            const isCoach = !!coachRes.data;
            if (!hasProfile && !isCoach) {
              console.log('🔒 Sessão bloqueada: usuário sem cadastro em profiles/coaches. Limpando sessão...');
              try { await clearCorruptedSession(); } catch {}
              useAuthStore.setState({
                user: null,
                profile: null,
                isAuthenticated: false,
                isInitializing: false,
              });
              return;
            }
          } catch (e) {
            console.log('⚠️ Erro ao validar cadastro. Permitindo continuação por ora.');
          }

          useAuthStore.setState({ isInitializing: false });
        } else {
          console.log('🔍 Sem usuário válido. Limpando sessão local...');
          try { await clearCorruptedSession(); } catch {}
          useAuthStore.setState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isInitializing: false,
          });
        }
      } catch (error) {
        console.error('🔍 Erro na inicialização (getUser):', error);
        try { await clearCorruptedSession(); } catch {}
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
          // ✅ CORRIGIDO: Unificar setState
          useAuthStore.setState({
            user: session.user,
            isAuthenticated: true,
            isInitializing: false
          });
          await loadProfile();
          await loadCoachProfile(); // Carregar perfil de treinador se existir
          // Se for treinador, garantir que a primeira tela seja CoachMain
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
          // Limpa modo treinador ao perder sessão
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

  if (isInitializing || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 16 }}>Carregando RunMind...</Text>
      </View>
    );
  }

  // Redirecionamento defensivo: se autenticado e é treinador, garantir CoachMain na primeira renderização
  if (isAuthenticated && currentCoach && !hasPushedCoachMain) {
    setHasPushedCoachMain(true);
  }

  const navigatorKey = `${isAuthenticated ? 'auth' : 'no'}-${currentCoach ? 'coach' : 'ath'}`;
  return (
    <NavigationContainer>
      <Stack.Navigator key={navigatorKey} screenOptions={{ headerShown: false }} initialRouteName={isAuthenticated ? (currentCoach ? 'CoachMain' : 'Main') : 'Auth'}>
        {isAuthenticated ? (
          currentCoach ? (
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
          <Stack.Screen 
            name="Auth" 
            component={(props: any) => (
              <AuthScreen 
                {...props} 
                onCoachSelected={() => setShowCoachProfileSetup(true)} 
              />
            )} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}