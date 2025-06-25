import React from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, Platform, ViewStyle, Dimensions, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate,
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
  const scale = useSharedValue(0.9);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, {
        damping: 25,
        stiffness: 400,
      });
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 400,
      });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withSpring(0.9, {
        damping: 25,
        stiffness: 400,
      });
      translateY.value = withSpring(20, {
        damping: 25,
        stiffness: 400,
      });
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
        { scale: scale.value },
        { translateY: translateY.value }
      ],
      opacity: opacity.value,
    };
  });

  if (!isVisible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.modalContainer,
              modalStyle,
              style,
              {
                width,
                ...(height && { height }),
                maxHeight: WINDOW_HEIGHT * 0.85, // Réduit de 0.9 à 0.85 pour plus d'espace
                minWidth: Math.min(320, width),
              },
            ]}
          >
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
            
            <View style={styles.contentWrapper}>
              <Animated.ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                overScrollMode="never"
                bounces={Platform.OS !== 'web'}
                {...(Platform.OS === 'web' && {
                  className: 'custom-scrollbar'
                })}
              >
                <View style={styles.contentContainer}>
                  {children}
                </View>
              </Animated.ScrollView>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </TouchableWithoutFeedback>
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
  contentWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
  },
});