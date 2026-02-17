import { useCallback, useEffect, useRef } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

export const MENUS_SECTION_KEY = '__MENUS__';

export interface ScrollSyncSection {
  key: string;
  offset: number;
}

interface UseScrollSyncOptions {
  activeItemType: string;
  activeMainTab: string;
  onActiveItemTypeChange: (itemType: string) => void;
  onMainTabChange: (tab: string) => void;
  /** Returns ordered sections with their pixel offsets (top → bottom) */
  getSections: () => ScrollSyncSection[];
  /** Scrolls the underlying list/scroll view to the given section */
  scrollToSection: (sectionKey: string) => void;
}

/**
 * Hook de synchronisation bidirectionnelle scroll ↔ sidebar.
 *
 * - Sidebar click → auto-scroll vers la section
 * - User scroll → détection de la section visible → mise à jour sidebar
 *
 * Partagé entre CardView (ScrollView) et TableView (SectionList).
 * Chaque vue fournit sa propre implémentation de `getSections` et `scrollToSection`.
 */
export function useScrollSync({
  activeItemType,
  activeMainTab,
  onActiveItemTypeChange,
  onMainTabChange,
  getSections,
  scrollToSection,
}: UseScrollSyncOptions) {
  const isProgrammaticScroll = useRef(false);
  const scrollTriggeredUpdate = useRef(false);
  const activeItemTypeRef = useRef(activeItemType);
  const activeMainTabRef = useRef(activeMainTab);
  activeItemTypeRef.current = activeItemType;
  activeMainTabRef.current = activeMainTab;

  // Auto-scroll vers la section active quand la sidebar change
  useEffect(() => {
    if (scrollTriggeredUpdate.current) {
      scrollTriggeredUpdate.current = false;
      return;
    }
    const targetKey = activeMainTab === 'MENUS' ? MENUS_SECTION_KEY : activeItemType;

    isProgrammaticScroll.current = true;
    scrollToSection(targetKey);
    setTimeout(() => { isProgrammaticScroll.current = false; }, 400);
  }, [activeItemType, activeMainTab, scrollToSection]);

  // Détection de la section visible au scroll
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isProgrammaticScroll.current) return;

    const scrollY = event.nativeEvent.contentOffset.y;
    const sections = getSections();
    if (sections.length === 0) return;

    let currentKey = sections[0].key;
    for (const section of sections) {
      if (section.offset <= scrollY + 50) {
        currentKey = section.key;
      }
    }

    if (currentKey === MENUS_SECTION_KEY) {
      if (activeMainTabRef.current !== 'MENUS') {
        scrollTriggeredUpdate.current = true;
        onMainTabChange('MENUS');
      }
    } else {
      if (activeMainTabRef.current !== 'ITEMS' || currentKey !== activeItemTypeRef.current) {
        scrollTriggeredUpdate.current = true;
        if (activeMainTabRef.current !== 'ITEMS') {
          onMainTabChange('ITEMS');
        }
        onActiveItemTypeChange(currentKey);
      }
    }
  }, [onActiveItemTypeChange, onMainTabChange, getSections]);

  return { handleScroll };
}
