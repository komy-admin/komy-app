import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { X, Check, Package, Search } from 'lucide-react-native';
import { Item } from '~/types/item.types';

/**
 * Props pour le contenu du panel de sélection d'articles
 * Note : Ce composant ne gère PAS le SlidePanel lui-même
 * Il doit être wrappé dans un SlidePanel par le composant parent
 */
interface ItemSelectionPanelContentProps {
  availableItems: Item[];
  onClose: () => void;
  onSelectItem: (itemId: string, supplement: number, isAvailable: boolean) => void;
  mode?: 'add' | 'edit';
  editData?: {
    itemId: string;
    itemName: string;
    supplement: string;
    isAvailable: boolean;
  };
}

/**
 * Contenu du panel de sélection d'articles
 * Séparation des responsabilités : Ce composant gère uniquement le contenu,
 * le SlidePanel est géré par le composant parent (MenuEditor)
 */
export function ItemSelectionPanelContent({
  availableItems,
  onClose,
  onSelectItem,
  mode = 'add',
  editData,
}: ItemSelectionPanelContentProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>(editData?.itemId || '');
  const [supplement, setSupplement] = useState(editData?.supplement || '0');
  const [isAvailable, setIsAvailable] = useState(editData?.isAvailable ?? true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfiguration, setShowConfiguration] = useState(mode === 'edit');

  const handleSave = () => {
    if (!selectedItemId) return;
    const supplementValue = parseFloat(supplement) || 0;
    onSelectItem(selectedItemId, supplementValue, isAvailable);
    handleClose();
  };

  const handleClose = () => {
    setSelectedItemId('');
    setSupplement('0');
    setIsAvailable(true);
    setSearchQuery('');
    setShowConfiguration(false);
    onClose();
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    setShowConfiguration(true);
  };

  const handleChangeItem = () => {
    setShowConfiguration(false);
  };

  const filteredItems = React.useMemo(() =>
    availableItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [availableItems, searchQuery]
  );

  // En mode edit, on n'a pas besoin de chercher l'item dans availableItems
  // car il est déjà assigné et on a juste besoin des editData
  const selectedItem = mode === 'edit'
    ? (selectedItemId ? { id: selectedItemId, name: editData?.itemName || '' } as any : null)
    : availableItems.find((item) => item.id === selectedItemId);

  return (
    <View style={styles.panelContent}>
        {/* Header */}
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>
              {mode === 'edit' ? `Modifier "${editData?.itemName}"` : 'Ajouter un article'}
            </Text>
            <Text style={styles.panelSubtitle}>
              {mode === 'edit'
                ? 'Modifier le supplément et la disponibilité'
                : 'Sélectionnez un article à ajouter à cette catégorie'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color="#64748B" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView
          style={styles.panelForm}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Étape 1: Sélection d'article (mode add seulement, avant configuration) */}
          {mode === 'add' && !showConfiguration && (
            <>
              {/* Barre de recherche */}
              <View style={styles.searchContainer}>
                <Search size={20} color="#94A3B8" strokeWidth={2} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Rechercher un article..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Liste des articles */}
              {filteredItems.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Articles disponibles ({filteredItems.length})
                  </Text>
                  <View style={styles.itemsList}>
                    {filteredItems.map((item) => (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.itemCard,
                          selectedItemId === item.id && styles.itemCardSelected,
                        ]}
                        onPress={() => handleItemSelect(item.id)}
                      >
                        <View style={styles.itemCardContent}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemPrice}>
                            Prix de base : {(item.price / 100).toFixed(2)}€
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.radio,
                            selectedItemId === item.id && styles.radioSelected,
                          ]}
                        >
                          {selectedItemId === item.id && (
                            <View style={styles.radioInner} />
                          )}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Étape 2: Configuration (affichée après sélection en mode add ou directement en mode edit) */}
          {(showConfiguration || mode === 'edit') && selectedItem && (
            <>
              {/* Article sélectionné avec option de changement */}
              {mode === 'add' && (
                <View style={styles.selectedItemBanner}>
                  <View style={styles.selectedItemInfo}>
                    <Text style={styles.selectedItemLabel}>Article sélectionné</Text>
                    <Text style={styles.selectedItemName}>{selectedItem.name}</Text>
                    <Text style={styles.selectedItemPrice}>
                      Prix de base : {(selectedItem.price / 100).toFixed(2)}€
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeItemButton}
                    onPress={handleChangeItem}
                  >
                    <Text style={styles.changeItemButtonText}>Changer</Text>
                  </TouchableOpacity>
                </View>
              )}

              {mode === 'add' && <View style={styles.divider} />}

              {/* Supplément */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Supplément (€)</Text>
                <TextInput
                  style={styles.formInput}
                  value={supplement}
                  onChangeText={setSupplement}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.formHint}>
                  Prix supplémentaire ajouté au prix de base de l'article
                </Text>
              </View>

              {/* Disponibilité */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Disponibilité</Text>
                <Pressable
                  style={[
                    styles.availabilityToggle,
                    isAvailable && styles.availabilityToggleActive,
                  ]}
                  onPress={() => setIsAvailable(!isAvailable)}
                >
                  <View
                    style={[
                      styles.availabilityIndicator,
                      isAvailable && styles.availabilityIndicatorActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.availabilityText,
                      isAvailable && styles.availabilityTextActive,
                    ]}
                  >
                    {isAvailable ? 'Disponible' : 'Indisponible'}
                  </Text>
                </Pressable>
                <Text style={styles.formHint}>
                  L'article sera {isAvailable ? 'visible' : 'masqué'} dans le menu
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.panelFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!selectedItemId || (mode === 'add' && !showConfiguration)) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!selectedItemId || (mode === 'add' && !showConfiguration)}
            activeOpacity={(!selectedItemId || (mode === 'add' && !showConfiguration)) ? 1 : 0.7}
          >
            <Check size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.saveButtonText}>
              {mode === 'edit' ? 'Modifier' : 'Ajouter'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
  );
}

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
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  panelSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  panelForm: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#1E293B',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  formHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 16,
  },
  formInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
  itemsList: {
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    gap: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  itemCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  itemCardContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 12,
    color: '#64748B',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#3B82F6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  availabilityToggleActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
  },
  availabilityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9CA3AF',
    marginRight: 12,
  },
  availabilityIndicatorActive: {
    backgroundColor: '#10B981',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  availabilityTextActive: {
    color: '#047857',
  },
  panelFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
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
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedItemBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  selectedItemPrice: {
    fontSize: 13,
    color: '#64748B',
  },
  changeItemButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  changeItemButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
