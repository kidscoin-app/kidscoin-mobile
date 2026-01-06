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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Image
          source={require('../../../assets/logo-porco.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>Bem-vindo de volta!</Text>
        <Text style={styles.subtitle}>Quem esta usando o app?</Text>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ParentLogin')}
          activeOpacity={0.8}
        >
          <Surface style={styles.card} elevation={3}>
            <View style={[styles.iconContainer, { backgroundColor: COLORS.parent.primary + '20' }]}>
              <MaterialCommunityIcons name="account-tie" size={40} color={COLORS.parent.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Sou Pai/Mae</Text>
              <Text style={styles.cardDescription}>
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
          <Surface style={styles.card} elevation={3}>
            <View style={[styles.iconContainer, { backgroundColor: COLORS.child.primary + '20' }]}>
              <MaterialCommunityIcons name="human-child" size={40} color={COLORS.child.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Sou Crianca</Text>
              <Text style={styles.cardDescription}>
                Ver minhas tarefas e recompensas
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.common.textLight} />
          </Surface>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Nao tem conta? </Text>
        <Text
          style={styles.footerLink}
          onPress={() => navigation.navigate('Register')}
        >
          Cadastre-se
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.common.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: COLORS.child.primary,
    padding: 20,
    paddingTop: 80,
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.common.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.common.white,
    opacity: 0.9,
  },
  cardsContainer: {
    padding: 20,
    marginTop: -30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.common.white,
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.common.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.common.textLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  footerText: {
    color: COLORS.common.textLight,
    fontSize: 16,
  },
  footerLink: {
    color: COLORS.parent.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LoginScreen;
