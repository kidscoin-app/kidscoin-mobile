/**
 * Tela de Login da Crianca
 */
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TextInput as RNTextInput,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Snackbar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts';
import { COLORS } from '../../utils/constants';

const ChildLoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { signIn } = useAuth();

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pinRefs = [
    useRef<RNTextInput>(null),
    useRef<RNTextInput>(null),
    useRef<RNTextInput>(null),
    useRef<RNTextInput>(null),
  ];

  const handlePinChange = (value: string, index: number) => {
    const newPin = [...pin];
    newPin[index] = value.replace(/[^0-9]/g, '');
    setPin(newPin);

    // Move to next input if value entered
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyPress = (key: string, index: number) => {
    // Move to previous input on backspace if current is empty
    if (key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const handleLogin = async () => {
    const fullPin = pin.join('');

    if (!username || fullPin.length !== 4) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn({ emailOrUsername: username, password: fullPin });
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
            source={require('../../../assets/porco-feliz.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoTextImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pronto pra aventura?</Text>
          <Text style={styles.cardSubtitle}>Digite seu username e PIN</Text>

          <TextInput
            value={username}
            onChangeText={(text) => setUsername(text.toLowerCase())}
            mode="outlined"
            autoCapitalize="none"
            style={styles.usernameInput}
            left={<TextInput.Icon icon="at" />}
            outlineColor={COLORS.common.border}
            activeOutlineColor={COLORS.child.primary}
            outlineStyle={styles.inputOutline}
            placeholder="Username"
            placeholderTextColor={COLORS.common.textMuted}
          />

          <Text style={styles.pinLabel}>PIN (4 digitos)</Text>

          <View style={styles.pinContainer}>
            {pin.map((digit, index) => (
              <View key={index} style={styles.pinBox}>
                <RNTextInput
                  ref={pinRefs[index]}
                  style={styles.pinInput}
                  value={digit}
                  onChangeText={(value) => handlePinChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handlePinKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry
                  selectTextOnFocus
                />
              </View>
            ))}
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor={COLORS.child.success}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Vamos jogar!
          </Button>
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
    backgroundColor: COLORS.child.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: COLORS.child.primary,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  logoTextImage: {
    width: 140,
    height: 40,
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
  usernameInput: {
    backgroundColor: COLORS.common.white,
    marginBottom: 24,
  },
  inputOutline: {
    borderRadius: 25,
  },
  pinLabel: {
    fontSize: 14,
    color: COLORS.common.text,
    marginBottom: 12,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  pinBox: {
    width: 65,
    height: 65,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.common.border,
    backgroundColor: COLORS.common.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinInput: {
    fontSize: 24,
    textAlign: 'center',
    width: '100%',
    height: '100%',
    color: COLORS.common.text,
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
});

export default ChildLoginScreen;
