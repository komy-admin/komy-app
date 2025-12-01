/**
 * 🏓 COMPOSANT ROOMTABLE
 *
 * Représente une table interactive dans une salle de restaurant.
 * Gère le drag & drop, le resize, et la synchronisation avec le backend.
 *
 * 🎯 ARCHITECTURE GLOBALE :
 *
 * 1️⃣ SYSTÈME DE COORDONNÉES :
 *    - Backend : Coordonnées de GRILLE (entiers, ex: xStart=2, width=3)
 *    - UI : Coordonnées en PIXELS (ex: currentX=100px, width=150px)
 *    - Conversion : pixels = grille * CELL_SIZE
 *
 * 2️⃣ FLUX DE DONNÉES (UNIDIRECTIONNEL) :
 *    Backend (table props) → SharedValues (UI) → Animations → Visual
 *    └─ Update via onUpdate() ←─ Validation ←─ User Gesture ─┘
 *
 * 3️⃣ SYNCHRONISATION BACKEND ↔ UI :
 *    - useEffect surveille table.xStart, table.yStart, table.width, table.height
 *    - Dès qu'une prop change → sync vers les SharedValues
 *    - Protection anti-cascade : skip si déjà synchronisé
 *
 * 4️⃣ GESTES (React Native Gesture Handler + Reanimated) :
 *    - Drag : Mouvement fluide + ghost preview + snap final
 *    - Resize : 4 handles (gauche, droite, haut, bas) avec snap-to-grid
 *    - Tap/LongPress : Sélection et menu contextuel
 *
 * 5️⃣ VALIDATION :
 *    - Limites de la room (0 ≤ x ≤ roomWidth)
 *    - Collisions AABB avec autres tables
 *    - Taille minimum (MIN_CELLS = 2)
 *    - Si invalide → rollback vers backend (source de vérité)
 *
 * 6️⃣ OPTIMISATIONS :
 *    - Précalcul des limites dans onStart (évite 60 calculs/sec)
 *    - SharedValues pour accès worklet (thread UI)
 *    - Math.round strict pour éviter problèmes de précision décimale
 *    - Ghost preview calculé séparément du mouvement réel
 *
 * ⚠️ POINTS CRITIQUES À RETENIR :
 * - Toujours utiliser table.* (backend) comme source de vérité en cas d'échec
 * - Math.round STRICT sur toutes conversions pixels→grille (évite 2.000001)
 * - startX/startWidth capturés dans onStart = RÉFÉRENCE pour tout le geste
 * - alreadySynced check = évite cascades de syncs infinies
 */
import React, { useMemo, useCallback } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { getStatusColor, getStatusBorderStyle } from "~/lib/utils";
import { Table } from "~/types/table.types";
import { Text } from "../ui";
import { Status } from "~/types/status.enum";
import { RoomChairs } from "./RoomChairs";
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';

interface TableViewProps {
  table: Table;
  tables: Table[]; // Pour vérifier les collisions
  roomWidth: number; // Largeur de la room en cellules
  roomHeight: number; // Hauteur de la room en cellules
  status?: Status;
  isEditing: boolean;
  editionMode: boolean;
  positionValid: boolean;
  CELL_SIZE: number;
  currentZoomScale: SharedValue<number>; // ⚡ SharedValue direct (pas number)
  isSelected: boolean;
  onPress: (table: Table) => void;
  onLongPress: (table: Table) => void;
  onUpdate: (id: string, updates: Partial<Table>) => void;
}

const RoomTable: React.FC<TableViewProps> = ({
  table,
  tables,
  roomWidth,
  roomHeight,
  status,
  isEditing,
  editionMode,
  positionValid,
  CELL_SIZE,
  currentZoomScale,
  isSelected,
  onPress,
  onLongPress,
  onUpdate
}) => {
  const MIN_CELLS = 2;

  /**
   * 🎯 SYSTÈME DE SHARED VALUES (React Native Reanimated)
   *
   * Les SharedValues permettent des animations fluides 60fps en s'exécutant sur le thread UI.
   * Elles sont séparées en plusieurs catégories :
   */

  // 📍 POSITIONS DE TRANSLATION (pour le drag fluide)
  // translateX/Y : offset temporaire pendant le drag, remis à 0 après validation
  // startX/Y : position de départ du geste (capturée dans onStart)
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(table.xStart * CELL_SIZE);
  const startY = useSharedValue(table.yStart * CELL_SIZE);

  // 📌 POSITIONS ACTUELLES (source de vérité côté UI)
  // currentX/Y : position réelle de la table en pixels, synchronisée avec le backend
  const currentX = useSharedValue(table.xStart * CELL_SIZE);
  const currentY = useSharedValue(table.yStart * CELL_SIZE);

  // ✅ DERNIÈRE POSITION VALIDE (pour rollback en cas d'échec)
  // lastValidX/Y : sauvegarde de la dernière position validée sans collision
  const lastValidX = useSharedValue(table.xStart * CELL_SIZE);
  const lastValidY = useSharedValue(table.yStart * CELL_SIZE);

  // 📏 DIMENSIONS ANIMÉES (pour le resize)
  // width/height : dimensions visuelles animées pendant le resize
  // startWidth/Height : dimensions de départ du geste (capturées dans onStart)
  const width = useSharedValue(table.width * CELL_SIZE);
  const height = useSharedValue(table.height * CELL_SIZE);
  const startWidth = useSharedValue(table.width * CELL_SIZE);
  const startHeight = useSharedValue(table.height * CELL_SIZE);

  // 📐 DIMENSIONS ACTUELLES (source de vérité côté UI)
  // currentWidth/Height : dimensions réelles de la table, synchronisées avec le backend
  const currentWidth = useSharedValue(table.width * CELL_SIZE);
  const currentHeight = useSharedValue(table.height * CELL_SIZE);

  // 🎨 EFFETS VISUELS
  // scale : agrandissement lors de la sélection (1.05x pendant le drag)
  // opacity : transparence pour indiquer une position invalide
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // 👻 APERÇU FANTÔME (preview de la position snappée)
  // Affiche une silhouette semi-transparente à la position snappée pendant le drag
  const ghostOpacity = useSharedValue(0);
  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);

  // ⚡ CACHE DE PERFORMANCE (précalculs pour le drag)
  // Ces valeurs sont calculées une seule fois au début du drag pour éviter
  // de recalculer à chaque frame (60 fois par seconde)
  const cachedTableWidthInCells = useSharedValue(0);
  const cachedTableHeightInCells = useSharedValue(0);
  const cachedMaxX = useSharedValue(0);
  const cachedMaxY = useSharedValue(0);

  // 🔍 ZOOM SCALE (pour compenser le zoom de la Room sur grandes grilles)
  // ⚡ v2.4: Utilisation directe de currentZoomScale (SharedValue), pas de sync nécessaire
  // Sur grille 30x30, zoom ~0.5-0.6 → sans compensation, table ne suit pas le doigt
  const zoomScale = currentZoomScale;

  // Vérifier si une position est valide (dans les limites et sans collision)
  const isValidPosition = useCallback((x: number, y: number, w: number, h: number) => {
    'worklet';
    // Vérifier les limites de la room
    if (x < 0 || y < 0 || x + w > roomWidth || y + h > roomHeight) {
      return false;
    }

    // Vérifier les collisions avec d'autres tables
    // NOTE: Cette vérification se fait côté JS, pas dans le worklet
    return true; // La vérification complète sera faite dans onEnd
  }, [roomWidth, roomHeight]);

  /**
   * 🔄 SYNCHRONISATION BACKEND → UI
   *
   * Ce useEffect synchronise les SharedValues (UI) avec les props du backend.
   * Il se déclenche quand table.xStart, table.yStart, table.width ou table.height changent.
   *
   * ⚠️ PROBLÈME CRITIQUE RÉSOLU :
   * Sans la vérification alreadySynced, on avait des "cascades de syncs" :
   * 1. Le backend met à jour table.xStart = 2
   * 2. Le useEffect sync met currentX.value = 2
   * 3. Cela déclenche un re-render qui réexécute useEffect
   * 4. Boucle infinie de syncs causant une désynchronisation
   *
   * 💡 SOLUTION :
   * On vérifie si les SharedValues sont DÉJÀ égales aux valeurs backend.
   * Si oui → skip le sync (évite la cascade)
   * Si non → sync nécessaire (changement réel du backend)
   */
  React.useEffect(() => {
    const targetX = table.xStart * CELL_SIZE;
    const targetY = table.yStart * CELL_SIZE;
    const targetWidth = table.width * CELL_SIZE;
    const targetHeight = table.height * CELL_SIZE;

    // ✋ Vérifier si déjà synchronisé pour éviter les syncs inutiles
    const alreadySynced = (
      currentX.value === targetX &&
      currentY.value === targetY &&
      currentWidth.value === targetWidth &&
      currentHeight.value === targetHeight
    );

    if (alreadySynced) {
      console.log('⏭️ SYNC SKIPPED (already synced)', table.name);
      return;
    }

    console.log('🔄 SYNC SHARED VALUES', table.name, {
      from: {
        currentX: Math.round(currentX.value / CELL_SIZE),
        currentY: Math.round(currentY.value / CELL_SIZE),
        currentWidth: Math.round(currentWidth.value / CELL_SIZE),
        currentHeight: Math.round(currentHeight.value / CELL_SIZE)
      },
      to: {
        xStart: table.xStart,
        yStart: table.yStart,
        width: table.width,
        height: table.height
      }
    });

    // 📥 Synchroniser les valeurs actuelles
    currentX.value = targetX;
    currentY.value = targetY;
    currentWidth.value = targetWidth;
    currentHeight.value = targetHeight;

    // ✅ Mettre à jour les positions valides (pour rollback)
    lastValidX.value = targetX;
    lastValidY.value = targetY;

    // 🎨 Synchroniser aussi les valeurs animées
    width.value = targetWidth;
    height.value = targetHeight;
    translateX.value = 0;
    translateY.value = 0;
  }, [table.xStart, table.yStart, table.width, table.height]);

  // Callbacks
  const handlePress = useCallback(() => {
    onPress(table);
  }, [onPress, table]);

  const handleLongPress = useCallback(() => {
    onLongPress(table);
  }, [onLongPress, table]);

  /**
   * 🔍 DÉTECTION DE COLLISION (AABB - Axis-Aligned Bounding Box)
   *
   * Vérifie si une table entre en collision avec d'autres tables.
   * Utilise l'algorithme AABB qui vérifie le chevauchement de rectangles.
   *
   * 📐 PRINCIPE AABB :
   * Deux rectangles se chevauchent SI ET SEULEMENT SI :
   * - Le côté gauche de A est à gauche du côté droit de B (x < otherX + otherW)
   * - Le côté droit de A est à droite du côté gauche de B (x + w > otherX)
   * - Le côté haut de A est au-dessus du côté bas de B (y < otherY + otherH)
   * - Le côté bas de A est en-dessous du côté haut de B (y + h > otherY)
   *
   * ⚠️ IMPORTANT : Utilise les coordonnées de la GRILLE (entiers), pas les pixels
   *
   * @param x - Position X en cellules de grille
   * @param y - Position Y en cellules de grille
   * @param w - Largeur en cellules de grille
   * @param h - Hauteur en cellules de grille
   * @returns true si collision détectée, false sinon
   */
  const checkCollision = useCallback((x: number, y: number, w: number, h: number): boolean => {
    return tables.some(otherTable => {
      // Ignorer la table elle-même
      if (otherTable.id === table.id) return false;

      // AABB collision detection avec des entiers (coordonnées grille)
      return (
        x < otherTable.xStart + otherTable.width &&
        x + w > otherTable.xStart &&
        y < otherTable.yStart + otherTable.height &&
        y + h > otherTable.yStart
      );
    });
  }, [tables, table.id]);

  /**
   * 🚚 MISE À JOUR DE POSITION (après drag)
   *
   * Appelée quand l'utilisateur relâche une table après l'avoir déplacée.
   * Valide la nouvelle position et met à jour le backend ou rollback si invalide.
   *
   * 📍 PROCESSUS :
   * 1. Conversion pixels → grille (avec Math.round strict pour éviter décimales)
   * 2. Vérification des limites de la room
   * 3. Vérification des collisions AABB
   * 4a. Si valide → Mise à jour backend + sync des SharedValues
   * 4b. Si invalide → Animation de retour à lastValidX/Y
   *
   * ⚠️ IMPORTANCE DU Math.round :
   * Sans arrondi strict, on peut avoir gridX = 2.0000001 au lieu de 2
   * Cela casse la détection AABB qui attend des entiers purs
   */
  const handleUpdatePosition = useCallback((newX: number, newY: number) => {
    // 1️⃣ Convertir pixels → grille avec arrondi strict pour éviter les décimales
    const gridX = Math.round(newX / CELL_SIZE);
    const gridY = Math.round(newY / CELL_SIZE);
    const tableWidth = Math.round(currentWidth.value / CELL_SIZE);
    const tableHeight = Math.round(currentHeight.value / CELL_SIZE);

    // 2️⃣ Vérifier les limites de la room
    const withinBounds = (
      gridX >= 0 &&
      gridY >= 0 &&
      gridX + tableWidth <= roomWidth &&
      gridY + tableHeight <= roomHeight
    );

    // 3️⃣ Vérifier les collisions
    const hasCollision = checkCollision(gridX, gridY, tableWidth, tableHeight);

    // 4️⃣ Si position valide, mettre à jour
    if (!hasCollision && withinBounds) {
      // ✅ Reconvertir en pixels pour cohérence (garantit alignement parfait)
      const validX = gridX * CELL_SIZE;
      const validY = gridY * CELL_SIZE;

      // Sauvegarder comme dernière position valide
      lastValidX.value = validX;
      lastValidY.value = validY;
      currentX.value = validX;
      currentY.value = validY;
      translateX.value = 0;
      translateY.value = 0;

      // 📤 Envoyer au backend (en coordonnées grille)
      onUpdate(table.id, {
        xStart: gridX,
        yStart: gridY
      });
    } else {
      // ❌ Collision ou hors limites → animation de retour
      const deltaX = lastValidX.value - currentX.value;
      const deltaY = lastValidY.value - currentY.value;

      translateX.value = withSpring(deltaX, {}, () => {
        // Une fois l'animation terminée, reset les valeurs
        translateX.value = 0;
        currentX.value = lastValidX.value;
      });

      translateY.value = withSpring(deltaY, {}, () => {
        translateY.value = 0;
        currentY.value = lastValidY.value;
      });
    }
  }, [CELL_SIZE, onUpdate, table.id, checkCollision, roomWidth, roomHeight, currentWidth, currentHeight, lastValidX, lastValidY]);

  /**
   * 📏 MISE À JOUR DE TAILLE (après resize)
   *
   * Appelée quand l'utilisateur relâche un handle de resize.
   * Peut aussi mettre à jour la position (resize gauche/haut déplace la table).
   *
   * 📐 PROCESSUS :
   * 1. Conversion pixels → grille + application de la taille MIN_CELLS
   * 2. Vérification des limites de la room
   * 3. Vérification des collisions AABB
   * 4a. Si valide → Mise à jour backend + sync des SharedValues
   * 4b. Si invalide → Reset COMPLET vers les valeurs BACKEND
   *
   * ⚠️ BUG RÉSOLU - RESET VERS BACKEND :
   * Avant, on faisait : width.value = withSpring(currentWidth.value)
   * Problème : currentWidth peut être désynchronisé du backend !
   * Si on déplace une table puis resize, currentWidth peut avoir l'ancienne restriction.
   *
   * 💡 SOLUTION :
   * Reset TOUJOURS vers table.width * CELL_SIZE (valeur backend = source de vérité)
   * Cela garantit que les SharedValues reflètent l'état réel du backend
   *
   * @param newWidth - Nouvelle largeur en pixels
   * @param newHeight - Nouvelle hauteur en pixels
   * @param newX - Nouvelle position X en pixels (optionnel, pour resize gauche)
   * @param newY - Nouvelle position Y en pixels (optionnel, pour resize haut)
   */
  const handleUpdateSize = useCallback((newWidth: number, newHeight: number, newX?: number, newY?: number) => {
    // 1️⃣ Convertir avec arrondi strict
    const gridWidth = Math.round(newWidth / CELL_SIZE);
    const gridHeight = Math.round(newHeight / CELL_SIZE);
    const finalGridX = newX !== undefined ? Math.round(newX / CELL_SIZE) : table.xStart;
    const finalGridY = newY !== undefined ? Math.round(newY / CELL_SIZE) : table.yStart;

    // Appliquer les contraintes de taille minimale (2 cellules minimum)
    const constrainedWidth = Math.max(MIN_CELLS, gridWidth);
    const constrainedHeight = Math.max(MIN_CELLS, gridHeight);

    // 2️⃣ Vérification des limites de la room
    const withinBounds = (
      finalGridX >= 0 &&
      finalGridY >= 0 &&
      finalGridX + constrainedWidth <= roomWidth &&
      finalGridY + constrainedHeight <= roomHeight
    );

    // 3️⃣ Vérification des collisions
    const hasCollision = checkCollision(finalGridX, finalGridY, constrainedWidth, constrainedHeight);

    console.log('🔧 RESIZE DEBUG', {
      tableId: table.id,
      tableName: table.name,
      attempt: {
        gridWidth,
        gridHeight,
        finalGridX,
        finalGridY,
        constrainedWidth,
        constrainedHeight
      },
      currentState: {
        tableWidth: table.width,
        tableHeight: table.height,
        tableX: table.xStart,
        tableY: table.yStart
      },
      sharedValues: {
        currentWidth: Math.round(currentWidth.value / CELL_SIZE),
        currentHeight: Math.round(currentHeight.value / CELL_SIZE),
        currentX: Math.round(currentX.value / CELL_SIZE),
        currentY: Math.round(currentY.value / CELL_SIZE)
      },
      validation: {
        hasCollision,
        withinBounds,
        willSucceed: !hasCollision && withinBounds
      }
    });

    // 4️⃣ Valider et appliquer OU rollback
    if (!hasCollision && withinBounds) {
      // ✅ Tout est valide - reconvertir en pixels pour cohérence
      const validX = finalGridX * CELL_SIZE;
      const validY = finalGridY * CELL_SIZE;
      const validWidth = constrainedWidth * CELL_SIZE;
      const validHeight = constrainedHeight * CELL_SIZE;

      // Mettre à jour les positions si elles ont changé (resize gauche/haut)
      if (newX !== undefined) {
        currentX.value = validX;
        lastValidX.value = validX;
        translateX.value = 0;
      }
      if (newY !== undefined) {
        currentY.value = validY;
        lastValidY.value = validY;
        translateY.value = 0;
      }

      currentWidth.value = validWidth;
      currentHeight.value = validHeight;

      // 📤 Construire les updates pour le backend
      const updates: Partial<Table> = {
        width: constrainedWidth,
        height: constrainedHeight
      };
      if (newX !== undefined) {
        updates.xStart = finalGridX;
      }
      if (newY !== undefined) {
        updates.yStart = finalGridY;
      }

      onUpdate(table.id, updates);
      console.log('✅ RESIZE SUCCESS', table.name);
    } else {
      // ❌ Collision ou hors limites
      console.log('❌ RESIZE FAILED', table.name, {
        reason: !withinBounds ? 'OUT_OF_BOUNDS' : 'COLLISION',
        resetting: {
          widthTo: table.width,
          heightTo: table.height,
          xTo: table.xStart,
          yTo: table.yStart
        }
      });

      // 🔄 RESET COMPLET vers les valeurs du BACKEND (source de vérité)
      // ⚠️ IMPORTANT : Ne PAS utiliser currentWidth/currentHeight qui peuvent être désynchronisés
      // Toujours utiliser table.width/height qui viennent du backend
      const backendWidth = table.width * CELL_SIZE;
      const backendHeight = table.height * CELL_SIZE;
      const backendX = table.xStart * CELL_SIZE;
      const backendY = table.yStart * CELL_SIZE;

      width.value = withSpring(backendWidth);
      height.value = withSpring(backendHeight);

      // Réinitialiser aussi les positions (pour resize gauche/haut)
      currentX.value = backendX;
      currentY.value = backendY;
      currentWidth.value = backendWidth;
      currentHeight.value = backendHeight;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    }
  }, [CELL_SIZE, onUpdate, table.id, table.xStart, table.yStart, table.width, table.height, checkCollision, roomWidth, roomHeight, currentWidth, currentHeight, lastValidX, lastValidY]);

  // Geste de tap
  const tapGesture = useMemo(() =>
    Gesture.Tap()
      .onEnd(() => {
        'worklet';
        runOnJS(handlePress)();
      })
      .runOnJS(false),
    [handlePress]);

  // Geste de long press
  const longPressGesture = useMemo(() =>
    Gesture.LongPress()
      .minDuration(500)
      .onEnd(() => {
        'worklet';
        runOnJS(handleLongPress)();
      })
      .runOnJS(false),
    [handleLongPress]);

  // Gestes de redimensionnement avec snap-to-grid en temps réel
  const rightResizeGesture = useMemo(() =>
    Gesture.Pan()
      .enabled(isEditing && editionMode)
      .onStart(() => {
        'worklet';
        startWidth.value = currentWidth.value;
      })
      .onUpdate((event) => {
        'worklet';
        // 🔍 Compenser le zoom pour que le resize suive le curseur
        const compensatedTranslationX = event.translationX / zoomScale.value;
        const rawWidth = startWidth.value + compensatedTranslationX;
        // Snap to grid pendant le resize
        const snappedWidth = Math.max(MIN_CELLS * CELL_SIZE, Math.round(rawWidth / CELL_SIZE) * CELL_SIZE);
        width.value = snappedWidth;
      })
      .onEnd(() => {
        'worklet';
        // Ne PAS mettre à jour currentWidth ici - laisser handleUpdateSize le faire
        runOnJS(handleUpdateSize)(width.value, currentHeight.value);
      })
      .runOnJS(false),
    [isEditing, editionMode, handleUpdateSize]);

  /**
   * ↔️ GESTE DE RESIZE GAUCHE
   *
   * Plus complexe que le resize droit car il modifie À LA FOIS :
   * - La largeur de la table (width)
   * - La position X de la table (xStart)
   *
   * 🎯 PRINCIPE :
   * Quand on tire le bord gauche vers la gauche :
   * - La table s'agrandit (width augmente)
   * - La table se déplace vers la gauche (xStart diminue)
   *
   * ⚠️ BUG RÉSOLU - UTILISATION DE startWidth/startX :
   * Avant : deltaWidth = snappedWidth - currentWidth.value
   * Problème : currentWidth peut changer pendant le geste → calculs erronés
   *
   * 💡 SOLUTION :
   * Toujours utiliser startWidth et startX capturés dans onStart comme RÉFÉRENCE.
   * Ces valeurs sont figées pendant tout le geste, garantissant la cohérence des calculs.
   *
   * 📐 CALCUL :
   * Si on ajoute 2 cellules de largeur (deltaGrid = +2) :
   * newX = startX - 2 * CELL_SIZE (on décale de 2 cellules vers la gauche)
   */
  const leftResizeGesture = useMemo(() =>
    Gesture.Pan()
      .enabled(isEditing && editionMode)
      .onStart(() => {
        'worklet';
        // 💾 Capturer les valeurs de départ (RÉFÉRENCE pour tout le geste)
        startWidth.value = currentWidth.value;
        startX.value = currentX.value;
      })
      .onUpdate((event) => {
        'worklet';
        // 🔍 Compenser le zoom pour que le resize suive le curseur
        const compensatedTranslationX = event.translationX / zoomScale.value;
        // 📏 Calculer la nouvelle largeur (tirer vers gauche = réduire translationX)
        const rawWidth = startWidth.value - compensatedTranslationX;
        const snappedWidth = Math.max(MIN_CELLS * CELL_SIZE, Math.round(rawWidth / CELL_SIZE) * CELL_SIZE);

        // ⚠️ IMPORTANT : Utiliser startWidth comme référence (pas currentWidth)
        const deltaWidth = snappedWidth - startWidth.value;

        // Appliquer le resize visuel
        width.value = snappedWidth;
        // Déplacer vers la gauche de la différence (compensation visuelle)
        translateX.value = -deltaWidth;
      })
      .onEnd(() => {
        'worklet';
        // 🧮 Calculer le décalage en cellules de grille
        const deltaGrid = (width.value - startWidth.value) / CELL_SIZE;

        // ⚠️ IMPORTANT : Utiliser startX comme référence (pas currentX)
        const newX = startX.value - deltaGrid * CELL_SIZE;

        // 🚀 Validation et update backend (avec nouvelle position X)
        runOnJS(handleUpdateSize)(width.value, currentHeight.value, newX, undefined);
      })
      .runOnJS(false),
    [isEditing, editionMode, handleUpdateSize]);

  const bottomResizeGesture = useMemo(() =>
    Gesture.Pan()
      .enabled(isEditing && editionMode)
      .onStart(() => {
        'worklet';
        startHeight.value = currentHeight.value;
      })
      .onUpdate((event) => {
        'worklet';
        // 🔍 Compenser le zoom pour que le resize suive le curseur
        const compensatedTranslationY = event.translationY / zoomScale.value;
        const rawHeight = startHeight.value + compensatedTranslationY;
        const snappedHeight = Math.max(MIN_CELLS * CELL_SIZE, Math.round(rawHeight / CELL_SIZE) * CELL_SIZE);
        height.value = snappedHeight;
      })
      .onEnd(() => {
        'worklet';
        // Ne PAS mettre à jour currentHeight ici - laisser handleUpdateSize le faire
        runOnJS(handleUpdateSize)(currentWidth.value, height.value);
      })
      .runOnJS(false),
    [isEditing, editionMode, handleUpdateSize]);

  const topResizeGesture = useMemo(() =>
    Gesture.Pan()
      .enabled(isEditing && editionMode)
      .onStart(() => {
        'worklet';
        startHeight.value = currentHeight.value;
        startY.value = currentY.value;
      })
      .onUpdate((event) => {
        'worklet';
        // 🔍 Compenser le zoom pour que le resize suive le curseur
        const compensatedTranslationY = event.translationY / zoomScale.value;
        const rawHeight = startHeight.value - compensatedTranslationY;
        const snappedHeight = Math.max(MIN_CELLS * CELL_SIZE, Math.round(rawHeight / CELL_SIZE) * CELL_SIZE);
        const deltaHeight = snappedHeight - startHeight.value; // Utiliser startHeight comme référence

        height.value = snappedHeight;
        translateY.value = -deltaHeight;
      })
      .onEnd(() => {
        'worklet';
        const deltaGrid = (height.value - startHeight.value) / CELL_SIZE; // Utiliser startHeight
        const newY = startY.value - deltaGrid * CELL_SIZE; // Utiliser startY

        runOnJS(handleUpdateSize)(currentWidth.value, height.value, undefined, newY);
      })
      .runOnJS(false),
    [isEditing, editionMode, handleUpdateSize]);

  /**
   * 🖐️ GESTE DE DRAG (déplacement de table)
   *
   * Geste Pan qui permet de déplacer une table avec le doigt/souris.
   * Utilise un système de "drag fluide + ghost preview + snap final".
   *
   * 🎯 FONCTIONNEMENT EN 3 PHASES :
   *
   * 1️⃣ onStart (début du drag) :
   *    - Agrandit légèrement la table (scale = 1.05) pour feedback visuel
   *    - Sauvegarde la position de départ dans lastValidX/Y
   *    - Précalcule les limites max (roomWidth - tableWidth) pour performance
   *    - Reset translateX/Y à 0
   *
   * 2️⃣ onUpdate (pendant le drag, ~60fps) :
   *    - translateX/Y suit EXACTEMENT le doigt (pas de snap)
   *    - Calcule la position snappée pour le GHOST uniquement
   *    - Le ghost montre où la table va se placer quand on relâche
   *    - Contraindre ghost dans les limites de la room
   *
   * 3️⃣ onEnd (relâchement) :
   *    - Calcule la position finale snappée à la grille
   *    - Appelle handleUpdatePosition qui valide et met à jour backend
   *    - Reset scale à 1 et cache le ghost
   *
   * ⚡ OPTIMISATION :
   * Les valeurs cachedMaxX/Y sont calculées UNE SEULE FOIS dans onStart.
   * Cela évite de recalculer 60 fois par seconde dans onUpdate.
   */
  const dragGesture = useMemo(() =>
    Gesture.Pan()
      .enabled(isEditing && editionMode)
      .onStart(() => {
        'worklet';
        // 🎨 Feedback visuel : agrandir légèrement
        scale.value = 1.05;

        // 💾 Sauvegarder la position actuelle
        lastValidX.value = currentX.value;
        lastValidY.value = currentY.value;
        startX.value = currentX.value;
        startY.value = currentY.value;
        translateX.value = 0;
        translateY.value = 0;

        // ⚡ Précalculer une seule fois au début du drag (optimisation)
        cachedTableWidthInCells.value = Math.round(currentWidth.value / CELL_SIZE);
        cachedTableHeightInCells.value = Math.round(currentHeight.value / CELL_SIZE);
        cachedMaxX.value = roomWidth - cachedTableWidthInCells.value;
        cachedMaxY.value = roomHeight - cachedTableHeightInCells.value;
      })
      .onUpdate((event) => {
        'worklet';
        // 👆 Mouvement direct SANS snap (suit exactement le doigt)
        // 🔍 Diviser par zoomScale pour compenser le zoom sur grandes grilles
        const compensatedTranslationX = event.translationX / zoomScale.value;
        const compensatedTranslationY = event.translationY / zoomScale.value;

        translateX.value = compensatedTranslationX;
        translateY.value = compensatedTranslationY;

        // 👻 Calculs optimisés pour le fantôme (preview de la position snappée)
        const snappedGridX = Math.round((currentX.value + compensatedTranslationX) / CELL_SIZE);
        const snappedGridY = Math.round((currentY.value + compensatedTranslationY) / CELL_SIZE);

        // Contraindre dans les limites de la room
        const constrainedX = Math.max(0, Math.min(snappedGridX, cachedMaxX.value));
        const constrainedY = Math.max(0, Math.min(snappedGridY, cachedMaxY.value));

        // Positionner le ghost à la position snappée
        ghostX.value = constrainedX * CELL_SIZE;
        ghostY.value = constrainedY * CELL_SIZE;
        ghostOpacity.value = 0.3;
      })
      .onEnd(() => {
        'worklet';
        // 🎨 Reset des effets visuels
        scale.value = withSpring(1);
        ghostOpacity.value = withSpring(0);

        // 📍 Snap final à la grille - réutiliser les valeurs précalculées
        const snappedGridX = Math.round((currentX.value + translateX.value) / CELL_SIZE);
        const snappedGridY = Math.round((currentY.value + translateY.value) / CELL_SIZE);

        const constrainedX = Math.max(0, Math.min(snappedGridX, cachedMaxX.value));
        const constrainedY = Math.max(0, Math.min(snappedGridY, cachedMaxY.value));

        const finalX = constrainedX * CELL_SIZE;
        const finalY = constrainedY * CELL_SIZE;

        // 🚀 Envoyer au JS thread pour validation et update backend
        runOnJS(handleUpdatePosition)(finalX, finalY);
      })
      .runOnJS(false),
  [isEditing, editionMode, handleUpdatePosition, roomWidth, roomHeight]);

  // Geste composé uniquement pour la table principale (pas les handles)
  const composedGesture = useMemo(() => {
    if (isEditing && editionMode) {
      return dragGesture;
    }
    return Gesture.Exclusive(longPressGesture, tapGesture);
  }, [isEditing, editionMode, dragGesture, longPressGesture, tapGesture]);

  // Style animé pour la table
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute' as const,
      left: currentX.value + translateX.value,
      top: currentY.value + translateY.value,
      width: width.value,
      height: height.value,
      transform: [
        { scale: scale.value }
      ],
      opacity: opacity.value,
      zIndex: isSelected ? 10000 : 1000,
    };
  }, [isSelected]);

  // Style pour l'aperçu fantôme
  const ghostStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute' as const,
      left: ghostX.value,
      top: ghostY.value,
      width: width.value,
      height: height.value,
      opacity: ghostOpacity.value,
      zIndex: 999, // Juste en dessous de la table
      borderWidth: 2,
      borderColor: '#2A2E33',
      borderStyle: 'dashed',
      borderRadius: 5,
      backgroundColor: 'rgba(42, 46, 51, 0.1)',
    };
  });

  // Reset des animations quand la table change
  React.useEffect(() => {
    if (!isEditing) {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
    }
  }, [isEditing, table.xStart, table.yStart]);

  // Validation de position
  React.useEffect(() => {
    if (!positionValid && isEditing) {
      opacity.value = withSpring(0.5);
    } else {
      opacity.value = withSpring(1);
    }
  }, [positionValid, isEditing]);

  const tableStyle = useMemo(() => ({
    backgroundColor: !editionMode && status ? getStatusColor(status) : '#D9D9D9',
    ...(isEditing
      ? { borderWidth: 3, borderColor: '#2A2E33', borderStyle: 'solid' as const }
      : (status ? getStatusBorderStyle(status, table) : { borderWidth: 2, borderColor: '#AAAAAA', borderStyle: 'solid' as const })
    ),
  }), [status, isEditing, table]);

  // 🎨 Style pour le conteneur avec curseur et texte non sélectionnable (web)
  const containerStyle = useMemo(() => ({
    ...(Platform.OS === 'web' && {
      userSelect: 'none' as any,
      WebkitUserSelect: 'none' as any,
      ...(isEditing && editionMode && {
        cursor: 'move' as any,
      }),
    }),
  }), [isEditing, editionMode]);

  return (
    <>
      {/* Aperçu fantôme de la position snappée */}
      {isEditing && editionMode && <Animated.View style={ghostStyle} pointerEvents="none" />}

      <Animated.View style={animatedStyle}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[{ width: '100%', height: '100%' }, containerStyle]}>
            <RoomChairs position="top" table={table} CELL_SIZE={CELL_SIZE} />
            <RoomChairs position="left" table={table} CELL_SIZE={CELL_SIZE} />

            <View style={styles.innerContainer}>
              <View style={[styles.table, tableStyle]}>
                <Text style={styles.tableText}>{table.name}</Text>
              </View>
            </View>

            <RoomChairs position="right" table={table} CELL_SIZE={CELL_SIZE} />
            <RoomChairs position="bottom" table={table} CELL_SIZE={CELL_SIZE} />
          </Animated.View>
        </GestureDetector>

        {isEditing && editionMode && (
          <>
            {/* Handle de redimensionnement droit */}
            <GestureDetector gesture={rightResizeGesture}>
              <Animated.View style={styles.rightHandle}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>

            {/* Handle de redimensionnement gauche */}
            <GestureDetector gesture={leftResizeGesture}>
              <Animated.View style={styles.leftHandle}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>

            {/* Handle de redimensionnement bas */}
            <GestureDetector gesture={bottomResizeGesture}>
              <Animated.View style={styles.bottomHandle}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>

            {/* Handle de redimensionnement haut */}
            <GestureDetector gesture={topResizeGesture}>
              <Animated.View style={styles.topHandle}>
                <View style={styles.handleDot} />
              </Animated.View>
            </GestureDetector>
          </>
        )}
      </Animated.View>
    </>
  );
};

// 🚀 OPTIMISATION: React.memo pour éviter re-renders inutiles
const RoomTableMemoized = React.memo(RoomTable, (prevProps, nextProps) => {
  // Comparaison granulaire: re-render seulement si ces props changent
  return (
    prevProps.table.id === nextProps.table.id &&
    prevProps.table.xStart === nextProps.table.xStart &&
    prevProps.table.yStart === nextProps.table.yStart &&
    prevProps.table.width === nextProps.table.width &&
    prevProps.table.height === nextProps.table.height &&
    prevProps.table.name === nextProps.table.name &&
    prevProps.table.seats === nextProps.table.seats &&
    prevProps.status === nextProps.status &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.positionValid === nextProps.positionValid &&
    prevProps.isSelected === nextProps.isSelected
    // ⚡ currentZoomScale est une SharedValue (référence stable, pas besoin de comparer)
    // Note: on ignore tables, callbacks et autres props stables
  );
});

RoomTableMemoized.displayName = 'RoomTable';

const styles = StyleSheet.create({
  innerContainer: {
    width: '100%',
    height: '100%',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  table: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 3,
  },
  tableText: {
    color: '#2A2E33',
    fontWeight: 'bold',
  },
  // 🎯 HANDLES DE RESIZE - Style de base avec priorité et curseurs
  rightHandle: {
    position: 'absolute',
    right: -5,
    top: '50%',
    width: 30,
    height: 30,
    transform: [{ translateY: -15 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001, // Priorité sur le drag de la table
    ...(Platform.OS === 'web' && { cursor: 'ew-resize' as any }),
  },
  leftHandle: {
    position: 'absolute',
    left: -5,
    top: '50%',
    width: 30,
    height: 30,
    transform: [{ translateY: -15 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
    ...(Platform.OS === 'web' && { cursor: 'ew-resize' as any }),
  },
  bottomHandle: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
    width: 30,
    height: 30,
    transform: [{ translateX: -15 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
    ...(Platform.OS === 'web' && { cursor: 'ns-resize' as any }),
  },
  topHandle: {
    position: 'absolute',
    top: -5,
    left: '50%',
    width: 30,
    height: 30,
    transform: [{ translateX: -15 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
    ...(Platform.OS === 'web' && { cursor: 'ns-resize' as any }),
  },
  handleDot: {
    width: 20, // Légèrement plus gros pour meilleure visibilité
    height: 20,
    backgroundColor: '#2A2E33',
    borderRadius: 10,
    // Halo pour meilleur feedback visuel
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

// 🚀 Export de la version memoïzée pour optimisation des re-renders
export { RoomTableMemoized as RoomTable };