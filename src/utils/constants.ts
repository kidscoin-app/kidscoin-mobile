/**
 * Constantes da aplicação
 */

// URL da API
// export const API_URL = "https://kidscoin-api-production.up.railway.app/api"
export const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Chaves do AsyncStorage
export const STORAGE_KEYS = {
  TOKEN: '@kidscoin:token',
  REFRESH_TOKEN: '@kidscoin:refreshToken',
  USER: '@kidscoin:user',
};

// Cores do tema
export const COLORS = {
  // Para Crianças
  child: {
    primary: '#9B7BB8',      // Roxo principal (era #6366F1)
    primaryDark: '#7A5A9E',  // Roxo escuro para hover/pressed
    primaryLight: '#C4A8D8', // Roxo claro para backgrounds
    secondary: '#F5A3B5',    // Rosa (era #EC4899)
    secondaryLight: '#FFD4DC', // Rosa claro
    success: '#6BCB77',      // Verde sucesso (era #10B981)
    successLight: '#A8E6A3', // Verde claro
    warning: '#FFD93D',      // Dourado/Gold (era #F59E0B)
    background: '#FFF9F5',   // Cream (era #F8FAFC)
    backgroundLight: '#F7F5F9', // Cinza lavanda
  },

  // Para Pais
  parent: {
    primary: '#7A5A9E',      // Roxo mais escuro (era #3B82F6)
    secondary: '#9B7BB8',    // Roxo médio (era #8B5CF6)
    background: '#FFF9F5',   // Cream
  },

  // Comuns
  common: {
    text: '#3D3A40',         // Texto escuro com tom roxo (era #1F2937)
    textLight: '#6B6670',    // Texto secundário
    textMuted: '#9B9699',    // Texto bem suave
    white: '#FFFFFF',
    error: '#EF4444',        // Mantém o vermelho
    border: '#E8E4EC',       // Borda com tom roxo (era #E5E7EB)
    cream: '#FFF9F5',        // Background principal
  },

  // Cores de Status (novas)
  status: {
    pending: '#FFD93D',      // Amarelo/Dourado - aguardando
    waiting: '#6B99FF',      // Azul - esperando aprovação
    approved: '#6BCB77',     // Verde - aprovado
    rejected: '#EF4444',     // Vermelho - rejeitado
  },

  // Gamificação (novas)
  gamification: {
    gold: '#FFD93D',         // Moedas, conquistas
    xp: '#9B7BB8',           // Barra de XP
    streak: '#FF6B35',       // Cor do streak (laranja/fogo)
    level: '#7A5A9E',        // Badge de nível
  },
};

// Categorias de tarefas
export const TASK_CATEGORIES = {
  LIMPEZA: { label: 'Limpeza', icon: 'broom', color: '#3B82F6' },
  ORGANIZACAO: { label: 'Organização', icon: 'folder', color: '#8B5CF6' },
  ESTUDOS: { label: 'Estudos', icon: 'book', color: '#10B981' },
  CUIDADOS: { label: 'Cuidados', icon: 'heart', color: '#EC4899' },
  OUTRAS: { label: 'Outras', icon: 'star', color: '#F59E0B' },
};

// Status de tarefas
export const TASK_STATUS = {
  PENDING: { label: 'Disponível', color: '#3B82F6' },
  COMPLETED: { label: 'Aguardando aprovação', color: '#F59E0B' },
  APPROVED: { label: 'Aprovada', color: '#10B981' },
  REJECTED: { label: 'Rejeitada', color: '#EF4444' },
};

// Tipos de notificação
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'Nova tarefa!',
  TASK_COMPLETED: 'Tarefa concluída!',
  TASK_APPROVED: 'Tarefa aprovada!',
  TASK_REJECTED: 'Tarefa rejeitada',
  LEVEL_UP: 'Nível aumentado!',
  BADGE_UNLOCKED: 'Nova conquista!',
  REDEMPTION_REQUESTED: 'Resgate solicitado',
  REDEMPTION_APPROVED: 'Resgate aprovado!',
  REDEMPTION_REJECTED: 'Resgate rejeitado',
  SAVINGS_DEPOSIT: 'Depósito na poupança',
  SAVINGS_WITHDRAWAL: 'Saque da poupança',
  SAVINGS_INTEREST: 'Rendimento da poupança',
};
