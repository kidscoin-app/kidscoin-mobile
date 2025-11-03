import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button } from 'react-native-paper';
import { AVAILABLE_AVATARS } from '../utils/avatars';

interface AvatarSelectorProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectAvatar: (avatarId: string) => void;
  currentAvatarId?: string | null;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  visible,
  onDismiss,
  onSelectAvatar,
  currentAvatarId,
}) => {
  const handleSelectAvatar = (avatarId: string) => {
    onSelectAvatar(avatarId);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Text style={styles.title}>Escolha seu Avatar 🎨</Text>
        <Text style={styles.subtitle}>Selecione um animal para ser seu avatar!</Text>

        <ScrollView style={styles.scrollView}>
          <View style={styles.avatarGrid}>
            {AVAILABLE_AVATARS.map((avatar) => {
              const isSelected = currentAvatarId === avatar.id;

              return (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarItem,
                    isSelected && styles.avatarItemSelected,
                  ]}
                  onPress={() => handleSelectAvatar(avatar.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                  <Text style={styles.avatarName}>{avatar.name}</Text>
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <Button
          mode="outlined"
          onPress={onDismiss}
          style={styles.cancelButton}
          textColor="#666"
        >
          Cancelar
        </Button>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    maxHeight: 400,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarItem: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 3,
    borderColor: 'transparent',
    position: 'relative',
  },
  avatarItemSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  avatarEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  avatarName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 16,
  },
});

export default AvatarSelector;
