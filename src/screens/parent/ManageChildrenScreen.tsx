/**
 * Tela para gerenciar criancas
 * Migrado para React Query
 */
import React, { useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native';
import {
  Button,
  Dialog,
  Portal,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useChildren, useCreateChild, useDeleteChild } from '../../hooks';
import { getErrorMessage } from '../../services';
import { User } from '../../types';
import { COLORS } from '../../utils/constants';
import { BottomSheet } from '../../components';

// Funcao para calcular XP necessario para proximo nivel
const getXpForNextLevel = (level: number): number => {
  return level * 500; // Exemplo: Lv1 = 500, Lv2 = 1000, etc.
};

const ManageChildrenScreen: React.FC = () => {
  // Bottom Sheets
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [selectedChild, setSelectedChild] = useState<User | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);

  const pinRefs = [
    useRef<RNTextInput>(null),
    useRef<RNTextInput>(null),
    useRef<RNTextInput>(null),
    useRef<RNTextInput>(null),
  ];

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog state
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deletingChild, setDeletingChild] = useState<User | null>(null);

  // React Query hooks
  const { data: children = [], isLoading: loadingChildren } = useChildren();

  const createChild = useCreateChild({
    onSuccess: (newChild) => {
      setSuccess(`${newChild.fullName} foi criado(a)!`);
      resetForm();
      setShowAddSheet(false);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const deleteChild = useDeleteChild({
    onSuccess: () => {
      setSuccess(`${deletingChild?.fullName} foi excluido(a) com sucesso.`);
      setDeleteDialogVisible(false);
      setDeletingChild(null);
      setShowDetailsSheet(false);
      setSelectedChild(null);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  /**
   * Resetar formulario
   */
  const resetForm = () => {
    setFullName('');
    setUsername('');
    setAge('');
    setPin(['', '', '', '']);
  };

  /**
   * Lidar com mudanca no PIN
   */
  const handlePinChange = (value: string, index: number) => {
    const newPin = [...pin];
    newPin[index] = value.replace(/[^0-9]/g, '');
    setPin(newPin);

    // Mover para proximo input
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  /**
   * Lidar com backspace no PIN
   */
  const handlePinKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  /**
   * Validar formulario
   */
  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      setError('Preencha o nome da crianca');
      return false;
    }

    if (!username.trim()) {
      setError('Preencha o username');
      return false;
    }

    if (username.length < 3) {
      setError('Username deve ter pelo menos 3 caracteres');
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username pode conter apenas letras, numeros, - e _');
      return false;
    }

    if (!age.trim()) {
      setError('Preencha a idade');
      return false;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1) {
      setError('Idade invalida');
      return false;
    }

    const fullPin = pin.join('');
    if (fullPin.length !== 4) {
      setError('O PIN deve ter 4 digitos');
      return false;
    }

    return true;
  };

  /**
   * Criar nova crianca
   */
  const handleCreateChild = () => {
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    createChild.mutate({
      fullName: fullName.trim(),
      username: username.trim(),
      age: parseInt(age),
      pin: pin.join(''),
    });
  };

  /**
   * Abrir detalhes da crianca
   */
  const openChildDetails = (child: User) => {
    setSelectedChild(child);
    setShowDetailsSheet(true);
  };

  /**
   * Abrir dialog de exclusao
   */
  const openDeleteDialog = (child: User) => {
    setDeletingChild(child);
    setDeleteDialogVisible(true);
    setShowDetailsSheet(false); // Fechar BottomSheet para evitar problema de z-index
  };

  /**
   * Deletar crianca
   */
  const handleDeleteChild = () => {
    if (!deletingChild) {
      return;
    }
    deleteChild.mutate(deletingChild.id);
  };

  /**
   * Obter inicial do nome
   */
  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  /**
   * Obter username para exibicao
   */
  const getDisplayUsername = (child: User): string => {
    if (child.username) {
      return child.username;
    }
    if (child.email) {
      return child.email.split('@')[0];
    }
    return 'sem-username';
  };

  return (
    <View style={styles.container}>
      {/* Lista de Criancas */}
      <ScrollView style={styles.childList} contentContainerStyle={styles.childListContent}>
        <Text style={styles.sectionTitle}>Perfis</Text>

        {loadingChildren ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Carregando...</Text>
          </View>
        ) : children.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={48}
              color={COLORS.common.textLight}
            />
            <Text style={styles.emptyText}>Nenhuma criança cadastrada ainda</Text>
          </View>
        ) : (
          children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={styles.childCard}
              onPress={() => openChildDetails(child)}
              activeOpacity={0.7}
            >
              <View style={styles.childCardContent}>
                {/* Avatar */}
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{getInitial(child.fullName)}</Text>
                </View>

                {/* Info */}
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.fullName}</Text>
                  <Text style={styles.childUsername}>@{getDisplayUsername(child)}</Text>
                  <View style={styles.childStats}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="hand-coin" size={14} color="#FFC107" />
                      <Text style={styles.statText}>{child.coinBalance ?? 0}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
                      <Text style={styles.statText}>{child.xpTotal ?? 0} XP</Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="trophy" size={14} color="#FFC107" />
                      <Text style={styles.statText}>Lv. {child.level ?? 1}</Text>
                    </View>
                  </View>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    openDeleteDialog(child);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="delete-outline" size={22} color={COLORS.common.textLight} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Botao Flutuante Adicionar */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setShowAddSheet(true)}
        activeOpacity={0.9}
      >
        <MaterialCommunityIcons name="plus" size={22} color="#fff" />
        <Text style={styles.fabText}>Adicionar</Text>
      </TouchableOpacity>

      {/* Bottom Sheet de Adicionar Crianca */}
      <BottomSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title="Cadastrar Crianca"
        height={0.75}
      >
        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="lightbulb-outline" size={20} color={COLORS.parent.primary} />
          <Text style={styles.infoText}>
            A crianca usara o <Text style={styles.infoTextBold}>username</Text> e o{' '}
            <Text style={styles.infoTextBold}>PIN</Text> para fazer login no app.
          </Text>
        </View>

        <TextInput
          value={fullName}
          onChangeText={setFullName}
          mode="outlined"
          style={styles.input}
          placeholder="Nome da Crianca"
          left={<TextInput.Icon icon="account-outline" />}
          outlineColor={COLORS.common.border}
          activeOutlineColor={COLORS.parent.primary}
          outlineStyle={styles.inputOutline}
        />

        <TextInput
          value={age}
          onChangeText={setAge}
          mode="outlined"
          keyboardType="numeric"
          maxLength={2}
          style={styles.input}
          placeholder="Idade"
          left={<TextInput.Icon icon="calendar-outline" />}
          outlineColor={COLORS.common.border}
          activeOutlineColor={COLORS.parent.primary}
          outlineStyle={styles.inputOutline}
        />

        <TextInput
          value={username}
          onChangeText={(text) => setUsername(text.toLowerCase())}
          mode="outlined"
          autoCapitalize="none"
          style={styles.input}
          placeholder="Username"
          left={<TextInput.Icon icon="at" />}
          outlineColor={COLORS.common.border}
          activeOutlineColor={COLORS.parent.primary}
          outlineStyle={styles.inputOutline}
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

        <TouchableOpacity
          style={[styles.createButton, createChild.isPending && styles.createButtonDisabled]}
          onPress={handleCreateChild}
          disabled={createChild.isPending}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.createButtonText}>
            {createChild.isPending ? 'Cadastrando...' : 'Cadastrar Crianca'}
          </Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Bottom Sheet de Detalhes da Crianca */}
      <BottomSheet
        visible={showDetailsSheet}
        onClose={() => {
          setShowDetailsSheet(false);
          setSelectedChild(null);
        }}
        title={selectedChild?.fullName ?? ''}
        height={0.65}
      >
        {selectedChild && (
          <View style={styles.detailsContainer}>
            {/* Avatar Grande */}
            <View style={styles.detailsAvatarCircle}>
              <Text style={styles.detailsAvatarText}>{getInitial(selectedChild.fullName)}</Text>
            </View>

            {/* Info */}
            <Text style={styles.detailsName}>{selectedChild.fullName}</Text>
            <Text style={styles.detailsUsername}>@{getDisplayUsername(selectedChild)}</Text>
            <Text style={styles.detailsAge}>{selectedChild.age ?? '?'} anos</Text>

            {/* Stats Cards */}
            <View style={styles.statsCards}>
              <View style={[styles.statsCard, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="hand-coin" size={24} color="#FF9800" />
                <Text style={styles.statsCardValue}>{selectedChild.coinBalance ?? 0}</Text>
                <Text style={styles.statsCardLabel}>Moedas</Text>
              </View>
              <View style={[styles.statsCard, { backgroundColor: '#FFF8E1' }]}>
                <MaterialCommunityIcons name="star" size={24} color="#FFC107" />
                <Text style={styles.statsCardValue}>{selectedChild.xpTotal ?? 0}</Text>
                <Text style={styles.statsCardLabel}>XP Total</Text>
              </View>
              <View style={[styles.statsCard, { backgroundColor: '#F3E5F5' }]}>
                <MaterialCommunityIcons name="trophy" size={24} color={COLORS.parent.primary} />
                <Text style={styles.statsCardValue}>Lv. {selectedChild.level ?? 1}</Text>
                <Text style={styles.statsCardLabel}>Nível</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progresso para Lv. {(selectedChild.level ?? 1) + 1}</Text>
                <Text style={styles.progressXp}>
                  {(selectedChild.xpTotal ?? 0) % getXpForNextLevel(selectedChild.level ?? 1)}/{getXpForNextLevel(selectedChild.level ?? 1)} XP
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        100,
                        ((selectedChild.xpTotal ?? 0) % getXpForNextLevel(selectedChild.level ?? 1)) /
                          getXpForNextLevel(selectedChild.level ?? 1) *
                          100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Botoes */}
            <View style={styles.detailsButtons}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => openDeleteDialog(selectedChild)}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteButtonText}>Deletar Perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowDetailsSheet(false);
                  setSelectedChild(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </BottomSheet>

      {/* Dialog de exclusao de crianca */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Excluir Crianca</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Tem certeza que deseja excluir <Text style={styles.dialogChildName}>{deletingChild?.fullName}</Text>?
            </Text>
            <Text style={[styles.dialogText, { color: COLORS.common.error, fontWeight: '600' }]}>
              Esta ação e irreversível. Todos os dados serão perdidos.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancelar</Button>
            <Button
              onPress={handleDeleteChild}
              textColor={COLORS.common.error}
              loading={deleteChild.isPending}
              disabled={deleteChild.isPending}
            >
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbars */}
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        style={styles.errorSnackbar}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess('')}
        duration={3000}
        style={styles.successSnackbar}
      >
        {success}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.common.white,
  },
  header: {
    backgroundColor: COLORS.parent.primary,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  childList: {
    flex: 1,
  },
  childListContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.common.text,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.common.textLight,
    textAlign: 'center',
  },
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  childCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.parent.primary,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.common.text,
    marginBottom: 2,
  },
  childUsername: {
    fontSize: 14,
    color: COLORS.parent.primary,
    marginBottom: 6,
  },
  childStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: COLORS.common.textLight,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.parent.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Form styles
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.common.text,
    lineHeight: 20,
  },
  infoTextBold: {
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  inputOutline: {
    borderRadius: 12,
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.common.text,
    marginBottom: 12,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  pinBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.common.border,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinInput: {
    fontSize: 20,
    textAlign: 'center',
    width: '100%',
    height: '100%',
    color: COLORS.common.text,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.parent.primary,
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Details styles
  detailsContainer: {
    alignItems: 'center',
  },
  detailsAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailsAvatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.parent.primary,
  },
  detailsName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.common.text,
    marginBottom: 4,
  },
  detailsUsername: {
    fontSize: 15,
    color: COLORS.parent.primary,
    marginBottom: 4,
  },
  detailsAge: {
    fontSize: 14,
    color: COLORS.common.textLight,
    marginBottom: 20,
  },
  statsCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 4,
  },
  statsCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.common.text,
  },
  statsCardLabel: {
    fontSize: 12,
    color: COLORS.common.textLight,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.common.text,
  },
  progressXp: {
    fontSize: 14,
    color: COLORS.common.textLight,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#FFE0B2',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 4,
  },
  detailsButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 14,
    borderRadius: 25,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.common.error,
  },
  closeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 25,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.common.text,
  },
  dialogText: {
    fontSize: 14,
    color: COLORS.common.text,
    marginBottom: 10,
  },
  dialogChildName: {
    fontWeight: 'bold',
    color: COLORS.parent.primary,
  },
  errorSnackbar: {
    backgroundColor: COLORS.common.error,
  },
  successSnackbar: {
    backgroundColor: COLORS.child.success,
  },
});

export default ManageChildrenScreen;
