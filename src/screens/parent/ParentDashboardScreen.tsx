/**
 * Dashboard do Pai
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts';
import { COLORS } from '../../utils/constants';
import { userService, taskService, rewardService } from '../../services';
import { User, TaskAssignment, Reward } from '../../types';
import { useNavigation } from '@react-navigation/native';

const ParentDashboardScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<User[]>([]);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [childrenData, tasksData, rewardsData] = await Promise.all([
        userService.getChildren(),
        taskService.getTasks(),
        rewardService.getRewards(),
      ]);
      setChildren(childrenData);
      setTasks(tasksData);
      setRewards(rewardsData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Contar tarefas aguardando aprovação
  const getPendingApprovalCount = (): number => {
    return tasks.filter(t => t.status === 'COMPLETED').length;
  };

  // Contar tarefas por status
  const getTasksCountByStatus = (status: string): number => {
    return tasks.filter(t => t.status === status).length;
  };

  // Obter tarefas por criança
  const getTasksByChild = (childId: string) => {
    return tasks.filter(t => t.childId === childId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.parent.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const pendingApprovalCount = getPendingApprovalCount();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {user?.fullName}! 👋</Text>
        <Text style={styles.subtitle}>Painel de Controle da Família</Text>
      </View>

      {/* Alerta de tarefas aguardando aprovação */}
      {pendingApprovalCount > 0 && (
        <Card style={styles.alertCard}>
          <Card.Content style={styles.alertContent}>
            <View style={styles.alertIconContainer}>
              <MaterialCommunityIcons name="alert-circle" size={32} color="#fff" />
            </View>
            <View style={styles.alertTextContainer}>
              <Text style={styles.alertTitle}>Ação Necessária!</Text>
              <Text style={styles.alertMessage}>
                {pendingApprovalCount} tarefa{pendingApprovalCount > 1 ? 's' : ''} aguardando aprovação
              </Text>
            </View>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => navigation.navigate('Tasks' as never)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.parent.primary} />
            </TouchableOpacity>
          </Card.Content>
        </Card>
      )}

      {/* Cards de Estatísticas */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8EAF6' }]}>
              <MaterialCommunityIcons name="account-group" size={28} color={COLORS.parent.primary} />
            </View>
            <Text style={styles.statValue}>{children.length}</Text>
            <Text style={styles.statLabel}>Crianças</Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.parent.primary }]}
              onPress={() => navigation.navigate('Children' as never)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cog" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Gerenciar</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="clipboard-list" size={28} color="#4CAF50" />
            </View>
            <Text style={styles.statValue}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Tarefas</Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => navigation.navigate('Tasks' as never)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Criar</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
              <MaterialCommunityIcons name="gift" size={28} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>{rewards.length}</Text>
            <Text style={styles.statLabel}>Recompensas</Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => navigation.navigate('Rewards' as never)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Criar</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#F1F8E9' }]}>
              <MaterialCommunityIcons name="check-circle" size={28} color="#8BC34A" />
            </View>
            <Text style={styles.statValue}>{getTasksCountByStatus('APPROVED')}</Text>
            <Text style={styles.statLabel}>Aprovadas</Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#8BC34A' }]}
              onPress={() => navigation.navigate('Tasks' as never, { scrollToAssigned: true } as never)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="eye" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Ver todas</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </View>

      {/* Resumo por Criança */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeaderWithButton}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-multiple" size={24} color={COLORS.parent.primary} />
              <Text style={styles.cardTitle}>Resumo por Criança</Text>
            </View>
            {children.length > 0 && (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => navigation.navigate('Children' as never)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="cog" size={16} color="#fff" />
                <Text style={styles.headerActionButtonText}>Gerenciar</Text>
              </TouchableOpacity>
            )}
          </View>

          {children.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle]}>
                <MaterialCommunityIcons name="account-plus" size={48} color={COLORS.parent.primary} />
              </View>
              <Text style={styles.emptyText}>Nenhuma criança cadastrada</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Children' as never)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                <Text style={styles.emptyButtonText}>Cadastrar Criança</Text>
              </TouchableOpacity>
            </View>
          ) : (
            children.map((child) => {
              const childTasks = getTasksByChild(child.id);
              const pending = childTasks.filter(t => t.status === 'PENDING').length;
              const completed = childTasks.filter(t => t.status === 'COMPLETED').length;
              const approved = childTasks.filter(t => t.status === 'APPROVED').length;

              return (
                <View key={child.id} style={styles.childItem}>
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.fullName}</Text>
                    <Text style={styles.childUsername}>@{child.username}</Text>
                  </View>
                  <View style={styles.childStats}>
                    {completed > 0 && (
                      <Chip
                        style={styles.childChip}
                        textStyle={styles.childChipText}
                        icon="clock"
                      >
                        {completed}
                      </Chip>
                    )}
                    <Chip
                      style={[styles.childChip, styles.childChipPending]}
                      textStyle={styles.childChipText}
                      icon="clipboard-text"
                    >
                      {pending}
                    </Chip>
                    <Chip
                      style={[styles.childChip, styles.childChipApproved]}
                      textStyle={styles.childChipText}
                      icon="check"
                    >
                      {approved}
                    </Chip>
                  </View>
                </View>
              );
            })
          )}
        </Card.Content>
      </Card>

      {/* Status das Tarefas */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeaderWithButton}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-donut" size={24} color={COLORS.parent.primary} />
              <Text style={styles.cardTitle}>Status das Tarefas</Text>
            </View>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => navigation.navigate('Tasks' as never, { scrollToAssigned: true } as never)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="eye" size={16} color="#fff" />
              <Text style={styles.headerActionButtonText}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.child.warning }]} />
              <Text style={styles.statusLabel}>Pendentes</Text>
              <Text style={styles.statusValue}>{getTasksCountByStatus('PENDING')}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.child.primary }]} />
              <Text style={styles.statusLabel}>Aguardando</Text>
              <Text style={styles.statusValue}>{getTasksCountByStatus('COMPLETED')}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.child.success }]} />
              <Text style={styles.statusLabel}>Aprovadas</Text>
              <Text style={styles.statusValue}>{getTasksCountByStatus('APPROVED')}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.common.error }]} />
              <Text style={styles.statusLabel}>Rejeitadas</Text>
              <Text style={styles.statusValue}>{getTasksCountByStatus('REJECTED')}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Botão de Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={signOut}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Sair da Conta</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.parent.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.parent.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: COLORS.parent.primary,
    padding: 20,
    paddingTop: 10,
    paddingBottom: 25,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  alertCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.parent.primary,
    borderRadius: 16,
    elevation: 4,
    shadowColor: COLORS.parent.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconContainer: {
    marginRight: 12,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 13,
    color: '#E3F2FD',
  },
  alertButton: {
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 16,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.common.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.common.textLight,
    marginTop: 4,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  headerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.parent.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
    shadowColor: COLORS.parent.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  headerActionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.common.text,
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8EAF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.common.textLight,
    marginTop: 16,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.parent.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
    shadowColor: COLORS.parent.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  childItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.common.text,
    marginBottom: 4,
  },
  childUsername: {
    fontSize: 13,
    color: COLORS.parent.primary,
  },
  childStats: {
    flexDirection: 'row',
    gap: 6,
  },
  childChip: {
    height: 28,
    backgroundColor: COLORS.child.primary,
  },
  childChipPending: {
    backgroundColor: COLORS.child.warning,
  },
  childChipApproved: {
    backgroundColor: COLORS.child.success,
  },
  childChipText: {
    fontSize: 12,
    color: '#fff',
    marginVertical: 0,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 11,
    color: COLORS.common.textLight,
    marginBottom: 4,
    textAlign: 'center',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.common.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 30,
  },
});

export default ParentDashboardScreen;
