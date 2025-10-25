/**
 * Dashboard da Criança
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useAuth } from '../../contexts';
import { COLORS } from '../../utils/constants';

const ChildDashboardScreen: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Olá, {user?.fullName}! 👋</Text>
        <Text style={styles.subtitle}>Dashboard da Criança em construção...</Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Minhas Informações</Text>
            <Text style={styles.infoText}>Email: {user?.email}</Text>
            <Text style={styles.infoText}>Perfil: Criança</Text>
            {user?.familyId && (
              <Text style={styles.infoText}>Família ID: {user.familyId}</Text>
            )}
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          onPress={signOut}
          style={styles.logoutButton}
          textColor={COLORS.common.error}
          icon="logout"
        >
          Sair da Conta
        </Button>
      </View>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.common.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.common.textLight,
    marginBottom: 30,
  },
  card: {
    marginBottom: 20,
    backgroundColor: COLORS.common.white,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.common.text,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.common.textLight,
    marginBottom: 8,
  },
  logoutButton: {
    marginTop: 20,
    borderColor: COLORS.common.error,
  },
});

export default ChildDashboardScreen;
