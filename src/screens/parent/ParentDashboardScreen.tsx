/**
 * Dashboard do Pai
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useAuth } from '../../contexts';
import { COLORS } from '../../utils/constants';

const ParentDashboardScreen: React.FC = () => {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Olá, {user?.fullName}! 👋</Text>
        <Text style={styles.subtitle}>Dashboard do Pai em construção...</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.parent.background,
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
  },
});

export default ParentDashboardScreen;
