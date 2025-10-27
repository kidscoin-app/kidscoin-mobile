import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ProgressBar, Avatar, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts';
import { COLORS } from '../../utils/constants';
import { gamificationService, walletService } from '../../services';
import { Gamification, Wallet } from '../../types';

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gamification, setGamification] = useState<Gamification | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [gamificationData, walletData] = await Promise.all([
        gamificationService.getGamification(),
        walletService.getWallet(),
      ]);
      setGamification(gamificationData);
      setWallet(walletData);
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para pegar as iniciais do nome
  const getInitials = (name: string): string => {
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  // Função para calcular progresso do XP (0 a 1)
  const getXpProgress = (): number => {
    if (!gamification) return 0;
    return gamification.currentXp / gamification.xpForNextLevel;
  };

  // Função para pegar badges desbloqueadas
  const getUnlockedBadges = (): number => {
    if (!gamification) return 0;
    return gamification.badges.filter(b => b.unlocked).length;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.child.primary} />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Cabeçalho com Avatar */}
      <View style={styles.header}>
        <Avatar.Text
          size={100}
          label={user?.fullName ? getInitials(user.fullName) : '??'}
          style={styles.avatar}
          labelStyle={styles.avatarLabel}
        />
        <Text style={styles.userName}>{user?.fullName || 'Sem nome'}</Text>
        <Text style={styles.userEmail}>@{user?.username || 'sem-usuario'}</Text>
      </View>

      {/* Card de Nível e XP */}
      {gamification && (
        <Card style={styles.levelCard}>
          <Card.Content>
            <View style={styles.levelHeader}>
              <MaterialCommunityIcons name="trophy" size={32} color="#FFD700" />
              <Text style={styles.levelTitle}>Nível {gamification.currentLevel}</Text>
            </View>
            <Text style={styles.xpText}>
              {gamification.currentXp} / {gamification.xpForNextLevel} XP
            </Text>
            <ProgressBar
              progress={getXpProgress()}
              color="#4CAF50"
              style={styles.progressBar}
            />
            <Text style={styles.xpNeeded}>
              Faltam {gamification.xpNeededForNextLevel} XP para o próximo nível! 🚀
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Estatísticas em Grid */}
      <View style={styles.statsGrid}>
        {/* Saldo Atual */}
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="currency-usd" size={32} color="#4CAF50" />
            <Text style={styles.statValue}>{wallet?.balance || 0}</Text>
            <Text style={styles.statLabel}>Moedas</Text>
          </Card.Content>
        </Card>

        {/* Total Ganho */}
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="cash-plus" size={32} color="#2196F3" />
            <Text style={styles.statValue}>{wallet?.totalEarned || 0}</Text>
            <Text style={styles.statLabel}>Total Ganho</Text>
          </Card.Content>
        </Card>

        {/* Total Gasto */}
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="cart" size={32} color="#FF9800" />
            <Text style={styles.statValue}>{wallet?.totalSpent || 0}</Text>
            <Text style={styles.statLabel}>Total Gasto</Text>
          </Card.Content>
        </Card>

        {/* Badges */}
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="medal" size={32} color="#9C27B0" />
            <Text style={styles.statValue}>{getUnlockedBadges()}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Seção de Badges */}
      {gamification && (
        <Card style={styles.badgesCard}>
          <Card.Content>
            <Text style={styles.badgesTitle}>🏆 Minhas Conquistas</Text>
            {gamification.badges.length > 0 ? (
              <View style={styles.badgesGrid}>
                {gamification.badges.map((badge) => (
                  <View
                    key={badge.id}
                    style={[
                      styles.badgeItem,
                      !badge.unlocked && styles.badgeItemLocked,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={badge.iconName as any}
                      size={40}
                      color={badge.unlocked ? '#FFD700' : '#CCCCCC'}
                    />
                    <Text
                      style={[
                        styles.badgeName,
                        !badge.unlocked && styles.badgeNameLocked,
                      ]}
                      numberOfLines={2}
                    >
                      {badge.name}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBadges}>
                <MaterialCommunityIcons name="trophy-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyBadgesText}>
                  Nenhuma conquista ainda!
                </Text>
                <Text style={styles.emptyBadgesHint}>
                  Complete tarefas e junte moedas para desbloquear badges incríveis! 🚀
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Botão de Logout */}
      <Button
        mode="contained"
        onPress={signOut}
        style={styles.logoutButton}
        buttonColor="#f44336"
        icon="logout"
      >
        Sair da Conta
      </Button>

      {/* Espaçamento final */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.child.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.child.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.child.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#FF6B6B',
    marginBottom: 12,
  },
  avatarLabel: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  levelCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    elevation: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  xpText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  xpNeeded: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    backgroundColor: '#fff',
    elevation: 3,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  badgesCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    elevation: 4,
  },
  badgesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFF9C4',
  },
  badgeItemLocked: {
    backgroundColor: '#F5F5F5',
  },
  badgeName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
  badgeNameLocked: {
    color: '#999',
  },
  emptyBadges: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyBadgesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyBadgesHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 6,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default ProfileScreen;
