/**
 * Tela da loja de recompensas (Child)
 * Migrado para React Query
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getErrorMessage } from '../../services';
import { Reward } from '../../types';
import { COLORS } from '../../utils/constants';
import { useRewards, useWallet, useRequestRedemption } from '../../hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 colunas com padding

const RewardsShopScreen: React.FC = () => {
  // UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // React Query hooks
  const { data: rewards = [], isLoading } = useRewards({ activeOnly: true });
  const { data: wallet } = useWallet();

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loja de Recompensas</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Suas moedas</Text>
          <View style={styles.balanceRow}>
            <MaterialCommunityIcons name="hand-coin" size={28} color="#FFC107" />
            <Text style={styles.balanceValue}>{balance.toLocaleString('pt-BR')}</Text>
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
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rewardCard: {
    width: CARD_WIDTH,
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
    width: CARD_WIDTH,
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
