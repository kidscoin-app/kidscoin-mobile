import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuth } from '../../contexts';
import { COLORS } from '../../utils/constants';

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text>Tela Perfil</Text>
      <Text>Usuário: {user?.fullName}</Text>
      <Button mode="contained" onPress={signOut} style={styles.button}>
        Sair
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.child.background,
    padding: 20,
  },
  button: {
    marginTop: 20,
  },
});

export default ProfileScreen;
