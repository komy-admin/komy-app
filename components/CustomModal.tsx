import React from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, Platform, ViewStyle, Dimensions, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

interface CustomModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  height?: number | 'auto';
  style?: ViewStyle;
  title?: string;
  titleColor?: string;
}

export function CustomModal({
  isVisible,
  onClose,
  children,
  width = WINDOW_WIDTH * 0.9,
  height,
  style,
  title,
  titleColor,
}: CustomModalProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  React.useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.95, { duration: 150 });
    }
  }, [isVisible]);

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      backgroundColor: `rgba(15, 23, 42, ${interpolate(
        opacity.value,
        [0, 1],
        [0, 0.4],
      )})`,
    };
  });

  const modalStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value }
      ],
      opacity: opacity.value,
    };
  });

  if (!isVisible) return null;

  return (
    // Overlay simple sans Animated.View pour éviter les conflits
    <View style={[styles.overlay, { opacity: isVisible ? 1 : 0 }]}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlayTouchable} />
      </TouchableWithoutFeedback>
      
      {/* Modal avec animation mais sans interférence tactile */}
      <Animated.View
        style={[
          styles.modalContainer,
          modalStyle,
          style,
          {
            width,
            ...(height && { height }),
            maxHeight: WINDOW_HEIGHT * 0.85,
            minWidth: Math.min(320, width),
          },
        ]}
      >
        {/* Header fixe */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleSection}>
              <View style={[styles.titleIndicator, { backgroundColor: titleColor || '#6366F1' }]} />
              <Text style={styles.title}>{title}</Text>
            </View>
            
            <TouchableWithoutFeedback onPress={onClose}>
              <View style={{ paddingHorizontal: 20, paddingVertical: 15 }}>
                <View style={[
                  styles.closeButton,
                  Platform.OS === 'web' && { cursor: 'pointer' }
                ]}>
                  <X size={18} color="#64748B" strokeWidth={2.5} />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
        
        {/* Contenu sans View wrapper supplémentaire */}
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 25,
    position: 'relative',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
    position: 'relative',
    zIndex: 10,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 12,
    paddingVertical: 5,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIndicator: {
    width: 4,
    height: 24,
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.3)',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
});