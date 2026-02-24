/**
 * useRoomZoom - Hook pour la gestion du zoom et pan de la Room
 *
 * Pan:
 * - Service / non-édition : 1 doigt/clic libre (RNGH Pan)
 * - Édition native : 1 doigt avec activeOffset 15px (priorité aux tables)
 * - Édition web : pan activé seulement quand aucune table sélectionnée
 *   → tap fond désélectionne → pan redevient libre
 *
 * Zoom : pinch (tactile) + molette (web, focal point vers le curseur)
 *
 * Limites :
 * - Scale : MIN_SCALE → MAX_SCALE (voir constants.ts)
 * - Pan clampé pour garder au moins 20% de la room visible (min 100px)
 *   Bornes symétriques basées sur la taille réelle de la room et du conteneur.
 */

import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { MIN_SCALE, MAX_SCALE } from '~/hooks/room/constants';

const IS_WEB = Platform.OS === 'web';

interface UseRoomZoomProps {
  initialZoom: number;
  editionMode?: boolean;
  hasSelectedTable?: boolean;
  roomPixelWidth: SharedValue<number>;
  roomPixelHeight: SharedValue<number>;
  containerWidth: SharedValue<number>;
  containerHeight: SharedValue<number>;
}

export const useRoomZoom = ({
  initialZoom,
  editionMode = false,
  hasSelectedTable = false,
  roomPixelWidth,
  roomPixelHeight,
  containerWidth,
  containerHeight,
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
  }, [initialZoom]);

  // Pan RNGH avec limites
  // Deps : seuls editionMode et hasSelectedTable changent (SharedValues = refs stables)
  const panGesture = useMemo(() => {
    const gesture = Gesture.Pan()
      .onStart(() => {
        'worklet';
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      })
      .onUpdate((event) => {
        'worklet';
        const rawX = savedTranslateX.value + event.translationX;
        const rawY = savedTranslateY.value + event.translationY;
        const s = scale.value;
        const rw = roomPixelWidth.value;
        const rh = roomPixelHeight.value;
        const cw = containerWidth.value;
        const ch = containerHeight.value;

        const mX = Math.max(rw * s * 0.2, 100);
        const maxX = (cw + rw * s) / 2 - mX;
        translateX.value = maxX > 0 ? Math.min(Math.max(rawX, -maxX), maxX) : 0;

        const mY = Math.max(rh * s * 0.2, 100);
        const maxY = (ch + rh * s) / 2 - mY;
        translateY.value = maxY > 0 ? Math.min(Math.max(rawY, -maxY), maxY) : 0;
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
  }, [editionMode, hasSelectedTable]);

  // Pinch zoom — simple scale, pas de focal (le pan simultané suit les doigts)
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
  []);

  // Web : molette avec focal point vers le curseur
  // Re-run quand initialZoom change (= l'élément DOM est rendu après le loading)
  useEffect(() => {
    if (!IS_WEB || typeof document === 'undefined') return;

    let element: HTMLElement | null = null;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const oldScale = scale.value;
      const delta = -event.deltaY * 0.001;
      const newScale = Math.min(Math.max(oldScale + delta, MIN_SCALE), MAX_SCALE);
      if (newScale === oldScale) return;

      if (!element) return;
      const ratio = newScale / oldScale;
      const rect = element.getBoundingClientRect();
      const fx = event.clientX - rect.left;
      const fy = event.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      translateX.value = fx - cx - (fx - cx - translateX.value) * ratio;
      translateY.value = fy - cy - (fy - cy - translateY.value) * ratio;
      scale.value = newScale;
      savedScale.value = newScale;
    };

    const raf = requestAnimationFrame(() => {
      element = document.getElementById('room-zoom-container');
      if (element) {
        element.addEventListener('wheel', handleWheel, { passive: false });
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      if (element) {
        element.removeEventListener('wheel', handleWheel);
      }
    };
  }, [initialZoom]);

  return {
    translateX,
    translateY,
    scale,
    panGesture,
    pinchGesture,
  };
};
