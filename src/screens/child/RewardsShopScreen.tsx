import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS } from '../../utils/constants';

const RewardsShopScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Tela Loja de Recompensas</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.child.background,
    padding: 20,
  },
});

export default RewardsShopScreen;
