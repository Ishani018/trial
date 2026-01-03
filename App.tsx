import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';

export type RootStackParamList = {
  Home: undefined;
  Game: { themeId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text allowFontScaling={false} style={styles.errorText}>Something went wrong</Text>
          <Text allowFontScaling={false} style={styles.errorDetails}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  React.useEffect(() => {
    console.log('App mounted successfully');
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer
            onReady={() => console.log('Navigation ready')}
            onStateChange={() => console.log('Navigation state changed')}
            theme={{
              dark: true,
              colors: {
                primary: '#F1F5F9',
                background: '#0F172A',
                card: '#0F172A',
                text: '#F1F5F9',
                border: '#334155',
                notification: '#EF4444',
              },
            }}
          >
            <StatusBar style="light" translucent={false} />
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: '#0F172A', // Slate-900
                },
              }}
            >
              <Stack.Screen 
                name="Home" 
                component={HomeScreen}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen 
                name="Game" 
                component={GameScreen}
                options={{
                  headerShown: false,
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700' as any,
    color: '#EF4444',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
