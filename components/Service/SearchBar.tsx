import { useState, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Modal, TextInput as RNTextInput, LayoutChangeEvent } from 'react-native';
import { TextInput, Text } from '~/components/ui';
import { ListFilter, Search, X } from 'lucide-react-native';
import { OrderFilterState } from '~/components/filters/OrderFilters';
import { FilterTooltip } from './FilterTooltip';
import { getActiveFiltersCount } from '~/utils/orderFilters';

// Types
interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: OrderFilterState;
  onFiltersChange: (filters: OrderFilterState) => void;
  onClearFilters: () => void;
}

interface ButtonLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Constantes
const TOOLTIP_OFFSET = 8;
const ARROW_TOP_POSITION = 20;
const ARROW_LEFT_POSITION = -8;

export function SearchBar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearFilters
}: SearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [buttonLayout, setButtonLayout] = useState<ButtonLayout | null>(null);
  const filterButtonRef = useRef<View>(null);
  const searchInputRef = useRef<RNTextInput>(null);
  const activeFiltersCount = useMemo(() => getActiveFiltersCount(filters), [filters]);

  // Fonction utilitaire pour capturer la position du bouton sur web
  const captureWebButtonPosition = useCallback(() => {
    if (Platform.OS === 'web' && filterButtonRef.current) {
      const element = filterButtonRef.current as any;
      if (element.getBoundingClientRect) {
        const rect = element.getBoundingClientRect();
        setButtonLayout({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        });
      }
    }
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    if (Platform.OS === 'web') {
      // Web: capturer via getBoundingClientRect ou fallback sur nativeEvent
      captureWebButtonPosition();
    } else {
      // Mobile: utiliser measureInWindow
      const eventTarget = event.target as any;
      if (eventTarget?.measureInWindow) {
        eventTarget.measureInWindow((pageX: number, pageY: number, w: number, h: number) => {
          setButtonLayout({ x: pageX, y: pageY, width: w, height: h });
        });
      }
    }
  }, [captureWebButtonPosition]);

  const handleOpenFilters = useCallback(() => {
    // Sur web, toujours capturer la position avant d'ouvrir
    if (Platform.OS === 'web') {
      captureWebButtonPosition();
      // Utiliser setTimeout pour s'assurer que le state est mis à jour avant d'ouvrir
      setTimeout(() => setShowFilters(true), 0);
    } else if (buttonLayout) {
      // Sur mobile, ouvrir seulement si on a la position
      setShowFilters(true);
    }
  }, [buttonLayout, captureWebButtonPosition]);

  const handleCloseFilters = useCallback(() => {
    setShowFilters(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  const handleContainerPress = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  return (
    <>
      <View style={styles.container}>
        {/* Champ de recherche */}
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={handleContainerPress}
          activeOpacity={1}
        >
          <Search size={16} color="#9CA3AF" strokeWidth={1.5} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Rechercher"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            numberOfLines={1}
            multiline={false}
            maxLength={50}
            {...Platform.select({
              ios: {
                enablesReturnKeyAutomatically: true,
              },
              android: {
                underlineColorAndroid: 'transparent',
                textBreakStrategy: 'simple',
                hyphenationFrequency: 'none',
              },
              web: {
                tabIndex: 0,
                style: {
                  outline: 'none',
                  border: 'none',
                  boxShadow: 'none',
                }
              }
            })}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
              activeOpacity={0.7}
            >
              <X size={16} color="#9CA3AF" strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Bouton filtres (à droite) avec Modal */}
        <View onLayout={handleLayout} collapsable={false}>
          <TouchableOpacity
            ref={filterButtonRef}
            style={[
              styles.iconButton,
              activeFiltersCount > 0 && styles.iconButtonActive
            ]}
            onPress={handleOpenFilters}
            activeOpacity={0.7}
          >
            <ListFilter
              size={18}
              color="#374151"
              strokeWidth={1.5}
            />
            {activeFiltersCount > 0 && (
              <View style={styles.badge}>
                <Text
                  style={[
                    styles.badgeText,
                    Platform.select({
                      web: {
                        fontSize: 11,
                        lineHeight: 10,
                      }
                    })
                  ]}
                >
                  {activeFiltersCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal avec tooltip de filtres */}
      {showFilters && (
        <Modal
          visible={showFilters}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseFilters}
        >
          <TouchableOpacity
            style={styles.overlayBackground}
            activeOpacity={1}
            onPress={handleCloseFilters}
          >
            <View
              style={[
                styles.tooltipContainer,
                buttonLayout && {
                  top: buttonLayout.y,
                  left: buttonLayout.x + buttonLayout.width + TOOLTIP_OFFSET,
                }
              ]}
            >
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.tooltip}>
                  {/* Flèche pointant vers le bouton filtres */}
                  <View style={styles.tooltipArrow} />
                  <FilterTooltip
                    filters={filters}
                    onFiltersChange={onFiltersChange}
                    onClearFilters={onClearFilters}
                    onClose={handleCloseFilters}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
    position: 'relative',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    ...Platform.select({
      web: { cursor: 'pointer' as any }
    })
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
    ...Platform.select({
      web: { cursor: 'pointer' as any }
    })
  },
  iconButtonActive: {
    borderColor: '#2A2E33',
    backgroundColor: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 12,
    ...Platform.select({
      web: {
        WebkitTextFillColor: '#FFFFFF',
        textFillColor: '#FFFFFF',
      }
    })
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 22,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
    minWidth: 80,
    ...Platform.select({
      web: { cursor: 'text' as any }
    })
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    padding: 0,
    margin: 0,
    height: 28,
    borderWidth: 0,
    textAlign: 'left',
    includeFontPadding: false,
    minWidth: 40,
    maxWidth: '100%',
    ...Platform.select({
      web: {
        backgroundColor: 'transparent',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        minWidth: 40,
      },
      android: {
        textAlignVertical: 'center',
        includeFontPadding: false,
        minWidth: 40,
        textBreakStrategy: 'simple',
      },
      ios: {
        textAlign: 'left',
        minWidth: 40,
      }
    })
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  tooltipContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  tooltip: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipArrow: {
    position: 'absolute',
    top: ARROW_TOP_POSITION,
    left: ARROW_LEFT_POSITION,
    width: 0,
    height: 0,
    borderTopWidth: TOOLTIP_OFFSET,
    borderBottomWidth: TOOLTIP_OFFSET,
    borderRightWidth: TOOLTIP_OFFSET,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#FFFFFF',
    zIndex: 1001,
  },
});