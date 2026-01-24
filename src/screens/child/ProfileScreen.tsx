/**
 * Tela de Perfil da Criança
 * Redesign com header roxo e cards modernos
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { Text, ActivityIndicator, Snackbar, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts';
import { COLORS } from '../../utils/constants';
import { gamificationService, walletService, userService, taskService } from '../../services';
import { Gamification, Wallet, Badge } from '../../types';
import { AvatarSelector } from '../../components';
import { getAvatarEmoji } from '../../utils/avatars';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;

// Cores do tema roxo
const PURPLE_THEME = {
  primary: '#9575CD',
  light: '#EDE7F6',
  dark: '#7E57C2',
  gradient: '#B39DDB',
};

const ProfileScreen: React.FC = () => {
  const { user, signOut, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gamification, setGamification] = useState<Gamification | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [gamificationData, walletData, tasksData] = await Promise.all([
        gamificationService.getGamification(),
        walletService.getWallet(),
        taskService.getTasks().catch(() => []),
      ]);
      setGamification(gamificationData);
      setWallet(walletData);
      // Contar tarefas completadas
      const completed = tasksData.filter((t: any) => t.status === 'APPROVED').length;
      setCompletedTasksCount(completed);
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular progresso do XP (0 a 1)
  const getXpProgress = (): number => {
    if (!gamification) return 0;
    return gamification.currentXp / gamification.xpForNextLevel;
  };

  // Função para pegar badges desbloqueadas
  const getUnlockedBadges = (): number => {
    if (!gamification) return 0;
    return gamification.badges.filter(b => b.unlocked).length;
  };

  // Função para atualizar avatar
  const handleSelectAvatar = async (avatarId: string) => {
    try {
      setUpdatingAvatar(true);
      const updatedUser = await userService.updateAvatar(avatarId);
      updateUser(updatedUser);
      setSnackbarMessage('Avatar atualizado com sucesso!');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error);
      setSnackbarMessage('Erro ao atualizar avatar. Tente novamente.');
      setSnackbarVisible(true);
    } finally {
      setUpdatingAvatar(false);
    }
  };

  // Função para abrir modal de badge
  const handleBadgePress = (badge: Badge) => {
    setSelectedBadge(badge);
    setBadgeModalVisible(true);
  };

  // Função para traduzir o tipo de critério em texto legível
  const getCriteriaText = (badge: Badge): string => {
    switch (badge.criteriaType) {
      case 'TASK_COUNT':
        return `Complete ${badge.criteriaValue} tarefas`;
      case 'CURRENT_BALANCE':
        return `Tenha ${badge.criteriaValue} moedas no saldo`;
      case 'TOTAL_COINS_EARNED':
        return `Ganhe ${badge.criteriaValue} moedas no total`;
      case 'REDEMPTION_COUNT':
        return `Resgate ${badge.criteriaValue} recompensas`;
      case 'SAVINGS_AMOUNT':
        return `Economize ${badge.criteriaValue} moedas na poupanca`;
      case 'TASKS_IN_ONE_DAY':
        return `Complete ${badge.criteriaValue} tarefas em um dia`;
      case 'STREAK_DAYS':
        return `Complete tarefas por ${badge.criteriaValue} dias seguidos`;
      case 'DAYS_SAVED':
        return `Mantenha moedas guardadas por ${badge.criteriaValue} dias`;
      default:
        return 'Criterio desconhecido';
    }
  };

  // Função para formatar números
  const formatNumber = (num: number): string => {
    return num.toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PURPLE_THEME.primary} />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  const avatarEmoji = getAvatarEmoji(user?.avatarUrl);
  const unlockedBadgesCount = getUnlockedBadges();
  const totalBadges = gamification?.badges.length || 0;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PURPLE_THEME.primary} barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Roxo */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>

          {/* Avatar */}
          <TouchableOpacity
            onPress={() => setShowAvatarSelector(true)}
            activeOpacity={0.8}
            disabled={updatingAvatar}
            style={styles.avatarWrapper}
          >
            <View style={styles.avatarContainer}>
              {avatarEmoji ? (
                <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
              ) : (
                <MaterialCommunityIcons name="account" size={60} color={PURPLE_THEME.primary} />
              )}
            </View>
            <View style={styles.editBadge}>
              <MaterialCommunityIcons name="pencil" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Nome */}
          <Text style={styles.userName}>{user?.fullName || 'Sem nome'}</Text>

          {/* Indicador de Badges */}
          <View style={styles.badgesIndicator}>
            <View style={styles.badgeIndicatorItem}>
              <Text style={styles.badgeIndicatorEmoji}>🏆</Text>
              <View style={styles.badgeIndicatorCount}>
                <Text style={styles.badgeIndicatorCountText}>{unlockedBadgesCount}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Card de Nível */}
          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <View style={styles.levelLeft}>
                <View style={styles.levelIconCircle}>
                  <MaterialCommunityIcons name="star" size={20} color="#333" />
                </View>
                <Text style={styles.levelTitle}>Nivel {gamification?.currentLevel || 1}</Text>
              </View>
              <Text style={styles.levelXp}>
                {gamification?.currentXp || 0}/{gamification?.xpForNextLevel || 100} XP
              </Text>
            </View>

            {/* Progress Bar customizada */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${getXpProgress() * 100}%` }]} />
              <View style={[styles.progressDot, { left: '33%' }]} />
              <View style={[styles.progressDot, { left: '66%' }]} />
            </View>

            <Text style={styles.xpNeeded}>
              {gamification?.xpNeededForNextLevel || 100} XP para o proximo nivel!
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {/* Moedas */}
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🪙</Text>
              <Text style={styles.statValue}>
                {formatNumber(wallet?.balance || 0)}
              </Text>
              <Text style={styles.statLabel}>Moedas</Text>
            </View>

            {/* Tarefas */}
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={styles.statValue}>
                {completedTasksCount}
              </Text>
              <Text style={styles.statLabel}>Tarefas</Text>
            </View>

            {/* Ganhos */}
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📈</Text>
              <Text style={styles.statValue}>
                {formatNumber(wallet?.totalEarned || 0)}
              </Text>
              <Text style={styles.statLabel}>Ganhos</Text>
            </View>

            {/* Badges */}
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🏅</Text>
              <Text style={styles.statValue}>
                {unlockedBadgesCount}
              </Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>

          {/* Conquistas */}
          <View style={styles.achievementsCard}>
            <View style={styles.achievementsHeader}>
              <View style={styles.achievementsTitleRow}>
                <Text style={styles.achievementsEmoji}>🏆</Text>
                <Text style={styles.achievementsTitle}>Conquistas</Text>
              </View>
              <Text style={styles.achievementsCount}>
                {unlockedBadgesCount}/{totalBadges}
              </Text>
            </View>

            {gamification && gamification.badges.length > 0 ? (
              <View style={styles.achievementsGrid}>
                {gamification.badges.map((badge) => (
                  <TouchableOpacity
                    key={badge.id}
                    style={styles.achievementItem}
                    onPress={() => handleBadgePress(badge)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.achievementIconContainer,
                        badge.unlocked
                          ? styles.achievementIconUnlocked
                          : styles.achievementIconLocked,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={badge.iconName as any}
                        size={28}
                        color={badge.unlocked ? '#FFD700' : '#BDBDBD'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.achievementName,
                        !badge.unlocked && styles.achievementNameLocked,
                      ]}
                      numberOfLines={2}
                    >
                      {badge.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyAchievements}>
                <MaterialCommunityIcons name="trophy-outline" size={48} color="#BDBDBD" />
                <Text style={styles.emptyAchievementsText}>
                  Nenhuma conquista disponivel ainda
                </Text>
              </View>
            )}
          </View>

          {/* Botão de Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={signOut}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="logout" size={22} color="#E91E63" />
            <Text style={styles.logoutButtonText}>Sair da Conta</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Modal de Seleção de Avatar */}
      <AvatarSelector
        visible={showAvatarSelector}
        onDismiss={() => setShowAvatarSelector(false)}
        onSelectAvatar={handleSelectAvatar}
        currentAvatarId={user?.avatarUrl || undefined}
      />

      {/* Snackbar de Feedback */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>

      {/* Modal de Detalhes da Badge */}
      <Modal
        visible={badgeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBadgeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setBadgeModalVisible(false)}
          />
          {selectedBadge && (
            <View style={styles.modalContainer}>
              {/* Header com Ícone e Nome */}
              <View style={styles.modalHeader}>
                <View
                  style={[
                    styles.modalBadgeIcon,
                    selectedBadge.unlocked
                      ? styles.modalBadgeIconUnlocked
                      : styles.modalBadgeIconLocked,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={selectedBadge.iconName as any}
                    size={64}
                    color={selectedBadge.unlocked ? '#FFD700' : '#CCCCCC'}
                  />
                </View>
                <Text style={styles.modalBadgeName}>{selectedBadge.name}</Text>

                {/* Status */}
                {selectedBadge.unlocked ? (
                  <View style={styles.modalUnlockedBadge}>
                    <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
                    <Text style={styles.modalUnlockedText}>Conquistada!</Text>
                  </View>
                ) : (
                  <View style={styles.modalLockedBadge}>
                    <MaterialCommunityIcons name="lock" size={18} color="#FF9800" />
                    <Text style={styles.modalLockedText}>Bloqueada</Text>
                  </View>
                )}
              </View>

              {/* Divisor */}
              <View style={styles.modalDivider} />

              {/* ScrollView com as informações */}
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
              >
                {/* Descrição */}
                <View style={styles.modalInfoRow}>
                  <View style={styles.modalInfoIcon}>
                    <Text style={styles.modalInfoEmoji}>📖</Text>
                  </View>
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Descricao</Text>
                    <Text style={styles.modalInfoText}>{selectedBadge.description}</Text>
                  </View>
                </View>

                {/* Como Conquistar */}
                <View style={styles.modalInfoRow}>
                  <View style={styles.modalInfoIcon}>
                    <Text style={styles.modalInfoEmoji}>🎯</Text>
                  </View>
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Como Conquistar</Text>
                    <Text style={styles.modalInfoText}>{getCriteriaText(selectedBadge)}</Text>
                  </View>
                </View>

                {/* XP Bônus */}
                <View style={styles.modalInfoRow}>
                  <View style={styles.modalInfoIcon}>
                    <Text style={styles.modalInfoEmoji}>⭐</Text>
                  </View>
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Bonus de XP</Text>
                    <Text style={styles.modalXpBonus}>+{selectedBadge.xpBonus} XP</Text>
                  </View>
                </View>

                {/* Data de Desbloqueio (se desbloqueada) */}
                {selectedBadge.unlocked && selectedBadge.unlockedAt && (
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoIcon}>
                      <Text style={styles.modalInfoEmoji}>📅</Text>
                    </View>
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Desbloqueada em</Text>
                      <Text style={styles.modalInfoText}>
                        {new Date(selectedBadge.unlockedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Botão Fechar */}
              <View style={styles.modalFooter}>
                <Button
                  mode="contained"
                  onPress={() => setBadgeModalVisible(false)}
                  style={styles.modalCloseButton}
                  buttonColor={PURPLE_THEME.primary}
                >
                  Fechar
                </Button>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  // Header
  header: {
    backgroundColor: PURPLE_THEME.primary,
    paddingTop: STATUS_BAR_HEIGHT + 16,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarEmoji: {
    fontSize: 70,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  badgesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeIndicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  badgeIndicatorEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  badgeIndicatorCount: {
    backgroundColor: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  badgeIndicatorCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },

  // Content
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Level Card
  levelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  levelXp: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#F3E5F5',
    borderRadius: 6,
    position: 'relative',
    marginBottom: 12,
    overflow: 'visible',
  },
  progressBar: {
    height: '100%',
    backgroundColor: PURPLE_THEME.primary,
    borderRadius: 6,
  },
  progressDot: {
    position: 'absolute',
    top: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E1BEE7',
    transform: [{ translateY: -4 }, { translateX: -4 }],
  },
  xpNeeded: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    maxWidth: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: PURPLE_THEME.primary,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },

  // Achievements Card
  achievementsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achievementsEmoji: {
    fontSize: 24,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  achievementsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementIconUnlocked: {
    backgroundColor: '#FFF8E1',
  },
  achievementIconLocked: {
    backgroundColor: '#F5F5F5',
  },
  achievementName: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },
  achievementNameLocked: {
    color: '#999',
  },
  emptyAchievements: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyAchievementsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCE4EC',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E63',
  },

  bottomSpacer: {
    height: 20,
  },

  snackbar: {
    backgroundColor: PURPLE_THEME.primary,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  modalBadgeIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
  },
  modalBadgeIconUnlocked: {
    backgroundColor: '#FFF9C4',
    borderColor: '#FFD700',
  },
  modalBadgeIconLocked: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  modalBadgeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  modalUnlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  modalUnlockedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 6,
  },
  modalLockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  modalLockedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
    marginLeft: 6,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 24,
  },
  modalScrollView: {
    maxHeight: 320,
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalInfoIcon: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  modalInfoEmoji: {
    fontSize: 26,
  },
  modalInfoContent: {
    flex: 1,
  },
  modalInfoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalInfoText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  modalXpBonus: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  modalCloseButton: {
    paddingVertical: 8,
  },
});

export default ProfileScreen;
