// Lista de avatares disponíveis para as crianças escolherem
export interface AvatarOption {
  id: string;
  emoji: string;
  name: string;
}

export const AVAILABLE_AVATARS: AvatarOption[] = [
  { id: 'dog', emoji: '🐶', name: 'Cachorro' },
  { id: 'cat', emoji: '🐱', name: 'Gato' },
  { id: 'mouse', emoji: '🐭', name: 'Ratinho' },
  { id: 'rabbit', emoji: '🐰', name: 'Coelho' },
  { id: 'bear', emoji: '🐻', name: 'Urso' },
  { id: 'panda', emoji: '🐼', name: 'Panda' },
  { id: 'koala', emoji: '🐨', name: 'Coala' },
  { id: 'tiger', emoji: '🐯', name: 'Tigre' },
  { id: 'pig', emoji: '🐷', name: 'Porquinho' },
  { id: 'frog', emoji: '🐸', name: 'Sapo' },
  { id: 'monkey', emoji: '🐵', name: 'Macaco' },
  { id: 'chicken', emoji: '🐥', name: 'Pintinho' },
];

// Função helper para pegar avatar por ID
export const getAvatarById = (id: string): AvatarOption | undefined => {
  return AVAILABLE_AVATARS.find(avatar => avatar.id === id);
};

// Função helper para pegar emoji do avatar
export const getAvatarEmoji = (avatarUrl: string | null | undefined): string | null => {
  if (!avatarUrl) return null;

  // Primeiro, tenta buscar por ID (ex: "dog", "cat")
  const avatar = getAvatarById(avatarUrl);
  if (avatar) {
    return avatar.emoji;
  }

  // Se não encontrou por ID, assume que já é um emoji e retorna direto
  return avatarUrl;
};
