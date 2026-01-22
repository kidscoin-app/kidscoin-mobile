/**
 * Dashboard da Criança
 * Redesign com header, stats, tarefa do dia e progresso semanal
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts';
import { useGamification, useWallet, useTasks, useNotifications, useRefreshOnFocus } from '../../hooks';
import { getAvatarEmoji } from '../../utils/avatars';
import { TaskAssignment } from '../../types/Task';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;

// Cores do tema
const PURPLE_THEME = {
  primary: '#9575CD',
  light: '#EDE7F6',
  dark: '#7E57C2',
};

// Ícones por categoria de tarefa
const CATEGORY_ICONS: Record<string, string> = {
  LIMPEZA: 'broom',
  ORGANIZACAO: 'folder-outline',
  ESTUDOS: 'book-open-variant',
  CUIDADOS: 'heart-outline',
  OUTRAS: 'star-outline',
};

const ChildDashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  // React Query hooks
  const {
    data: gamification,
    isLoading: loadingGamification,
    refetch: refetchGamification,
  } = useGamification();

  const {
    data: wallet,
    isLoading: loadingWallet,
    refetch: refetchWallet,
  } = useWallet();

  const {
    data: tasks = [],
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = useTasks();

  const { refetch: refetchNotifications } = useNotifications();

  // Atualizar dados quando a tela receber foco
  useRefreshOnFocus(refetchTasks);
  useRefreshOnFocus(refetchNotifications);
  useRefreshOnFocus(refetchGamification);
  useRefreshOnFocus(refetchWallet);

  // Tarefas pendentes
  const pendingTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'PENDING');
  }, [tasks]);

  // Tarefas completadas hoje
  const tasksCompletedToday = useMemo(() => {
    const today = new Date().toDateString();
    return tasks.filter(t => {
      if (t.status === 'APPROVED' || t.status === 'COMPLETED') {
        const completedDate = t.completedAt ? new Date(t.completedAt).toDateString() : null;
        return completedDate === today;
      }
      return false;
    }).length;
  }, [tasks]);

  // Total de tarefas para hoje (pendentes + completadas hoje)
  const totalTasksToday = useMemo(() => {
    return pendingTasks.length + tasksCompletedToday;
  }, [pendingTasks, tasksCompletedToday]);

  // Tarefa do dia (maior recompensa em moedas)
  const taskOfTheDay = useMemo((): TaskAssignment | null => {
    if (pendingTasks.length === 0) return null;
    return pendingTasks.reduce((max, task) => {
      return task.task.coinValue > max.task.coinValue ? task : max;
    }, pendingTasks[0]);
  }, [pendingTasks]);

  // Progresso da semana (últimos 7 dias)
  const weekProgress = useMemo(() => {
    const days: { label: string; completed: boolean; isToday: boolean; isFuture: boolean }[] = [];
    const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday

    // Pegar datas com tarefas completadas
    const completedDates = new Set(
      tasks
        .filter(t => (t.status === 'APPROVED' || t.status === 'COMPLETED') && t.completedAt)
        .map(t => new Date(t.completedAt!).toDateString())
    );

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - dayOfWeek + i);
      const dateString = date.toDateString();
      const isToday = dateString === today.toDateString();
      const isFuture = date > today;

      days.push({
        label: dayLabels[i],
        completed: completedDates.has(dateString),
        isToday,
        isFuture,
      });
    }

    return days;
  }, [tasks]);

  // Dias completados na semana
  const daysCompletedThisWeek = useMemo(() => {
    return weekProgress.filter(d => d.completed).length;
  }, [weekProgress]);

  // Loading state - só mostra loading na primeira carga (quando não há dados em cache)
  const loading =
    (loadingGamification && !gamification) ||
    (loadingWallet && !wallet) ||
    (loadingTasks && tasks.length === 0);

  // Refresh handler
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchGamification(),
      refetchWallet(),
      refetchTasks(),
      refetchNotifications(),
    ]);
    setRefreshing(false);
  };

  // Saudação baseada na hora do dia
  const getGreeting = (): { text: string; emoji: string } => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Bom dia', emoji: '☀️' };
    if (hour < 18) return { text: 'Boa tarde', emoji: '🌤️' };
    return { text: 'Boa noite', emoji: '🌙' };
  };

  // Progresso do XP (0 a 1)
  const getXpProgress = (): number => {
    if (!gamification) return 0;
    return gamification.currentXp / gamification.xpForNextLevel;
  };

  // Progresso das tarefas do dia (0 a 1)
  const getTasksProgress = (): number => {
    if (totalTasksToday === 0) return 0;
    return tasksCompletedToday / totalTasksToday;
  };

  // Navegar para tarefas
  const navigateToTasks = () => {
    navigation.navigate('Tasks' as never);
  };

  // Navegar para loja
  const navigateToShop = () => {
    navigation.navigate('Shop' as never);
  };

  // Marcar tarefa como concluída (navegar para tela de tarefas)
  const handleDoTask = () => {
    navigation.navigate('Tasks' as never);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PURPLE_THEME.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const greeting = getGreeting();
  const avatarEmoji = getAvatarEmoji(user?.avatarUrl);
  const currentStreak = gamification?.currentStreak || 0;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F5F5F5" barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {avatarEmoji ? (
                <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
              ) : (
                <MaterialCommunityIcons name="account" size={50} color={PURPLE_THEME.primary} />
              )}
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{gamification?.currentLevel || 1}</Text>
              </View>
            </View>
          </View>

          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>
              {greeting.emoji} {greeting.text}
            </Text>
            <Text style={styles.userName}>{user?.fullName?.split(' ')[0] || 'Campeão'}!</Text>
          </View>

          {/* Streak */}
          <View style={styles.streakContainer}>
            <MaterialCommunityIcons name="fire" size={20} color="#fff" />
            <Text style={styles.streakText}>{currentStreak}</Text>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          {/* Top Row - Coins and Tasks Progress */}
          <View style={styles.statsTopRow}>
            {/* Coins */}
            <View style={styles.coinsSection}>
              <Text style={styles.coinEmoji}>🪙</Text>
              <Text style={styles.coinsValue}>
                {(wallet?.balance || 0).toLocaleString('pt-BR')}
              </Text>
            </View>

            {/* Tasks Progress Circle */}
            <View style={styles.tasksProgressSection}>
              <View style={styles.progressCircleContainer}>
                <View style={styles.progressCircleOuter}>
                  <View
                    style={[
                      styles.progressCircleFill,
                      {
                        transform: [{ rotate: `${getTasksProgress() * 360}deg` }],
                      },
                    ]}
                  />
                  <View style={styles.progressCircleInner}>
                    <MaterialCommunityIcons name="target" size={24} color={PURPLE_THEME.primary} />
                  </View>
                </View>
              </View>
              <Text style={styles.tasksProgressText}>
                {tasksCompletedToday}/{totalTasksToday}
              </Text>
              <Text style={styles.tasksProgressLabel}>tarefas hoje</Text>
            </View>
          </View>

          {/* Level Section */}
          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <View style={styles.levelLeft}>
                <View style={styles.levelIconCircle}>
                  <MaterialCommunityIcons name="star" size={16} color="#333" />
                </View>
                <Text style={styles.levelTitle}>Nivel {gamification?.currentLevel || 1}</Text>
              </View>
              <Text style={styles.levelXp}>
                {gamification?.currentXp || 0}/{gamification?.xpForNextLevel || 100} XP
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${getXpProgress() * 100}%` }]} />
              <View style={[styles.progressDot, { left: '33%' }]} />
              <View style={[styles.progressDot, { left: '66%' }]} />
            </View>

            <Text style={styles.xpNeeded}>
              {gamification?.xpNeededForNextLevel || 100} XP para o proximo nivel!
            </Text>
          </View>
        </View>

        {/* Task of the Day */}
        {taskOfTheDay ? (
          <View style={styles.taskOfDayCard}>
            <View style={styles.taskOfDayHeader}>
              <View style={styles.taskOfDayTitleRow}>
                <Text style={styles.taskOfDayStarEmoji}>⭐</Text>
                <Text style={styles.taskOfDayTitle}>TAREFA DO DIA</Text>
              </View>
              <Text style={styles.taskOfDaySparkle}>✨</Text>
            </View>

            <View style={styles.taskOfDayContent}>
              <View style={styles.taskIconContainer}>
                <MaterialCommunityIcons
                  name={CATEGORY_ICONS[taskOfTheDay.task.category] as any || 'star-outline'}
                  size={32}
                  color="#666"
                />
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{taskOfTheDay.task.title}</Text>
                <View style={styles.taskRewards}>
                  <Text style={styles.taskCoinReward}>🪙 +{taskOfTheDay.task.coinValue}</Text>
                  <Text style={styles.taskXpReward}>⭐ +{taskOfTheDay.task.xpValue} XP</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.doTaskButton}
              onPress={handleDoTask}
              activeOpacity={0.8}
            >
              <Text style={styles.doTaskButtonText}>Fazer agora!</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewAllTasksLink}
              onPress={navigateToTasks}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllTasksText}>ver todas as tarefas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noTaskCard}>
            <Text style={styles.noTaskEmoji}>🎉</Text>
            <Text style={styles.noTaskText}>Parabens! Todas as tarefas foram concluidas!</Text>
            <TouchableOpacity
              style={styles.viewAllTasksLink}
              onPress={navigateToTasks}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllTasksText}>ver todas as tarefas</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Weekly Progress */}
        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekTitle}>Sua Semana</Text>
            <Text style={styles.weekCount}>{daysCompletedThisWeek}/7 dias</Text>
          </View>

          <View style={styles.weekDays}>
            {weekProgress.map((day, index) => (
              <View key={index} style={styles.dayItem}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <View
                  style={[
                    styles.dayCircle,
                    day.completed && styles.dayCircleCompleted,
                    day.isToday && !day.completed && styles.dayCircleToday,
                    day.isFuture && styles.dayCircleFuture,
                  ]}
                >
                  {day.completed && (
                    <MaterialCommunityIcons name="check" size={18} color="#fff" />
                  )}
                  {day.isToday && !day.completed && (
                    <MaterialCommunityIcons name="map-marker" size={14} color={PURPLE_THEME.primary} />
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Access Cards */}
        <View style={styles.quickAccessRow}>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={navigateToTasks}
            activeOpacity={0.8}
          >
            <View style={styles.quickAccessIconContainer}>
              <Text style={styles.quickAccessEmoji}>📋</Text>
              {pendingTasks.length > 0 && (
                <View style={styles.quickAccessBadge}>
                  <Text style={styles.quickAccessBadgeText}>{pendingTasks.length}</Text>
                </View>
              )}
            </View>
            <Text style={styles.quickAccessLabel}>Ver Tarefas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={navigateToShop}
            activeOpacity={0.8}
          >
            <View style={styles.quickAccessIconContainer}>
              <Text style={styles.quickAccessEmoji}>🎁</Text>
            </View>
            <Text style={styles.quickAccessLabel}>Ver Loja</Text>
          </TouchableOpacity>
        </View>

        {/* Motivational Banner */}
        {pendingTasks.length > 0 && (
          <View style={styles.motivationalBanner}>
            <Text style={styles.motivationalText}>
              🌟 Continue assim! Faltam so {pendingTasks.length} tarefa{pendingTasks.length > 1 ? 's' : ''} para sua meta diaria!
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: STATUS_BAR_HEIGHT,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  avatarSection: {
    marginRight: 12,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarEmoji: {
    fontSize: 50,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 4,
  },
  streakText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Stats Card
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  coinsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinEmoji: {
    fontSize: 36,
    marginRight: 8,
  },
  coinsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  tasksProgressSection: {
    alignItems: 'center',
  },
  progressCircleContainer: {
    marginBottom: 8,
  },
  progressCircleOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    borderColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressCircleFill: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    borderColor: PURPLE_THEME.primary,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressCircleInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasksProgressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tasksProgressLabel: {
    fontSize: 12,
    color: '#666',
  },
  levelSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  levelXp: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#F3E5F5',
    borderRadius: 5,
    position: 'relative',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: PURPLE_THEME.primary,
    borderRadius: 5,
  },
  progressDot: {
    position: 'absolute',
    top: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E1BEE7',
    transform: [{ translateY: -3 }, { translateX: -3 }],
  },
  xpNeeded: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },

  // Task of the Day
  taskOfDayCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: PURPLE_THEME.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  taskOfDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskOfDayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskOfDayStarEmoji: {
    fontSize: 16,
  },
  taskOfDayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E91E63',
    letterSpacing: 0.5,
  },
  taskOfDaySparkle: {
    fontSize: 18,
  },
  taskOfDayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  taskRewards: {
    flexDirection: 'row',
    gap: 16,
  },
  taskCoinReward: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFA000',
  },
  taskXpReward: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFA000',
  },
  doTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PURPLE_THEME.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 4,
  },
  doTaskButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewAllTasksLink: {
    alignItems: 'center',
    paddingTop: 12,
  },
  viewAllTasksText: {
    fontSize: 14,
    color: '#999',
  },
  noTaskCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PURPLE_THEME.light,
  },
  noTaskEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noTaskText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },

  // Week Card
  weekCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  weekCount: {
    fontSize: 14,
    color: '#666',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFCDD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleCompleted: {
    backgroundColor: '#4CAF50',
  },
  dayCircleToday: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: PURPLE_THEME.primary,
    borderStyle: 'dashed',
  },
  dayCircleFuture: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  // Quick Access
  quickAccessRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  quickAccessCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickAccessIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  quickAccessEmoji: {
    fontSize: 36,
  },
  quickAccessBadge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: '#E91E63',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  quickAccessLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Motivational Banner
  motivationalBanner: {
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  motivationalText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '500',
  },

  bottomSpacer: {
    height: 20,
  },
});

export default ChildDashboardScreen;
