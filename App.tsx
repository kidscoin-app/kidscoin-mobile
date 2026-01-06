/**
 * Aplicativo principal - KidsCoins
 * Educação Financeira Infantil Gamificada
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryProvider } from './src/providers/QueryProvider';
import { AuthProvider } from './src/contexts';
import { AppNavigator } from './src/navigation';

// Forçar tema claro para evitar problemas com dark mode do sistema
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <PaperProvider theme={theme}>
            <AuthProvider>
              <StatusBar style="dark" />
              <AppNavigator />
            </AuthProvider>
          </PaperProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
