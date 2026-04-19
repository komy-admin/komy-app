import React, { ReactNode } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '~/theme';

interface ForkModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: number;
}

export const ForkModal = ({
  visible,
  onClose,
  title,
  children,
  maxWidth = 400
}: ForkModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        onPress={onClose}
        style={styles.overlay}
      >
        <View style={[styles.container, { maxWidth }]}>
          <Pressable 
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={8}
          >
            <X size={20} color={colors.gray[500]} />
          </Pressable>

          {title && (
            <Text style={styles.title}>
              {title}
            </Text>
          )}
          
          {children}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  container: {
    backgroundColor: 'white',
    width: '80%',
    height: '80%',
    borderRadius: 12,
    padding: 16,
    position: 'relative'
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 8
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    padding: 4
  }
});