/**
 * Funções auxiliares para formatação
 */

/**
 * Formata número de moedas
 */
export const formatCoins = (value: number): string => {
  return `${value} moedas`;
};

/**
 * Formata XP
 */
export const formatXP = (value: number): string => {
  return `${value} XP`;
};

/**
 * Formata data para exibição
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formata data e hora para exibição
 */
export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formata data relativa (ex: "há 2 horas", "ontem")
 */
export const formatRelativeDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora mesmo';
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours} h`;
  if (diffDays < 7) return `há ${diffDays} dias`;
  return formatDate(d);
};

/**
 * Trunca texto longo
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Calcula porcentagem de progresso
 */
export const calculateProgress = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min((current / total) * 100, 100);
};

/**
 * Formata nível com emoji
 */
export const formatLevel = (level: number): string => {
  const emojis = ['🌱', '🌿', '🌳', '⭐', '🌟', '✨', '💫', '🏆', '👑', '🎖️'];
  const emoji = emojis[Math.min(level - 1, emojis.length - 1)] || '⭐';
  return `${emoji} Nível ${level}`;
};
