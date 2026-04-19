import { View, Text, Animated, StyleSheet, Pressable } from 'react-native';
import { useEffect, useRef } from 'react';
import { CircleCheck, CircleX, TriangleAlert, Info, X } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  count: number;
}

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  info: 3000,
  warning: 4000,
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: '#2D6A4F',
  error: '#D8315B',
  warning: '#FFAA00',
  info: '#3B82F6',
};

const TOAST_ICONS: Record<ToastType, React.FC<{ size: number; color: string }>> = {
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
};

interface ToastItemProps {
  toast: ToastData;
  onRemove: (id: number) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  // Reset timer on count change (dedup refresh)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => hide(), toast.duration) as unknown as NodeJS.Timeout;
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.count]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
    ]).start(() => onRemove(toast.id));
  };

  const Icon = TOAST_ICONS[toast.type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          backgroundColor: TOAST_COLORS[toast.type],
          transform: [{ translateY }],
          marginBottom: 8,
        },
      ]}
    >
      <Icon size={18} color="#FFFFFF" />
      <Text style={styles.message}>
        {toast.count > 1 && (
          <Text style={styles.count}>{toast.count}x </Text>
        )}
        {toast.message}
      </Text>
      <Pressable onPress={hide} hitSlop={8}>
        <X size={16} color="rgba(255,255,255,0.7)" />
      </Pressable>
    </Animated.View>
  );
}

interface ToastStackProps {
  toasts: ToastData[];
  onRemove: (id: number) => void;
}

export function ToastStack({ toasts, onRemove }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <View style={styles.stack} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </View>
  );
}

export { DEFAULT_DURATIONS };

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 99999,
  },
  container: {
    maxWidth: 480,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  message: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  count: {
    fontWeight: '700',
  },
});
