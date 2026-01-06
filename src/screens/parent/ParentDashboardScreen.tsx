/**
 * Dashboard do Pai
 * Migrado para React Query
 */
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ScrollView as HorizontalScroll } from 'react-native';
import { Text, ActivityIndicator, Badge, Chip, Portal, Dialog, TextInput, Button, Snackbar } from 'react-native-paper';
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
  const [actionFilter, setActionFilter] = useState<'all' | 'task' | 'redemption'>('all');

  // Estado do dialog de rejeicao
  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [rejectingAction, setRejectingAction] = useState<PendingAction | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Estado do snackbar
  const [snackbarMessage, setSnackbarMessage] = useState('');

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

  // Filtrar acoes baseado no filtro selecionado
  const filteredActions = useMemo(() => {
    if (actionFilter === 'all') return pendingActions;
    return pendingActions.filter(a => a.type === actionFilter);
  }, [pendingActions, actionFilter]);

  // Contadores por tipo
  const taskActionsCount = pendingActions.filter(a => a.type === 'task').length;
  const redemptionActionsCount = pendingActions.filter(a => a.type === 'redemption').length;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchChildren(), refetchTasks(), refetchRewards(), refetchRedemptions(), refetchNotifications()]);
    setRefreshing(false);
  };

  const handleApprove = (action: PendingAction) => {
    if (action.type === 'task') {
      approveTask(action.id, {
        onSuccess: () => {
          setSnackbarMessage('Tarefa aprovada com sucesso!');
        },
      });
    } else {
      approveRedemption(action.id, {
        onSuccess: () => {
          setSnackbarMessage('Resgate aprovado com sucesso!');
        },
      });
    }
  };

  const handleReject = (action: PendingAction) => {
    setRejectingAction(action);
    setRejectionReason('');
    setRejectDialogVisible(true);
  };

  const handleConfirmReject = () => {
    if (!rejectingAction) return;

    if (rejectingAction.type === 'task') {
      rejectTask(
        { assignmentId: rejectingAction.id, data: { rejectionReason: rejectionReason.trim() } },
        {
          onSuccess: () => {
            setRejectDialogVisible(false);
            setRejectingAction(null);
            setRejectionReason('');
            setSnackbarMessage('Tarefa rejeitada com sucesso!');
          },
        }
      );
    } else {
      rejectRedemption(
        { redemptionId: rejectingAction.id, data: { rejectionReason: rejectionReason.trim() } },
        {
          onSuccess: () => {
            setRejectDialogVisible(false);
            setRejectingAction(null);
            setRejectionReason('');
            setSnackbarMessage('Resgate rejeitado com sucesso!');
          },
        }
      );
    }
  };

  const handleCloseRejectDialog = () => {
    setRejectDialogVisible(false);
    setRejectingAction(null);
    setRejectionReason('');
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
        </View>

        {/* Filtros */}
        {pendingActions.length > 0 && (
          <HorizontalScroll
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
            contentContainerStyle={styles.filterContainer}
          >
            <Chip
              selected={actionFilter === 'all'}
              onPress={() => setActionFilter('all')}
              style={[styles.filterChip, actionFilter === 'all' && styles.filterChipSelected]}
              textStyle={[styles.filterChipText, actionFilter === 'all' && styles.filterChipTextSelected]}
              showSelectedOverlay={false}
            >
              Todas ({pendingActions.length})
            </Chip>
            <Chip
              selected={actionFilter === 'task'}
              onPress={() => setActionFilter('task')}
              style={[styles.filterChip, actionFilter === 'task' && styles.filterChipSelected]}
              textStyle={[styles.filterChipText, actionFilter === 'task' && styles.filterChipTextSelected]}
              showSelectedOverlay={false}
            >
              Tarefas ({taskActionsCount})
            </Chip>
            <Chip
              selected={actionFilter === 'redemption'}
              onPress={() => setActionFilter('redemption')}
              style={[styles.filterChip, actionFilter === 'redemption' && styles.filterChipSelected]}
              textStyle={[styles.filterChipText, actionFilter === 'redemption' && styles.filterChipTextSelected]}
              showSelectedOverlay={false}
            >
              Recompensas ({redemptionActionsCount})
            </Chip>
          </HorizontalScroll>
        )}

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
        ) : filteredActions.length === 0 ? (
          <View style={styles.emptyActionsContainer}>
            <View style={styles.emptyActionsIconCircle}>
              <MaterialCommunityIcons
                name={actionFilter === 'task' ? 'clipboard-text-outline' : 'gift-outline'}
                size={48}
                color={COLORS.common.textLight}
              />
            </View>
            <Text style={styles.emptyActionsTitle}>Nenhuma acao</Text>
            <Text style={styles.emptyActionsText}>
              Nao ha {actionFilter === 'task' ? 'tarefas' : 'recompensas'} pendentes.
            </Text>
          </View>
        ) : (
          <View style={styles.actionsContainer}>
            {filteredActions.map((action) => (
              <View key={`${action.type}-${action.id}`} style={styles.actionCard}>
                {/* Badge no canto superior direito */}
                <View style={[
                  styles.actionTypeBadge,
                  { backgroundColor: action.type === 'task' ? '#4CAF50' : '#FF9800' }
                ]}>
                  <Text style={styles.actionTypeBadgeText}>
                    {action.type === 'task' ? 'Tarefa' : 'Recompensa'}
                  </Text>
                </View>

                <View style={[
                  styles.actionIconContainer,
                  { backgroundColor: action.type === 'task' ? '#E8F5E9' : '#FFF3E0' }
                ]}>
                  <MaterialCommunityIcons
                    name={action.type === 'task' ? 'clipboard-check-outline' : 'gift-outline'}
                    size={24}
                    color={action.type === 'task' ? '#4CAF50' : '#FF9800'}
                  />
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

      {/* Dialog de Rejeicao */}
      <Portal>
        <Dialog visible={rejectDialogVisible} onDismiss={handleCloseRejectDialog}>
          <Dialog.Title>
            {rejectingAction?.type === 'task' ? 'Rejeitar Tarefa' : 'Rejeitar Resgate'}
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Informe o motivo da rejeicao para {rejectingAction?.childName}:
            </Text>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder={rejectingAction?.type === 'task' 
                ? "Ex: Tarefa nao foi completada corretamente" 
                : "Ex: Não pode jogar videogame hoje"
              }
              style={styles.dialogInput}
              outlineColor={COLORS.common.border}
              activeOutlineColor={COLORS.parent.primary}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseRejectDialog}>Cancelar</Button>
            <Button
              onPress={handleConfirmReject}
              disabled={!rejectionReason.trim() || isProcessing}
              loading={isProcessing}
              textColor={COLORS.common.error}
            >
              Rejeitar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar de feedback */}
      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage('')}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
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
  filterScrollView: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  filterChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    height: 36,
  },
  filterChipSelected: {
    backgroundColor: COLORS.parent.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.common.textLight,
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  actionsContainer: {
    gap: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'visible',
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.common.text,
    marginBottom: 4,
  },
  actionTypeBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  actionTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
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
  dialogText: {
    fontSize: 14,
    color: COLORS.common.textLight,
    marginBottom: 16,
  },
  dialogInput: {
    backgroundColor: COLORS.common.white,
  },
  snackbar: {
    backgroundColor: COLORS.child.success,
  },
});

export default ParentDashboardScreen;
