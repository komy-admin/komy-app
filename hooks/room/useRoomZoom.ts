/**
 * useRoomZoom - Hook personnalisé pour la gestion du zoom de la Room
 *
 * Extrait toute la logique de zoom (pan, pinch, wheel) de Room.tsx
 * pour améliorer la maintenabilité et réduire la complexité
 *
 * ⚡ OPTIMISATION v2.4:
 * - Suppression du state React currentZoom (causait saccades sur web)
 * - Utilisation directe de scale.value partout (100% UI thread, 0 re-render)
 * - Performances identiques iOS/Android/Web
 */

import { useCallback, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

interface UseRoomZoomProps {
  initialZoom: number;
}

export const useRoomZoom = ({
  initialZoom
}: UseRoomZoomProps) => {
  // Shared values pour les transformations
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(initialZoom);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const savedScale = useSharedValue(initialZoom);

  // Mettre à jour le zoom quand initialZoom change
  useEffect(() => {
    if (initialZoom !== scale.value) {
      scale.value = initialZoom;
      savedScale.value = initialZoom;
    }
  }, [initialZoom, scale, savedScale]);

  // Geste de pan (déplacement) - Actif dans tous les modes
  // 🎯 En mode édition: drag table a priorité, pan room uniquement sur background
  // La hiérarchie des GestureDetector gère automatiquement la priorité
  const panGesture = useMemo(() =>
    Gesture.Pan()
      .onStart(() => {
        'worklet';
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      })
      .onUpdate((event) => {
        'worklet';
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }),
  [savedTranslateX, savedTranslateY, translateX, translateY]);

  // Geste de pinch (zoom)
  const pinchGesture = useMemo(() =>
    Gesture.Pinch()
      .onStart(() => {
        'worklet';
        savedScale.value = scale.value;
      })
      .onUpdate((event) => {
        'worklet';
        const newScale = savedScale.value * event.scale;
        scale.value = Math.min(Math.max(newScale, 0.2), 1.5);
      }),
  [scale, savedScale]);

  // Support de la molette souris sur web (100% UI thread, 0 re-render)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const zoomSensitivity = 0.001;
      const delta = -event.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(scale.value + delta, 0.2), 1.5);

      // ⚡ Mettre à jour SEULEMENT scale.value (UI thread, pas de re-render)
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

  // Réinitialiser les transformations
  const resetTransform = useCallback(() => {
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [translateX, translateY, savedTranslateX, savedTranslateY]);

  return {
    // Shared values
    translateX,
    translateY,
    scale,

    // Gestures
    panGesture,
    pinchGesture,

    // Fonctions
    resetTransform
  };
};
