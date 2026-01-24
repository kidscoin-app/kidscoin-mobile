/**
 * Tela da loja de recompensas (Child)
 * Migrado para React Query
 */
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getErrorMessage } from '../../services';
import { Reward } from '../../types';
import { COLORS } from '../../utils/constants';
import { useRewards, useWallet, useRequestRedemption, useRefreshOnFocus } from '../../hooks';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;

const RewardsShopScreen: React.FC = () => {
  // UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // React Query hooks
  const { data: rewards = [], isLoading, refetch: refetchRewards } = useRewards({ activeOnly: true });
  const { data: wallet, refetch: refetchWallet } = useWallet();

  // Atualizar dados quando a tela receber foco
  useRefreshOnFocus(refetchRewards);
  useRefreshOnFocus(refetchWallet);

  const balance = wallet?.balance || 0;

  const requestRedemption = useRequestRedemption({
    onSuccess: (_, variables) => {
      const reward = rewards.find(r => r.id === variables.rewardId);
      setSuccess(`Pedido de "${reward?.name || 'recompensa'}" enviado! Aguarde aprovacao.`);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  /**
   * Solicitar resgate de recompensa
   */
  const handleRequestRedemption = (reward: Reward) => {
    setError('');
    setSuccess('');

    // Verificar se tem moedas suficientes
    if (balance < reward.coinCost) {
      setError('Voce nao tem moedas suficientes!');
      return;
    }

    requestRedemption.mutate({ rewardId: reward.id });
  };

  /**
   * Verificar se crianca tem moedas suficientes
   */
  const hasEnoughCoins = (cost: number) => balance >= cost;

  /**
   * Dividir rewards em pares para grid de 2 colunas
   */
  const getRewardPairs = () => {
    const pairs: (Reward | null)[][] = [];
    for (let i = 0; i < rewards.length; i += 2) {
      pairs.push([rewards[i], rewards[i + 1] || null]);
    }
    return pairs;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.child.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loja de Recompensas</Text>

        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <View style={styles.statIconCircle}>
              <MaterialCommunityIcons name="gift-outline" size={24} color={COLORS.child.primary} />
            </View>
            <View>
              <Text style={styles.statValue}>{rewards.length}</Text>
              <Text style={styles.statLabel}>disponiveis</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconCircle}>
              <MaterialCommunityIcons name="hand-coin" size={24} color="#FFC107" />
            </View>
            <View>
              <Text style={styles.statValue}>{balance.toLocaleString('pt-BR')}</Text>
              <Text style={styles.statLabel}>suas moedas</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Lista de Recompensas */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Carregando recompensas...</Text>
          </View>
        ) : rewards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="gift-outline" size={48} color={COLORS.common.textLight} />
            <Text style={styles.emptyTitle}>Nenhuma recompensa</Text>
            <Text style={styles.emptyText}>Peca aos seus pais para criar algumas!</Text>
          </View>
        ) : (
          <>
            {/* Grid de Recompensas */}
            {getRewardPairs().map((pair, pairIndex) => (
              <View key={pairIndex} style={styles.rewardRow}>
                {pair.map((reward, index) => {
                  if (!reward) {
                    return <View key={`empty-${index}`} style={styles.rewardCardPlaceholder} />;
                  }

                  const canAfford = hasEnoughCoins(reward.coinCost);

                  return (
                    <View key={reward.id} style={styles.rewardCard}>
                      {/* Icone */}
                      <View style={styles.rewardIconContainer}>
                        <MaterialCommunityIcons
                          name="gift-outline"
                          size={32}
                          color={COLORS.child.primary}
                        />
                      </View>

                      {/* Nome */}
                      <Text style={styles.rewardName} numberOfLines={2}>
                        {reward.name}
                      </Text>

                      {/* Custo */}
                      <View style={styles.costContainer}>
                        <MaterialCommunityIcons name="hand-coin" size={16} color="#FFC107" />
                        <Text style={[styles.costText, !canAfford && styles.costTextExpensive]}>
                          {reward.coinCost}
                        </Text>
                      </View>

                      {/* Botao */}
                      <TouchableOpacity
                        style={[
                          styles.redeemButton,
                          !canAfford && styles.redeemButtonDisabled,
                        ]}
                        onPress={() => handleRequestRedemption(reward)}
                        disabled={!canAfford || requestRedemption.isPending}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name="gift"
                          size={18}
                          color={canAfford ? '#fff' : COLORS.common.textLight}
                        />
                        <Text
                          style={[
                            styles.redeemButtonText,
                            !canAfford && styles.redeemButtonTextDisabled,
                          ]}
                        >
                          {canAfford ? 'Quero!' : 'Faltam moedas'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ))}

            {/* Card de Dica */}
            <View style={styles.tipCard}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={24}
                color={COLORS.child.primary}
              />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Dica!</Text>
                <Text style={styles.tipText}>
                  Complete mais tarefas para ganhar moedas e trocar por recompensas
                </Text>
              </View>
            </View>
          </>
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
        duration={4000}
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
    paddingBottom: 20,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
  rewardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rewardCard: {
    flex: 1,
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
  rewardCardPlaceholder: {
    flex: 1,
  },
  rewardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.common.text,
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 36,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  costText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.child.success,
  },
  costTextExpensive: {
    color: COLORS.common.error,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.child.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    width: '100%',
  },
  redeemButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  redeemButtonTextDisabled: {
    color: COLORS.common.textLight,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3E5F5',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.common.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.common.textLight,
    lineHeight: 20,
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

export default RewardsShopScreen;
