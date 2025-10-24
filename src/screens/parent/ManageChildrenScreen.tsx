import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS } from '../../utils/constants';

const ManageChildrenScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Tela Gerenciar Crianças</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.parent.background,
    padding: 20,
  },
});

export default ManageChildrenScreen;
