/**
 * useRoomZoom - Hook pour la gestion du zoom et pan de la Room
 *
 * Pan:
 * - Service / non-édition : 1 doigt/clic libre (RNGH Pan)
 * - Édition native : 1 doigt avec activeOffset 15px (priorité aux tables)
 * - Édition web : pan activé seulement quand aucune table sélectionnée
 *   → tap fond désélectionne → pan redevient libre
 *
 * Zoom : pinch (tactile) + molette (web)
 */

import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

const IS_WEB = Platform.OS === 'web';
const MIN_SCALE = 0.2;
const MAX_SCALE = 1.5;

interface UseRoomZoomProps {
  initialZoom: number;
  editionMode?: boolean;
  hasSelectedTable?: boolean;
}

export const useRoomZoom = ({
  initialZoom,
  editionMode = false,
  hasSelectedTable = false,
}: UseRoomZoomProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(initialZoom);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const savedScale = useSharedValue(initialZoom);

  useEffect(() => {
    if (initialZoom !== scale.value) {
      scale.value = initialZoom;
      savedScale.value = initialZoom;
    }
  }, [initialZoom, scale, savedScale]);

  // Pan RNGH
  // - Non-édition : pan libre
  // - Édition native : activeOffset 15px (laisse priorité aux tables)
  // - Édition web sans sélection : pan libre
  // - Édition web avec sélection : pan désactivé (priorité resize/drag table)
  const panGesture = useMemo(() => {
    const gesture = Gesture.Pan()
      .onStart(() => {
        'worklet';
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      })
      .onUpdate((event) => {
        'worklet';
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      });
    if (editionMode) {
      if (IS_WEB) {
        gesture.enabled(!hasSelectedTable);
      } else {
        gesture.activeOffsetX([-15, 15]);
        gesture.activeOffsetY([-15, 15]);
      }
    }
    return gesture;
  }, [savedTranslateX, savedTranslateY, translateX, translateY, editionMode, hasSelectedTable]);

  // Pinch zoom
  const pinchGesture = useMemo(() =>
    Gesture.Pinch()
      .onStart(() => {
        'worklet';
        savedScale.value = scale.value;
      })
      .onUpdate((event) => {
        'worklet';
        const newScale = savedScale.value * event.scale;
        scale.value = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
      }),
  [scale, savedScale]);

  // Web : molette pour zoom
  useEffect(() => {
    if (!IS_WEB || typeof document === 'undefined') return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = -event.deltaY * 0.001;
      const newScale = Math.min(Math.max(scale.value + delta, MIN_SCALE), MAX_SCALE);
      scale.value = newScale;
      savedScale.value = newScale;
    };

    const timer = setTimeout(() => {
      const element = document.getElementById('room-zoom-container');
      if (element) {
        element.addEventListener('wheel', handleWheel, { passive: false });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      const element = document.getElementById('room-zoom-container');
      if (element) {
        element.removeEventListener('wheel', handleWheel);
      }
    };
  }, [scale, savedScale]);

  return {
    translateX,
    translateY,
    scale,
    panGesture,
    pinchGesture,
  };
};
