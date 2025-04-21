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
}

export function CustomModal({
  isVisible,
  onClose,
  children,
  width = WINDOW_WIDTH * 0.9,
  height,
  style,
  title,
}: CustomModalProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  React.useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withSpring(0.8, {
        damping: 20,
        stiffness: 300,
      });
    }
  }, [isVisible]);

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      backgroundColor: `rgba(0, 0, 0, ${interpolate(
        opacity.value,
        [0, 1],
        [0, 0.6],
        Extrapolate.CLAMP
      )})`,
    };
  });

  const modalStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
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
                maxHeight: WINDOW_HEIGHT * 0.9,
                minWidth: Math.min(320, width),
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{title}</Text>
              </View>
              
              <TouchableWithoutFeedback onPress={onClose}>
                <View style={[
                  styles.closeButton,
                  Platform.OS === 'web' && { cursor: 'pointer' }
                ]}>
                  <X size={20} color="#1A1A1A" strokeWidth={2.5} />
                </View>
              </TouchableWithoutFeedback>
            </View>
            
            {/* Content */}
            <View style={styles.contentWrapper}>
              <Animated.ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={Platform.OS !== 'web'}
                scrollEventThrottle={16}
                overScrollMode="never"
                bounces={Platform.OS !== 'web'}
                {...(Platform.OS === 'web' && {
                  className: 'custom-scrollbar'
                })}
              >
                {children}
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
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(8px)',
    }),
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    position: 'relative',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});