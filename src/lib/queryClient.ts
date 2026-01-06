import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - dados considerados frescos
      gcTime: 1000 * 60 * 30, // 30 minutos - tempo no cache (antigo cacheTime)
      retry: 2, // Tentar 2 vezes em caso de falha
      refetchOnWindowFocus: false, // React Native não usa window
      refetchOnReconnect: true, // Refetch ao reconectar
    },
    mutations: {
      retry: 1, // Tentar 1 vez em caso de falha
    },
  },
});
