import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions, Modal } from 'react-native';
import { Text } from '~/components/ui';
import { Edit2, Trash2, StickyNote, Tag as TagIcon, ShoppingBag, X } from 'lucide-react-native';
import { OrderLine, OrderLineType } from '~/types/order-line.types';
import { Item } from '~/types/item.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DraftReviewModalProps {
  visible: boolean;
  draftLines: OrderLine[];
  onEdit: (item: Item, index: number) => void;
  onEditMenu?: (menuLine: OrderLine, index: number) => void;
  onDelete: (index: number) => void;
  onClose: () => void;
  onClearAll: () => void;
}

export const DraftReviewModal: React.FC<DraftReviewModalProps> = ({
  visible,
  draftLines,
  onEdit,
  onEditMenu,
  onDelete,
  onClose,
  onClearAll
}) => {

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Détail de la commande</Text>
              <View style={styles.headerBadge}>
                <ShoppingBag size={16} color="#3B82F6" strokeWidth={2.5} />
                <Text style={styles.headerBadgeText}>
                  {draftLines.length} ligne{draftLines.length > 1 ? 's' : ''}
                  {draftLines.filter(l => !l.id || l.id.startsWith('draft-')).length > 0 &&
                    ` (${draftLines.filter(l => !l.id || l.id.startsWith('draft-')).length} nouvelle${draftLines.filter(l => !l.id || l.id.startsWith('draft-')).length > 1 ? 's' : ''})`
                  }
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666666" strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* List */}
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {draftLines.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ShoppingBag size={64} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>Panier vide</Text>
                <Text style={styles.emptyText}>
                  Ajoutez des articles pour commencer
                </Text>
              </View>
            ) : (
              draftLines.map((line, index) => (
                <DraftLineCard
                  key={line.id || index}
                  line={line}
                  index={index}
                  onEdit={onEdit}
                  onEditMenu={onEditMenu}
                  onDelete={onDelete}
                />
              ))
            )}
          </ScrollView>

          {/* Footer avec total et actions */}
          {draftLines.length > 0 ? (
            <View style={styles.footer}>
              <View style={styles.footerButtons}>
                <Pressable style={styles.clearButton} onPress={onClearAll}>
                  <Trash2 size={18} color="#EF4444" strokeWidth={2.5} />
                  <Text style={styles.clearButtonText}>Tout supprimer</Text>
                </Pressable>
                <Pressable style={styles.closeFooterButton} onPress={onClose}>
                  <Text style={styles.closeFooterButtonText}>Fermer</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.footerEmpty}>
              <Pressable style={styles.closeButtonEmpty} onPress={onClose}>
                <Text style={styles.closeButtonText}>Fermer</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Carte pour une ligne de draft
interface DraftLineCardProps {
  line: OrderLine;
  index: number;
  onEdit: (item: Item, index: number) => void;
  onDelete: (index: number) => void;
}

const DraftLineCard: React.FC<DraftLineCardProps & { onEditMenu?: (menuLine: OrderLine, index: number) => void }> = ({
  line,
  index,
  onEdit,
  onEditMenu,
  onDelete
}) => {
  // Afficher les items à la carte
  if (line.type === OrderLineType.ITEM && line.item) {
    return <DraftItemCard line={line} index={index} onEdit={onEdit} onDelete={onDelete} />;
  }

  // Afficher les menus
  if (line.type === OrderLineType.MENU && line.menu) {
    return <DraftMenuCard line={line} index={index} onEditMenu={onEditMenu} onDelete={onDelete} />;
  }

  return null;
};

// Carte pour un item à la carte
const DraftItemCard: React.FC<DraftLineCardProps> = ({
  line,
  index,
  onEdit,
  onDelete
}) => {
  const hasNote = line.note && line.note.trim().length > 0;
  const hasTags = line.tags && line.tags.length > 0;
  const isNewDraft = !line.id || line.id.startsWith('draft-');

  return (
    <View style={styles.itemCard}>
      {/* Header de la card */}
      <View style={styles.itemHeader}>
        <View style={styles.itemMainInfo}>
          <View style={styles.itemNameRow}>
            <Text style={styles.itemName}>{line.item?.name || ''}</Text>
            {isNewDraft && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NOUVEAU</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemPrice}>{(line.totalPrice || 0).toFixed(2)}€</Text>
        </View>
        <View style={styles.itemActions}>
          <Pressable
            style={styles.editButton}
            onPress={() => {
              if (line.item) {
                // Convertir le snapshot en Item pour l'édition
                const item: Item = {
                  ...line.item,
                  isActive: true,
                  tags: line.item.tags || []
                } as Item;
                onEdit(item, index);
              }
            }}
          >
            <Edit2 size={16} color="#3B82F6" strokeWidth={2.5} />
          </Pressable>
          <Pressable
            style={styles.deleteButton}
            onPress={() => onDelete(index)}
          >
            <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      {/* Note */}
      {hasNote && (
        <View style={styles.noteSection}>
          <View style={styles.noteBadge}>
            <StickyNote size={14} color="#F59E0B" strokeWidth={2.5} />
            <Text style={styles.noteLabel}>Note</Text>
          </View>
          <Text style={styles.noteText}>{line.note || ''}</Text>
        </View>
      )}

      {/* Tags */}
      {hasTags && (
        <View style={styles.tagsSection}>
          <View style={styles.tagsBadge}>
            <TagIcon size={14} color="#8B5CF6" strokeWidth={2.5} />
            <Text style={styles.tagsLabel}>Options</Text>
          </View>
          <View style={styles.tagsGrid}>
            {line.tags!.filter(tag => tag && tag.tagSnapshot).map((tag, idx) => (
              <View key={idx} style={styles.tagChip}>
                <Text style={styles.tagChipLabel}>{tag.tagSnapshot.label}</Text>
                <Text style={styles.tagChipValue}>
                  {formatTagValue(tag)}
                </Text>
                {tag.priceModifier != null && tag.priceModifier !== 0 && (
                  <View style={styles.tagPriceBadge}>
                    <Text style={styles.tagPriceText}>
                      {tag.priceModifier > 0 ? '+' : ''}{(tag.priceModifier || 0).toFixed(2)}€
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// Carte pour un menu
interface DraftMenuCardProps {
  line: OrderLine;
  index: number;
  onEditMenu?: (menuLine: OrderLine, index: number) => void;
  onDelete: (index: number) => void;
}

const DraftMenuCard: React.FC<DraftMenuCardProps> = ({
  line,
  index,
  onEditMenu,
  onDelete
}) => {
  if (!line.menu || !line.items) return null;

  const hasNote = line.note && line.note.trim().length > 0;
  const isNewDraft = !line.id || line.id.startsWith('draft-');

  return (
    <View style={styles.menuCard}>
      {/* Header du menu */}
      <View style={styles.menuHeader}>
        <View style={styles.menuMainInfo}>
          <View style={styles.menuNameRow}>
            <Text style={styles.menuName}>{line.menu.name || ''}</Text>
            {isNewDraft && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NOUVEAU</Text>
              </View>
            )}
          </View>
          <Text style={styles.menuPrice}>{Number((line.totalPrice || 0)).toFixed(2)}€</Text>
        </View>
        <View style={styles.itemActions}>
          {onEditMenu && (
            <Pressable
              style={styles.editButton}
              onPress={() => onEditMenu(line, index)}
            >
              <Edit2 size={16} color="#3B82F6" strokeWidth={2.5} />
            </Pressable>
          )}
          <Pressable
            style={styles.deleteButton}
            onPress={() => onDelete(index)}
          >
            <Trash2 size={16} color="#EF4444" strokeWidth={2.5} />
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
              <View style={styles.menuItemHeader}>
                <Text style={styles.menuItemCategory}>{menuItem.categoryName}</Text>
                <Text style={styles.menuItemName}>{menuItem.item?.name || ''}</Text>
                {menuItem.supplementPrice > 0 && (
                  <Text style={styles.menuItemSupplement}>
                    +{Number(menuItem.supplementPrice).toFixed(2)}€
                  </Text>
                )}
              </View>

              {/* Note de l'item */}
              {itemHasNote && (
                <View style={styles.menuItemNoteSection}>
                  <StickyNote size={12} color="#F59E0B" strokeWidth={2.5} />
                  <Text style={styles.menuItemNoteText}>{menuItem.note}</Text>
                </View>
              )}

              {/* Tags de l'item */}
              {itemHasTags && (
                <View style={styles.menuItemTagsSection}>
                  <View style={styles.menuItemTagsBadge}>
                    <TagIcon size={12} color="#8B5CF6" strokeWidth={2.5} />
                    <Text style={styles.menuItemTagsLabel}>Options</Text>
                  </View>
                  <View style={styles.menuItemTagsGrid}>
                    {menuItem.tags.filter((tag: any) => tag && tag.tagSnapshot).map((tag: any, tagIdx: number) => (
                      <View key={tagIdx} style={styles.menuItemTagChip}>
                        <Text style={styles.menuItemTagLabel}>{tag.tagSnapshot.label}</Text>
                        <Text style={styles.menuItemTagValue}>{formatTagValue(tag)}</Text>
                        {tag.priceModifier != null && tag.priceModifier !== 0 && (
                          <View style={styles.menuItemTagPriceBadge}>
                            <Text style={styles.menuItemTagPrice}>
                              {tag.priceModifier > 0 ? '+' : ''}{Number(tag.priceModifier).toFixed(2)}€
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Note globale du menu */}
      {hasNote && (
        <View style={styles.noteSection}>
          <View style={styles.noteBadge}>
            <StickyNote size={14} color="#F59E0B" strokeWidth={2.5} />
            <Text style={styles.noteLabel}>Note</Text>
          </View>
          <Text style={styles.noteText}>{line.note || ''}</Text>
        </View>
      )}
    </View>
  );
};

const formatTagValue = (tag: any): string => {
  if (tag.value === null || tag.value === undefined) return '';
  if (typeof tag.value === 'boolean') return tag.value ? 'Oui' : 'Non';
  if (Array.isArray(tag.value)) return tag.value.join(', ');
  return String(tag.value);
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: Math.min(SCREEN_WIDTH * 0.95, 550),
    height: SCREEN_HEIGHT * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignSelf: 'flex-start',
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Card Item
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Note Section
  noteSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#F3F4F6',
  },
  noteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 20,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },

  // Tags Section
  tagsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#F3F4F6',
  },
  tagsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  tagsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  tagChipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  tagChipValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  tagPriceBadge: {
    backgroundColor: '#DDD6FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  tagPriceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FAFBFC',
    gap: 14,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  clearButtonText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
  },
  closeFooterButton: {
    flex: 1,
    backgroundColor: '#2A2E33',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFooterButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  footerEmpty: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FAFBFC',
  },
  closeButtonEmpty: {
    backgroundColor: '#2A2E33',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Menu Card Styles
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#EFF6FF',
  },
  menuMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  menuNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  menuName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 6,
  },
  menuPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
  },
  menuItemsSection: {
    gap: 12,
  },
  menuItemRow: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItemHeader: {
    gap: 4,
  },
  menuItemCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  menuItemSupplement: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: 2,
  },
  menuItemNoteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  menuItemNoteText: {
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic',
    flex: 1,
  },
  menuItemTagsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  menuItemTagsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  menuItemTagsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItemTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  menuItemTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 5,
  },
  menuItemTagLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  menuItemTagValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  menuItemTagPriceBadge: {
    backgroundColor: '#DDD6FE',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  menuItemTagPrice: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
  // Badge pour les nouveaux items
  newBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
