import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Hook para refetch de dados quando a tela recebe foco
 *
 * Útil para garantir dados atualizados ao navegar entre telas.
 * Ignora o primeiro render (quando a tela é montada pela primeira vez).
 *
 * @param refetch - Função de refetch do React Query
 *
 * @example
 * const { data, refetch } = useTasks();
 * useRefreshOnFocus(refetch);
 */
export function useRefreshOnFocus(refetch: () => void) {
  const firstTimeRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }

      refetch();
    }, [refetch])
  );
}
