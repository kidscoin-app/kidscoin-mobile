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
  StatusBar,
  Platform,
} from 'react-native';
import { ActivityIndicator, Snackbar, Text, TextInput } from 'react-native-paper';
import { BottomSheet } from '../../components';
import { COLORS } from '../../utils/constants';
import { useSavings, useWallet, useDepositSavings, useWithdrawSavings, useRefreshOnFocus } from '../../hooks';

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
      setWithdrawSheetVisible(false);
      setWithdrawAmount('');
      showSnackbar(`${variables.amount.toLocaleString('pt-BR')} moedas sacadas!`, 'success');
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
      console.error('Erro ao carregar meta de poupança:', error);
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
      showSnackbar('A meta não pode ser menor que o saldo atual', 'error');
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
    if (!savings || amount > savings.availableBalance) {
      showSnackbar('Você não tem moedas suficientes na poupança', 'error');
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
        <Text style={styles.loadingText}>Carregando poupança...</Text>
      </View>
    );
  }

  const balance = savings?.balance || 0;
  const availableBalance = savings?.availableBalance || 0;
  const pendingInterest = savings?.pendingInterest || 0;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={GREEN_THEME.primary} barStyle="light-content" />

      {/* Header Verde */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Minha Poupança</Text>
          {/* <MaterialCommunityIcons name="piggy-bank" size={48} color="#fff" style={styles.headerIcon} /> */}
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Você tem agora</Text>
          <Text style={styles.balanceValue}>{formatNumber(availableBalance)}</Text>
          <Text style={styles.balanceSubtext}>moedas disponíveis</Text>

          {/* Detalhes do saldo */}
          <View style={styles.balanceDetails}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="wallet" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={styles.balanceDetailText}>Você guardou: {formatNumber(balance)}</Text>
            </View>
            {pendingInterest > 0 && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="trending-up" size={18} color="#FFD54F" />
                <Text style={styles.bonusText}>Bônus: +{formatNumber(pendingInterest)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Botões de Ação - dentro do header */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.depositButton}
            onPress={() => setDepositSheetVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-down-circle-outline" size={24} color={GREEN_THEME.dark} />
            <Text style={styles.depositButtonText}>Depositar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => setWithdrawSheetVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-up-circle-outline" size={24} color="#fff" />
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

        {/* Card de Rendimento */}
        <View style={styles.earningsCard}>
          {pendingInterest > 0 ? (
            <>
              <View style={styles.earningsHeader}>
                <MaterialCommunityIcons name="shimmer" size={40} color={GREEN_THEME.primary} />
                <View style={styles.earningsInfo}>
                  <Text style={styles.earningsValue}>+{formatNumber(pendingInterest)} moedas</Text>
                  <Text style={styles.earningsLabel}>cresceram sozinhas! 🌱</Text>
                </View>
              </View>
              <Text style={styles.earningsExplanation}>
                Das suas {formatNumber(availableBalance)} moedas, {formatNumber(pendingInterest)} foram de bônus que sua poupança gerou!
              </Text>
            </>
          ) : (
            <>
              <View style={styles.earningsHeader}>
                <MaterialCommunityIcons name="sprout" size={40} color="#999" />
                <View style={styles.earningsInfo}>
                  <Text style={styles.earningsValueEmpty}>Ainda sem bônus</Text>
                  <Text style={styles.earningsLabelEmpty}>Sua poupança esta crescendo! 🌱</Text>
                </View>
              </View>
              <Text style={styles.earningsExplanation}>
                Continue guardando suas moedas e logo elas vão comecar a crescer sozinhas!
              </Text>
            </>
          )}
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
            <Text style={styles.goalTitle}>Meta de Poupança</Text>
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
            <Text style={styles.projectionTitle}>Quanto vai crescer?</Text>
          </View>
          <Text style={styles.projectionSubtitle}>
            Suas moedas crescem <Text style={styles.projectionHighlight}>TODOS OS DIAS</Text>! E quanto mais tempo guardadas, mais rendem! 📈
          </Text>
          <View style={styles.projectionList}>
            <View style={styles.projectionItem}>
              <View style={styles.projectionLeft}>
                <MaterialCommunityIcons name="calendar-week" size={20} color="#666" />
                <Text style={styles.projectionPeriod}>1 semana</Text>
              </View>
              <Text style={styles.projectionValue}>≈ +3%</Text>
            </View>
            <View style={styles.projectionItem}>
              <View style={styles.projectionLeft}>
                <MaterialCommunityIcons name="calendar-month" size={20} color="#666" />
                <Text style={styles.projectionPeriod}>1 mês</Text>
              </View>
              <Text style={styles.projectionValue}>≈ +14%</Text>
            </View>
            <View style={styles.projectionItem}>
              <View style={styles.projectionLeft}>
                <MaterialCommunityIcons name="calendar-multiselect" size={20} color="#666" />
                <Text style={styles.projectionPeriod}>3 meses</Text>
              </View>
              <Text style={styles.projectionValue}>≈ +46%</Text>
            </View>
          </View>
        </View>

        {/* Card Como Funciona */}
        <View style={styles.bonusCard}>
          <View style={styles.bonusHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={GREEN_THEME.primary} />
            <Text style={styles.bonusTitle}>Como sua poupança cresce?</Text>
          </View>

          {/* Rendimento Diário */}
          <View style={styles.howItWorksItem}>
            <View style={styles.howItWorksIcon}>
              <MaterialCommunityIcons name="calendar-today" size={20} color={GREEN_THEME.primary} />
            </View>
            <View style={styles.howItWorksText}>
              <Text style={styles.howItWorksTitle}>Todos os dias! 🌟</Text>
              <Text style={styles.howItWorksDescription}>
                Suas moedas crescem um pouquinho TODO DIA automaticamente!
              </Text>
            </View>
          </View>

          {/* Sistema Progressivo */}
          <View style={styles.howItWorksItem}>
            <View style={styles.howItWorksIcon}>
              <MaterialCommunityIcons name="trending-up" size={20} color="#FF9800" />
            </View>
            <View style={styles.howItWorksText}>
              <Text style={styles.howItWorksTitle}>Quanto mais tempo, mais rende! 📈</Text>
              <Text style={styles.howItWorksDescription}>
                Primeiros 6 dias: Rende menos{'\n'}
                Depois de 1 semana: Rende mais!{'\n'}
                Depois de 1 mês: Rende ainda mais!!{'\n'}
                Depois de 3 meses: Rende MUITO MAIS!!!
              </Text>
            </View>
          </View>

          {/* Explicação Simples */}
          <View style={styles.magicCard}>
            <Text style={styles.magicEmoji}>✨</Text>
            <Text style={styles.magicText}>
              E o melhor: você não precisa fazer NADA! Suas moedas crescem sozinhas enquanto você dorme! 😴
            </Text>
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
        title="Depositar na Poupança"
        height={0.5}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetLabel}>Saldo disponível na carteira</Text>
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
        title="Sacar da Poupança"
        height={0.55}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetLabel}>Você pode sacar</Text>
          <Text style={styles.sheetBalance}>{formatNumber(availableBalance)} moedas</Text>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color={GREEN_THEME.primary} />
            <Text style={styles.infoText}>
              Esse valor já inclui os juros que suas moedas renderam! 💰
            </Text>
          </View>

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
        title="Editar Meta de Poupança"
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerIcon: {
    opacity: 0.95,
  },
  balanceSection: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
    textAlign: 'center',
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  balanceSubtext: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    textAlign: 'center',
  },
  balanceDetails: {
    marginTop: 16,
    gap: 8,
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  balanceDetailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
  },
  bonusText: {
    fontSize: 14,
    color: '#FFD54F',
    fontWeight: '700',
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
    backgroundColor: '#fff',
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
    color: GREEN_THEME.dark,
  },
  withdrawButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
    gap: 8,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Earnings Card
  earningsCard: {
    backgroundColor: GREEN_THEME.light,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: GREEN_THEME.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  earningsInfo: {
    flex: 1,
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GREEN_THEME.primary,
  },
  earningsLabel: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
  earningsValueEmpty: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#999',
  },
  earningsLabelEmpty: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  earningsExplanation: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
    top: -8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -14 }],
  },
  pigEmoji: {
    fontSize: 24,
    textAlign: 'center',
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
  howItWorksItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  howItWorksIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN_THEME.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howItWorksText: {
    flex: 1,
  },
  howItWorksTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  howItWorksDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  magicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
    borderWidth: 2,
    borderColor: '#FFE082',
  },
  magicEmoji: {
    fontSize: 32,
  },
  magicText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: GREEN_THEME.light,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
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
