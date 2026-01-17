/**
 * Tela de tarefas da crianca
 * Migrado para React Query
 */
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView as HorizontalScroll,
  StatusBar,
  Platform,
} from 'react-native';
import { Chip, Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getErrorMessage } from '../../services';
import { TaskCategory } from '../../types';
import { COLORS } from '../../utils/constants';
import { useTasks, useCompleteTask, useRetryTask, useRefreshOnFocus } from '../../hooks';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;

// Categorias disponiveis com icones
const CATEGORIES: { value: TaskCategory; label: string; icon: string }[] = [
  { value: 'LIMPEZA', label: 'Limpeza', icon: 'broom' },
  { value: 'ORGANIZACAO', label: 'Organizacao', icon: 'package-variant' },
  { value: 'ESTUDOS', label: 'Estudo', icon: 'book-open-variant' },
  { value: 'CUIDADOS', label: 'Cuidados', icon: 'heart' },
  { value: 'OUTRAS', label: 'Outras', icon: 'star-four-points' },
];

// Funcao para obter icone da categoria
const getCategoryIcon = (category: TaskCategory): string => {
  const found = CATEGORIES.find((c) => c.value === category);
  return found?.icon || 'star-four-points';
};

type StatusFilter = 'all' | 'PENDING' | 'REJECTED';

const ChildTasksScreen: React.FC = () => {
  // UI State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // React Query hooks
  const { data: tasks = [], isLoading: loading, refetch: refetchTasks } = useTasks();

  // Atualizar dados quando a tela receber foco
  useRefreshOnFocus(refetchTasks);

  const completeTask = useCompleteTask({
    onSuccess: () => {
      setSuccess('Tarefa concluida! Aguarde a aprovacao do responsavel.');
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const retryTask = useRetryTask({
    onSuccess: () => {
      setSuccess('Tarefa pronta para refazer! Mostre que voce consegue!');
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  // Contadores
  const pendingCount = useMemo(() => {
    return tasks.filter((t) => t.status === 'PENDING').length;
  }, [tasks]);

  const rejectedCount = useMemo(() => {
    return tasks.filter((t) => t.status === 'REJECTED').length;
  }, [tasks]);

  // Filtragem de tarefas
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filtrar por status
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Filtrar por categoria
    if (categoryFilter) {
      result = result.filter((t) => t.task.category === categoryFilter);
    }

    return result;
  }, [tasks, statusFilter, categoryFilter]);

  /**
   * Completar tarefa
   */
  const handleComplete = (assignmentId: string) => {
    completeTask.mutate(assignmentId);
  };

  /**
   * Refazer tarefa rejeitada
   */
  const handleRetry = (assignmentId: string) => {
    retryTask.mutate(assignmentId);
  };

  /**
   * Obter cor do status
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFE4C4';
      case 'COMPLETED':
        return '#E8F5E9';
      case 'APPROVED':
        return '#E8F5E9';
      case 'REJECTED':
        return '#FFEBEE';
      default:
        return '#F5F5F5';
    }
  };

  /**
   * Obter cor do texto do status
   */
  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#E67E22';
      case 'COMPLETED':
        return COLORS.child.success;
      case 'APPROVED':
        return COLORS.child.success;
      case 'REJECTED':
        return COLORS.common.error;
      default:
        return COLORS.common.textLight;
    }
  };

  /**
   * Obter texto do status
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Fazer';
      case 'COMPLETED':
        return 'Revisando';
      case 'APPROVED':
        return 'Aprovada';
      case 'REJECTED':
        return 'Recusada';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.child.primary} />

      {/* Header Fixo */}
      <View style={styles.header}>
        {/* Titulo e Contador */}
        <Text style={styles.headerTitle}>Minhas Tarefas</Text>

        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <View style={styles.statIconCircle}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={24} color={COLORS.child.primary} />
            </View>
            <View>
              <Text style={styles.statValue}>{pendingCount}</Text>
              <Text style={styles.statLabel}>para fazer</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconCircle}>
              <MaterialCommunityIcons name="check-circle-outline" size={24} color={COLORS.child.primary} />
            </View>
            <View>
              <Text style={styles.statValue}>{tasks.filter(t => t.status === 'APPROVED').length}</Text>
              <Text style={styles.statLabel}>concluidas</Text>
            </View>
          </View>
        </View>

        {/* Filtros de Status - Botões segmentados */}
        <View style={styles.statusFiltersContainer}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentButton, statusFilter === 'all' && styles.segmentButtonActive]}
              onPress={() => setStatusFilter('all')}
            >
              <Text style={[styles.segmentText, statusFilter === 'all' && styles.segmentTextActive]}>
                Todas
              </Text>
              <View style={[styles.segmentBadge, statusFilter === 'all' && styles.segmentBadgeActive]}>
                <Text style={[styles.segmentBadgeText, statusFilter === 'all' && styles.segmentBadgeTextActive]}>
                  {tasks.length}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentButton, statusFilter === 'PENDING' && styles.segmentButtonActive]}
              onPress={() => setStatusFilter('PENDING')}
            >
              <Text style={[styles.segmentText, statusFilter === 'PENDING' && styles.segmentTextActive]}>
                Fazer
              </Text>
              <View style={[styles.segmentBadge, statusFilter === 'PENDING' && styles.segmentBadgeActive]}>
                <Text style={[styles.segmentBadgeText, statusFilter === 'PENDING' && styles.segmentBadgeTextActive]}>
                  {pendingCount}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentButton, statusFilter === 'REJECTED' && styles.segmentButtonActive]}
              onPress={() => setStatusFilter('REJECTED')}
            >
              <Text style={[styles.segmentText, statusFilter === 'REJECTED' && styles.segmentTextActive]}>
                Recusadas
              </Text>
              <View style={[styles.segmentBadge, statusFilter === 'REJECTED' && styles.segmentBadgeActive]}>
                <Text style={[styles.segmentBadgeText, statusFilter === 'REJECTED' && styles.segmentBadgeTextActive]}>
                  {rejectedCount}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Filtro de Categoria - Fora do header */}
      <View style={styles.categorySection}>
        <Text style={styles.categorySectionTitle}>Categoria</Text>
        <HorizontalScroll
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilters}
        >
          <TouchableOpacity
            style={[styles.categoryButton, categoryFilter === null && styles.categoryButtonSelected]}
            onPress={() => setCategoryFilter(null)}
          >
            <MaterialCommunityIcons
              name="star-four-points"
              size={16}
              color={categoryFilter === null ? '#fff' : COLORS.child.primary}
            />
            <Text style={[styles.categoryButtonText, categoryFilter === null && styles.categoryButtonTextSelected]}>
              Todas
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
                onPress={() => setCategoryFilter(cat.value)}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={16}
                  color={isSelected ? '#fff' : COLORS.child.primary}
                />
                <Text style={[styles.categoryButtonText, isSelected && styles.categoryButtonTextSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </HorizontalScroll>
      </View>

      {/* Lista de Tarefas */}
      <ScrollView style={styles.taskList} contentContainerStyle={styles.taskListContent}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Carregando suas tarefas...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name={statusFilter === 'PENDING' ? 'party-popper' : 'clipboard-text-outline'}
              size={48}
              color={COLORS.common.textLight}
            />
            <Text style={styles.emptyTitle}>
              {statusFilter === 'PENDING' ? 'Parabens!' : 'Nenhuma tarefa'}
            </Text>
            <Text style={styles.emptyText}>
              {statusFilter === 'PENDING'
                ? 'Voce nao tem tarefas pendentes!'
                : statusFilter === 'REJECTED'
                ? 'Nenhuma tarefa recusada.'
                : 'Voce ainda nao tem tarefas.'}
            </Text>
          </View>
        ) : (
          filteredTasks.map((assignment) => (
            <View key={assignment.id} style={styles.taskCard}>
              {/* Header do Card */}
              <View style={styles.taskCardHeader}>
                {/* Icone da Categoria */}
                <View style={styles.taskIconContainer}>
                  <MaterialCommunityIcons
                    name={getCategoryIcon(assignment.task.category) as any}
                    size={28}
                    color={COLORS.child.primary}
                  />
                </View>

                {/* Info */}
                <View style={styles.taskInfo}>
                  <View style={styles.taskTitleRow}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {assignment.task.title}
                    </Text>
                    <View
                      style={[
                        styles.taskStatusBadge,
                        { backgroundColor: getStatusColor(assignment.status) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.taskStatusText,
                          { color: getStatusTextColor(assignment.status) },
                        ]}
                      >
                        {getStatusText(assignment.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Descricao */}
                  {assignment.task.description && (
                    <Text style={styles.taskDescription} numberOfLines={1}>
                      {assignment.task.description}
                    </Text>
                  )}

                  {/* Valores */}
                  <View style={styles.taskValues}>
                    <View style={styles.taskValueItem}>
                      <MaterialCommunityIcons name="hand-coin" size={16} color="#4CAF50" />
                      <Text style={styles.taskValueText}>+{assignment.task.coinValue}</Text>
                    </View>
                    <View style={styles.taskValueItem}>
                      <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                      <Text style={styles.taskValueText}>+{assignment.task.xpValue} XP</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Botao de Acao */}
              {assignment.status === 'PENDING' && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => handleComplete(assignment.id)}
                  disabled={completeTask.isPending}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  <Text style={styles.completeButtonText}>
                    {completeTask.isPending ? 'Enviando...' : 'Completei!'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Motivo da Rejeicao */}
              {assignment.status === 'REJECTED' && assignment.rejectionReason && (
                <View style={styles.rejectionContainer}>
                  <View style={styles.rejectionHeader}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.common.error} />
                    <Text style={styles.rejectionTitle}>Por que foi recusada?</Text>
                  </View>
                  <Text style={styles.rejectionText}>{assignment.rejectionReason}</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => handleRetry(assignment.id)}
                    disabled={retryTask.isPending}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
                    <Text style={styles.retryButtonText}>
                      {retryTask.isPending ? 'Enviando...' : 'Tentar de Novo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Status Revisando */}
              {assignment.status === 'COMPLETED' && (
                <View style={styles.reviewingContainer}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.child.primary} />
                  <Text style={styles.reviewingText}>Aguardando aprovacao do responsavel...</Text>
                </View>
              )}

              {/* Status Aprovada */}
              {assignment.status === 'APPROVED' && (
                <View style={styles.approvedContainer}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.child.success} />
                  <Text style={styles.approvedText}>Tarefa aprovada! Moedas e XP recebidos!</Text>
                </View>
              )}
            </View>
          ))
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Snackbars */}
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        style={styles.errorSnackbar}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess('')}
        duration={3000}
        style={styles.successSnackbar}
      >
        {success}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.common.white,
  },
  header: {
    backgroundColor: COLORS.child.primary,
    paddingTop: STATUS_BAR_HEIGHT + 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  statusFiltersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#fff',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  segmentTextActive: {
    color: COLORS.child.primary,
  },
  segmentBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  segmentBadgeActive: {
    backgroundColor: COLORS.child.primary,
  },
  segmentBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
  },
  segmentBadgeTextActive: {
    color: '#fff',
  },
  categorySection: {
    backgroundColor: COLORS.common.white,
    paddingVertical: 10,
  },
  categorySectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.common.textLight,
    marginLeft: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryFilters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    gap: 6,
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.child.primary,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.child.primary,
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.common.text,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.common.textLight,
    textAlign: 'center',
  },
  taskCard: {
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
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.common.text,
    flex: 1,
  },
  taskStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: COLORS.common.textLight,
    marginBottom: 8,
  },
  taskValues: {
    flexDirection: 'row',
    gap: 16,
  },
  taskValueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.common.text,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.child.success,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 16,
    gap: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectionContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.common.error,
  },
  rejectionText: {
    fontSize: 13,
    color: COLORS.common.text,
    marginBottom: 12,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.child.secondary,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
  },
  reviewingText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.child.primary,
  },
  approvedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  approvedText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.child.success,
  },
  bottomSpacer: {
    height: 20,
  },
  errorSnackbar: {
    backgroundColor: COLORS.common.error,
  },
  successSnackbar: {
    backgroundColor: COLORS.child.success,
  },
});

export default ChildTasksScreen;
