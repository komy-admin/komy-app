import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TouchableOpacity, Text as RNText, Platform, Animated } from 'react-native';
import { Trash2, ShoppingBag, ArrowLeftToLine, Lock } from 'lucide-react-native';
import { OrderLine, OrderLineType, SelectedTag } from '~/types/order-line.types';
import { ItemType } from '~/types/item-type.types';
import { Status } from '~/types/status.enum';
import { formatPrice } from '~/lib/utils';

// ========================================
// LOCK HELPERS
// ========================================

/**
 * Dériver le statut effectif d'une ligne MENU à partir de ses OrderLineItems.
 * Pour les ITEM, on utilise directement line.status.
 */
const getEffectiveStatus = (line: OrderLine): string | undefined => {
  if (line.type === OrderLineType.MENU && line.items && line.items.length > 0) {
    const statuses = line.items.map(item => item.status);
    if (statuses.every(s => s === Status.DRAFT)) return Status.DRAFT;
    if (statuses.some(s => s === Status.INPROGRESS)) return Status.INPROGRESS;
    if (statuses.some(s => s === Status.PENDING)) return Status.PENDING;
    if (statuses.every(s => s === Status.READY)) return Status.READY;
    if (statuses.every(s => s === Status.SERVED)) return Status.SERVED;
    if (statuses.every(s => s === Status.TERMINATED)) return Status.TERMINATED;
    if (statuses.some(s => s === Status.ERROR)) return Status.ERROR;
    return Status.PENDING;
  }
  return line.status;
};

/** A line is locked if it's a saved server line with a non-draft status */
const isLineLocked = (line: OrderLine): boolean => {
  if (line.id.startsWith('draft-')) return false;
  const effectiveStatus = getEffectiveStatus(line);
  return effectiveStatus !== Status.DRAFT;
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case Status.DRAFT: return 'Brouillon';
    case Status.PENDING: return 'En attente';
    case Status.INPROGRESS: return 'En préparation';
    case Status.READY: return 'Prêt';
    case Status.SERVED: return 'Servi';
    case Status.TERMINATED: return 'Terminé';
    case Status.ERROR: return 'Erreur';
    default: return status;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case Status.DRAFT: return '#9CA3AF';
    case Status.PENDING: return '#F59E0B';
    case Status.INPROGRESS: return '#FB923C';
    case Status.READY: return '#3B82F6';
    case Status.SERVED: return '#10B981';
    case Status.TERMINATED: return '#6B7280';
    case Status.ERROR: return '#EF4444';
    default: return '#6B7280';
  }
};

// ========================================
// HELPERS
// ========================================

const formatTagValue = (tag: any): string => {
  if (tag.value === null || tag.value === undefined) return '';
  if (typeof tag.value === 'boolean') return tag.value ? 'Oui' : 'Non';
  if (Array.isArray(tag.value)) return tag.value.join(', ');
  return String(tag.value);
};

// Fingerprint: identical item + tags + note + status = same line
// Items with different statuses are never merged together
const getLineFingerprint = (line: OrderLine): string => {
  const itemId = line.item?.id || '';
  const note = line.note || '';
  const status = getEffectiveStatus(line) || 'draft';
  const tags = (line.tags || [])
    .filter(t => t && t.tagSnapshot)
    .sort((a, b) => a.tagId.localeCompare(b.tagId))
    .map(t => `${t.tagId}:${JSON.stringify(t.value)}`)
    .join('|');
  return `${status}__${itemId}__${tags}__${note}`;
};

// A grouped row: identical lines merged with quantity
interface GroupedLine {
  line: OrderLine;
  quantity: number;
  originalIndices: number[];
  totalPrice: number;
}

// Group ITEM lines by itemType, preserving original index
interface GroupedSection {
  itemTypeId: string;
  itemTypeName: string;
  priorityOrder: number;
  lines: { line: OrderLine; originalIndex: number }[];
  groupedLines: GroupedLine[];
}

interface DraftReviewPanelContentProps {
  title?: string;
  draftLines: OrderLine[];
  onEdit: (index: number) => void;
  onEditMenu?: (menuLine: OrderLine) => void;
  onDelete: (index: number) => void;
  onSave?: () => void;
  onCancel?: () => void;
  hasChanges?: boolean;
  isProcessing?: boolean;
  cancelDeleteRef?: React.RefObject<(() => void) | null>;
  hideFooter?: boolean;
  itemTypes?: ItemType[];
}

export const DraftReviewPanelContent: React.FC<DraftReviewPanelContentProps> = ({
  title,
  draftLines,
  onEdit,
  onEditMenu,
  onDelete,
  onSave,
  onCancel,
  hasChanges = false,
  isProcessing = false,
  cancelDeleteRef,
  hideFooter = false,
  itemTypes,
}) => {
  // Track which row is pending delete (by originalIndex)
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);

  const handleDeleteRequest = useCallback((index: number) => {
    setPendingDeleteIndex(index);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (pendingDeleteIndex !== null) {
      onDelete(pendingDeleteIndex);
      setPendingDeleteIndex(null);
    }
  }, [pendingDeleteIndex, onDelete]);

  const handleCancelDelete = useCallback(() => {
    setPendingDeleteIndex(null);
  }, []);

  // Expose cancel to parent via ref
  useEffect(() => {
    if (cancelDeleteRef) {
      cancelDeleteRef.current = handleCancelDelete;
    }
    return () => {
      if (cancelDeleteRef) cancelDeleteRef.current = null;
    };
  }, [cancelDeleteRef, handleCancelDelete]);

  // Group ITEM lines by itemType, then merge identical lines
  const { itemSections, menuLines } = useMemo(() => {
    const sectionsMap = new Map<string, GroupedSection>();
    const menus: { line: OrderLine; originalIndex: number }[] = [];

    draftLines.forEach((line, index) => {
      if (line.type === OrderLineType.MENU) {
        menus.push({ line, originalIndex: index });
        return;
      }

      if (line.type === OrderLineType.ITEM && line.item) {
        const snapshotType = line.item.itemType;
        const key = snapshotType?.id || 'unknown';
        if (!sectionsMap.has(key)) {
          // Chercher priorityOrder depuis itemTypes (source de vérité) plutôt que le snapshot
          const fullItemType = itemTypes?.find(t => t.id === key);
          sectionsMap.set(key, {
            itemTypeId: key,
            itemTypeName: fullItemType?.name || snapshotType?.name || 'Autre',
            priorityOrder: fullItemType?.priorityOrder ?? snapshotType?.priorityOrder ?? 999,
            lines: [],
            groupedLines: [],
          });
        }
        sectionsMap.get(key)!.lines.push({ line, originalIndex: index });
      }
    });

    // Merge identical lines within each section
    sectionsMap.forEach((section) => {
      const groups = new Map<string, GroupedLine>();
      section.lines.forEach(({ line, originalIndex }) => {
        const fp = getLineFingerprint(line);
        if (groups.has(fp)) {
          const g = groups.get(fp)!;
          g.quantity += 1;
          g.originalIndices.push(originalIndex);
          g.totalPrice += (line.totalPrice || 0);
        } else {
          groups.set(fp, {
            line,
            quantity: 1,
            originalIndices: [originalIndex],
            totalPrice: line.totalPrice || 0,
          });
        }
      });
      section.groupedLines = Array.from(groups.values()).sort(
        (a, b) => (a.line.item?.name || '').localeCompare(b.line.item?.name || '')
      );
    });

    const sorted = Array.from(sectionsMap.values()).sort((a, b) => {
      if (a.priorityOrder !== b.priorityOrder) return a.priorityOrder - b.priorityOrder;
      return a.itemTypeName.localeCompare(b.itemTypeName);
    });

    return { itemSections: sorted, menuLines: menus };
  }, [draftLines, itemTypes]);

  const totalLines = draftLines.length;

  return (
    <View style={styles.panelContent}>
      {/* Header */}
      <View style={styles.panelHeader}>
        <Pressable onPress={onCancel} style={styles.backButton}>
          <ArrowLeftToLine size={20} color="#2A2E33" />
        </Pressable>
        <View style={styles.titleContainer}>
          <RNText style={styles.titleText} numberOfLines={1}>
            {title || 'Commande'}
          </RNText>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        onScrollBeginDrag={handleCancelDelete}
      >
        {totalLines === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingBag size={64} color="#CBD5E1" strokeWidth={1.5} />
            <RNText style={styles.emptyTitle}>Commande vide</RNText>
            <RNText style={styles.emptyText}>
              Ajoutez des articles pour commencer
            </RNText>
          </View>
        ) : (
          <>
            {/* Item sections grouped by itemType */}
            {itemSections.map((section) => (
              <View key={section.itemTypeId} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <RNText style={styles.sectionTitle}>
                    {section.lines.length}x {section.itemTypeName}
                  </RNText>
                </View>

                <View style={styles.sectionBlock}>
                  {section.groupedLines.map((group) => (
                    <ReceiptItemRow
                      key={group.originalIndices.join('-')}
                      line={group.line}
                      quantity={group.quantity}
                      totalPrice={group.totalPrice}
                      originalIndex={group.originalIndices[0]}
                      isPendingDelete={pendingDeleteIndex === group.originalIndices[0]}
                      hasPendingDelete={pendingDeleteIndex !== null}
                      isLocked={isLineLocked(group.line)}
                      onEdit={onEdit}
                      onDeleteRequest={handleDeleteRequest}
                      onConfirmDelete={handleConfirmDelete}
                      onCancelDelete={handleCancelDelete}
                    />
                  ))}
                </View>
              </View>
            ))}

            {/* Menu section */}
            {menuLines.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <RNText style={styles.sectionTitle}>
                    {menuLines.length}x Menu{menuLines.length > 1 ? 's' : ''}
                  </RNText>
                </View>

                <View style={styles.sectionBlock}>
                  {menuLines.map(({ line, originalIndex }) => (
                    <ReceiptMenuRow
                      key={line.id || `temp-${originalIndex}`}
                      line={line}
                      originalIndex={originalIndex}
                      isPendingDelete={pendingDeleteIndex === originalIndex}
                      hasPendingDelete={pendingDeleteIndex !== null}
                      isLocked={false}
                      onEditMenu={onEditMenu}
                      onDeleteRequest={handleDeleteRequest}
                      onConfirmDelete={handleConfirmDelete}
                      onCancelDelete={handleCancelDelete}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer */}
      {!hideFooter && (
        <View style={styles.panelFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <RNText style={styles.cancelButtonText}>Annuler</RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, (!hasChanges || isProcessing) && styles.saveButtonDisabled]}
            onPress={onSave}
            disabled={!hasChanges || isProcessing}
          >
            <RNText style={styles.saveButtonText}>
              {isProcessing ? 'Sauvegarde...' : 'Enregistrer'}
            </RNText>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
};

// ========================================
// INLINE DELETE CONFIRMATION OVERLAY
// ========================================

const DeleteConfirmOverlay: React.FC<{
  onConfirm: () => void;
}> = ({ onConfirm }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.deleteOverlay, { opacity }]}>
      <Pressable onPress={onConfirm} style={styles.deleteOverlayButton}>
        <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
        <RNText style={styles.deleteOverlayText}>Confirmer la suppression</RNText>
      </Pressable>
    </Animated.View>
  );
};

// ========================================
// RECEIPT ITEM ROW
// ========================================

interface ReceiptItemRowProps {
  line: OrderLine;
  quantity: number;
  totalPrice: number;
  originalIndex: number;
  isPendingDelete: boolean;
  hasPendingDelete: boolean;
  isLocked: boolean;
  onEdit: (index: number) => void;
  onDeleteRequest: (index: number) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

const ReceiptItemRow: React.FC<ReceiptItemRowProps> = React.memo(({
  line,
  quantity,
  totalPrice,
  originalIndex,
  isPendingDelete,
  hasPendingDelete,
  isLocked,
  onEdit,
  onDeleteRequest,
  onConfirmDelete,
  onCancelDelete,
}) => {
  const hasNote = line.note && line.note.trim().length > 0;
  const hasTags = line.tags && line.tags.length > 0;
  const itemName = line.item?.name || 'Article';

  const handlePress = () => {
    if (isLocked) return;
    if (hasPendingDelete) {
      onCancelDelete();
    } else {
      onEdit(originalIndex);
    }
  };

  return (
    <View style={[styles.receiptRowWrapper, isPendingDelete && styles.receiptRowWrapperElevated]}>
      <Pressable onPress={handlePress} style={[styles.receiptRow, isLocked && styles.lockedRow]}>
        <View style={styles.receiptMainLine}>
          <RNText style={[styles.receiptQty, isLocked && styles.lockedText]}>{quantity}x</RNText>
          <RNText style={[styles.receiptName, isLocked && styles.lockedText]} numberOfLines={1} ellipsizeMode="tail">
            {itemName}
          </RNText>
          <View style={styles.receiptDots} />
          <RNText style={[styles.receiptPrice, isLocked && styles.lockedText]}>{formatPrice(totalPrice)}</RNText>
          {isLocked ? (
            <View style={styles.lockIconWrap}>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(line.status || '')}18` }]}>
                <Lock size={11} color={getStatusColor(line.status || '')} strokeWidth={2.5} />
                <RNText style={[styles.statusBadgeText, { color: getStatusColor(line.status || '') }]}>
                  {getStatusLabel(line.status || '')}
                </RNText>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={(e) => { e.stopPropagation(); onDeleteRequest(originalIndex); }}
              style={styles.trashButton}
              hitSlop={6}
            >
              <Trash2 size={18} color="#EF4444" strokeWidth={2} />
            </Pressable>
          )}
        </View>

        {hasTags && (
          <View style={styles.receiptDetails}>
            {line.tags!.filter(tag => tag && tag.tagSnapshot).map((tag, idx) => (
              <RNText key={idx} style={[styles.receiptTag, isLocked && styles.lockedText]}>
                {tag.tagSnapshot.label}: {formatTagValue(tag)}
                {tag.priceModifier != null && tag.priceModifier !== 0
                  ? ` (${tag.priceModifier > 0 ? '+' : ''}${formatPrice(tag.priceModifier)})`
                  : ''}
              </RNText>
            ))}
          </View>
        )}

        {hasNote && (
          <RNText style={[styles.receiptNote, isLocked && styles.lockedText]} numberOfLines={1} ellipsizeMode="tail">
            Note: {line.note}
          </RNText>
        )}
      </Pressable>

      {isPendingDelete && (
        <DeleteConfirmOverlay onConfirm={onConfirmDelete} />
      )}
    </View>
  );
});

// ========================================
// RECEIPT MENU ROW
// ========================================

interface ReceiptMenuRowProps {
  line: OrderLine;
  originalIndex: number;
  isPendingDelete: boolean;
  hasPendingDelete: boolean;
  isLocked: boolean;
  onEditMenu?: (menuLine: OrderLine) => void;
  onDeleteRequest: (index: number) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

const ReceiptMenuRow: React.FC<ReceiptMenuRowProps> = React.memo(({
  line,
  originalIndex,
  isPendingDelete,
  hasPendingDelete,
  isLocked,
  onEditMenu,
  onDeleteRequest,
  onConfirmDelete,
  onCancelDelete,
}) => {
  if (!line.menu || !line.items) return null;

  const hasNote = line.note && line.note.trim().length > 0;
  const menuName = line.menu.name || 'Menu';

  const handlePress = () => {
    if (isLocked) return;
    if (hasPendingDelete) {
      onCancelDelete();
    } else {
      onEditMenu?.(line);
    }
  };

  return (
    <View style={[styles.receiptRowWrapper, isPendingDelete && styles.receiptRowWrapperElevated]}>
      <Pressable onPress={handlePress} style={[styles.receiptRow, isLocked && styles.lockedRow]}>
        <View style={styles.receiptMainLine}>
          <View style={styles.menuLabelWrap}>
            <View style={[styles.menuBadge, isLocked && { opacity: 0.5 }]}>
              <RNText style={styles.menuBadgeText}>MENU</RNText>
            </View>
            <RNText style={[styles.receiptName, isLocked && styles.lockedText]} numberOfLines={1} ellipsizeMode="tail">
              {menuName}
            </RNText>
          </View>
          <View style={styles.receiptDots} />
          <RNText style={[styles.receiptPrice, isLocked && styles.lockedText]}>{formatPrice(line.totalPrice || 0)}</RNText>
          {isLocked ? (
            <View style={styles.lockIconWrap}>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(getEffectiveStatus(line) || '')}18` }]}>
                <Lock size={11} color={getStatusColor(getEffectiveStatus(line) || '')} strokeWidth={2.5} />
                <RNText style={[styles.statusBadgeText, { color: getStatusColor(getEffectiveStatus(line) || '') }]}>
                  {getStatusLabel(getEffectiveStatus(line) || '')}
                </RNText>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={(e) => { e.stopPropagation(); onDeleteRequest(originalIndex); }}
              style={styles.trashButton}
              hitSlop={6}
            >
              <Trash2 size={18} color="#EF4444" strokeWidth={2} />
            </Pressable>
          )}
        </View>

        <View style={styles.menuItemsList}>
          {line.items.map((menuItem: any, idx: number) => {
            const itemHasTags = menuItem.tags && menuItem.tags.length > 0;
            const itemHasNote = menuItem.note && menuItem.note.trim().length > 0;

            return (
              <View key={idx} style={styles.menuSubItem}>
                <RNText style={[styles.menuSubItemText, isLocked && styles.lockedText]}>
                  <RNText style={[styles.menuSubCategory, isLocked && styles.lockedText]}>{menuItem.categoryName}: </RNText>
                  {menuItem.item?.name || ''}
                  {menuItem.supplementPrice > 0 ? ` (+${formatPrice(menuItem.supplementPrice)})` : ''}
                </RNText>

                {itemHasTags && menuItem.tags.filter((tag: SelectedTag) => tag && tag.tagSnapshot).map((tag: SelectedTag, tagIdx: number) => (
                  <RNText key={tagIdx} style={[styles.receiptTag, isLocked && styles.lockedText]}>
                    {tag.tagSnapshot.label}: {formatTagValue(tag)}
                    {tag.priceModifier != null && tag.priceModifier !== 0
                      ? ` (${tag.priceModifier > 0 ? '+' : ''}${formatPrice(tag.priceModifier)})`
                      : ''}
                  </RNText>
                ))}

                {itemHasNote && (
                  <RNText style={[styles.receiptNote, isLocked && styles.lockedText]} numberOfLines={1}>
                    Note: {menuItem.note}
                  </RNText>
                )}
              </View>
            );
          })}
        </View>

        {hasNote && (
          <RNText style={[styles.receiptNote, isLocked && styles.lockedText]} numberOfLines={1} ellipsizeMode="tail">
            Note: {line.note}
          </RNText>
        )}
      </Pressable>

      {isPendingDelete && (
        <DeleteConfirmOverlay onConfirm={onConfirmDelete} />
      )}
    </View>
  );
});

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  panelContent: {
    flex: 1,
  },
  panelHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 4,
    elevation: 0,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
    height: '100%',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A2E33',
    letterSpacing: 0.5,
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Section
  section: {
    marginBottom: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Section block (white)
  sectionBlock: {
    backgroundColor: '#FFFFFF',
  },

  // Receipt row wrapper (for overlay positioning)
  receiptRowWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  receiptRowWrapperElevated: {
    zIndex: 20,
    elevation: 20,
  },

  // Receipt row
  receiptRow: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  receiptMainLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptQty: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginRight: 6,
    flexShrink: 0,
  },
  receiptName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flexShrink: 1,
  },
  receiptDots: {
    flex: 1,
    minWidth: 8,
  },
  receiptPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flexShrink: 0,
  },
  trashButton: {
    marginLeft: 10,
    padding: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },

  // Tags & notes (simple inline)
  receiptDetails: {
    marginTop: 4,
    gap: 2,
  },
  receiptTag: {
    fontSize: 11,
    color: '#6B7280',
    paddingLeft: 4,
  },
  receiptNote: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#92400E',
    marginTop: 3,
    paddingLeft: 4,
  },

  // Inline delete confirmation overlay
  deleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 30,
  },
  deleteOverlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  deleteOverlayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Locked state
  lockedRow: {
    opacity: 0.55,
  },
  lockedText: {
    opacity: 0.7,
  },
  lockIconWrap: {
    marginLeft: 10,
    flexShrink: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // Menu specific
  menuLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  menuBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  menuBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  menuItemsList: {
    marginTop: 6,
    paddingLeft: 8,
    gap: 4,
  },
  menuSubItem: {
    gap: 1,
  },
  menuSubItemText: {
    fontSize: 12,
    color: '#4B5563',
  },
  menuSubCategory: {
    fontWeight: '600',
    color: '#9CA3AF',
    fontSize: 11,
  },

  // Footer
  panelFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
