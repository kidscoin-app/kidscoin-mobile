/**
 * Tela de Login
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  Snackbar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
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
          <Image
            source={require('../../../assets/logo-porco.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Ola, Pai/Mae!</Text>
          <Text style={styles.subtitle}>Digite seu email e senha para entrar</Text>
        </View>

        <Surface style={styles.card} elevation={2}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            label="Senha"
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
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor={COLORS.parent.primary}
          >
            Entrar
          </Button>

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Não tem conta? </Text>
            <Text
              style={styles.link}
              onPress={() => navigation.navigate('Register')}
            >
              Cadastre-se
            </Text>
          </View>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            textColor={COLORS.common.textLight}
          >
            Voltar
          </Button>
        </Surface>
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
    backgroundColor: COLORS.parent.background,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#fff'
  },
  header: {
    backgroundColor: COLORS.parent.primary,
    padding: 20,
    paddingTop: 80,
    paddingBottom: 50,
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
  },
  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: COLORS.common.white,
    marginTop: -30,
    marginHorizontal: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  linkText: {
    color: COLORS.common.textLight,
  },
  link: {
    color: COLORS.parent.primary,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 10,
  },
});

export default ParentLoginScreen;
