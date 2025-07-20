import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Modal } from 'react-native';
import { TextInput, Text } from '~/components/ui';
import { ListFilter, Search, X } from 'lucide-react-native';
import { OrderFilterState } from '~/components/filters/OrderFilters';
import { FilterTooltip } from './FilterTooltip';
import { getActiveFiltersCount } from '~/utils/orderFilters';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: OrderFilterState;
  onFiltersChange: (filters: OrderFilterState) => void;
  onClearFilters: () => void;
}

export function SearchBar({ 
  searchQuery, 
  onSearchChange, 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: SearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filterButtonLayout, setFilterButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const filterButtonRef = useRef<View>(null);
  const searchInputRef = useRef<any>(null);
  const activeFiltersCount = useMemo(() => getActiveFiltersCount(filters), [filters]);

  const handleOpenFilters = () => {
    if (filterButtonRef.current) {
      filterButtonRef.current.measure((_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
        setFilterButtonLayout({ x: pageX, y: pageY, width, height });
        setShowFilters(true);
      });
    }
  };

  const handleCloseFilters = () => {
    setShowFilters(false);
  };

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  const handleContainerPress = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
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
            placeholder="Rechercher par table..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            {...Platform.select({
              ios: {
                enablesReturnKeyAutomatically: true,
              },
              android: {
                underlineColorAndroid: 'transparent',
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

        {/* Bouton filtres (à droite) */}
        <TouchableOpacity
          ref={filterButtonRef}
          style={[
            styles.iconButton,
            activeFiltersCount > 0 && {
              borderColor: '#2A2E33',
              backgroundColor: '#FFFFFF',
            }
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

      {/* Infobulle de filtres à droite de l'icône */}
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
            <View style={[
              styles.tooltipContainer,
              filterButtonLayout && {
                top: filterButtonLayout.y - 8,
                left: filterButtonLayout.x + filterButtonLayout.width + 8,
              }
            ]}>
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
    paddingHorizontal: 3,
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
    paddingHorizontal: 16,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    ...Platform.select({
      web: {
        backgroundColor: 'transparent',
        // cursor: 'text' as any,
      },
      android: {
        textAlignVertical: 'center',
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
    top: 20,
    left: -8,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#FFFFFF',
    zIndex: 1001,
  },
});