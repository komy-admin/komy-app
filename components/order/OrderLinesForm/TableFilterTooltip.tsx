import { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Modal } from 'react-native';
import { Text } from '~/components/ui';
import { XIcon, ListFilter } from 'lucide-react-native';

interface TableFilterTooltipProps {
  onClose: () => void;
}

export function TableFilterTooltip({ onClose }: TableFilterTooltipProps) {
  return (
    <View style={styles.container}>
      {/* Header compact */}
      <View style={styles.header}>
        <Text style={styles.title}>Filtres</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <XIcon size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Placeholder pour les filtres futurs */}
      <View style={styles.section}>
        <Text style={styles.placeholderText}>
          Filtres à venir...
        </Text>
      </View>
    </View>
  );
}

interface TableFilterButtonProps {
  activeFiltersCount?: number;
}

export function TableFilterButton({ activeFiltersCount = 0 }: TableFilterButtonProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [buttonLayout, setButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleLayout = (event: any) => {
    event.target.measureInWindow((pageX: number, pageY: number, w: number, h: number) => {
      setButtonLayout({ x: pageX, y: pageY, width: w, height: h });
    });
  };

  const handleOpenFilters = () => {
    if (buttonLayout) {
      setShowFilters(true);
    }
  };

  const handleCloseFilters = () => {
    setShowFilters(false);
  };

  return (
    <>
      <View onLayout={handleLayout} collapsable={false}>
        <TouchableOpacity
          style={[
            styles.iconButton,
            activeFiltersCount > 0 && styles.iconButtonActive
          ]}
          onPress={handleOpenFilters}
          activeOpacity={0.7}
        >
          <ListFilter
            size={17}
            color={activeFiltersCount > 0 ? "#2563EB" : "#2A2E33"}
            strokeWidth={2.5}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {activeFiltersCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal avec tooltip */}
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
              buttonLayout && {
                top: buttonLayout.y - 8,
                left: buttonLayout.x + buttonLayout.width + 8,
              }
            ]}>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.tooltip}>
                  {/* Flèche pointant vers le bouton filtres */}
                  <View style={styles.tooltipArrow} />
                  <TableFilterTooltip onClose={handleCloseFilters} />
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
  // Tooltip container
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: 280,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 2,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  section: {
    padding: 12,
  },
  placeholderText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },

  // Filter button
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      }
    })
  },
  iconButtonActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 12,
  },

  // Modal and tooltip
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
