/**
 * Tela de Poupança (Child)
 * Redesign com header verde e cards modernos
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { ActivityIndicator, Snackbar, Text, TextInput } from 'react-native-paper';
import { BottomSheet } from '../../components';
import { COLORS } from '../../utils/constants';
import { useSavings, useWallet, useDepositSavings, useWithdrawSavings, useRefreshOnFocus } from '../../hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAT_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24;

const SAVINGS_GOAL_KEY = '@kidscoin:savingsGoal';

// Cores do tema verde
const GREEN_THEME = {
  primary: '#7BC67E',
  light: '#E8F5E9',
  dark: '#5BA85E',
  accent: '#8FD392',
};

const SavingsScreen: React.FC = () => {
  // React Query hooks
  const {
    data: savings,
    isLoading: loadingSavings,
    refetch: refetchSavings,
  } = useSavings();

  const {
    data: wallet,
    isLoading: loadingWallet,
    refetch: refetchWallet,
  } = useWallet();

  // Atualizar dados quando a tela receber foco
  useRefreshOnFocus(refetchSavings);
  useRefreshOnFocus(refetchWallet);

  const loading = loadingSavings || loadingWallet;

  // Bottom Sheets
  const [depositSheetVisible, setDepositSheetVisible] = useState(false);
  const [withdrawSheetVisible, setWithdrawSheetVisible] = useState(false);
  const [goalSheetVisible, setGoalSheetVisible] = useState(false);

  // Valores dos formulários
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newGoal, setNewGoal] = useState('');

  // Snackbar
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'success' });

  // Meta de poupança (editável)
  const [savingsGoal, setSavingsGoal] = useState(15000000);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Mutations
  const depositSavings = useDepositSavings({
    onSuccess: (_, variables) => {
      setDepositSheetVisible(false);
      setDepositAmount('');
      showSnackbar(`${variables.amount.toLocaleString('pt-BR')} moedas depositadas!`, 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.message || 'Erro ao depositar', 'error');
    },
  });

  const withdrawSavings = useWithdrawSavings({
    onSuccess: (_, variables) => {
      const bonus = Math.round(variables.amount * (getTimeBonus() / 100));
      setWithdrawSheetVisible(false);
      setWithdrawAmount('');
      showSnackbar(
        bonus > 0
          ? `Sacado ${variables.amount.toLocaleString('pt-BR')} + ${bonus.toLocaleString('pt-BR')} de bonus!`
          : `${variables.amount.toLocaleString('pt-BR')} moedas sacadas!`,
        'success'
      );
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.message || 'Erro ao sacar', 'error');
    },
  });

  useEffect(() => {
    loadSavingsGoal();
  }, []);

  const loadSavingsGoal = async () => {
    try {
      const storedGoal = await AsyncStorage.getItem(SAVINGS_GOAL_KEY);
      if (storedGoal) {
        setSavingsGoal(parseInt(storedGoal));
      }
    } catch (error) {
      console.error('Erro ao carregar meta de poupanca:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSavings(), refetchWallet()]);
    setRefreshing(false);
  };

  const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
    setSnackbar({ visible: true, message, type });
  };

  // Atualizar meta de poupança
  const handleUpdateGoal = async () => {
    Keyboard.dismiss();

    const goalValue = parseInt(newGoal.replace(/\D/g, ''));
    const currentBalance = savings?.balance || 0;

    if (!goalValue || goalValue <= 0) {
      showSnackbar('Digite um valor valido', 'error');
      return;
    }

    if (goalValue < currentBalance) {
      showSnackbar('A meta nao pode ser menor que o saldo atual', 'error');
      return;
    }

    try {
      await AsyncStorage.setItem(SAVINGS_GOAL_KEY, goalValue.toString());
      setSavingsGoal(goalValue);
      setGoalSheetVisible(false);
      setNewGoal('');
      showSnackbar('Meta atualizada!', 'success');
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      showSnackbar('Erro ao salvar meta', 'error');
    }
  };

  // Calcula progresso da meta (0 a 1)
  const getGoalProgress = (): number => {
    if (!savings) return 0;
    return Math.min(savings.balance / savingsGoal, 1);
  };

  // Calcula percentual da meta
  const getGoalPercentage = (): number => {
    return Math.round(getGoalProgress() * 100);
  };

  // Calcula dias guardados (dias desde o último depósito)
  const getDaysSaved = (): number => {
    if (!savings?.lastDepositAt) return 0;
    const lastDeposit = new Date(savings.lastDepositAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDeposit.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calcula bônus por tempo
  const getTimeBonus = (): number => {
    const days = getDaysSaved();
    if (days >= 30) return 10;
    if (days >= 7) return 2;
    return 0;
  };

  // Simula rendimento composto
  const simulateInterest = (weeks: number): number => {
    if (!savings) return 0;
    const weeklyRate = 0.02; // 2%
    return Math.round(savings.balance * Math.pow(1 + weeklyRate, weeks) - savings.balance);
  };

  // Depositar
  const handleDeposit = () => {
    const amount = parseInt(depositAmount.replace(/\D/g, ''));
    if (!amount || amount <= 0) {
      showSnackbar('Digite um valor valido', 'error');
      return;
    }
    if (!wallet || amount > wallet.balance) {
      showSnackbar('Saldo insuficiente na carteira', 'error');
      return;
    }

    depositSavings.mutate({ amount });
  };

  // Sacar
  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount.replace(/\D/g, ''));
    if (!amount || amount <= 0) {
      showSnackbar('Digite um valor valido', 'error');
      return;
    }
    if (!savings || amount > savings.balance) {
      showSnackbar('Saldo insuficiente na poupanca', 'error');
      return;
    }

    withdrawSavings.mutate({ amount });
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GREEN_THEME.primary} />
        <Text style={styles.loadingText}>Carregando poupanca...</Text>
      </View>
    );
  }

  const balance = savings?.balance || 0;
  const totalDeposited = savings?.totalDeposited || 0;
  const totalEarned = savings?.totalEarned || 0;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={GREEN_THEME.primary} barStyle="light-content" />

      {/* Header Verde */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minha Poupanca</Text>
        <View style={styles.balanceSection}>
          <MaterialCommunityIcons name="piggy-bank" size={80} color="#fff" style={styles.piggyIcon} />
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Saldo</Text>
            <View style={styles.balanceRow}>
              <MaterialCommunityIcons name="piggy-bank" size={28} color="#FFD54F" />
              <Text style={styles.balanceValue}>{formatNumber(balance)}</Text>
            </View>
            <Text style={styles.balanceSubtext}>moedas guardadas</Text>
          </View>
        </View>

        {/* Botões de Ação - dentro do header */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.depositButton}
            onPress={() => setDepositSheetVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-down-circle-outline" size={24} color="#fff" />
            <Text style={styles.depositButtonText}>Depositar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => setWithdrawSheetVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-up-circle-outline" size={24} color="#333" />
            <Text style={styles.withdrawButtonText}>Sacar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >

        {/* Cards de Estatísticas */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="arrow-down-circle-outline" size={32} color="#333" />
            <Text style={styles.statValue}>{formatNumber(totalDeposited)}</Text>
            <Text style={styles.statLabel}>Depositado</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="shimmer" size={32} color={GREEN_THEME.primary} />
            <Text style={[styles.statValue, styles.statValueGreen]}>{formatNumber(totalEarned)}</Text>
            <Text style={styles.statLabel}>Rendeu!</Text>
          </View>
        </View>

        {/* Card de Meta de Poupança */}
        <TouchableOpacity
          style={styles.goalCard}
          onPress={() => {
            setNewGoal(savingsGoal.toString());
            setGoalSheetVisible(true);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.goalHeader}>
            <MaterialCommunityIcons name="target" size={24} color={COLORS.child.primary} />
            <Text style={styles.goalTitle}>Meta de Poupanca</Text>
          </View>
          <View style={styles.goalProgressRow}>
            <Text style={styles.goalProgressLabel}>Progresso</Text>
            <Text style={styles.goalPercentage}>{getGoalPercentage()}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${getGoalPercentage()}%` }]} />
            <View style={[styles.pigIndicator, { left: `${Math.min(getGoalPercentage(), 95)}%` }]}>
              <Text style={styles.pigEmoji}>🐷</Text>
            </View>
          </View>
          <Text style={styles.goalText}>
            {formatNumber(balance)} / {formatNumber(savingsGoal)} moedas
          </Text>
        </TouchableOpacity>

        {/* Card Quanto vai render */}
        <View style={styles.projectionCard}>
          <View style={styles.projectionHeader}>
            <MaterialCommunityIcons name="calculator-variant" size={24} color={GREEN_THEME.primary} />
            <Text style={styles.projectionTitle}>Quanto vai render?</Text>
          </View>
          <Text style={styles.projectionSubtitle}>
            Sua poupanca rende <Text style={styles.projectionHighlight}>2%</Text> toda semana!
          </Text>
          <View style={styles.projectionList}>
            <View style={styles.projectionItem}>
              <View style={styles.projectionLeft}>
                <MaterialCommunityIcons name="calendar-week" size={20} color="#666" />
                <Text style={styles.projectionPeriod}>1 semana</Text>
              </View>
              <Text style={styles.projectionValue}>+{formatNumber(simulateInterest(1))}</Text>
            </View>
            <View style={styles.projectionItem}>
              <View style={styles.projectionLeft}>
                <MaterialCommunityIcons name="calendar-month" size={20} color="#666" />
                <Text style={styles.projectionPeriod}>1 mes</Text>
              </View>
              <Text style={styles.projectionValue}>+{formatNumber(simulateInterest(4))}</Text>
            </View>
            <View style={styles.projectionItem}>
              <View style={styles.projectionLeft}>
                <MaterialCommunityIcons name="calendar-multiselect" size={20} color="#666" />
                <Text style={styles.projectionPeriod}>3 meses</Text>
              </View>
              <Text style={styles.projectionValue}>+{formatNumber(simulateInterest(12))}</Text>
            </View>
          </View>
        </View>

        {/* Card Bônus por Tempo */}
        <View style={styles.bonusCard}>
          <View style={styles.bonusHeader}>
            <MaterialCommunityIcons name="clock-outline" size={24} color={GREEN_THEME.primary} />
            <Text style={styles.bonusTitle}>Bonus por Tempo</Text>
          </View>
          <Text style={styles.bonusSubtitle}>
            Quanto mais tempo guardar, maior o bonus! 🎁
          </Text>
          <View style={styles.bonusCardsRow}>
            <View style={[styles.bonusMilestone, getDaysSaved() >= 7 && styles.bonusMilestoneActive]}>
              <MaterialCommunityIcons name="bullseye-arrow" size={28} color={GREEN_THEME.primary} />
              <Text style={styles.bonusDays}>7 dias</Text>
              <Text style={styles.bonusPercent}>+2%</Text>
            </View>
            <View style={[styles.bonusMilestone, getDaysSaved() >= 30 && styles.bonusMilestoneActive]}>
              <MaterialCommunityIcons name="bullseye-arrow" size={28} color={GREEN_THEME.primary} />
              <Text style={styles.bonusDays}>30 dias</Text>
              <Text style={styles.bonusPercent}>+10%</Text>
            </View>
          </View>
          <View style={styles.currentBonusCard}>
            <MaterialCommunityIcons name="timer-sand" size={24} color="#666" />
            <View style={styles.currentBonusInfo}>
              <Text style={styles.currentBonusDays}>{getDaysSaved()} dia{getDaysSaved() !== 1 ? 's' : ''} guardados</Text>
              <Text style={styles.currentBonusPercent}>
                Bonus atual: <Text style={styles.currentBonusValue}>{getTimeBonus()}%</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Sheet - Depositar */}
      <BottomSheet
        visible={depositSheetVisible}
        onClose={() => {
          setDepositSheetVisible(false);
          setDepositAmount('');
        }}
        title="Depositar na Poupanca"
        height={0.5}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetLabel}>Saldo disponivel na carteira</Text>
          <Text style={styles.sheetBalance}>{formatNumber(wallet?.balance || 0)} moedas</Text>

          <TextInput
            label="Valor a depositar"
            value={depositAmount}
            onChangeText={setDepositAmount}
            keyboardType="number-pad"
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.common.border}
            activeOutlineColor={GREEN_THEME.primary}
            left={<TextInput.Icon icon="hand-coin" />}
          />

          <TouchableOpacity
            style={[styles.sheetButton, styles.depositSheetButton]}
            onPress={handleDeposit}
            disabled={depositSavings.isPending}
            activeOpacity={0.8}
          >
            {depositSavings.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="arrow-down-circle" size={24} color="#fff" />
                <Text style={styles.sheetButtonText}>Depositar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Bottom Sheet - Sacar */}
      <BottomSheet
        visible={withdrawSheetVisible}
        onClose={() => {
          setWithdrawSheetVisible(false);
          setWithdrawAmount('');
        }}
        title="Sacar da Poupanca"
        height={0.55}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetLabel}>Saldo na poupanca</Text>
          <Text style={styles.sheetBalance}>{formatNumber(balance)} moedas</Text>

          {getTimeBonus() > 0 && (
            <View style={styles.bonusBadge}>
              <MaterialCommunityIcons name="gift" size={20} color={GREEN_THEME.primary} />
              <Text style={styles.bonusBadgeText}>Voce vai receber +{getTimeBonus()}% de bonus!</Text>
            </View>
          )}

          <TextInput
            label="Valor a sacar"
            value={withdrawAmount}
            onChangeText={setWithdrawAmount}
            keyboardType="number-pad"
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.common.border}
            activeOutlineColor="#FFC107"
            left={<TextInput.Icon icon="hand-coin" />}
          />

          {withdrawAmount && parseInt(withdrawAmount.replace(/\D/g, '')) > 0 && (
            <Text style={styles.withdrawPreview}>
              Voce recebera: {formatNumber(
                parseInt(withdrawAmount.replace(/\D/g, '')) +
                Math.round(parseInt(withdrawAmount.replace(/\D/g, '')) * (getTimeBonus() / 100))
              )} moedas
            </Text>
          )}

          <TouchableOpacity
            style={[styles.sheetButton, styles.withdrawSheetButton]}
            onPress={handleWithdraw}
            disabled={withdrawSavings.isPending}
            activeOpacity={0.8}
          >
            {withdrawSavings.isPending ? (
              <ActivityIndicator size="small" color="#333" />
            ) : (
              <>
                <MaterialCommunityIcons name="arrow-up-circle" size={24} color="#333" />
                <Text style={[styles.sheetButtonText, styles.withdrawSheetButtonText]}>Sacar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Bottom Sheet - Editar Meta */}
      <BottomSheet
        visible={goalSheetVisible}
        onClose={() => {
          setGoalSheetVisible(false);
          setNewGoal('');
        }}
        title="Editar Meta de Poupanca"
        height={0.5}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetLabel}>Meta atual</Text>
          <Text style={styles.sheetBalance}>{formatNumber(savingsGoal)} moedas</Text>

          <View style={styles.warningBox}>
            <MaterialCommunityIcons name="information" size={20} color="#FF9800" />
            <Text style={styles.warningText}>
              A nova meta deve ser maior ou igual ao saldo atual ({formatNumber(balance)} moedas)
            </Text>
          </View>

          <TextInput
            label="Nova meta"
            value={newGoal}
            onChangeText={setNewGoal}
            keyboardType="number-pad"
            mode="outlined"
            style={styles.input}
            outlineColor={COLORS.common.border}
            activeOutlineColor={COLORS.child.primary}
            left={<TextInput.Icon icon="target" />}
          />

          <TouchableOpacity
            style={[styles.sheetButton, styles.goalSheetButton]}
            onPress={handleUpdateGoal}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="check" size={24} color="#fff" />
            <Text style={styles.sheetButtonText}>Salvar Meta</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Snackbar */}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={{
          backgroundColor: snackbar.type === 'success' ? GREEN_THEME.primary : '#f44336',
        }}
      >
        {snackbar.message}
      </Snackbar>
    </View>
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
    color: '#666',
  },

  // Header
  header: {
    backgroundColor: GREEN_THEME.primary,
    paddingTop: STATUS_BAR_HEIGHT + 16,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  balanceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  piggyIcon: {
    marginRight: 16,
    opacity: 0.9,
  },
  balanceInfo: {
    alignItems: 'flex-start',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 32,
  },

  // Action Buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: -24,
    zIndex: 10,
  },
  depositButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN_THEME.dark,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  depositButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  withdrawButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC107',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  // Stats Cards
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: STAT_CARD_WIDTH,
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
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statValueGreen: {
    color: GREEN_THEME.primary,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  // Goal Card
  goalCard: {
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
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.common.text,
  },
  goalProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalProgressLabel: {
    fontSize: 14,
    color: '#666',
  },
  goalPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.common.text,
  },
  progressBarContainer: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    position: 'relative',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.child.primary,
    borderRadius: 10,
  },
  pigIndicator: {
    position: 'absolute',
    top: -2,
    transform: [{ translateX: -12 }],
  },
  pigEmoji: {
    fontSize: 24,
  },
  goalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  // Projection Card
  projectionCard: {
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
  projectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  projectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.common.text,
  },
  projectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  projectionHighlight: {
    color: GREEN_THEME.primary,
    fontWeight: '700',
  },
  projectionList: {
    gap: 8,
  },
  projectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: GREEN_THEME.light,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  projectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectionPeriod: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  projectionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREEN_THEME.primary,
  },

  // Bonus Card
  bonusCard: {
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
  bonusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bonusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.common.text,
  },
  bonusSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  bonusCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  bonusMilestone: {
    flex: 1,
    backgroundColor: GREEN_THEME.light,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  bonusMilestoneActive: {
    borderWidth: 2,
    borderColor: GREEN_THEME.dark,
  },
  bonusDays: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  bonusPercent: {
    fontSize: 14,
    color: GREEN_THEME.dark,
    fontWeight: '600',
    marginTop: 4,
  },
  currentBonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  currentBonusInfo: {
    flex: 1,
  },
  currentBonusDays: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  currentBonusPercent: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  currentBonusValue: {
    color: GREEN_THEME.primary,
    fontWeight: '700',
  },

  // Bottom Sheet Content
  sheetContent: {
    gap: 16,
  },
  sheetLabel: {
    fontSize: 14,
    color: '#666',
  },
  sheetBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GREEN_THEME.primary,
    marginTop: -8,
  },
  input: {
    backgroundColor: '#fff',
  },
  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  depositSheetButton: {
    backgroundColor: GREEN_THEME.primary,
  },
  withdrawSheetButton: {
    backgroundColor: '#FFC107',
  },
  goalSheetButton: {
    backgroundColor: COLORS.child.primary,
  },
  sheetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  withdrawSheetButtonText: {
    color: '#333',
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: GREEN_THEME.light,
    borderRadius: 8,
    gap: 8,
  },
  bonusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN_THEME.dark,
    flex: 1,
  },
  withdrawPreview: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
    flex: 1,
    lineHeight: 18,
  },

  bottomSpacer: {
    height: 20,
  },
});

export default SavingsScreen;
