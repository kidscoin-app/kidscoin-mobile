/**
 * Tela para gerenciar tarefas (Parent)
 * Migrado para React Query
 */
import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView as HorizontalScroll,
} from 'react-native';
import {
  Button,
  Chip,
  Dialog,
  IconButton,
  Portal,
  SegmentedButtons,
  Snackbar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useChildren,
  useTasks,
  useCreateTask,
  useApproveTask,
  useRejectTask,
  useDeleteTask,
  useRefreshOnFocus,
} from '../../hooks';
import { getErrorMessage } from '../../services';
import { RecurrenceType, TaskAssignment, TaskCategory } from '../../types';
import { COLORS } from '../../utils/constants';
import { BottomSheet } from '../../components';

// Categorias disponiveis
const CATEGORIES: { value: TaskCategory; label: string; icon: string; emoji: string }[] = [
  { value: 'LIMPEZA', label: 'Limpeza', icon: 'broom', emoji: '' },
  { value: 'ORGANIZACAO', label: 'Organização', icon: 'package-variant', emoji: '' },
  { value: 'ESTUDOS', label: 'Estudo', icon: 'book-open', emoji: '' },
  { value: 'CUIDADOS', label: 'Cuidados', icon: 'heart', emoji: '' },
  { value: 'OUTRAS', label: 'Outras', icon: 'dots-horizontal', emoji: '' },
];

// Dias da semana
const WEEKDAYS = [
  { value: 'MON', label: 'Seg' },
  { value: 'TUE', label: 'Ter' },
  { value: 'WED', label: 'Qua' },
  { value: 'THU', label: 'Qui' },
  { value: 'FRI', label: 'Sex' },
  { value: 'SAT', label: 'Sab' },
  { value: 'SUN', label: 'Dom' },
];

type StatusFilter = 'ALL' | 'COMPLETED' | 'PENDING' | 'APPROVED';

const ManageTasksScreen: React.FC = () => {
  // Filtros
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | null>(null);

  // Bottom Sheet
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  // Formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coinValue, setCoinValue] = useState('');
  const [xpValue, setXpValue] = useState('');
  const [category, setCategory] = useState<TaskCategory>('LIMPEZA');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  // Recorrencia
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('DAILY');
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');

  // UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog de rejeicao
  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [rejectingTask, setRejectingTask] = useState<TaskAssignment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Dialog de exclusao
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskAssignment | null>(null);

  // React Query hooks
  const { data: children = [] } = useChildren();
  const { data: tasks = [], isLoading: loadingTasks, refetch: refetchTasks } = useTasks();

  // Atualizar dados quando a tela receber foco
  useRefreshOnFocus(refetchTasks);

  const createTask = useCreateTask({
    onSuccess: () => {
      setSuccess('Tarefa criada com sucesso!');
      resetForm();
      setShowCreateSheet(false);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const approveTask = useApproveTask({
    onSuccess: () => {
      setSuccess('Tarefa aprovada! Moedas e XP creditados.');
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const rejectTask = useRejectTask({
    onSuccess: () => {
      setSuccess('Tarefa rejeitada.');
      setRejectDialogVisible(false);
      setRejectingTask(null);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const deleteTask = useDeleteTask({
    onSuccess: () => {
      setSuccess('Tarefa excluida com sucesso.');
      setDeleteDialogVisible(false);
      setDeletingTask(null);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  // Contadores por status
  const statusCounts = useMemo(() => {
    return {
      all: tasks.length,
      completed: tasks.filter((t) => t.status === 'COMPLETED').length,
      pending: tasks.filter((t) => t.status === 'PENDING').length,
      approved: tasks.filter((t) => t.status === 'APPROVED').length,
    };
  }, [tasks]);

  // Filtrar e ordenar tarefas
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filtro de status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Filtro de categoria
    if (categoryFilter) {
      filtered = filtered.filter((t) => t.task.category === categoryFilter);
    }

    // Ordenar: COMPLETED primeiro, depois PENDING, REJECTED, APPROVED
    const priorityMap: { [key: string]: number } = {
      COMPLETED: 1,
      REJECTED: 2,
      PENDING: 3,
      APPROVED: 4,
    };

    return [...filtered].sort((a, b) => {
      const priorityA = priorityMap[a.status] || 999;
      const priorityB = priorityMap[b.status] || 999;
      return priorityA - priorityB;
    });
  }, [tasks, statusFilter, categoryFilter]);

  /**
   * Resetar formulario
   */
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCoinValue('');
    setXpValue('');
    setCategory('LIMPEZA');
    setSelectedChildren([]);
    setIsRecurring(false);
    setRecurrenceType('DAILY');
    setSelectedWeekdays([]);
    setHasEndDate(false);
    setEndDate('');
  };

  /**
   * Validar formulario
   */
  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Preencha o titulo da tarefa');
      return false;
    }

    const coins = parseInt(coinValue);
    if (isNaN(coins) || coins <= 0) {
      setError('Valor de moedas deve ser maior que zero');
      return false;
    }

    const xp = parseInt(xpValue);
    if (isNaN(xp) || xp <= 0) {
      setError('Valor de XP deve ser maior que zero');
      return false;
    }

    if (selectedChildren.length === 0) {
      setError('Selecione pelo menos uma criança');
      return false;
    }

    if (isRecurring && recurrenceType === 'WEEKLY' && selectedWeekdays.length === 0) {
      setError('Selecione pelo menos um dia da semana');
      return false;
    }

    return true;
  };

  /**
   * Criar tarefa
   */
  const handleCreateTask = () => {
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    createTask.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      coinValue: parseInt(coinValue),
      xpValue: parseInt(xpValue),
      category,
      childrenIds: selectedChildren,
      isRecurring: isRecurring || undefined,
      recurrenceType: isRecurring ? recurrenceType : undefined,
      recurrenceDays:
        isRecurring && recurrenceType === 'WEEKLY' ? selectedWeekdays.join(',') : undefined,
      recurrenceEndDate: isRecurring && hasEndDate && endDate ? endDate : undefined,
    });
  };

  /**
   * Aprovar tarefa
   */
  const handleApprove = (assignmentId: string) => {
    approveTask.mutate(assignmentId);
  };

  /**
   * Abrir dialog de rejeicao
   */
  const openRejectDialog = (task: TaskAssignment) => {
    setRejectingTask(task);
    setRejectionReason('');
    setRejectDialogVisible(true);
  };

  /**
   * Rejeitar tarefa
   */
  const handleReject = () => {
    if (!rejectingTask || !rejectionReason.trim()) {
      return;
    }

    rejectTask.mutate({
      assignmentId: rejectingTask.id,
      data: { rejectionReason: rejectionReason.trim() },
    });
  };

  /**
   * Abrir dialog de exclusao
   */
  const openDeleteDialog = (task: TaskAssignment) => {
    setDeletingTask(task);
    setDeleteDialogVisible(true);
  };

  /**
   * Deletar tarefa
   */
  const handleDelete = () => {
    if (!deletingTask) {
      return;
    }
    deleteTask.mutate(deletingTask.id);
  };

  /**
   * Toggle crianca selecionada
   */
  const toggleChild = (childId: string) => {
    setSelectedChildren((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    );
  };

  /**
   * Toggle dia da semana selecionado
   */
  const toggleWeekday = (day: string) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  /**
   * Obter cor do status
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFF3E0';
      case 'COMPLETED':
        return '#F3E5F5';
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
        return '#E65100';
      case 'COMPLETED':
        return COLORS.parent.primary;
      case 'APPROVED':
        return '#2E7D32';
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
        return 'Pendente';
      case 'COMPLETED':
        return 'Aguardando Aprovação';
      case 'APPROVED':
        return 'Aprovada';
      case 'REJECTED':
        return 'Rejeitada';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Filtros de Status */}
      <View style={styles.statusFiltersContainer}>
        <HorizontalScroll
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusFilters}
        >
          <Chip
            selected={statusFilter === 'ALL'}
            onPress={() => setStatusFilter('ALL')}
            style={[styles.statusChip, statusFilter === 'ALL' && styles.statusChipSelected]}
            textStyle={[styles.statusChipText, statusFilter === 'ALL' && styles.statusChipTextSelected]}
            showSelectedOverlay={false}
          >
            Todas {statusCounts.all}
          </Chip>
          <Chip
            selected={statusFilter === 'COMPLETED'}
            onPress={() => setStatusFilter('COMPLETED')}
            style={[styles.statusChip, statusFilter === 'COMPLETED' && styles.statusChipSelected]}
            textStyle={[styles.statusChipText, statusFilter === 'COMPLETED' && styles.statusChipTextSelected]}
            showSelectedOverlay={false}
          >
            Aguardando {statusCounts.completed}
          </Chip>
          <Chip
            selected={statusFilter === 'PENDING'}
            onPress={() => setStatusFilter('PENDING')}
            style={[styles.statusChip, statusFilter === 'PENDING' && styles.statusChipSelected]}
            textStyle={[styles.statusChipText, statusFilter === 'PENDING' && styles.statusChipTextSelected]}
            showSelectedOverlay={false}
          >
            Pendentes {statusCounts.pending}
          </Chip>
          <Chip
            selected={statusFilter === 'APPROVED'}
            onPress={() => setStatusFilter('APPROVED')}
            style={[styles.statusChip, statusFilter === 'APPROVED' && styles.statusChipSelected]}
            textStyle={[styles.statusChipText, statusFilter === 'APPROVED' && styles.statusChipTextSelected]}
            showSelectedOverlay={false}
          >
            Aprovadas {statusCounts.approved}
          </Chip>
        </HorizontalScroll>
      </View>

      {/* Filtro de Categoria */}
      <View style={styles.categoryFilterContainer}>
        <View style={styles.categoryLabelRow}>
          <MaterialCommunityIcons name="filter-variant" size={18} color={COLORS.common.textLight} />
          <Text style={styles.categoryLabel}>Categoria</Text>
        </View>
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
            icon={categoryFilter === null ? 'check' : undefined}
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
                icon={isSelected ? 'check' : cat.icon}
              >
                {cat.label}
              </Chip>
            );
          })}
        </HorizontalScroll>
      </View>

      {/* Lista de Tarefas */}
      <ScrollView style={styles.taskList} contentContainerStyle={styles.taskListContent}>
        {loadingTasks ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Carregando...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={48}
              color={COLORS.common.textLight}
            />
            <Text style={styles.emptyText}>Nenhuma tarefa encontrada</Text>
          </View>
        ) : (
          filteredTasks.map((assignment) => (
            <View key={assignment.id} style={styles.taskCard}>
              {/* Header do Card */}
              <View style={styles.taskCardHeader}>
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
                <Text style={styles.taskDescription} numberOfLines={2}>
                  {assignment.task.description}
                </Text>
              )}

              {/* Crianca */}
              <View style={styles.taskChildRow}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={16}
                  color={COLORS.common.textLight}
                />
                <Text style={styles.taskChildName}>{assignment.childName}</Text>
              </View>

              {/* Valores e Delete */}
              <View style={styles.taskValuesRow}>
                <View style={styles.taskValues}>
                  <View style={styles.taskValueItem}>
                    <MaterialCommunityIcons name="hand-coin" size={18} color="#FFC107" />
                    <Text style={styles.taskValueText}>{assignment.task.coinValue} moedas</Text>
                  </View>
                  <View style={styles.taskValueItem}>
                    <MaterialCommunityIcons name="star" size={18} color="#FFC107" />
                    <Text style={styles.taskValueText}>{assignment.task.xpValue} XP</Text>
                  </View>
                </View>
                <IconButton
                  icon="delete-outline"
                  iconColor={COLORS.common.error}
                  size={22}
                  onPress={() => openDeleteDialog(assignment)}
                  style={styles.deleteButton}
                />
              </View>

              {/* Botoes de Acao para tarefas COMPLETED */}
              {assignment.status === 'COMPLETED' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApprove(assignment.id)}
                    disabled={approveTask.isPending}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="check" size={18} color="#fff" />
                    <Text style={styles.approveButtonText}>Aprovar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => openRejectDialog(assignment)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="close" size={18} color={COLORS.common.error} />
                    <Text style={styles.rejectButtonText}>Rejeitar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Motivo da Rejeicao */}
              {assignment.status === 'REJECTED' && assignment.rejectionReason && (
                <View style={styles.rejectionContainer}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.common.error} />
                  <Text style={styles.rejectionReason}>
                    Motivo: {assignment.rejectionReason}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Botao Flutuante Nova */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setShowCreateSheet(true)}
        activeOpacity={0.9}
      >
        <MaterialCommunityIcons name="plus" size={22} color="#fff" />
        <Text style={styles.fabText}>Nova</Text>
      </TouchableOpacity>

      {/* Bottom Sheet de Criar Tarefa */}
      <BottomSheet
        visible={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        title="Criar Nova Tarefa"
        height={0.9}
      >
        <TextInput
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          placeholder="Titulo da Tarefa"
          outlineColor={COLORS.common.border}
          activeOutlineColor={COLORS.parent.primary}
          outlineStyle={styles.inputOutline}
        />

        <TextInput
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.inputMultiline}
          placeholder="Descrição (opcional)"
          outlineColor={COLORS.common.border}
          activeOutlineColor={COLORS.parent.primary}
          outlineStyle={styles.inputOutline}
        />

        <View style={styles.row}>
          <TextInput
            value={coinValue}
            onChangeText={setCoinValue}
            mode="outlined"
            keyboardType="numeric"
            style={[styles.input, styles.halfInput]}
            left={<TextInput.Icon icon="currency-usd" />}
            placeholder="Moedas"
            outlineColor={COLORS.common.border}
            activeOutlineColor={COLORS.parent.primary}
            outlineStyle={styles.inputOutline}
          />

          <TextInput
            value={xpValue}
            onChangeText={setXpValue}
            mode="outlined"
            keyboardType="numeric"
            style={[styles.input, styles.halfInput]}
            left={<TextInput.Icon icon="star-outline" />}
            placeholder="XP"
            outlineColor={COLORS.common.border}
            activeOutlineColor={COLORS.parent.primary}
            outlineStyle={styles.inputOutline}
          />
        </View>

        <Text style={styles.formLabel}>Categoria</Text>
        <HorizontalScroll
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.formChipsScroll}
        >
          <View style={styles.formChipsRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.value;
              return (
                <Chip
                  key={cat.value}
                  selected={isSelected}
                  onPress={() => setCategory(cat.value)}
                  style={[styles.formChip, isSelected && styles.formChipSelected]}
                  icon={isSelected ? 'check' : cat.icon}
                  textStyle={isSelected ? styles.formChipTextSelected : styles.formChipText}
                  showSelectedOverlay={false}
                >
                  {cat.label}
                </Chip>
              );
            })}
          </View>
        </HorizontalScroll>

        <Text style={styles.formLabel}>Atribuir para</Text>
        {children.length === 0 ? (
          <Text style={styles.emptyText}>Cadastre crianças primeiro na aba "Crianças"</Text>
        ) : (
          <View style={styles.childrenList}>
            {children.map((child) => {
              const isSelected = selectedChildren.includes(child.id);
              return (
                <Chip
                  key={child.id}
                  selected={isSelected}
                  onPress={() => toggleChild(child.id)}
                  style={[styles.formChip, isSelected && styles.formChipSelected]}
                  icon="account-outline"
                  textStyle={isSelected ? styles.formChipTextSelected : styles.formChipText}
                  showSelectedOverlay={false}
                >
                  {child.fullName}
                </Chip>
              );
            })}
          </View>
        )}

        {/* Secao de Recorrencia */}
        <View style={styles.recurrenceSection}>
          <View style={styles.recurrenceHeader}>
            <Text style={styles.formLabel}>Tarefa Recorrente</Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              color={COLORS.parent.primary}
            />
          </View>

          {isRecurring && (
            <View style={styles.recurrenceOptions}>
              <Text style={styles.sublabel}>Frequencia</Text>
              <SegmentedButtons
                value={recurrenceType}
                onValueChange={(value) => setRecurrenceType(value as RecurrenceType)}
                buttons={[
                  { value: 'DAILY', label: 'Todos os dias' },
                  { value: 'WEEKLY', label: 'Dias especificos' },
                ]}
                style={styles.segmentedButtons}
              />

              {recurrenceType === 'WEEKLY' && (
                <View>
                  <Text style={styles.sublabel}>Dias da semana</Text>
                  <View style={styles.weekdaysContainer}>
                    {WEEKDAYS.map((day) => {
                      const isSelected = selectedWeekdays.includes(day.value);
                      return (
                        <Chip
                          key={day.value}
                          selected={isSelected}
                          onPress={() => toggleWeekday(day.value)}
                          style={[styles.weekdayChip, isSelected && styles.formChipSelected]}
                          textStyle={isSelected ? styles.formChipTextSelected : styles.formChipText}
                          showSelectedOverlay={false}
                        >
                          {day.label}
                        </Chip>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={styles.endDateSection}>
                <View style={styles.recurrenceHeader}>
                  <Text style={styles.sublabel}>Definir data final</Text>
                  <Switch
                    value={hasEndDate}
                    onValueChange={setHasEndDate}
                    color={COLORS.parent.primary}
                  />
                </View>

                {hasEndDate && (
                  <TextInput
                    value={endDate}
                    onChangeText={setEndDate}
                    mode="outlined"
                    placeholder="AAAA-MM-DD"
                    style={styles.input}
                    left={<TextInput.Icon icon="calendar" />}
                    outlineColor={COLORS.common.border}
                    activeOutlineColor={COLORS.parent.primary}
                    outlineStyle={styles.inputOutline}
                  />
                )}
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.createButton,
            (createTask.isPending || children.length === 0) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateTask}
          disabled={createTask.isPending || children.length === 0}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.createButtonText}>
            {createTask.isPending ? 'Criando...' : 'Criar Tarefa'}
          </Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Dialog de rejeicao */}
      <Portal>
        <Dialog visible={rejectDialogVisible} onDismiss={() => setRejectDialogVisible(false)}>
          <Dialog.Title>Rejeitar Tarefa</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Informe o motivo da rejeicao para {rejectingTask?.childName}:
            </Text>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Ex: Não foi feito corretamente"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRejectDialogVisible(false)}>Cancelar</Button>
            <Button
              onPress={handleReject}
              disabled={!rejectionReason.trim() || rejectTask.isPending}
              loading={rejectTask.isPending}
              textColor={COLORS.common.error}
            >
              Rejeitar
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Dialog de exclusao */}
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Excluir Tarefa</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Tem certeza que deseja excluir a tarefa "{deletingTask?.task.title}"?
            </Text>
            <Text style={[styles.dialogText, { fontSize: 13, color: COLORS.common.textLight }]}>
              Esta ação não pode ser desfeita.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancelar</Button>
            <Button
              onPress={handleDelete}
              textColor={COLORS.common.error}
              loading={deleteTask.isPending}
              disabled={deleteTask.isPending}
            >
                Excluir
              </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
    backgroundColor: COLORS.parent.primary,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusFiltersContainer: {
    backgroundColor: COLORS.common.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.common.border,
  },
  statusFilters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  statusChip: {
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  statusChipSelected: {
    backgroundColor: COLORS.parent.primary,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.common.white,
  },
  categoryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 14,
    color: COLORS.common.textLight,
  },
  categoryFilters: {
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.parent.primary,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
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
    fontSize: 11,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: COLORS.common.textLight,
    marginBottom: 10,
    lineHeight: 20,
  },
  taskChildRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  taskChildName: {
    fontSize: 14,
    color: COLORS.common.textLight,
  },
  taskValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskValues: {
    flexDirection: 'row',
    gap: 16,
  },
  taskValueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskValueText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.common.text,
  },
  deleteButton: {
    margin: -8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.child.success,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.common.error,
    gap: 6,
  },
  rejectButtonText: {
    color: COLORS.common.error,
    fontSize: 15,
    fontWeight: '600',
  },
  rejectionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  rejectionReason: {
    flex: 1,
    fontSize: 13,
    color: COLORS.common.error,
  },
  bottomSpacer: {
    height: 20,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.parent.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Form styles
  input: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  inputMultiline: {
    backgroundColor: '#fff',
    marginBottom: 16,
    minHeight: 80,
  },
  inputOutline: {
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.common.text,
    marginBottom: 10,
  },
  formChipsScroll: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  formChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  childrenList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  formChip: {
    backgroundColor: '#F5F5F5',
  },
  formChipSelected: {
    backgroundColor: COLORS.parent.primary,
  },
  formChipText: {
    color: COLORS.common.text,
  },
  formChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  recurrenceSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.common.border,
  },
  recurrenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sublabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.common.text,
    marginTop: 12,
    marginBottom: 10,
  },
  recurrenceOptions: {
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  weekdaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  weekdayChip: {
    backgroundColor: '#F5F5F5',
  },
  endDateSection: {
    marginTop: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.parent.primary,
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dialogText: {
    marginBottom: 15,
    color: COLORS.common.text,
  },
  dialogInput: {
    marginTop: 10,
  },
  errorSnackbar: {
    backgroundColor: COLORS.common.error,
  },
  successSnackbar: {
    backgroundColor: COLORS.child.success,
  },
});

export default ManageTasksScreen;
