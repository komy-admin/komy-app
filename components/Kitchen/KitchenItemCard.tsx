import React, { useMemo, useRef, useCallback } from "react";
import { TouchableOpacity, View, StyleSheet, Text as RNText, PanResponder, Animated, Platform } from "react-native";
import { Status } from "~/types/status.enum";
import { DateFormat, formatDate, formatPrice, getTableShortId, formatTagValue, getFieldTypeConfig } from "~/lib/utils";
import { ArrowLeft, ArrowRight, StickyNote, ChevronRight } from "lucide-react-native";

// ==================== TYPES ====================

interface KitchenItem {
  id: string;
  type: 'ITEM' | 'MENU_ITEM';
  itemName: string;
  itemType?: string;
  menuName?: string;
  menuId?: string;
  orderLineId?: string;
  status?: Status;
  isOverdue: boolean;
  note?: string;
  tags?: Array<{
    tagSnapshot: {
      label: string;
      fieldType: string;
    };
    priceModifier?: number;
  }>;
}

interface KitchenItemGroup {
  id: string;
  orderId: string;
  orderNumber: string;
  tableName: string;
  status: Status;
  items: KitchenItem[];
  isOverdue: boolean;
  createdAt: string;
}

interface SwipeableCategoryHeaderProps {
  category: string;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  canGoForward: boolean;
  canGoBack: boolean;
}

// ==================== CONSTANTES ====================

const STATUS_ORDER = [Status.PENDING, Status.INPROGRESS, Status.READY];
const SWIPE_THRESHOLD = 60;
const SWIPE_ANIMATION_DURATION = 150;
const ANIMATION_DELAY = 100;
const MIN_SWIPE_DISTANCE = 10;

const COLORS = {
  forward: '#6EE7B7',
  backward: '#FDBA74',
  forwardIcon: '#10B981',
  backwardIcon: '#F97316',
} as const;

// ==================== COMPOSANT HEADER DE CATÉGORIE ====================

function SwipeableCategoryHeader({
  category,
  onSwipeRight,
  onSwipeLeft,
  canGoForward,
  canGoBack,
}: SwipeableCategoryHeaderProps) {
  const progressWidth = useRef(new Animated.Value(0)).current;
  const [isGoingForward, setIsGoingForward] = React.useState(true);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [progressBarWidth, setProgressBarWidth] = React.useState(0);

  // Cleanup listener on unmount
  React.useEffect(() => {
    const listenerId = progressWidth.addListener(({ value }) => {
      if (containerWidth > 0) {
        setProgressBarWidth((value / 100) * containerWidth);
      }
    });

    return () => {
      progressWidth.removeListener(listenerId);
    };
  }, [containerWidth, progressWidth]);

  // Version Web: simple tap
  if (Platform.OS === 'web') {
    return (
      <View style={styles.categoryHeaderWrapper}>
        <View style={styles.categoryHeaderBackground} />
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={onSwipeRight}
          disabled={!canGoForward}
          activeOpacity={0.7}
        >
          <View style={styles.categoryHeaderContent}>
            <RNText style={styles.categoryName}>{category.toUpperCase()}</RNText>
            <View style={styles.categorySwipeIndicator}>
              {canGoBack && (
                <ChevronRight size={14} color={COLORS.backwardIcon} strokeWidth={2} style={{ transform: [{ rotate: '180deg' }] }} />
              )}
              {canGoForward && (
                <>
                  <ChevronRight size={14} color={COLORS.forwardIcon} strokeWidth={2} />
                  <ChevronRight size={14} color={COLORS.forwardIcon} strokeWidth={2} style={{ marginLeft: -6 }} />
                  <ChevronRight size={14} color={COLORS.forwardIcon} strokeWidth={2} style={{ marginLeft: -6 }} />
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Version Mobile: swipe avec animation
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > MIN_SWIPE_DISTANCE,

        onPanResponderMove: (_, gestureState) => {
          const dx = gestureState.dx;

          if (dx > 0 && canGoForward) {
            setIsGoingForward(true);
            const clampedDx = Math.min(dx, 100);
            progressWidth.setValue(clampedDx);
          } else if (dx < 0 && canGoBack) {
            setIsGoingForward(false);
            const clampedDx = Math.max(dx, -100);
            progressWidth.setValue(Math.abs(clampedDx));
          }
        },

        onPanResponderRelease: (_, gestureState) => {
          const dx = gestureState.dx;

          if (dx > SWIPE_THRESHOLD && canGoForward) {
            Animated.timing(progressWidth, {
              toValue: 100,
              duration: SWIPE_ANIMATION_DURATION,
              useNativeDriver: false,
            }).start(() => {
              setTimeout(() => {
                onSwipeRight();
                progressWidth.setValue(0);
              }, ANIMATION_DELAY);
            });
          } else if (dx < -SWIPE_THRESHOLD && canGoBack) {
            Animated.timing(progressWidth, {
              toValue: 100,
              duration: SWIPE_ANIMATION_DURATION,
              useNativeDriver: false,
            }).start(() => {
              setTimeout(() => {
                onSwipeLeft();
                progressWidth.setValue(0);
              }, ANIMATION_DELAY);
            });
          } else {
            Animated.timing(progressWidth, {
              toValue: 0,
              duration: SWIPE_ANIMATION_DURATION,
              useNativeDriver: false,
            }).start();
          }
        },
      }),
    [canGoForward, canGoBack, progressWidth, onSwipeRight, onSwipeLeft]
  );

  return (
    <View
      style={styles.categoryHeaderWrapper}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.categoryHeaderBackground} />

      {progressBarWidth > 0 && (
        <View
          style={[
            styles.progressBarAnimated,
            {
              backgroundColor: isGoingForward ? COLORS.forward : COLORS.backward,
              opacity: 0.8,
              [isGoingForward ? 'left' : 'right']: 0,
              width: progressBarWidth,
            },
          ]}
        />
      )}

      <Animated.View {...panResponder.panHandlers} style={styles.categoryHeader}>
        <View style={styles.categoryHeaderContent}>
          <RNText style={styles.categoryName}>{category.toUpperCase()}</RNText>
          <View style={styles.categorySwipeIndicator}>
            {canGoBack && (
              <ChevronRight size={14} color={COLORS.backwardIcon} strokeWidth={2} style={{ transform: [{ rotate: '180deg' }] }} />
            )}
            {canGoForward && (
              <>
                <ChevronRight size={14} color={COLORS.forwardIcon} strokeWidth={2} />
                <ChevronRight size={14} color={COLORS.forwardIcon} strokeWidth={2} style={{ marginLeft: -6 }} />
                <ChevronRight size={14} color={COLORS.forwardIcon} strokeWidth={2} style={{ marginLeft: -6 }} />
              </>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function KitchenItemCard({
  itemGroup,
  onStatusChange,
  onIndividualItemStatusChange,
}: {
  itemGroup: KitchenItemGroup;
  onStatusChange: (itemGroup: KitchenItemGroup, newStatus: Status) => void;
  onIndividualItemStatusChange?: (item: KitchenItem, newStatus: Status) => void;
}) {
  const currentStatusIndex = STATUS_ORDER.indexOf(itemGroup.status);
  const canGoBack = currentStatusIndex > 0;
  const canGoForward = currentStatusIndex < STATUS_ORDER.length - 1;

  // Grouper les items par catégorie
  const itemsByCategory = useMemo(() => {
    const groups = new Map<string, KitchenItem[]>();

    itemGroup.items.forEach(item => {
      const category = item.itemType || 'Autre';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(item);
    });

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [itemGroup.items]);

  // ==================== HANDLERS ====================

  const handleStatusBack = useCallback(() => {
    if (canGoBack) {
      const newStatus = STATUS_ORDER[currentStatusIndex - 1];
      onStatusChange(itemGroup, newStatus);
    }
  }, [canGoBack, currentStatusIndex, itemGroup, onStatusChange]);

  const handleStatusForward = useCallback(() => {
    if (canGoForward) {
      const newStatus = STATUS_ORDER[currentStatusIndex + 1];
      onStatusChange(itemGroup, newStatus);
    }
  }, [canGoForward, currentStatusIndex, itemGroup, onStatusChange]);

  const handleCategorySwipeRight = useCallback((categoryItems: KitchenItem[]) => {
    if (!canGoForward) return;

    const newStatus = STATUS_ORDER[currentStatusIndex + 1];

    const itemsToUpdate = categoryItems.filter(item => {
      const itemStatusIndex = item.status ? STATUS_ORDER.indexOf(item.status) : currentStatusIndex;
      return itemStatusIndex < STATUS_ORDER.length - 1 && itemGroup.status !== Status.READY;
    });

    if (itemsToUpdate.length === 0) return;

    const tempGroup: KitchenItemGroup = {
      ...itemGroup,
      items: itemsToUpdate,
    };

    onStatusChange(tempGroup, newStatus);
  }, [canGoForward, currentStatusIndex, itemGroup, onStatusChange]);

  const handleCategorySwipeLeft = useCallback((categoryItems: KitchenItem[]) => {
    if (!canGoBack) return;

    const newStatus = STATUS_ORDER[currentStatusIndex - 1];

    const itemsToUpdate = categoryItems.filter(item => {
      const itemStatusIndex = item.status ? STATUS_ORDER.indexOf(item.status) : currentStatusIndex;
      return itemStatusIndex > 0;
    });

    if (itemsToUpdate.length === 0) return;

    const tempGroup: KitchenItemGroup = {
      ...itemGroup,
      items: itemsToUpdate,
    };

    onStatusChange(tempGroup, newStatus);
  }, [canGoBack, currentStatusIndex, itemGroup, onStatusChange]);

  const handleItemTapForward = useCallback((item: KitchenItem) => {
    if (!onIndividualItemStatusChange) return;

    const itemStatusIndex = item.status ? STATUS_ORDER.indexOf(item.status) : currentStatusIndex;

    if (itemStatusIndex >= STATUS_ORDER.length - 1) return;
    if (itemGroup.status === Status.READY) return;

    const newStatus = STATUS_ORDER[itemStatusIndex + 1];
    onIndividualItemStatusChange(item, newStatus);
  }, [onIndividualItemStatusChange, currentStatusIndex, itemGroup.status]);

  const tableShortId = getTableShortId(itemGroup.tableName);

  // ==================== RENDER ====================

  return (
    <View style={[styles.card, itemGroup.isOverdue && styles.overdueCard]}>
      {/* Header */}
      <View style={styles.header}>
        {canGoBack && (
          <TouchableOpacity
            onPress={handleStatusBack}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color="#6B7280" />
          </TouchableOpacity>
        )}

        <View style={styles.headerInfo}>
          <RNText style={styles.tableId}>{tableShortId}</RNText>
          <RNText style={styles.separator}>•</RNText>
          <RNText style={styles.orderTime}>{formatDate(itemGroup.createdAt, DateFormat.TIME)}</RNText>
        </View>

        <View style={styles.itemCountBadge}>
          <RNText style={styles.itemCountText}>{itemGroup.items.length}</RNText>
        </View>

        {canGoForward && (
          <TouchableOpacity
            onPress={handleStatusForward}
            style={[styles.actionButton, styles.actionButtonForward]}
            activeOpacity={0.7}
          >
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Items groupés par catégorie */}
      <View style={styles.content}>
        {itemsByCategory.map(([category, items], categoryIndex) => (
          <View
            key={category}
            style={[
              styles.categorySection,
              categoryIndex === itemsByCategory.length - 1 && styles.categorySectionLast,
            ]}
          >
            <SwipeableCategoryHeader
              category={category}
              onSwipeRight={() => handleCategorySwipeRight(items)}
              onSwipeLeft={() => handleCategorySwipeLeft(items)}
              canGoForward={canGoForward}
              canGoBack={canGoBack}
            />

            {items.map((item, index) => {
              const hasCustomization = (item.note && item.note.trim().length > 0) || (item.tags && item.tags.length > 0);
              const isLastItem = index === items.length - 1;
              const itemStatusIndex = item.status ? STATUS_ORDER.indexOf(item.status) : currentStatusIndex;
              const itemCanGoForward = itemStatusIndex < STATUS_ORDER.length - 1;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemRow, isLastItem && styles.itemRowLast]}
                  onPress={() => handleItemTapForward(item)}
                  activeOpacity={0.7}
                  disabled={!itemCanGoForward}
                >
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <RNText style={[styles.itemName, item.isOverdue && styles.itemNameOverdue]}>
                        {item.itemName}
                      </RNText>
                      {item.type === 'MENU_ITEM' && item.menuName && (
                        <RNText style={styles.menuBadge}>Menu: {item.menuName}</RNText>
                      )}
                    </View>

                    {hasCustomization && (
                      <View style={styles.customizationBlock}>
                        {item.note && item.note.trim().length > 0 && (
                          <View style={styles.noteChip}>
                            <StickyNote size={11} color="#F59E0B" strokeWidth={2} />
                            <RNText style={styles.noteText}>{item.note}</RNText>
                          </View>
                        )}

                        {item.tags?.filter(tag => tag?.tagSnapshot).map((tag, tagIdx) => {
                          const config = getFieldTypeConfig(tag.tagSnapshot.fieldType);
                          const formattedValue = formatTagValue(tag);

                          return (
                            <View key={tagIdx} style={[styles.tagChip, { backgroundColor: config.bgColor }]}>
                              <RNText style={[styles.tagLabel, { color: config.textColor }]}>
                                {tag.tagSnapshot.label}: {formattedValue}
                              </RNText>
                              {tag.priceModifier != null && tag.priceModifier !== 0 && (
                                <View style={[styles.tagPrice, { backgroundColor: config.priceBgColor }]}>
                                  <RNText style={[styles.tagPriceText, { color: config.textColor }]}>
                                    {(tag.priceModifier > 0 ? '+' : '') + formatPrice(tag.priceModifier)}
                                  </RNText>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {itemCanGoForward && itemGroup.status !== Status.READY && (
                    <View style={styles.itemTapIndicator}>
                      <ChevronRight size={18} color={COLORS.forwardIcon} strokeWidth={2.5} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Indicateur de retard */}
      {itemGroup.isOverdue && (
        <View style={styles.overdueIndicator}>
          <RNText style={styles.overdueText}>RETARD</RNText>
        </View>
      )}
    </View>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 8,
  },
  overdueCard: {
    borderColor: '#DC2626',
    borderWidth: 2,
    shadowColor: '#DC2626',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    gap: 6,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  tableId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A2E33',
    letterSpacing: 0.5,
    flexShrink: 0,
    paddingLeft: 4,
  },
  separator: {
    fontSize: 11,
    color: '#D1D5DB',
    fontWeight: '400',
    flexShrink: 0,
  },
  orderTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    flexShrink: 0,
  },
  itemCountBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    marginLeft: 4,
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonForward: {
    backgroundColor: '#2A2E33',
    borderColor: '#2A2E33',
  },

  content: {
    paddingTop: 6,
    paddingBottom: 6,
  },

  categorySection: {
    marginBottom: 6,
  },
  categorySectionLast: {
    marginBottom: 0,
  },

  categoryHeaderWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  categoryHeaderBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#F3F4F6',
    zIndex: 0,
  },
  progressBarAnimated: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  categoryHeader: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative',
    zIndex: 2,
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 1,
  },
  categorySwipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  itemNameOverdue: {
    color: '#DC2626',
    fontWeight: '700',
  },
  menuBadge: {
    fontSize: 10,
    color: '#7C3AED',
    fontWeight: '500',
    fontStyle: 'italic',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  itemTapIndicator: {
    marginLeft: 8,
    opacity: 0.8,
  },

  customizationBlock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },

  noteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noteText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
    fontStyle: 'italic',
  },

  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    gap: 4,
  },
  tagLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagPrice: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  tagPriceText: {
    fontSize: 10,
    fontWeight: '700',
  },

  overdueIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overdueText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
