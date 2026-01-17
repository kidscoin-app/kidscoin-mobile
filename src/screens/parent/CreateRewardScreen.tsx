/**
 * Tela para criar e gerenciar recompensas (Parent)
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
  Chip,
  Snackbar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useRewards,
  useCreateReward,
  useToggleReward,
  useRefreshOnFocus,
  usePendingRedemptions,
  useApproveRedemption,
  useRejectRedemption,
} from '../../hooks';
import { getErrorMessage } from '../../services';
import { COLORS } from '../../utils/constants';
import { BottomSheet } from '../../components';

type StatusFilter = 'PENDING' | 'ACTIVE' | 'INACTIVE';

const CreateRewardScreen: React.FC = () => {
  // Filtro
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');

  // Bottom Sheet
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  // Formulario
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coinCost, setCoinCost] = useState('');

  // UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // React Query hooks
  const { data: rewards = [], isLoading: loadingRewards, refetch: refetchRewards } = useRewards();
  const { data: pendingRedemptions = [], isLoading: loadingRedemptions, refetch: refetchRedemptions } = usePendingRedemptions();

  // Atualizar dados quando a tela receber foco
  useRefreshOnFocus(refetchRewards);
  useRefreshOnFocus(refetchRedemptions);

  const createReward = useCreateReward({
    onSuccess: () => {
      setSuccess('Recompensa criada com sucesso!');
      resetForm();
      setShowCreateSheet(false);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const toggleReward = useToggleReward({
    onSuccess: (reward) => {
      setSuccess(reward.isActive ? `${reward.name} foi ativada` : `${reward.name} foi desativada`);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const approveRedemption = useApproveRedemption({
    onSuccess: (redemption) => {
      setSuccess(`Resgate de "${redemption.reward.name}" aprovado!`);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const rejectRedemption = useRejectRedemption({
    onSuccess: () => {
      setSuccess('Resgate rejeitado. Moedas devolvidas.');
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  // Calculos
  const totalCoins = useMemo(() => {
    return rewards.reduce((sum, r) => sum + r.coinCost, 0);
  }, [rewards]);

  const activeCount = useMemo(() => {
    return rewards.filter((r) => r.isActive).length;
  }, [rewards]);

  // Filtrar recompensas (apenas para ativas/inativas)
  const filteredRewards = useMemo(() => {
    switch (statusFilter) {
      case 'ACTIVE':
        return rewards.filter((r) => r.isActive);
      case 'INACTIVE':
        return rewards.filter((r) => !r.isActive);
      default:
        return [];
    }
  }, [rewards, statusFilter]);

  // Contagem de redenções pendentes
  const pendingCount = pendingRedemptions.length;

  /**
   * Resetar formulario
   */
  const resetForm = () => {
    setName('');
    setDescription('');
    setCoinCost('');
  };

  /**
   * Validar formulario
   */
  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Preencha o nome da recompensa');
      return false;
    }

    const cost = parseInt(coinCost);
    if (isNaN(cost) || cost <= 0) {
      setError('Custo deve ser maior que zero');
      return false;
    }

    return true;
  };

  /**
   * Criar recompensa
   */
  const handleCreateReward = () => {
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    createReward.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      coinCost: parseInt(coinCost),
    });
  };

  return (
    <View style={styles.container}>
      {/* Card de Resumo */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryIconCircle}>
            <MaterialCommunityIcons
              name="gift-outline"
              size={24}
              color={COLORS.parent.primary}
            />
          </View>
          <Text style={styles.summaryValue}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Ativas</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <View style={styles.summaryIconCircle}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color={COLORS.parent.primary}
            />
          </View>
          <Text style={styles.summaryValue}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Aguardando</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <HorizontalScroll
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <Chip
            selected={statusFilter === 'PENDING'}
            onPress={() => setStatusFilter('PENDING')}
            style={[styles.filterChip, statusFilter === 'PENDING' && styles.filterChipPending]}
            textStyle={[styles.filterChipText, statusFilter === 'PENDING' && styles.filterChipTextSelected]}
            showSelectedOverlay={false}
          >
            Aguardando {pendingCount > 0 && `(${pendingCount})`}
          </Chip>
          <Chip
            selected={statusFilter === 'ACTIVE'}
            onPress={() => setStatusFilter('ACTIVE')}
            style={[styles.filterChip, statusFilter === 'ACTIVE' && styles.filterChipSelected]}
            textStyle={[styles.filterChipText, statusFilter === 'ACTIVE' && styles.filterChipTextSelected]}
            showSelectedOverlay={false}
          >
            Ativas
          </Chip>
          <Chip
            selected={statusFilter === 'INACTIVE'}
            onPress={() => setStatusFilter('INACTIVE')}
            style={[styles.filterChip, statusFilter === 'INACTIVE' && styles.filterChipSelected]}
            textStyle={[styles.filterChipText, statusFilter === 'INACTIVE' && styles.filterChipTextSelected]}
            showSelectedOverlay={false}
          >
            Inativas
          </Chip>
        </HorizontalScroll>
      </View>

      {/* Lista */}
      <ScrollView style={styles.rewardList} contentContainerStyle={styles.rewardListContent}>
        {/* Aba de Pendentes */}
        {statusFilter === 'PENDING' && (
          <>
            {loadingRedemptions ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Carregando...</Text>
              </View>
            ) : pendingRedemptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={48}
                  color={COLORS.child.success}
                />
                <Text style={styles.emptyText}>Nenhum pedido pendente</Text>
                <Text style={styles.emptySubtext}>
                  Quando as crianças pedirem recompensas, aparecerão aqui
                </Text>
              </View>
            ) : (
              pendingRedemptions.map((redemption) => (
                <View key={redemption.id} style={styles.pendingCard}>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>AGUARDANDO</Text>
                  </View>
                  <View style={styles.rewardCardHeader}>
                    <View style={[styles.rewardIconCircle, styles.pendingIconCircle]}>
                      <MaterialCommunityIcons name="gift" size={24} color="#F59E0B" />
                    </View>
                    <View style={styles.rewardContent}>
                      <Text style={styles.rewardName} numberOfLines={1}>
                        {redemption.reward.name}
                      </Text>
                      <Text style={styles.childName}>
                        Pedido por: {redemption.childName}
                      </Text>
                      <Text style={styles.requestDate}>
                        {new Date(redemption.requestedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.pendingCost}>
                    <MaterialCommunityIcons name="hand-coin" size={18} color="#FFC107" />
                    <Text style={styles.coinText}>{redemption.reward.coinCost} moedas</Text>
                  </View>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => rejectRedemption.mutate({
                        redemptionId: redemption.id,
                        data: { rejectionReason: 'Não aprovado pelo responsável' }
                      })}
                      disabled={approveRedemption.isPending || rejectRedemption.isPending}
                    >
                      <MaterialCommunityIcons name="close" size={18} color={COLORS.common.error} />
                      <Text style={styles.rejectButtonText}>Recusar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => approveRedemption.mutate(redemption.id)}
                      disabled={approveRedemption.isPending || rejectRedemption.isPending}
                    >
                      <MaterialCommunityIcons name="check" size={18} color="#fff" />
                      <Text style={styles.approveButtonText}>Aprovar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* Aba de Ativas/Inativas */}
        {(statusFilter === 'ACTIVE' || statusFilter === 'INACTIVE') && (
          <>
            {loadingRewards ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Carregando...</Text>
              </View>
            ) : filteredRewards.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="gift-outline"
                  size={48}
                  color={COLORS.common.textLight}
                />
                <Text style={styles.emptyText}>
                  {statusFilter === 'ACTIVE'
                    ? 'Nenhuma recompensa ativa'
                    : 'Nenhuma recompensa inativa'}
                </Text>
              </View>
            ) : (
              filteredRewards.map((reward) => (
                <View key={reward.id} style={styles.rewardCard}>
                  <View style={styles.rewardCardHeader}>
                    <View style={styles.rewardIconCircle}>
                      <MaterialCommunityIcons name="gift-outline" size={24} color={COLORS.parent.primary} />
                    </View>
                    <View style={styles.rewardContent}>
                      <Text
                        style={[styles.rewardName, !reward.isActive && styles.rewardNameInactive]}
                        numberOfLines={1}
                      >
                        {reward.name}
                      </Text>
                      {reward.description && (
                        <Text style={styles.rewardDescription} numberOfLines={2}>
                          {reward.description}
                        </Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.statusDot,
                        reward.isActive ? styles.statusDotActive : styles.statusDotInactive,
                      ]}
                    />
                  </View>

                  <View style={styles.rewardCardFooter}>
                    <View style={styles.coinContainer}>
                      <MaterialCommunityIcons name="hand-coin" size={18} color="#FFC107" />
                      <Text style={styles.coinText}>{reward.coinCost} moedas</Text>
                    </View>
                    <Switch
                      value={reward.isActive}
                      onValueChange={() => toggleReward.mutate(reward.id)}
                      color={COLORS.child.success}
                    />
                  </View>
                </View>
              ))
            )}
          </>
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

      {/* Bottom Sheet de Criar Recompensa */}
      <BottomSheet
        visible={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        title="Criar Nova Recompensa"
        height={0.6}
      >
        <TextInput
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          placeholder="Nome da Recompensa"
          left={<TextInput.Icon icon="gift-outline" />}
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
          placeholder="Descricao (opcional)"
          outlineColor={COLORS.common.border}
          activeOutlineColor={COLORS.parent.primary}
          outlineStyle={styles.inputOutline}
        />

        <TextInput
          value={coinCost}
          onChangeText={setCoinCost}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          placeholder="Custo em Moedas"
          left={<TextInput.Icon icon="hand-coin" />}
          outlineColor={COLORS.common.border}
          activeOutlineColor={COLORS.parent.primary}
          outlineStyle={styles.inputOutline}
        />

        <TouchableOpacity
          style={[styles.createButton, createReward.isPending && styles.createButtonDisabled]}
          onPress={handleCreateReward}
          disabled={createReward.isPending}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.createButtonText}>
            {createReward.isPending ? 'Criando...' : 'Criar Recompensa'}
          </Text>
        </TouchableOpacity>
      </BottomSheet>

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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E5F5',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  summaryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.common.text,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.common.textLight,
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filters: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: COLORS.parent.primary,
  },
  filterChipPending: {
    backgroundColor: '#F59E0B',
  },
  filterChipText: {
    color: COLORS.common.text,
    fontSize: 14,
  },
  filterChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  rewardList: {
    flex: 1,
  },
  rewardListContent: {
    padding: 16,
    paddingTop: 0,
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
  emptySubtext: {
    fontSize: 12,
    color: COLORS.common.textLight,
    textAlign: 'center',
    marginTop: -8,
  },
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    paddingTop: 28,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F59E0B',
    overflow: 'hidden',
  },
  pendingBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#F59E0B',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderBottomRightRadius: 12,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  pendingIconCircle: {
    backgroundColor: '#FEF3C7',
  },
  childName: {
    fontSize: 14,
    color: COLORS.parent.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 12,
    color: COLORS.common.textLight,
  },
  pendingCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.common.error,
    backgroundColor: '#FEF2F2',
    gap: 6,
  },
  rejectButtonText: {
    color: COLORS.common.error,
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.child.success,
    gap: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rewardCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  rewardIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rewardContent: {
    flex: 1,
    marginRight: 8,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.common.text,
    marginBottom: 4,
  },
  rewardNameInactive: {
    color: COLORS.common.textLight,
  },
  rewardDescription: {
    fontSize: 14,
    color: COLORS.common.textLight,
    lineHeight: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  statusDotActive: {
    backgroundColor: COLORS.child.success,
  },
  statusDotInactive: {
    backgroundColor: COLORS.common.textLight,
  },
  rewardCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.common.text,
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.parent.primary,
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 8,
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
  errorSnackbar: {
    backgroundColor: COLORS.common.error,
  },
  successSnackbar: {
    backgroundColor: COLORS.child.success,
  },
});

export default CreateRewardScreen;
