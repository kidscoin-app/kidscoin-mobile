/**
 * Navegador principal da aplicação
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts';
import AuthNavigator from './AuthNavigator';
import ParentNavigator from './ParentNavigator';
import ChildNavigator from './ChildNavigator';
import { COLORS } from '../utils/constants';

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.child.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : user.role === 'PARENT' ? (
        <ParentNavigator />
      ) : (
        <ChildNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
