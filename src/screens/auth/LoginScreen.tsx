/**
 * Tela de Selecao de Login
 */
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type LoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Login'
>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require('../../../assets/logo-white.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.headerSubtitle}>Educação Financeira Infantil</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bem-vindo de volta!</Text>
          <Text style={styles.cardSubtitle}>Quem esta usando o app?</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('ParentLogin')}
            activeOpacity={0.8}
          >
            <Surface style={styles.optionCard} elevation={2}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.parent.primary + '20' }]}>
                <MaterialCommunityIcons name="account-tie" size={32} color={COLORS.parent.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Sou Pai/Mae</Text>
                <Text style={styles.optionDescription}>
                  Gerenciar tarefas, criancas e recompensas
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.common.textLight} />
            </Surface>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('ChildLogin')}
            activeOpacity={0.8}
          >
            <Surface style={styles.optionCard} elevation={2}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.child.primary + '20' }]}>
                <MaterialCommunityIcons name="human-child" size={32} color={COLORS.child.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Sou Crianca</Text>
                <Text style={styles.optionDescription}>
                  Ver minhas tarefas e recompensas
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.common.textLight} />
            </Surface>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta? </Text>
            <Text
              style={styles.footerLink}
              onPress={() => navigation.navigate('Register')}
            >
              Cadastre-se
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.child.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: COLORS.child.primary,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoImage: {
    width: 260,
    height: 80,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.common.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.common.white,
    opacity: 0.9,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.common.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 30,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.common.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.common.textLight,
    textAlign: 'center',
    marginBottom: 30,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.common.white,
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.common.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.common.textLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: COLORS.common.textLight,
    fontSize: 15,
  },
  footerLink: {
    color: COLORS.parent.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default LoginScreen;
