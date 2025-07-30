import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Card, TextInput, Button, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../stores/auth';
import { supabase } from '../services/supabase';

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
  const { signIn, signUp, isLoading } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);

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
      }
    } catch (error: any) {
      setError('root', { message: error.message || 'Erro ao autenticar.' });
    }
  };

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

          <HelperText type="error" visible={!!errors.root}>
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
  console.log('AppNavigator renderizou');
  const { user, profile, isLoading, isInitializing, isAuthenticated, loadProfile, setInitializing } = useAuthStore();

  useEffect(() => {
    console.log('Efeito onAuthStateChange INICIOU');
    let initialized = false;

    // Checagem inicial da sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('onAuthStateChange DISPAROU', { event: 'initial', session });
      if (session?.user) {
        useAuthStore.setState({
          user: session.user,
          isAuthenticated: true
        });
        useAuthStore.setState({ isInitializing: false });
        loadProfile();
      } else {
        useAuthStore.setState({
          user: null,
          profile: null,
          isAuthenticated: false,
          isInitializing: false
        });
      }
    });

    // Listener para mudanças futuras
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('onAuthStateChange DISPAROU', { event, session });
      if (session?.user) {
        useAuthStore.setState({
          user: session.user,
          isAuthenticated: true
        });
        useAuthStore.setState({ isInitializing: false });
        loadProfile();
      } else {
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

  console.log('ESTADO ATUAL:', { isLoading, user, isAuthenticated, isInitializing });
  console.log('USER:', user);
  console.log('IS_AUTHENTICATED:', isAuthenticated);

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
        {/* Temporariamente desabilitando autenticação para teste */}
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}