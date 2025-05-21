import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { Menu as Menu } from 'lucide-react-native';

export type ActionItem = {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  type?: 'default' | 'destructive';
};

type ActionMenuProps = {
  actions: ActionItem[];
};

export function ActionMenu({ actions }: ActionMenuProps) {
  const [visible, setVisible] = useState(false);
  const buttonRef = useRef<View>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const handlePress = () => {
    if (buttonRef.current) {
      buttonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setPosition({
          top: pageY + height + 5,
          right: 20
        });
        setVisible(true);
      });
    }
  };

  useEffect(() => {
    if (visible && Platform.OS === 'web') {
      const hideOnBackgroundPress = () => setVisible(false);
      
      // Only add event listener on web platform
      window.addEventListener('click', hideOnBackgroundPress);
      return () => window.removeEventListener('click', hideOnBackgroundPress);
    }
  }, [visible]);

  return (
    <View>
      <Pressable 
        ref={buttonRef} 
        onPress={handlePress}
        style={styles.menuButton}
      >
        <View style={{ borderColor: '#D7D7D7', borderWidth: 1, borderRadius: 20, padding: 8 }}>
          <Menu size={18} color="#2A2E33" />
        </View>
      </Pressable>

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable 
          style={styles.backdrop}
          onPress={() => setVisible(false)}
        >
          <View 
            style={[
              styles.menuContainer, 
              { top: position.top, right: position.right }
            ]}
          >
            {actions.map((action, index) => (
              <Pressable
                key={index}
                style={[
                  styles.menuItem,
                  index === actions.length - 1 && styles.lastMenuItem
                ]}
                onPress={() => {
                  setVisible(false);
                  action.onPress();
                }}
              >
                {action.icon && (
                  <View style={styles.iconContainer}>
                    {action.icon}
                  </View>
                )}
                <Text 
                  style={[
                    styles.menuItemText,
                    action.type === 'destructive' && styles.destructiveText
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 150,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    marginRight: 10,
  },
  menuItemText: {
    fontSize: 14,
    color: '#2A2E33',
  },
  destructiveText: {
    color: '#ef4444',
  },
});