/**
 * Tela de Login dos Pais
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Snackbar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts';
import { COLORS } from '../../utils/constants';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type ParentLoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'ParentLogin'
>;

const ParentLoginScreen: React.FC = () => {
  const navigation = useNavigation<ParentLoginScreenNavigationProp>();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn({ emailOrUsername: email, password });
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.common.white} />
          </TouchableOpacity>

          <Image
            source={require('../../../assets/logo-white.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.headerSubtitle}>Acesso para Pais</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Olá, Pai/Mae!</Text>
          <Text style={styles.cardSubtitle}>Digite seu email e senha</Text>

          <TextInput
            value={email}
            onChangeText={(text) => setEmail(text.toLowerCase())}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
            outlineColor={COLORS.common.border}
            activeOutlineColor={COLORS.parent.primary}
            outlineStyle={styles.inputOutline}
            placeholder="Email"
            placeholderTextColor={COLORS.common.textMuted}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            outlineColor={COLORS.common.border}
            activeOutlineColor={COLORS.parent.primary}
            outlineStyle={styles.inputOutline}
            placeholder="Senha"
            placeholderTextColor={COLORS.common.textMuted}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor={COLORS.parent.primary}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Entrar
          </Button>

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

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.parent.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: COLORS.parent.primary,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 8,
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
    paddingHorizontal: 30,
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
  input: {
    backgroundColor: COLORS.common.white,
    marginBottom: 16,
  },
  inputOutline: {
    borderRadius: 25,
  },
  button: {
    borderRadius: 25,
    marginTop: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
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

export default ParentLoginScreen;
