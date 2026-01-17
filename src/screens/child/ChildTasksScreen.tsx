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
} from 'react-native';
import { Chip, Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getErrorMessage } from '../../services';
import { TaskCategory } from '../../types';
import { COLORS } from '../../utils/constants';
import { useTasks, useCompleteTask, useRetryTask } from '../../hooks';

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
  const { data: tasks = [], isLoading: loading } = useTasks();

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSummary}>
          <Text style={styles.summaryLabel}>Voce tem</Text>
          <Text style={styles.summaryCount}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>tarefas para fazer!</Text>
        </View>
      </View>

      {/* Filtros de Status */}
      <View style={styles.statusFiltersContainer}>
        <HorizontalScroll
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusFilters}
        >
          <Chip
            selected={statusFilter === 'all'}
            onPress={() => setStatusFilter('all')}
            style={[styles.statusChip, statusFilter === 'all' && styles.statusChipSelected]}
            textStyle={[styles.statusChipText, statusFilter === 'all' && styles.statusChipTextSelected]}
            showSelectedOverlay={false}
            icon={() => (
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={16}
                color={statusFilter === 'all' ? '#fff' : COLORS.common.textLight}
              />
            )}
          >
            Todas {tasks.length}
          </Chip>
          <Chip
            selected={statusFilter === 'PENDING'}
            onPress={() => setStatusFilter('PENDING')}
            style={[styles.statusChip, statusFilter === 'PENDING' && styles.statusChipSelectedPending]}
            textStyle={[styles.statusChipText, statusFilter === 'PENDING' && styles.statusChipTextSelected]}
            showSelectedOverlay={false}
            icon={() => (
              <MaterialCommunityIcons
                name="star-outline"
                size={16}
                color={statusFilter === 'PENDING' ? '#fff' : COLORS.common.textLight}
              />
            )}
          >
            Fazer {pendingCount}
          </Chip>
          <Chip
            selected={statusFilter === 'REJECTED'}
            onPress={() => setStatusFilter('REJECTED')}
            style={[styles.statusChip, statusFilter === 'REJECTED' && styles.statusChipSelectedRejected]}
            textStyle={[styles.statusChipText, statusFilter === 'REJECTED' && styles.statusChipTextSelected]}
            showSelectedOverlay={false}
            icon={() => (
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color={statusFilter === 'REJECTED' ? '#fff' : COLORS.common.textLight}
              />
            )}
          >
            Recusadas {rejectedCount}
          </Chip>
        </HorizontalScroll>
      </View>

      {/* Filtro de Categoria */}
      <View style={styles.categoryFilterContainer}>
        <HorizontalScroll
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilters}
        >
          <Chip
            selected={categoryFilter === null}
            onPress={() => setCategoryFilter(null)}
            style={[styles.categoryChip, categoryFilter === null && styles.categoryChipSelected]}
            textStyle={[styles.categoryChipText, categoryFilter === null && styles.categoryChipTextSelected]}
            showSelectedOverlay={false}
            icon={() => (
              <MaterialCommunityIcons
                name="star-four-points"
                size={16}
                color={categoryFilter === null ? '#fff' : COLORS.common.textLight}
              />
            )}
          >
            Todas
          </Chip>
          {CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat.value;
            return (
              <Chip
                key={cat.value}
                selected={isSelected}
                onPress={() => setCategoryFilter(cat.value)}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                textStyle={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}
                showSelectedOverlay={false}
                icon={() => (
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={16}
                    color={isSelected ? '#fff' : COLORS.common.textLight}
                  />
                )}
              >
                {cat.label}
              </Chip>
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
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerSummary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
  },
  summaryLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  summaryCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusFiltersContainer: {
    paddingVertical: 12,
    backgroundColor: COLORS.common.white,
  },
  statusFilters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  statusChip: {
    backgroundColor: '#F5E6E0',
    marginRight: 8,
  },
  statusChipSelected: {
    backgroundColor: COLORS.child.primary,
  },
  statusChipSelectedPending: {
    backgroundColor: COLORS.child.primary,
  },
  statusChipSelectedRejected: {
    backgroundColor: '#FFCDD2',
  },
  statusChipText: {
    color: COLORS.common.text,
    fontSize: 13,
  },
  statusChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  categoryFilterContainer: {
    paddingBottom: 12,
    backgroundColor: COLORS.common.white,
  },
  categoryFilters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.child.primary,
  },
  categoryChipText: {
    color: COLORS.common.text,
    fontSize: 13,
  },
  categoryChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
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
