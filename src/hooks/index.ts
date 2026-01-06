/**
 * ============================================================================
 * HOOKS - Exportação Centralizada
 * ============================================================================
 * Este arquivo exporta todos os hooks customizados da aplicação.
 *
 * Estrutura:
 * - Queries: Hooks para buscar dados (GET)
 * - Mutations: Hooks para modificar dados (POST, PUT, PATCH, DELETE)
 * - Utilitários: Hooks auxiliares
 *
 * Uso:
 * import { useChildren, useCreateChild, useRefreshOnFocus } from '../hooks';
 */

// ============================================================================
// QUERIES (React Query)
// ============================================================================
// Hooks para buscar dados. Retornam { data, isLoading, error, refetch, ... }
export * from './queries';

// ============================================================================
// MUTATIONS (React Query)
// ============================================================================
// Hooks para modificar dados. Retornam { mutate, mutateAsync, isPending, ... }
export * from './mutations';

// ============================================================================
// UTILITÁRIOS
// ============================================================================
export { useRefreshOnFocus } from './useRefreshOnFocus';
