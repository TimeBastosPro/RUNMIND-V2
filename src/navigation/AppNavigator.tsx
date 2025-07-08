import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Card, TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../stores/auth';
import { supabase } from '../services/supabase';

// Screens
import DailyCheckinScreen from '../screens/checkin/DailyCheckinScreen';

// Types
type TabParamList = {
  Home: undefined;
  'Check-in': undefined;
  Insights: undefined;
  Profile: undefined;
};

type StackParamList = {
  Main: undefined;
  Auth: undefined;
};

type NavigationProps = {
  navigation?: any;
};

// Temporary placeholder screens
function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Card>
        <Card.Content style={{ alignItems: 'center' }}>
          <Text variant="headlineMedium">🏠 Home</Text>
          <Text variant="bodyLarge" style={{ textAlign: 'center', marginTop: 16 }}>
            Bem-vindo ao RunMind! Sua tela inicial será implementada em breve.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

function InsightsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Card>
        <Card.Content style={{ alignItems: 'center' }}>
          <Text variant="headlineMedium">💡 Insights</Text>
          <Text variant="bodyLarge" style={{ textAlign: 'center', marginTop: 16 }}>
            Seus insights personalizados aparecerão aqui após alguns check-ins!
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

function ProfileScreen() {
  const { signOut, profile } = useAuthStore();
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Card>
        <Card.Content style={{ alignItems: 'center' }}>
          <Text variant="headlineMedium">👤 Perfil</Text>
          <Text variant="bodyLarge" style={{ textAlign: 'center', marginTop: 16 }}>
            Olá, {profile?.full_name || 'Usuário'}!
          </Text>
          <Text variant="bodyMedium" style={{ textAlign: 'center', marginTop: 8, opacity: 0.7 }}>
            {profile?.email}
          </Text>
          <View style={{ marginTop: 24 }}>
            <Text variant="bodyMedium">Nível: {profile?.experience_level}</Text>
            <Text variant="bodyMedium">Objetivo: {profile?.main_goal}</Text>
          </View>
        </Card.Content>
        <Card.Actions style={{ justifyContent: 'center', marginTop: 16 }}>
          <Button mode="outlined" onPress={signOut}>
            Sair da conta
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

function AuthScreen() {
  const { signIn, signUp, isLoading } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = async () => {
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
      }
    } catch (error: any) {
      alert(error.message);
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
            <TextInput
              label="Nome completo"
              value={fullName}
              onChangeText={setFullName}
              style={{ marginBottom: 16 }}
              mode="outlined"
            />
          )}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginBottom: 16 }}
            mode="outlined"
          />

          <TextInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ marginBottom: 24 }}
            mode="outlined"
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
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
          } else if (route.name === 'Profile') {
            iconName = 'account';
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
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading, loadProfile } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        useAuthStore.setState({ 
          user: session.user, 
          isAuthenticated: true 
        });
        await loadProfile();
      } else {
        useAuthStore.setState({ 
          user: null, 
          profile: null, 
          isAuthenticated: false 
        });
      }
      
      if (initializing) setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, [initializing, loadProfile]);

  if (initializing || isLoading) {
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
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}