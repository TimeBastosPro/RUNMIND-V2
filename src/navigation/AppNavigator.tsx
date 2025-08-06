import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Card, TextInput, Button, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../stores/auth';
import { supabase, checkAndRepairSession } from '../services/supabase';

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
// Remover: import CalendarScreen from '../screens/training/CalendarScreen';

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
};

type StackParamList = {
  Main: undefined;
  Auth: undefined;
  InitialLoading: undefined;

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

function AuthScreen() {
  const { signIn, signUp, isLoading, resetPassword } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);

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
      } else {
        await signUp(data.email, data.password, data.fullName);
        // ✅ MELHORADO: Mostrar mensagem de sucesso para cadastro
        setError('root', { 
          message: 'Conta criada com sucesso! Faça login para continuar.',
          type: 'success'
        });
        setIsLogin(true); // Voltar para tela de login
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

  // ✅ NOVO: Componente de reset de senha
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
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </Text>

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

          <Button mode="text" onPress={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
          </Button>

          <Button mode="text" onPress={() => setShowResetPassword(true)}>
            Esqueci minha senha
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<StackParamList>();
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
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Check-in" component={DailyCheckinScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Treinos" component={TrainingScreen} />
      <Tab.Screen name="Análise" component={ComparativeChartsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
      <Tab.Screen name="Perfil Esportivo" component={SportsProfileScreen} options={{ title: 'Perfil Esportivo' }} />
      <Tab.Screen name="Academy" component={AcademyNavigator} options={{ title: 'Academy' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, profile, isLoading, isInitializing, isAuthenticated, loadProfile, setInitializing } = useAuthStore();

  useEffect(() => {
    // ✅ MELHORADO: Verificação inicial com reparo de sessão
    const initializeAuth = async () => {
      try {
        console.log('🔍 Inicializando autenticação...');
        
        // Verificar e reparar sessão corrompida
        const hasValidSession = await checkAndRepairSession();
        
        if (hasValidSession) {
          // Checagem inicial da sessão
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session?.user && !error) {
            console.log('🔍 Sessão válida encontrada:', session.user.id);
            useAuthStore.setState({
              user: session.user,
              isAuthenticated: true,
              isInitializing: false
            });
            loadProfile();
          } else {
            console.log('🔍 Nenhuma sessão válida encontrada');
            useAuthStore.setState({
              user: null,
              profile: null,
              isAuthenticated: false,
              isInitializing: false
            });
          }
        } else {
          console.log('🔍 Sessão inválida, limpando estado');
          useAuthStore.setState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isInitializing: false
          });
        }
      } catch (error) {
        console.error('🔍 Erro na inicialização:', error);
        useAuthStore.setState({
          user: null,
          profile: null,
          isAuthenticated: false,
          isInitializing: false
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
          loadProfile();
        } else {
          useAuthStore.setState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isInitializing: false
          });
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
  }, [loadProfile, setInitializing]);

  if (isInitializing || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 16 }}>Carregando RunMind...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="InitialLoading" component={InitialLoadingScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}