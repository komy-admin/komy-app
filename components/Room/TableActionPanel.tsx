import React, { forwardRef } from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import { CreditCard as Edit2, Trash2 } from 'lucide-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface TableActionPanelProps {
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TableActionPanel = forwardRef<View, TableActionPanelProps>(({
  position,
  onPositionChange,
  onEdit,
  onDelete,
}, ref) => {
  const translateX = useSharedValue(position.x);
  const translateY = useSharedValue(position.y);
  const isDragging = useSharedValue(false);

  React.useEffect(() => {
    if (!isDragging.value) {
      translateX.value = withSpring(position.x, { 
        damping: Platform.OS === 'web' ? 20 : 15,
        stiffness: Platform.OS === 'web' ? 200 : 150,
        mass: Platform.OS === 'web' ? 0.5 : 0.8
      });
      translateY.value = withSpring(position.y, { 
        damping: Platform.OS === 'web' ? 20 : 15,
        stiffness: Platform.OS === 'web' ? 200 : 150,
        mass: Platform.OS === 'web' ? 0.5 : 0.8
      });
    }
  }, [position, isDragging.value]);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      isDragging.value = true;
    })
    .onUpdate((e) => {
      translateX.value = position.x + e.translationX;
      translateY.value = position.y + e.translationY;
    })
    .onEnd((e) => {
      isDragging.value = false;
      runOnJS(onPositionChange)({
        x: position.x + e.translationX,
        y: position.y + e.translationY,
      });
    })
    .minDistance(5)
    .maxPointers(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View ref={ref} style={[styles.container, animatedStyle]} collapsable={false}>
        <View style={styles.handle} />
        <Pressable style={styles.button} onPress={onEdit}>
          <Edit2 size={20} color="#4B5563" />
          <Text style={styles.buttonText}>Modifier</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={[styles.button, styles.deleteButton]} onPress={onDelete}>
          <Trash2 size={20} color="#EF4444" />
          <Text style={[styles.buttonText, styles.deleteText]}>Supprimer</Text>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'column',
    zIndex: 1000,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  deleteButton: {
    marginTop: 4,
  },
  deleteText: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
});

export default TableActionPanel;