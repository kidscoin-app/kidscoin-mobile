/**
 * Tela da loja de recompensas (Child)
 */
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Snackbar, Text } from "react-native-paper";
import { getErrorMessage, rewardService, walletService } from "../../services";
import { Reward, Redemption } from "../../types";
import { COLORS } from "../../utils/constants";

const RewardsShopScreen: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [balance, setBalance] = useState(0);
  const [pendingRedemptions, setPendingRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Carregar recompensas, saldo e pedidos pendentes
   */
  const loadData = async () => {
    try {
      // Carregar recompensas ativas, saldo e pedidos pendentes em paralelo
      const [rewardsData, walletData, redemptionsData] = await Promise.all([
        rewardService.getRewards(true), // activeOnly = true
        walletService.getWallet(),
        rewardService.getRedemptions('PENDING'), // Apenas pendentes
      ]);
      setRewards(rewardsData);
      setBalance(walletData.balance);
      setPendingRedemptions(redemptionsData);
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
    }
  };

  /**
   * Solicitar resgate de recompensa
   */
  const handleRequestRedemption = async (reward: Reward) => {
    setError("");
    setSuccess("");

    // Verificar se tem moedas suficientes
    if (balance < reward.coinCost) {
      setError("Você não tem moedas suficientes! 😢");
      return;
    }

    setLoading(true);

    try {
      await rewardService.requestRedemption({ rewardId: reward.id });
      setSuccess(`🎉 Pedido de "${reward.name}" enviado! Aguarde aprovação.`);
      await loadData(); // Recarregar dados
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verificar se criança tem moedas suficientes
   */
  const hasEnoughCoins = (cost: number) => balance >= cost;

  /**
   * Verificar se a recompensa já tem um pedido pendente
   */
  const hasPendingRedemption = (rewardId: string) => {
    return pendingRedemptions.some(redemption => redemption.reward.id === rewardId);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Card de saldo */}
        <Card style={styles.balanceCard}>
          <Card.Content style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>💰 Minhas Moedas</Text>
            <Text style={styles.balanceValue}>{balance}</Text>
          </Card.Content>
        </Card>

        {/* Título */}
        <Text style={styles.title}>🎁 Loja de Recompensas</Text>
        <Text style={styles.subtitle}>
          Troque suas moedas por recompensas incríveis!
        </Text>

        {/* Lista de recompensas */}
        {rewards.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>
                Ainda não há recompensas disponíveis. 😊
              </Text>
              <Text style={styles.emptySubtext}>
                Peça aos seus pais para criar algumas!
              </Text>
            </Card.Content>
          </Card>
        ) : (
          rewards.map((reward) => {
            const canAfford = hasEnoughCoins(reward.coinCost);
            const isPending = hasPendingRedemption(reward.id);
            const isDisabled = !canAfford || loading || isPending;

            // Determinar texto e ícone do botão
            let buttonText = "Pedir esta recompensa!";
            let buttonIcon = "gift";
            let buttonColor = COLORS.child.primary;

            if (isPending) {
              buttonText = "Esperando aprovação...";
              buttonIcon = "clock-outline";
              buttonColor = COLORS.child.warning;
            } else if (!canAfford) {
              buttonText = "Moedas insuficientes";
              buttonIcon = "lock";
              buttonColor = COLORS.common.textLight;
            }

            return (
              <Card key={reward.id} style={styles.rewardCard}>
                <Card.Content>
                  <View style={styles.rewardHeader}>
                    <View style={styles.rewardTitleRow}>
                      <Text style={styles.rewardIcon}>🎁</Text>
                      <Text style={styles.rewardName}>{reward.name}</Text>
                    </View>
                    <Chip
                      style={[
                        styles.costChip,
                        canAfford
                          ? styles.costChipAfford
                          : styles.costChipExpensive,
                      ]}
                      textStyle={styles.costChipText}
                    >
                      💰 {reward.coinCost}
                    </Chip>
                  </View>

                  {reward.description && (
                    <Text style={styles.rewardDescription}>
                      {reward.description}
                    </Text>
                  )}

                  <Button
                    mode="contained"
                    onPress={() => handleRequestRedemption(reward)}
                    disabled={isDisabled}
                    style={styles.redeemButton}
                    buttonColor={buttonColor}
                    icon={buttonIcon}
                  >
                    {buttonText}
                  </Button>

                  {!canAfford && !isPending && (
                    <Text style={styles.needMoreText}>
                      Você precisa de mais {reward.coinCost - balance} moedas 💪
                    </Text>
                  )}

                  {isPending && (
                    <Text style={styles.pendingText}>
                      Seu pedido está sendo analisado 🕐
                    </Text>
                  )}
                </Card.Content>
              </Card>
            );
          })
        )}
      </View>

      {/* Snackbars */}
      <Snackbar
        visible={!!error}
        onDismiss={() => setError("")}
        duration={3000}
        style={styles.errorSnackbar}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess("")}
        duration={4000}
        style={styles.successSnackbar}
      >
        {success}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.child.background,
  },
  content: {
    padding: 20,
  },
  balanceCard: {
    marginBottom: 20,
    backgroundColor: COLORS.child.primary,
  },
  balanceContent: {
    alignItems: "center",
    paddingVertical: 10,
  },
  balanceLabel: {
    fontSize: 18,
    color: COLORS.common.white,
    fontWeight: "600",
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 36,
    color: COLORS.common.white,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.common.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.common.textLight,
    marginBottom: 20,
  },
  emptyCard: {
    backgroundColor: COLORS.common.white,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.common.text,
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.common.textLight,
    textAlign: "center",
  },
  rewardCard: {
    marginBottom: 15,
    backgroundColor: COLORS.common.white,
    elevation: 3,
  },
  rewardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  rewardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rewardIcon: {
    fontSize: 32,
    marginRight: 10,
  },
  rewardName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.common.text,
    flex: 1,
  },
  costChip: {
    marginLeft: 10,
  },
  costChipAfford: {
    backgroundColor: COLORS.child.success,
  },
  costChipExpensive: {
    backgroundColor: COLORS.child.warning,
  },
  costChipText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.common.white,
  },
  rewardDescription: {
    fontSize: 14,
    color: COLORS.common.textLight,
    marginBottom: 15,
    marginLeft: 42, // Alinhado com o título (após o ícone)
  },
  redeemButton: {
    marginTop: 10,
  },
  needMoreText: {
    fontSize: 12,
    color: COLORS.child.warning,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  pendingText: {
    fontSize: 12,
    color: COLORS.child.warning,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  errorSnackbar: {
    backgroundColor: COLORS.common.error,
  },
  successSnackbar: {
    backgroundColor: COLORS.child.success,
  },
});

export default RewardsShopScreen;
