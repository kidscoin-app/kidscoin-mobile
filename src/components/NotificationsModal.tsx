/**
 * Modal de Notificações
 * Usado por ParentDashboard e ChildDashboard
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SectionList,
  SectionListData,
  ScrollView,
} from 'react-native';
import { Text, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useApproveTask,
  useApproveRedemption,
} from '../hooks';
import { Notification, NotificationType } from '../types';
import { COLORS } from '../utils/constants';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  userType: 'parent' | 'child';
}

type FilterType = 'all' | 'unread' | 'tasks' | 'rewards';

interface NotificationSection {
  title: string;
  data: Notification[];
}

// Tipos de notificação por categoria
const TASK_TYPES: NotificationType[] = [
  'TASK_ASSIGNED',
  'TASK_COMPLETED',
  'TASK_APPROVED',
  'TASK_REJECTED',
];

const REWARD_TYPES: NotificationType[] = [
  'REDEMPTION_REQUESTED',
  'REDEMPTION_APPROVED',
  'REDEMPTION_REJECTED',
];

// Notificações relevantes por tipo de usuário
const PARENT_NOTIFICATIONS: NotificationType[] = [
  'TASK_COMPLETED',
  'REDEMPTION_REQUESTED',
];

const CHILD_NOTIFICATIONS: NotificationType[] = [
  'TASK_ASSIGNED',
  'TASK_APPROVED',
  'TASK_REJECTED',
  'REDEMPTION_APPROVED',
  'REDEMPTION_REJECTED',
  'LEVEL_UP',
  'BADGE_UNLOCKED',
];

// Ícones por tipo de notificação
const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  TASK_ASSIGNED: 'clipboard-plus',
  TASK_COMPLETED: 'clipboard-check',
  TASK_APPROVED: 'check-circle',
  TASK_REJECTED: 'close-circle',
  LEVEL_UP: 'arrow-up-bold-circle',
  BADGE_UNLOCKED: 'trophy',
  REDEMPTION_REQUESTED: 'gift',
  REDEMPTION_APPROVED: 'gift-open',
  REDEMPTION_REJECTED: 'gift-off',
  SAVINGS_DEPOSIT: 'piggy-bank',
  SAVINGS_WITHDRAWAL: 'piggy-bank-outline',
  SAVINGS_INTEREST: 'percent',
};

// Cores por tipo de notificação
const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  TASK_ASSIGNED: '#6366F1',
  TASK_COMPLETED: '#F59E0B',
  TASK_APPROVED: '#10B981',
  TASK_REJECTED: '#EF4444',
  LEVEL_UP: '#8B5CF6',
  BADGE_UNLOCKED: '#F59E0B',
  REDEMPTION_REQUESTED: '#F59E0B',
  REDEMPTION_APPROVED: '#10B981',
  REDEMPTION_REJECTED: '#EF4444',
  SAVINGS_DEPOSIT: '#10B981',
  SAVINGS_WITHDRAWAL: '#3B82F6',
  SAVINGS_INTEREST: '#8B5CF6',
};

// Notificações que exigem ação do pai
const ACTIONABLE_NOTIFICATIONS: NotificationType[] = [
  'TASK_COMPLETED',
  'REDEMPTION_REQUESTED',
];

const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  onClose,
  userType,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const navigation = useNavigation<NavigationProp<any>>();

  // React Query hooks
  const { data: allNotifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Hooks de aprovação (apenas para pai)
  const approveTask = useApproveTask({
    onSuccess: () => {
      // Notificação será removida automaticamente após invalidação
    },
  });

  const approveRedemption = useApproveRedemption({
    onSuccess: () => {
      // Notificação será removida automaticamente após invalidação
    },
  });

  // Cor primária baseada no tipo de usuário
  const primaryColor = userType === 'parent' ? COLORS.parent.primary : COLORS.child.primary;

  // Filtrar notificações relevantes para o tipo de usuário
  const relevantNotifications = useMemo(() => {
    const allowedTypes = userType === 'parent' ? PARENT_NOTIFICATIONS : CHILD_NOTIFICATIONS;
    return allNotifications.filter(n => allowedTypes.includes(n.type));
  }, [allNotifications, userType]);

  // Aplicar filtro selecionado
  const filteredNotifications = useMemo(() => {
    let filtered = relevantNotifications;

    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.isRead);
        break;
      case 'tasks':
        filtered = filtered.filter(n => TASK_TYPES.includes(n.type));
        break;
      case 'rewards':
        filtered = filtered.filter(n => REWARD_TYPES.includes(n.type));
        break;
    }

    return filtered;
  }, [relevantNotifications, filter]);

  // Contar não lidas
  const unreadCount = useMemo(() => {
    return relevantNotifications.filter(n => !n.isRead).length;
  }, [relevantNotifications]);

  // Agrupar por data
  const sections = useMemo((): NotificationSection[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups: Record<string, Notification[]> = {
      'Hoje': [],
      'Ontem': [],
      'Esta semana': [],
      'Anteriores': [],
    };

    filteredNotifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (notificationDate.getTime() === today.getTime()) {
        groups['Hoje'].push(notification);
      } else if (notificationDate.getTime() === yesterday.getTime()) {
        groups['Ontem'].push(notification);
      } else if (notificationDate.getTime() > weekAgo.getTime()) {
        groups['Esta semana'].push(notification);
      } else {
        groups['Anteriores'].push(notification);
      }
    });

    // Retornar apenas seções com itens
    return Object.entries(groups)
      .filter(([_, items]) => items.length > 0)
      .map(([title, data]) => ({ title, data }));
  }, [filteredNotifications]);

  // Tempo relativo
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('pt-BR');
  };

  // Verificar se notificação é acionável (só se ainda não foi lida/resolvida)
  const isActionable = (notification: Notification): boolean => {
    return (
      userType === 'parent' &&
      ACTIONABLE_NOTIFICATIONS.includes(notification.type) &&
      !notification.isRead
    );
  };

  // Marcar como lida ao tocar
  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
  };

  // Aprovar tarefa ou resgate
  const handleApprove = (notification: Notification) => {
    if (!notification.referenceId) return;

    if (notification.type === 'TASK_COMPLETED') {
      approveTask.mutate(notification.referenceId);
    } else if (notification.type === 'REDEMPTION_REQUESTED') {
      approveRedemption.mutate(notification.referenceId);
    }

    // Marcar como lida
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
  };

  // Navegar para ver detalhes
  const handleViewDetails = (notification: Notification) => {
    onClose();
    if (notification.type === 'TASK_COMPLETED') {
      navigation.navigate('Tasks' as never);
    } else if (notification.type === 'REDEMPTION_REQUESTED') {
      navigation.navigate('Rewards' as never);
    }
  };

  // Marcar todas como lidas
  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsRead.mutate();
    }
  };

  // Subtítulo dinâmico
  const getSubtitle = (): string => {
    if (unreadCount === 0) return 'Tudo em dia!';
    return `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`;
  };

  // Verificar se está aprovando esta notificação
  const isApproving = (notification: Notification): boolean => {
    if (!notification.referenceId) return false;
    if (notification.type === 'TASK_COMPLETED') {
      return approveTask.isPending;
    }
    if (notification.type === 'REDEMPTION_REQUESTED') {
      return approveRedemption.isPending;
    }
    return false;
  };

  // Renderizar item de notificação
  const renderNotification = ({ item }: { item: Notification }) => {
    const iconName = NOTIFICATION_ICONS[item.type] || 'bell';
    const iconColor = NOTIFICATION_COLORS[item.type] || primaryColor;
    const actionable = isActionable(item);

    return (
      <View style={[
        styles.notificationItem,
        !item.isRead && styles.notificationUnread,
        actionable && styles.notificationActionable,
      ]}>
        {actionable && (
          <View style={styles.actionBadge}>
            <Text style={styles.actionBadgeText}>AÇÃO NECESSÁRIA</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.notificationTouchable}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.notificationIcon, { backgroundColor: `${iconColor}15` }]}>
            <MaterialCommunityIcons name={iconName as any} size={24} color={iconColor} />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.notificationTime}>{getRelativeTime(item.createdAt)}</Text>
          </View>
          {!item.isRead && !actionable && (
            <View style={[styles.unreadDot, { backgroundColor: primaryColor }]} />
          )}
        </TouchableOpacity>
        {actionable && (
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => handleApprove(item)}
              loading={isApproving(item)}
              disabled={isApproving(item)}
              style={styles.approveButton}
              buttonColor="#10B981"
              icon="check"
              compact
            >
              Aprovar
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleViewDetails(item)}
              style={styles.detailsButton}
              textColor={primaryColor}
              icon="arrow-right"
              compact
            >
              Ver detalhes
            </Button>
          </View>
        )}
      </View>
    );
  };

  // Renderizar header da seção
  const renderSectionHeader = ({ section }: { section: SectionListData<Notification, NotificationSection> }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  // Renderizar lista vazia
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="bell-off-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Nenhuma notificação</Text>
      <Text style={styles.emptySubtext}>
        {filter !== 'all' ? 'Tente outro filtro' : 'Você está em dia!'}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <MaterialCommunityIcons name="check-all" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={styles.markAllText}>Marcar lidas</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons name="bell" size={28} color="#fff" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Notificações</Text>
              <Text style={styles.headerSubtitle}>{getSubtitle()}</Text>
            </View>
          </View>
        </View>

        {/* Filtros */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScrollView}
          contentContainerStyle={styles.filtersContainer}
        >
          <Chip
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={[styles.filterChip, filter === 'all' && { backgroundColor: primaryColor }]}
            textStyle={filter === 'all' ? styles.filterChipTextSelected : styles.filterChipText}
            mode={filter === 'all' ? 'flat' : 'outlined'}
          >
            Todas
          </Chip>
          <Chip
            selected={filter === 'unread'}
            onPress={() => setFilter('unread')}
            style={[styles.filterChip, filter === 'unread' && { backgroundColor: primaryColor }]}
            textStyle={filter === 'unread' ? styles.filterChipTextSelected : styles.filterChipText}
            mode={filter === 'unread' ? 'flat' : 'outlined'}
          >
            Não lidas
          </Chip>
          <Chip
            selected={filter === 'tasks'}
            onPress={() => setFilter('tasks')}
            style={[styles.filterChip, filter === 'tasks' && { backgroundColor: primaryColor }]}
            textStyle={filter === 'tasks' ? styles.filterChipTextSelected : styles.filterChipText}
            mode={filter === 'tasks' ? 'flat' : 'outlined'}
          >
            Tarefas
          </Chip>
          <Chip
            selected={filter === 'rewards'}
            onPress={() => setFilter('rewards')}
            style={[styles.filterChip, filter === 'rewards' && { backgroundColor: primaryColor }]}
            textStyle={filter === 'rewards' ? styles.filterChipTextSelected : styles.filterChipText}
            mode={filter === 'rewards' ? 'flat' : 'outlined'}
          >
            Recompensas
          </Chip>
        </ScrollView>

        {/* Lista */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            renderSectionHeader={renderSectionHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={sections.length === 0 ? styles.emptyList : styles.list}
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    gap: 6,
  },
  markAllText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  filtersScrollView: {
    maxHeight: 68,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    borderRadius: 20,
    height: 36,
  },
  filterChipText: {
    color: COLORS.common.text,
    fontSize: 14,
    lineHeight: 20,
  },
  filterChipTextSelected: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.common.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  notificationUnread: {
    backgroundColor: '#F0F9FF',
  },
  notificationActionable: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  notificationTouchable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionBadge: {
    backgroundColor: '#F59E0B',
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 8,
  },
  actionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  approveButton: {
    flex: 1,
    borderRadius: 8,
  },
  detailsButton: {
    flex: 1,
    borderRadius: 8,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.common.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.common.textLight,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.common.textLight,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.common.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.common.textLight,
    marginTop: 4,
  },
});

export default NotificationsModal;
