import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, TouchableOpacity, Text as RNText } from 'react-native';
import { Edit2, Trash2, X, ShoppingBag } from 'lucide-react-native';
import { OrderLine, OrderLineType, SelectedTag } from '~/types/order-line.types';
import { formatPrice, getTagFieldTypeConfig } from '~/lib/utils';

// ========================================
// HELPERS
// ========================================

// Helper: Récupère la couleur pour le badge de prix selon le type de champ
const getPriceBadgeColor = (fieldType: string): string => {
  switch (fieldType) {
    case 'select':
      return '#BFDBFE'; // Bleu plus foncé
    case 'multi-select':
      return '#DDD6FE'; // Violet plus foncé
    case 'toggle':
      return '#A7F3D0'; // Vert plus foncé
    case 'number':
      return '#FCD34D'; // Jaune plus foncé
    case 'text':
      return '#F9A8D4'; // Rose plus foncé
    default:
      return '#CBD5E1'; // Gris plus foncé
  }
};

// Helper: Formater la valeur d'un tag
const formatTagValue = (tag: any): string => {
  if (tag.value === null || tag.value === undefined) return '';
  if (typeof tag.value === 'boolean') return tag.value ? 'Oui' : 'Non';
  if (Array.isArray(tag.value)) return tag.value.join(', ');
  return String(tag.value);
};

interface DraftReviewPanelContentProps {
  draftLines: OrderLine[];
  onEdit: (index: number) => void;
  onEditMenu?: (menuLine: OrderLine) => void;
  onDelete: (index: number) => void;
  onClose: () => void;
  onClearAll: () => void;
}

export const DraftReviewPanelContent: React.FC<DraftReviewPanelContentProps> = ({
  draftLines,
  onEdit,
  onEditMenu,
  onDelete,
  onClose,
  onClearAll
}) => {
  const totalLines = draftLines.length;

  // Trier les lignes ET créer une map d'index en une seule passe
  const { sortedLines, indexMap, newLinesCount } = React.useMemo(() => {
    // Créer la map d'index original
    const map = new Map<string, number>();
    let newCount = 0;

    draftLines.forEach((line, index) => {
      map.set(line.id || `temp-${index}`, index);
      if (!line.id || line.id.startsWith('draft-')) {
        newCount++;
      }
    });

    // Trier les lignes
    const sorted = [...draftLines].sort((a, b) => {
      const aIsNew = !a.id || a.id.startsWith('draft-');
      const bIsNew = !b.id || b.id.startsWith('draft-');

      // Les nouveaux items en premier
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      return 0; // Garder l'ordre original sinon
    });

    return { sortedLines: sorted, indexMap: map, newLinesCount: newCount };
  }, [draftLines]);

  return (
    <View style={styles.panelContent}>
      {/* Header */}
      <View style={styles.panelHeader}>
        <View>
          <RNText style={[styles.panelTitle, { fontWeight: '600' }]}>
            Récapitulatif de la commande
          </RNText>
          <RNText style={[styles.panelSubtitle, { lineHeight: 18 }]}>
            {totalLines} ligne{totalLines > 1 ? 's' : ''}
            {newLinesCount > 0 && ` · ${newLinesCount} nouvelle${newLinesCount > 1 ? 's' : ''}`}
          </RNText>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={24} color="#64748B" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.panelForm}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {totalLines === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingBag size={64} color="#CBD5E1" strokeWidth={1.5} />
            <RNText style={[styles.emptyTitle, { fontWeight: '600' }]}>Commande vide</RNText>
            <RNText style={styles.emptyText}>
              Ajoutez des articles pour commencer
            </RNText>
          </View>
        ) : (
          sortedLines.map((line, sortedIndex) => {
            // Récupérer l'index original depuis la Map (O(1))
            const originalIndex = indexMap.get(line.id || `temp-${sortedIndex}`) ?? sortedIndex;
            return (
              <DraftLineCard
                key={line.id || originalIndex}
                line={line}
                index={originalIndex}
                onEdit={onEdit}
                onEditMenu={onEditMenu}
                onDelete={onDelete}
              />
            );
          })
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.panelFooter}>
        {totalLines > 0 && (
          <Pressable style={styles.clearButton} onPress={onClearAll}>
            <Trash2 size={18} color="#EF4444" strokeWidth={2} />
            <RNText style={[styles.clearButtonText, { fontWeight: '600' }]}>
              Tout supprimer
            </RNText>
          </Pressable>
        )}
        <Pressable
          style={[styles.closeButton, totalLines === 0 && styles.closeButtonFull]}
          onPress={onClose}
        >
          <RNText style={[styles.closeButtonText, { fontWeight: '600' }]}>
            Fermer
          </RNText>
        </Pressable>
      </View>
    </View>
  );
};

// ========================================
// DRAFT LINE CARD COMPONENTS
// ========================================

interface DraftLineCardProps {
  line: OrderLine;
  index: number;
  onEdit: (index: number) => void;
  onEditMenu?: (menuLine: OrderLine) => void;
  onDelete: (index: number) => void;
}

const DraftLineCard: React.FC<DraftLineCardProps> = ({ line, index, onEdit, onEditMenu, onDelete }) => {
  // Items à la carte
  if (line.type === OrderLineType.ITEM && line.item) {
    return <DraftItemCard line={line} index={index} onEdit={onEdit} onDelete={onDelete} />;
  }

  // Menus
  if (line.type === OrderLineType.MENU && line.menu) {
    return <DraftMenuCard line={line} index={index} onEditMenu={onEditMenu} onDelete={onDelete} />;
  }

  return null;
};

// ========================================
// ITEM CARD
// ========================================

const DraftItemCard: React.FC<Omit<DraftLineCardProps, 'onEditMenu'>> = React.memo(({
  line,
  index,
  onEdit,
  onDelete
}) => {
  const hasNote = line.note && line.note.trim().length > 0;
  const hasTags = line.tags && line.tags.length > 0;
  const isNewDraft = !line.id || line.id.startsWith('draft-');

  return (
    <View style={[
      styles.itemCard,
      isNewDraft && styles.itemCardNew
    ]}>
      <View style={styles.mainContent}>
        <View style={styles.leftColumn}>
          <View style={styles.nameRow}>
            <RNText
              style={[styles.itemName, { fontWeight: '700' }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {line.item?.name || ''}
            </RNText>
          </View>

          <View style={styles.footerInfo}>
            {isNewDraft && (
              <View style={styles.newBadge}>
                <RNText style={[styles.newBadgeText, { fontWeight: '700' }]}>
                  NOUVEAU
                </RNText>
              </View>
            )}

            {hasTags && line.tags!.filter(tag => tag && tag.tagSnapshot).map((tag, idx) => {
              const config = getTagFieldTypeConfig(tag.tagSnapshot.fieldType);
              const priceBgColor = getPriceBadgeColor(tag.tagSnapshot.fieldType);
              return (
                <View key={idx} style={[styles.tag, { backgroundColor: config.bgColor }]}>
                  <RNText style={[styles.tagLabel, { color: config.textColor, fontWeight: '600' }]}>
                    {tag.tagSnapshot.label}:
                  </RNText>
                  <RNText style={[styles.tagValue, { color: config.textColor, fontWeight: '500' }]}>
                    {formatTagValue(tag)}
                  </RNText>
                  {tag.priceModifier != null && tag.priceModifier !== 0 && (
                    <View style={[styles.tagPriceBadge, { backgroundColor: priceBgColor }]}>
                      <RNText style={[styles.tagPriceText, { color: config.textColor, fontWeight: '700' }]}>
                        {tag.priceModifier > 0 ? '+' : ''}{formatPrice(tag.priceModifier)}
                      </RNText>
                    </View>
                  )}
                </View>
              );
            })}

            {hasNote && (
              <View style={styles.noteContainer}>
                <RNText style={styles.noteLabel}>Note :</RNText>
                <RNText style={styles.noteText} numberOfLines={1} ellipsizeMode="tail">
                  {line.note || ''}
                </RNText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.priceTimeColumn}>
          <RNText style={[styles.itemPrice, { fontWeight: '800' }]}>
            {formatPrice(line.totalPrice || 0)}
          </RNText>
        </View>

        <View style={styles.actionsColumn}>
          <Pressable
            style={styles.editButton}
            onPress={() => onEdit(index)}
          >
            <Edit2 size={16} color="#3B82F6" strokeWidth={2} />
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={() => onDelete(index)}>
            <Trash2 size={16} color="#EF4444" strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

// ========================================
// MENU CARD
// ========================================

const DraftMenuCard: React.FC<Pick<DraftLineCardProps, 'line' | 'index' | 'onEditMenu' | 'onDelete'>> = React.memo(({
  line,
  index,
  onEditMenu,
  onDelete
}) => {
  if (!line.menu || !line.items) return null;

  const hasNote = line.note && line.note.trim().length > 0;
  const isNewDraft = !line.id || line.id.startsWith('draft-');

  return (
    <View style={[
      styles.menuCard,
      isNewDraft && styles.menuCardNew
    ]}>
      {/* Header */}
      <View style={styles.mainContent}>
        <View style={styles.leftColumn}>
          <View style={styles.nameRow}>
            <RNText
              style={[styles.menuName, { fontWeight: '700' }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {line.menu.name || ''}
            </RNText>
          </View>

          <View style={styles.footerInfo}>
            <View style={styles.menuBadge}>
              <RNText style={[styles.menuBadgeText, { fontWeight: '700' }]}>
                MENU
              </RNText>
            </View>
            {isNewDraft && (
              <View style={styles.newBadge}>
                <RNText style={[styles.newBadgeText, { fontWeight: '700' }]}>
                  NOUVEAU
                </RNText>
              </View>
            )}
            <RNText style={styles.itemCount}>
              {line.items.length} article{line.items.length > 1 ? 's' : ''}
            </RNText>
          </View>
        </View>

        <View style={styles.priceTimeColumn}>
          <RNText style={[styles.menuPrice, { fontWeight: '800' }]}>
            {formatPrice(line.totalPrice || 0)}
          </RNText>
        </View>

        <View style={styles.actionsColumn}>
          {onEditMenu && (
            <Pressable style={styles.editButton} onPress={() => onEditMenu(line)}>
              <Edit2 size={16} color="#3B82F6" strokeWidth={2} />
            </Pressable>
          )}
          <Pressable style={styles.deleteButton} onPress={() => onDelete(index)}>
            <Trash2 size={16} color="#EF4444" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* Items du menu */}
      <View style={styles.menuItemsSection}>
        {line.items.map((menuItem: any, idx: number) => {
          const itemHasNote = menuItem.note && menuItem.note.trim().length > 0;
          const itemHasTags = menuItem.tags && menuItem.tags.length > 0;

          return (
            <View key={idx} style={styles.menuItemRow}>
              <View style={styles.menuItemContent}>
                <RNText style={[styles.menuItemCategory, { fontWeight: '600', textTransform: 'uppercase' }]}>
                  {menuItem.categoryName}
                </RNText>
                <RNText style={[styles.menuItemName, { fontWeight: '600' }]}>
                  {menuItem.item?.name || ''}
                </RNText>
                {menuItem.supplementPrice > 0 && (
                  <RNText style={[styles.menuItemSupplement, { fontWeight: '600' }]}>
                    +{formatPrice(menuItem.supplementPrice)}
                  </RNText>
                )}

                {/* Tags et note inline */}
                {(itemHasTags || itemHasNote) && (
                  <View style={styles.menuItemFooter}>
                    {itemHasTags && menuItem.tags.filter((tag: SelectedTag) => tag && tag.tagSnapshot).map((tag: SelectedTag, tagIdx: number) => {
                      const config = getTagFieldTypeConfig(tag.tagSnapshot.fieldType);
                      const priceBgColor = getPriceBadgeColor(tag.tagSnapshot.fieldType);
                      return (
                        <View key={tagIdx} style={[styles.tag, { backgroundColor: config.bgColor }]}>
                          <RNText style={[styles.tagLabel, { fontWeight: '600', color: config.textColor }]}>
                            {tag.tagSnapshot.label}:
                          </RNText>
                          <RNText style={[styles.tagValue, { fontWeight: '500', color: config.textColor }]}>
                            {formatTagValue(tag)}
                          </RNText>
                          {tag.priceModifier != null && tag.priceModifier !== 0 && (
                            <View style={[styles.tagPriceBadge, { backgroundColor: priceBgColor }]}>
                              <RNText style={[styles.tagPriceText, { fontWeight: '700', color: config.textColor }]}>
                                {tag.priceModifier > 0 ? '+' : ''}{formatPrice(tag.priceModifier)}
                              </RNText>
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {itemHasNote && (
                      <View style={styles.noteContainer}>
                        <RNText style={styles.noteLabel}>Note :</RNText>
                        <RNText style={styles.noteText} numberOfLines={1} ellipsizeMode="tail">
                          {menuItem.note}
                        </RNText>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Note globale du menu */}
      {hasNote && (
        <View style={styles.menuNoteSection}>
          <View style={styles.noteContainer}>
            <RNText style={styles.noteLabel}>Note :</RNText>
            <RNText style={styles.noteText} numberOfLines={1} ellipsizeMode="tail">
              {line.note || ''}
            </RNText>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 16,
  },
  panelTitle: {
    fontSize: 18,
    color: '#1E293B',
    marginBottom: 4,
  },
  panelSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  panelForm: {
    flex: 1,
    padding: 20,
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
    color: '#64748B',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Card commune (Item et Menu)
  mainContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceTimeColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    alignSelf: 'center',
    gap: 4,
  },
  actionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Item Card
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  itemCardNew: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  itemName: {
    fontSize: 16,
    color: '#1F2937',
    flexShrink: 1,
  },
  itemPrice: {
    fontSize: 16,
    color: '#1F2937',
  },

  // Menu Card
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 0,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#6366F1', // Indigo pour les menus
  },
  menuCardNew: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  menuName: {
    fontSize: 16,
    color: '#1F2937',
    flexShrink: 1,
  },
  menuPrice: {
    fontSize: 16,
    color: '#1F2937',
  },
  menuBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  menuBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  itemCount: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Menu Items Section
  menuItemsSection: {
    marginTop: 12,
    gap: 0,
  },
  menuItemRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginHorizontal: -12,
  },
  menuItemContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  menuItemCategory: {
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  menuItemName: {
    fontSize: 14,
    color: '#1E293B',
  },
  menuItemSupplement: {
    fontSize: 12,
    color: '#F59E0B',
  },
  menuItemFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  menuNoteSection: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginHorizontal: -12,
  },

  // Tags
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagLabel: {
    fontSize: 10,
  },
  tagValue: {
    fontSize: 10,
  },
  tagPriceBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagPriceText: {
    fontSize: 10,
  },

  // Note inline
  noteContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 5,
    maxWidth: '100%',
    flexShrink: 1,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  noteText: {
    fontSize: 10,
    color: '#92400E',
    flexShrink: 1,
    minWidth: 0,
  },

  // New Badge
  newBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Actions
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Footer
  panelFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearButtonText: {
    color: '#EF4444',
    fontSize: 14,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#2A2E33',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonFull: {
    flex: undefined,
    width: '100%',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
