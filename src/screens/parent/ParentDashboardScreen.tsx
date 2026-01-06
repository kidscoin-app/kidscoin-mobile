/**
 * Dashboard do Pai
 * Migrado para React Query
 */
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, ActivityIndicator, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts';
import {
  useChildren,
  useTasks,
  useRewards,
  usePendingRedemptions,
  useNotifications,
  useApproveTask,
  useRejectTask,
  useApproveRedemption,
  useRejectRedemption,
} from '../../hooks';
import { COLORS } from '../../utils/constants';
import NotificationsModal from '../../components/NotificationsModal';
import { TaskAssignment } from '../../types/Task';
import { Redemption } from '../../types/Reward';

type PendingAction = {
  id: string;
  type: 'task' | 'redemption';
  title: string;
  childName: string;
  coinValue: number;
  xpValue?: number;
  originalData: TaskAssignment | Redemption;
};

const ParentDashboardScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();

  // React Query hooks
  const {
    data: children = [],
    isLoading: loadingChildren,
    refetch: refetchChildren,
  } = useChildren();
  const { data: tasks = [], isLoading: loadingTasks, refetch: refetchTasks } = useTasks();
  const { data: rewards = [], isLoading: loadingRewards, refetch: refetchRewards } = useRewards();
  const {
    data: pendingRedemptions = [],
    isLoading: loadingRedemptions,
    refetch: refetchRedemptions,
  } = usePendingRedemptions();

  const {
    data: notifications = [],
    refetch: refetchNotifications,
  } = useNotifications();

  // Mutation hooks
  const { mutate: approveTask, isPending: approvingTask } = useApproveTask();
  const { mutate: rejectTask, isPending: rejectingTask } = useRejectTask();
  const { mutate: approveRedemption, isPending: approvingRedemption } = useApproveRedemption();
  const { mutate: rejectRedemption, isPending: rejectingRedemption } = useRejectRedemption();

  const isProcessing = approvingTask || rejectingTask || approvingRedemption || rejectingRedemption;

  const loading = loadingChildren || loadingTasks || loadingRewards || loadingRedemptions;
  const [refreshing, setRefreshing] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Contar notificacoes nao lidas (tipos relevantes para pai)
  const unreadCount = useMemo(() => {
    const parentNotificationTypes = ['TASK_COMPLETED', 'REDEMPTION_REQUESTED'];
    return notifications.filter(
      n => parentNotificationTypes.includes(n.type) && !n.isRead
    ).length;
  }, [notifications]);

  // Contar tarefas aprovadas
  const approvedTasksCount = useMemo(() => {
    return tasks.filter(t => t.status === 'APPROVED').length;
  }, [tasks]);

  // Combinar tarefas aguardando aprovacao e resgates pendentes
  const pendingActions: PendingAction[] = useMemo(() => {
    const taskActions: PendingAction[] = tasks
      .filter(t => t.status === 'COMPLETED')
      .map(t => ({
        id: t.id,
        type: 'task' as const,
        title: t.task.title,
        childName: t.childName,
        coinValue: t.task.coinValue,
        xpValue: t.task.xpValue,
        originalData: t,
      }));

    const redemptionActions: PendingAction[] = pendingRedemptions.map(r => ({
      id: r.id,
      type: 'redemption' as const,
      title: r.reward.name,
      childName: r.childName,
      coinValue: r.reward.coinCost,
      originalData: r,
    }));

    return [...taskActions, ...redemptionActions];
  }, [tasks, pendingRedemptions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchChildren(), refetchTasks(), refetchRewards(), refetchRedemptions(), refetchNotifications()]);
    setRefreshing(false);
  };

  const handleApprove = (action: PendingAction) => {
    if (action.type === 'task') {
      approveTask(action.id);
    } else {
      approveRedemption(action.id);
    }
  };

  const handleReject = (action: PendingAction) => {
    Alert.prompt(
      'Rejeitar',
      'Informe o motivo da rejeicao (opcional):',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rejeitar',
          style: 'destructive',
          onPress: (reason?: string) => {
            if (action.type === 'task') {
              rejectTask({ assignmentId: action.id, data: { rejectionReason: reason || '' } });
            } else {
              rejectRedemption({ redemptionId: action.id, data: { rejectionReason: reason || '' } });
            }
          },
        },
      ],
      'plain-text'
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.parent.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Cabecalho */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Ola, {user?.fullName}!</Text>
            <Text style={styles.subtitle}>Painel de Controle da Familia</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setShowNotificationsModal(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
            {unreadCount > 0 && (
              <Badge size={18} style={styles.notificationBadge}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Cards de Estatisticas - 4 em uma linha */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: '#F3E5F5' }]}>
            <MaterialCommunityIcons name="account-group-outline" size={24} color={COLORS.parent.primary} />
          </View>
          <Text style={styles.statValue}>{children.length}</Text>
          <Text style={styles.statLabel}>Criancas</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: '#E8F5E9' }]}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.statValue}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Tarefas</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: '#FFF3E0' }]}>
            <MaterialCommunityIcons name="gift-outline" size={24} color="#FF9800" />
          </View>
          <Text style={styles.statValue}>{rewards.length}</Text>
          <Text style={styles.statLabel}>Premios</Text>
        </View>

        <View style={[styles.statCard, styles.statCardHighlighted]}>
          <View style={[styles.statIconCircle, { backgroundColor: '#E8F5E9' }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={24} color={COLORS.child.success} />
          </View>
          <Text style={styles.statValue}>{approvedTasksCount}</Text>
          <Text style={styles.statLabel}>Aprovadas</Text>
        </View>
      </View>

      {/* Secao Acoes Necessarias */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons name="auto-fix" size={20} color={COLORS.parent.primary} />
            <Text style={styles.sectionTitle}>Acoes Necessarias</Text>
            {pendingActions.length > 0 && (
              <Badge size={22} style={styles.countBadge}>
                {pendingActions.length}
              </Badge>
            )}
          </View>
          {pendingActions.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Tasks' as never)}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>Ver todas</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.parent.primary} />
            </TouchableOpacity>
          )}
        </View>

        {pendingActions.length === 0 ? (
          <View style={styles.emptyActionsContainer}>
            <View style={styles.emptyActionsIconCircle}>
              <MaterialCommunityIcons name="check-circle-outline" size={48} color={COLORS.child.success} />
            </View>
            <Text style={styles.emptyActionsTitle}>Tudo em dia!</Text>
            <Text style={styles.emptyActionsText}>
              Nao ha acoes pendentes no momento.
            </Text>
          </View>
        ) : (
          <View style={styles.actionsContainer}>
            {pendingActions.slice(0, 3).map((action) => (
              <View key={`${action.type}-${action.id}`} style={styles.actionCard}>
                <View style={styles.actionLeftBorder} />
                <View style={styles.actionIconContainer}>
                  <MaterialCommunityIcons name="clock-outline" size={24} color={COLORS.parent.primary} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle} numberOfLines={1}>{action.title}</Text>
                  <View style={styles.actionChildRow}>
                    <MaterialCommunityIcons name="account-outline" size={14} color={COLORS.common.textLight} />
                    <Text style={styles.actionChildName}>{action.childName}</Text>
                  </View>
                  <View style={styles.actionValuesRow}>
                    <View style={styles.actionValueItem}>
                      <MaterialCommunityIcons name="hand-coin" size={16} color="#FFC107" />
                      <Text style={styles.actionValueText}>{action.coinValue}</Text>
                    </View>
                    {action.xpValue && (
                      <View style={styles.actionValueItem}>
                        <MaterialCommunityIcons name="star-outline" size={16} color="#FFC107" />
                        <Text style={styles.actionValueText}>{action.xpValue} XP</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleReject(action)}
                    disabled={isProcessing}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="close" size={20} color={COLORS.common.error} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApprove(action)}
                    disabled={isProcessing}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Botao de Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={signOut} activeOpacity={0.8}>
        <MaterialCommunityIcons name="logout" size={20} color={COLORS.common.error} />
        <Text style={styles.logoutButtonText}>Sair da Conta</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />

      {/* Modal de Notificacoes */}
      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        userType="parent"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.common.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.common.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.common.textLight,
  },
  header: {
    backgroundColor: COLORS.parent.primary,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  headerLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.common.error,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: -15,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardHighlighted: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.common.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.common.textLight,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.common.text,
  },
  countBadge: {
    backgroundColor: COLORS.parent.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.parent.primary,
    fontWeight: '500',
  },
  emptyActionsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyActionsIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.common.text,
    marginBottom: 8,
  },
  emptyActionsText: {
    fontSize: 14,
    color: COLORS.common.textLight,
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    paddingLeft: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  actionLeftBorder: {
    width: 4,
    height: '100%',
    backgroundColor: '#90CAF9',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    marginRight: 12,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.common.text,
    marginBottom: 4,
  },
  actionChildRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  actionChildName: {
    fontSize: 13,
    color: COLORS.common.textLight,
  },
  actionValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionValueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionValueText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.common.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.child.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.common.error,
    gap: 8,
  },
  logoutButtonText: {
    color: COLORS.common.error,
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 30,
  },
});

export default ParentDashboardScreen;
