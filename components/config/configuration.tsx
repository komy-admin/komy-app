import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, PencilLine, Trash2, Check, X, Utensils, Save, ChefHat, Wine } from 'lucide-react-native';
import { useItemTypes } from '~/hooks/useItemTypes';
import { useToast } from '~/components/ToastProvider';
import { ItemType } from '~/types/item-type.types';

interface ItemTypeCardProps {
  itemType: ItemType;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: Partial<ItemType>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

// Couleur par défaut pour tous les itemTypes
const getItemTypeColor = () => '#6366F1';

// Génère les initiales du nom (1 ou 2 lettres)
const getItemTypeInitials = (itemTypeName: string) => {
  const words = itemTypeName.trim().split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
};

// Composant réutilisable pour les boutons de sélection de département
const DepartmentButtons: React.FC<{
  selectedDepartment: 'kitchen' | 'bar';
  onDepartmentChange: (department: 'kitchen' | 'bar') => void;
  styles: any;
}> = ({ selectedDepartment, onDepartmentChange, styles }) => (
  <View style={styles.editDepartmentRow}>
    <TouchableOpacity
      style={[
        styles.fullWidthDepartmentButton,
        styles.kitchenButton,
        selectedDepartment === 'kitchen' && styles.kitchenButtonActive
      ]}
      onPress={() => onDepartmentChange('kitchen')}
    >
      <ChefHat size={16} color={selectedDepartment === 'kitchen' ? '#FFFFFF' : '#10B981'} strokeWidth={2} />
      <Text style={[
        styles.fullWidthDepartmentText,
        selectedDepartment === 'kitchen' && styles.fullWidthDepartmentTextActive
      ]}>
        Cuisine
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[
        styles.fullWidthDepartmentButton,
        styles.barButton,
        selectedDepartment === 'bar' && styles.barButtonActive
      ]}
      onPress={() => onDepartmentChange('bar')}
    >
      <Wine size={16} color={selectedDepartment === 'bar' ? '#FFFFFF' : '#A855F7'} strokeWidth={2} />
      <Text style={[
        styles.fullWidthDepartmentText,
        selectedDepartment === 'bar' && styles.fullWidthDepartmentTextActive
      ]}>
        Bar
      </Text>
    </TouchableOpacity>
  </View>
);

const ItemTypeCard: React.FC<ItemTypeCardProps> = ({
  itemType,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete
}) => {
  const [editedName, setEditedName] = useState(itemType.name);
  const [selectedDepartment, setSelectedDepartment] = useState<'kitchen' | 'bar'>(
    itemType.type === 'bar' ? 'bar' : 'kitchen'
  );

  React.useEffect(() => {
    setEditedName(itemType.name);
    setSelectedDepartment(itemType.type === 'bar' ? 'bar' : 'kitchen');
  }, [itemType.name, itemType.type, isEditing]);

  const handleSave = () => {
    if (editedName.trim() && (editedName.trim() !== itemType.name || selectedDepartment !== itemType.type)) {
      onSave({ name: editedName.trim(), type: selectedDepartment });
    } else {
      onCancel(); // Si pas de changement, juste annuler
    }
  };

  const hasChanges = editedName.trim() !== itemType.name || selectedDepartment !== itemType.type;

  const handleCancel = () => {
    setEditedName(itemType.name);
    onCancel();
  };

  return (
    <View style={styles.itemTypeCard}>
      <View style={styles.itemTypeCardHeader}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>
            {getItemTypeInitials(itemType.name)}
          </Text>
        </View>
        
        {isEditing ? (
          <>
            <View style={styles.editContentContainer}>
              <View style={styles.editInputContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Nom du type"
                  autoFocus
                />
              </View>
            </View>
            
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.validateButton, (!editedName.trim() || !hasChanges) && styles.disabledButton]}
                onPress={handleSave}
                disabled={!editedName.trim() || !hasChanges}
              >
                <Check size={16} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <X size={16} color="#EF4444" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.itemTypeInfo}>
              <Text style={styles.itemTypeName}>{itemType.name}</Text>
              
              {/* Affichage du département sélectionné */}
              <View style={styles.departmentDisplay}>
                <View style={[
                  styles.departmentBadge, 
                  selectedDepartment === 'kitchen' ? styles.kitchenBadge : styles.barBadge
                ]}>
                  {selectedDepartment === 'kitchen' ? (
                    <ChefHat size={12} color="#FFFFFF" strokeWidth={2} />
                  ) : (
                    <Wine size={12} color="#FFFFFF" strokeWidth={2} />
                  )}
                  <Text style={styles.departmentBadgeText}>
                    {selectedDepartment === 'kitchen' ? 'Cuisine' : 'Bar'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onEdit}
              >
                <PencilLine size={16} color="#6366F1" strokeWidth={1.5} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={onDelete}
              >
                <Trash2 size={16} color="#EF4444" strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      
      {/* Boutons département en mode édition - en dessous de tout le contenu de la carte */}
      {isEditing && (
        <DepartmentButtons
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          styles={styles}
        />
      )}
    </View>
  );
};

export default function ConfigurationRestoPage() {
  const {
    itemTypes,
    loading,
    error,
    createItemType,
    updateItemType,
    deleteItemType
  } = useItemTypes();

  const { showToast } = useToast();
  const isMountedRef = React.useRef(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDepartment, setNewItemDepartment] = useState<'kitchen' | 'bar'>('kitchen');
  const [localItemTypes, setLocalItemTypes] = useState<ItemType[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [localEditingItemId, setLocalEditingItemId] = useState<string | null>(null);
  
  // Synchroniser l'état local avec les itemTypes du store
  React.useEffect(() => {
    if (itemTypes && itemTypes.length > 0 && !hasChanges) {
      setLocalItemTypes([...itemTypes]);
    }
  }, [itemTypes, hasChanges]);

  // Cleanup pour éviter les memory leaks
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleCreateItemType = () => {
    if (!newItemName.trim()) return;
    
    // Vérification des doublons
    const isDuplicate = localItemTypes.some(
      item => item.name.toLowerCase() === newItemName.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      showToast('Ce nom de type existe déjà', 'error');
      return;
    }
    
    const newItemType: ItemType = {
      id: `temp-${Date.now()}`, // ID temporaire
      name: newItemName.trim(),
      type: newItemDepartment
    };
    
    console.log('🆕 Création local itemType:', newItemType);
    setLocalItemTypes(prev => {
      const newList = [...prev, newItemType];
      console.log('📝 Nouvelle liste locale:', newList);
      return newList;
    });
    setNewItemName('');
    setNewItemDepartment('kitchen');
    setIsCreating(false);
    setHasChanges(true);
    console.log('✅ HasChanges défini à true');
  };

  const handleUpdateItemType = (id: string, data: Partial<ItemType>) => {
    // Vérifier si il y a vraiment un changement
    const currentItem = localItemTypes.find(item => item.id === id);
    if (!currentItem || !data.name || (currentItem.name === data.name.trim() && currentItem.type === data.type)) {
      setLocalEditingItemId(null);
      return;
    }
    
    // Appliquer le changement
    setLocalItemTypes(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...data } : item
      )
    );
    setLocalEditingItemId(null);
    setHasChanges(true);
  };

  const handleDeleteItemType = (itemType: ItemType) => {
    setLocalItemTypes(prev => prev.filter(item => item.id !== itemType.id));
    setHasChanges(true);
  };

  const handleSaveAllChanges = async () => {
    console.log('🔄 Tentative de sauvegarde, hasChanges:', hasChanges, 'isMounted:', isMountedRef.current);
    if (!hasChanges || !isMountedRef.current) return;
    
    try {
      // Créer les nouveaux items (ceux avec ID temporaire)
      const newItems = localItemTypes.filter(item => item.id.startsWith('temp-'));
      for (const item of newItems) {
        if (!isMountedRef.current) return;
        await createItemType({ name: item.name, type: item.type });
      }
      
      // Mettre à jour les items existants qui ont été modifiés
      const existingItems = localItemTypes.filter(item => !item.id.startsWith('temp-'));
      for (const item of existingItems) {
        if (!isMountedRef.current) return;
        const originalItem = itemTypes.find(original => original.id === item.id);
        if (originalItem && (originalItem.name !== item.name || originalItem.type !== item.type)) {
          await updateItemType(item.id, { name: item.name, type: item.type });
        }
      }
      
      // Supprimer les items qui ne sont plus dans la liste locale
      const deletedItems = itemTypes.filter(original => 
        !localItemTypes.some(local => local.id === original.id)
      );
      for (const item of deletedItems) {
        if (!isMountedRef.current) return;
        await deleteItemType(item.id);
      }
      
      if (!isMountedRef.current) return;
      setHasChanges(false);
      showToast('Types d\'article sauvegardés avec succès', 'success');
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error('Erreur lors de la sauvegarde:', error);
      showToast('Erreur lors de la sauvegarde des types', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.blurOverlay}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.row}>
            <View style={styles.activeCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Utensils size={20} color="#6366F1" strokeWidth={1.5} />
                </View>
                <View style={styles.headerContent}>
                  <Text style={styles.cardTitle}>Types d'articles</Text>
                  <Text style={styles.cardSubtitle}>
                    Gérer les catégories de votre menu
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setIsCreating(true)}
                  disabled={isCreating}
                >
                  <Plus size={16} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
              </View>


              {/* Liste des types d'articles */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : (
                <View style={styles.itemTypesGrid}>
                  {localItemTypes.length === 0 && !isCreating ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        Aucun type d'article configuré
                      </Text>
                      <Text style={styles.emptySubtext}>
                        Ajoutez votre premier type pour commencer
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Créer les rangées de 2 éléments pour les items existants */}
                      {Array.from({ length: Math.ceil(localItemTypes.length / 2) }, (_, rowIndex) => {
                        const startIndex = rowIndex * 2;
                        const rowItems = localItemTypes.slice(startIndex, startIndex + 2);
                        const isLastRow = startIndex + 2 >= localItemTypes.length;
                        const hasOddNumberInLastRow = isLastRow && rowItems.length === 1;
                        
                        return (
                          <View key={rowIndex} style={styles.itemTypesRow}>
                            {rowItems.map((itemType) => (
                              <View key={itemType.id} style={styles.itemTypeColumn}>
                                <ItemTypeCard
                                  itemType={itemType}
                                  isEditing={localEditingItemId === itemType.id}
                                  onEdit={() => setLocalEditingItemId(itemType.id)}
                                  onSave={(data) => handleUpdateItemType(itemType.id, data)}
                                  onCancel={() => setLocalEditingItemId(null)}
                                  onDelete={() => handleDeleteItemType(itemType)}
                                />
                              </View>
                            ))}
                            
                            {/* Si création et dernière rangée avec nombre impair, ajouter le formulaire */}
                            {isCreating && hasOddNumberInLastRow ? (
                              <View style={styles.itemTypeColumn}>
                                <View style={styles.itemTypeCard}>
                                  <View style={styles.itemTypeCardHeader}>
                                    <View style={styles.iconContainer}>
                                      <Text style={styles.iconText}>
                                        {getItemTypeInitials(newItemName || 'Nouveau')}
                                      </Text>
                                    </View>
                                    
                                    <View style={styles.editContentContainer}>
                                      <View style={styles.editInputContainer}>
                                        <TextInput
                                          style={styles.editInput}
                                          value={newItemName}
                                          onChangeText={setNewItemName}
                                          placeholder="Nom du nouveau type..."
                                          autoFocus
                                        />
                                      </View>
                                    </View>
                                    
                                    <View style={styles.cardActions}>
                                      <TouchableOpacity
                                        style={[styles.actionButton, styles.validateButton, !newItemName.trim() && styles.disabledButton]}
                                        onPress={handleCreateItemType}
                                        disabled={!newItemName.trim()}
                                      >
                                        <Check size={16} color="#FFFFFF" strokeWidth={2} />
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={[styles.actionButton, styles.cancelButton]}
                                        onPress={() => {
                                          setIsCreating(false);
                                          setNewItemName('');
                                          setNewItemDepartment('kitchen');
                                        }}
                                      >
                                        <X size={16} color="#EF4444" strokeWidth={2} />
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                  
                                  {/* Boutons département en pleine largeur sous les boutons de base */}
                                  <DepartmentButtons
                                    selectedDepartment={newItemDepartment}
                                    onDepartmentChange={setNewItemDepartment}
                                    styles={styles}
                                  />
                                </View>
                              </View>
                            ) : (
                              /* Colonne vide si pas de création ou si nombre pair - mais pas de flex pour éviter débordement */
                              rowItems.length === 1 && !isCreating && (
                                <View style={styles.itemTypeEmptyColumn} />
                              )
                            )}
                          </View>
                        );
                      })}
                      
                      {/* Formulaire de création sur nouvelle rangée (si nombre pair d'items ou aucun item) */}
                      {isCreating && localItemTypes.length % 2 === 0 && (
                        <View style={styles.itemTypesRow}>
                          <View style={styles.itemTypeColumn}>
                            <View style={styles.itemTypeCard}>
                              <View style={styles.itemTypeCardHeader}>
                                <View style={styles.iconContainer}>
                                  <Text style={styles.iconText}>
                                    {getItemTypeInitials(newItemName || 'Nouveau')}
                                  </Text>
                                </View>
                                
                                <View style={styles.editContentContainer}>
                                  <View style={styles.editInputContainer}>
                                    <TextInput
                                      style={styles.editInput}
                                      value={newItemName}
                                      onChangeText={setNewItemName}
                                      placeholder="Nom du nouveau type..."
                                      autoFocus
                                    />
                                  </View>
                                </View>
                                
                                <View style={styles.cardActions}>
                                  <TouchableOpacity
                                    style={[styles.actionButton, styles.validateButton, !newItemName.trim() && styles.disabledButton]}
                                    onPress={handleCreateItemType}
                                    disabled={!newItemName.trim()}
                                  >
                                    <Check size={16} color="#FFFFFF" strokeWidth={2} />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={() => {
                                      setIsCreating(false);
                                      setNewItemName('');
                                    }}
                                  >
                                    <X size={16} color="#EF4444" strokeWidth={2} />
                                  </TouchableOpacity>
                                </View>
                              </View>
                              
                              {/* Boutons département en pleine largeur sous les boutons de base */}
                              <DepartmentButtons
                                selectedDepartment={newItemDepartment}
                                onDepartmentChange={setNewItemDepartment}
                                styles={styles}
                              />
                            </View>
                          </View>
                          <View style={styles.itemTypeEmptyColumn} />
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
        
        {hasChanges && (
          <View style={styles.stickyButtonContainer}>
            <TouchableOpacity
              style={styles.globalSaveButton}
              onPress={() => {
                console.log('🔘 Bouton d\'enregistrement cliqué');
                handleSaveAllChanges();
              }}
              disabled={loading}
            >
              <Save size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.globalSaveButtonText}>
                Enregistrer les modifications
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  blurOverlay: {
    flex: 1,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#6366F1',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validateButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  cancelButton: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  disabledButton: {
    opacity: 0.5,
  },
  itemTypesGrid: {
    flex: 1,
  },
  itemTypesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  itemTypeColumn: {
    flex: 1,
  },
  itemTypeEmptyColumn: {
    flex: 1,
    minHeight: 1, // Juste pour forcer l'espace sans contenu visible
  },
  itemTypeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
  },
  itemTypeInfo: {
    flex: 1,
  },
  itemTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTypeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deleteButton: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  editContentContainer: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  editInputContainer: {
    // Suppression du marginBottom pour centrer l'input
  },
  editInput: {
    height: 40,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    fontSize: 14,
    color: '#1F2937',
  },
  departmentDisplay: {
    marginTop: 3,
  },
  departmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  kitchenBadge: {
    backgroundColor: '#10B981',
  },
  barBadge: {
    backgroundColor: '#A855F7',
  },
  departmentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  departmentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  departmentLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    width: 70,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    padding: 2,
    flex: 1,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  toggleOptionLeft: {
    // Style spécifique pour l'option de gauche si nécessaire
  },
  toggleOptionRight: {
    // Style spécifique pour l'option de droite si nécessaire
  },
  kitchenToggleActive: {
    backgroundColor: '#F97316',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  barToggleActive: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  globalSaveButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
  },
  globalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  departmentSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    padding: 2,
  },
  departmentOption: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  kitchenOptionActive: {
    backgroundColor: '#F97316',
  },
  barOptionActive: {
    backgroundColor: '#8B5CF6',
  },
  departmentOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  departmentOptionTextActive: {
    color: '#FFFFFF',
  },
  editTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  editInputInline: {
    flex: 1,
    height: 36,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2E33',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 6,
  },
  editDepartmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  fullWidthDepartmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  kitchenButton: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  kitchenButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  barButton: {
    backgroundColor: '#F8F4FF',
    borderColor: '#A855F7',
  },
  barButtonActive: {
    backgroundColor: '#A855F7',
    borderColor: '#A855F7',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  fullWidthDepartmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  fullWidthDepartmentTextActive: {
    color: '#FFFFFF',
  },
});