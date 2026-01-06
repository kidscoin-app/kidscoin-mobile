import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import {
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import * as Network from 'expo-network';
import { queryClient } from '../lib/queryClient';

/**
 * Configuração do Online Manager para React Native
 * Detecta mudanças de conectividade e pausa/retoma queries automaticamente
 */
onlineManager.setEventListener((setOnline) => {
  const subscription = Network.addNetworkStateListener((state) => {
    setOnline(!!state.isConnected);
  });
  return () => subscription.remove();
});

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * QueryProvider - Provider do React Query configurado para React Native/Expo
 *
 * Funcionalidades:
 * - Gerenciamento de estado online/offline via expo-network
 * - Refetch automático quando app volta ao foco
 * - Configurações otimizadas para mobile
 */
export function QueryProvider({ children }: QueryProviderProps) {
  /**
   * Configuração do Focus Manager para React Native
   * Quando o app volta do background, marca como "focado" para trigger refetch
   */
  useEffect(() => {
    const onAppStateChange = (status: AppStateStatus) => {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
