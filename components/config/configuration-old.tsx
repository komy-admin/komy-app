import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TextInput, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Plus, PencilLine, Trash2, Check, X, Utensils, Save, ChefHat, Wine, Tags, Settings } from 'lucide-react-native';
import { useItemTypes } from '~/hooks/useItemTypes';
import { useTags } from '~/hooks/useTags';
import { useToast } from '~/components/ToastProvider';
import { ItemType } from '~/types/item-type.types';
import { Tag, TagFieldType, TagOption } from '~/types/tag.types';

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

interface TagCardProps {
  tag: Tag;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: Partial<Tag>) => void;
  onCancel: () => void;
  onDelete: () => void;
  onConfigure: () => void;
}

const getTagFieldTypeLabel = (fieldType: TagFieldType): string => {
  const labels: Record<TagFieldType, string> = {
    'select': 'Sélection',
    'multi-select': 'Multi-sélection',
    'number': 'Nombre',
    'text': 'Texte',
    'toggle': 'Oui/Non'
  };
  return labels[fieldType] || fieldType;
};

const getTagInitials = (tagName: string) => {
  const words = tagName.trim().split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
};

const TagCard: React.FC<TagCardProps> = ({
  tag,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onConfigure
}) => {
  const [editedLabel, setEditedLabel] = useState(tag.label);
  const [editedFieldType, setEditedFieldType] = useState<TagFieldType>(tag.fieldType);
  const [editedIsRequired, setEditedIsRequired] = useState(tag.isRequired);

  React.useEffect(() => {
    setEditedLabel(tag.label);
    setEditedFieldType(tag.fieldType);
    setEditedIsRequired(tag.isRequired);
  }, [tag, isEditing]);

  const handleSave = () => {
    if (editedLabel.trim()) {
      const hasChanges =
        editedLabel.trim() !== tag.label ||
        editedFieldType !== tag.fieldType ||
        editedIsRequired !== tag.isRequired;

      if (hasChanges) {
        // Générer automatiquement le nom technique depuis le label
        const generatedName = editedLabel.trim().toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Retirer les accents
          .replace(/[^a-z0-9]+/g, '_') // Remplacer les caractères spéciaux par _
          .replace(/^_+|_+$/g, ''); // Retirer les _ en début et fin

        onSave({
          name: generatedName,
          label: editedLabel.trim(),
          fieldType: editedFieldType,
          isRequired: editedIsRequired
        });
      } else {
        onCancel();
      }
    }
  };

  const hasChanges =
    editedLabel.trim() !== tag.label ||
    editedFieldType !== tag.fieldType ||
    editedIsRequired !== tag.isRequired;

  const handleCancel = () => {
    setEditedLabel(tag.label);
    setEditedFieldType(tag.fieldType);
    setEditedIsRequired(tag.isRequired);
    onCancel();
  };

  const needsOptions = tag.fieldType === 'select' || tag.fieldType === 'multi-select';
  const optionsCount = tag.options?.length || 0;

  return (
    <View style={styles.itemTypeCard}>
      <View style={styles.itemTypeCardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
          <Text style={[styles.iconText, { color: '#A855F7' }]}>
            {getTagInitials(tag.label)}
          </Text>
        </View>

        {isEditing ? (
          <>
            <View style={styles.editContentContainer}>
              <View style={styles.editInputContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editedLabel}
                  onChangeText={setEditedLabel}
                  placeholder="Nom du tag (ex: Cuisson)"
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.validateButton, (!editedLabel.trim() || !hasChanges) && styles.disabledButton]}
                onPress={handleSave}
                disabled={!editedLabel.trim() || !hasChanges}
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
              <Text style={styles.itemTypeName}>{tag.label}</Text>

              <View style={styles.departmentDisplay}>
                <View style={[styles.departmentBadge, { backgroundColor: '#A855F7' }]}>
                  <Text style={styles.departmentBadgeText}>
                    {getTagFieldTypeLabel(tag.fieldType)}
                  </Text>
                  {tag.isRequired && (
                    <Text style={[styles.departmentBadgeText, { marginLeft: 4 }]}>*</Text>
                  )}
                </View>
                {needsOptions && (
                  <View style={[styles.departmentBadge, { backgroundColor: optionsCount > 0 ? '#10B981' : '#EF4444', marginLeft: 6 }]}>
                    <Text style={styles.departmentBadgeText}>
                      {optionsCount} option{optionsCount > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cardActions}>
              {needsOptions && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#A855F7', borderColor: '#A855F7' }]}
                  onPress={onConfigure}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>Options</Text>
                </TouchableOpacity>
              )}
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

      {isEditing && (
        <View style={styles.editDepartmentRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.departmentBadgeText, { color: '#64748B', marginBottom: 6, fontSize: 11 }]}>
              Type de champ
            </Text>
            <View style={styles.departmentDisplay}>
              <TouchableOpacity
                style={[styles.departmentBadge, { backgroundColor: '#A855F7' }]}
                onPress={() => {
                  const types: TagFieldType[] = ['select', 'multi-select', 'number', 'text', 'toggle'];
                  const currentIndex = types.indexOf(editedFieldType);
                  const nextIndex = (currentIndex + 1) % types.length;
                  setEditedFieldType(types[nextIndex]);
                }}
              >
                <Text style={styles.departmentBadgeText}>
                  {getTagFieldTypeLabel(editedFieldType)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.departmentBadgeText, { color: '#64748B', marginBottom: 6, fontSize: 11 }]}>
              Requis
            </Text>
            <TouchableOpacity
              style={[
                styles.fullWidthDepartmentButton,
                editedIsRequired ? styles.kitchenButtonActive : styles.kitchenButton
              ]}
              onPress={() => setEditedIsRequired(!editedIsRequired)}
            >
              <Text style={[
                styles.fullWidthDepartmentText,
                editedIsRequired && styles.fullWidthDepartmentTextActive
              ]}>
                {editedIsRequired ? 'Obligatoire' : 'Optionnel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

interface TagOptionsModalProps {
  visible: boolean;
  tag: Tag | null;
  onClose: () => void;
  onSave: (tagId: string, options: Partial<TagOption>[]) => void;
}

const TagOptionsModal: React.FC<TagOptionsModalProps> = ({ visible, tag, onClose, onSave }) => {
  const [options, setOptions] = useState<Partial<TagOption>[]>([]);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState('');

  React.useEffect(() => {
    if (tag && tag.options) {
      setOptions(tag.options.map(opt => ({ ...opt })));
    } else {
      setOptions([]);
    }
  }, [tag]);

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;

    const generatedValue = newOptionLabel.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const newOption: Partial<TagOption> = {
      id: `temp-opt-${Date.now()}`,
      value: generatedValue,
      label: newOptionLabel.trim(),
      priceModifier: newOptionPrice.trim() ? parseFloat(newOptionPrice) : null,
      isDefault: options.length === 0, // Premier option = défaut
      position: options.length
    };

    setOptions(prev => [...prev, newOption]);
    setNewOptionLabel('');
    setNewOptionPrice('');
    setIsAddingOption(false);
  };

  const handleDeleteOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetDefault = (index: number) => {
    setOptions(prev => prev.map((opt, i) => ({
      ...opt,
      isDefault: i === index
    })));
  };

  const handleUpdateOption = (index: number, field: 'label' | 'priceModifier', value: string) => {
    setOptions(prev => prev.map((opt, i) => {
      if (i !== index) return opt;

      if (field === 'label') {
        const generatedValue = value.trim().toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        return { ...opt, label: value, value: generatedValue };
      } else {
        return { ...opt, priceModifier: value.trim() ? parseFloat(value) : null };
      }
    }));
  };

  const handleSave = () => {
    if (tag) {
      onSave(tag.id, options);
      onClose();
    }
  };

  if (!tag) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Configurer "{tag.label}"</Text>
              <Text style={styles.modalSubtitle}>
                {getTagFieldTypeLabel(tag.fieldType)} • {options.length} option{options.length > 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={24} color="#64748B" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Liste des options */}
            <View style={styles.optionsList}>
              {options.map((option, index) => (
                <View key={option.id || index} style={styles.optionItem}>
                  <View style={styles.optionContent}>
                    <View style={styles.optionInputs}>
                      <TextInput
                        style={[styles.optionInput, { flex: 2 }]}
                        value={option.label}
                        onChangeText={(value) => handleUpdateOption(index, 'label', value)}
                        placeholder="Nom de l'option"
                      />
                      <TextInput
                        style={[styles.optionInput, { flex: 1 }]}
                        value={option.priceModifier?.toString() || ''}
                        onChangeText={(value) => handleUpdateOption(index, 'priceModifier', value)}
                        placeholder="Prix (€)"
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.optionActions}>
                      <TouchableOpacity
                        style={[styles.optionActionButton, option.isDefault && styles.optionDefaultButton]}
                        onPress={() => handleSetDefault(index)}
                      >
                        <Text style={[styles.optionActionText, option.isDefault && styles.optionDefaultText]}>
                          {option.isDefault ? '★' : '☆'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.optionActionButton, styles.optionDeleteButton]}
                        onPress={() => handleDeleteOption(index)}
                      >
                        <Trash2 size={16} color="#EF4444" strokeWidth={1.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              {/* Formulaire d'ajout */}
              {isAddingOption ? (
                <View style={styles.optionItem}>
                  <View style={styles.optionContent}>
                    <View style={styles.optionInputs}>
                      <TextInput
                        style={[styles.optionInput, { flex: 2 }]}
                        value={newOptionLabel}
                        onChangeText={setNewOptionLabel}
                        placeholder="Nom de l'option"
                        autoFocus
                      />
                      <TextInput
                        style={[styles.optionInput, { flex: 1 }]}
                        value={newOptionPrice}
                        onChangeText={setNewOptionPrice}
                        placeholder="Prix (€)"
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.optionActions}>
                      <TouchableOpacity
                        style={[styles.optionActionButton, styles.optionValidateButton]}
                        onPress={handleAddOption}
                        disabled={!newOptionLabel.trim()}
                      >
                        <Check size={16} color="#FFFFFF" strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.optionActionButton, styles.optionCancelButton]}
                        onPress={() => {
                          setIsAddingOption(false);
                          setNewOptionLabel('');
                          setNewOptionPrice('');
                        }}
                      >
                        <X size={16} color="#EF4444" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addOptionButton}
                  onPress={() => setIsAddingOption(true)}
                >
                  <Plus size={20} color="#A855F7" strokeWidth={2} />
                  <Text style={styles.addOptionText}>Ajouter une option</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={onClose}
            >
              <Text style={styles.modalCancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSaveButton]}
              onPress={handleSave}
            >
              <Save size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.modalSaveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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

  const {
    tags,
    loading: tagsLoading,
    error: tagsError,
    createTag,
    updateTag,
    deleteTag,
    bulkCreateOptions
  } = useTags();

  const { showToast } = useToast();
  const isMountedRef = React.useRef(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDepartment, setNewItemDepartment] = useState<'kitchen' | 'bar'>('kitchen');
  const [localItemTypes, setLocalItemTypes] = useState<ItemType[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [localEditingItemId, setLocalEditingItemId] = useState<string | null>(null);

  // Tags state
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagFieldType, setNewTagFieldType] = useState<TagFieldType>('select');
  const [newTagIsRequired, setNewTagIsRequired] = useState(false);
  const [localTags, setLocalTags] = useState<Tag[]>([]);
  const [hasTagChanges, setHasTagChanges] = useState(false);
  const [localEditingTagId, setLocalEditingTagId] = useState<string | null>(null);
  const [configuringTagId, setConfiguringTagId] = useState<string | null>(null);
  
  // Synchroniser l'état local avec les itemTypes du store
  React.useEffect(() => {
    if (itemTypes && itemTypes.length > 0 && !hasChanges) {
      setLocalItemTypes([...itemTypes]);
    }
  }, [itemTypes, hasChanges]);

  // Synchroniser l'état local avec les tags du store
  React.useEffect(() => {
    if (tags && tags.length > 0 && !hasTagChanges) {
      setLocalTags([...tags]);
    }
  }, [tags, hasTagChanges]);

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

  // Tags handlers
  const handleCreateTag = () => {
    if (!newTagLabel.trim()) return;

    // Générer automatiquement le nom technique depuis le label
    const generatedName = newTagLabel.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Retirer les accents
      .replace(/[^a-z0-9]+/g, '_') // Remplacer les caractères spéciaux par _
      .replace(/^_+|_+$/g, ''); // Retirer les _ en début et fin

    const isDuplicate = localTags.some(
      tag => tag.name.toLowerCase() === generatedName.toLowerCase()
    );

    if (isDuplicate) {
      showToast('Ce nom de tag existe déjà', 'error');
      return;
    }

    const newTag: Tag = {
      id: `temp-${Date.now()}`,
      accountId: '',
      name: generatedName,
      label: newTagLabel.trim(),
      fieldType: newTagFieldType,
      isRequired: newTagIsRequired,
      config: null,
      position: localTags.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setLocalTags(prev => [...prev, newTag]);
    setNewTagLabel('');
    setNewTagFieldType('select');
    setNewTagIsRequired(false);
    setIsCreatingTag(false);
    setHasTagChanges(true);
  };

  const handleUpdateTag = (id: string, data: Partial<Tag>) => {
    const currentTag = localTags.find(tag => tag.id === id);
    if (!currentTag || !data.label) {
      setLocalEditingTagId(null);
      return;
    }

    const hasChanges =
      currentTag.label !== data.label.trim() ||
      currentTag.fieldType !== data.fieldType ||
      currentTag.isRequired !== data.isRequired;

    if (!hasChanges) {
      setLocalEditingTagId(null);
      return;
    }

    setLocalTags(prev =>
      prev.map(tag =>
        tag.id === id ? { ...tag, ...data } : tag
      )
    );
    setLocalEditingTagId(null);
    setHasTagChanges(true);
  };

  const handleDeleteTag = (tag: Tag) => {
    setLocalTags(prev => prev.filter(t => t.id !== tag.id));
    setHasTagChanges(true);
  };

  const handleSaveTagOptions = (tagId: string, options: Partial<TagOption>[]) => {
    setLocalTags(prev =>
      prev.map(tag => {
        if (tag.id === tagId) {
          return {
            ...tag,
            options: options as TagOption[]
          };
        }
        return tag;
      })
    );
    setHasTagChanges(true);
  };

  const configuringTag = configuringTagId ? localTags.find(t => t.id === configuringTagId) || null : null;

  const handleSaveAllChanges = async () => {
    console.log('🔄 Tentative de sauvegarde, hasChanges:', hasChanges, 'hasTagChanges:', hasTagChanges, 'isMounted:', isMountedRef.current);
    if ((!hasChanges && !hasTagChanges) || !isMountedRef.current) return;
    
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

      // Sauvegarder les tags
      if (hasTagChanges) {
        // Créer les nouveaux tags (ceux avec ID temporaire)
        const newTags = localTags.filter(tag => tag.id.startsWith('temp-'));
        for (const tag of newTags) {
          if (!isMountedRef.current) return;
          const createdTag = await createTag({
            name: tag.name,
            label: tag.label,
            fieldType: tag.fieldType,
            isRequired: tag.isRequired,
            position: tag.position
          });

          // Si le tag a des options, les créer
          if (tag.options && tag.options.length > 0) {
            const optionsToCreate = tag.options.map(opt => ({
              value: opt.value,
              label: opt.label,
              priceModifier: opt.priceModifier,
              isDefault: opt.isDefault,
              position: opt.position
            }));
            await bulkCreateOptions(createdTag.id, optionsToCreate);
          }
        }

        // Mettre à jour les tags existants qui ont été modifiés
        const existingTags = localTags.filter(tag => !tag.id.startsWith('temp-'));
        for (const tag of existingTags) {
          if (!isMountedRef.current) return;
          const originalTag = tags.find(original => original.id === tag.id);
          if (originalTag && (
            originalTag.name !== tag.name ||
            originalTag.label !== tag.label ||
            originalTag.fieldType !== tag.fieldType ||
            originalTag.isRequired !== tag.isRequired
          )) {
            await updateTag(tag.id, {
              name: tag.name,
              label: tag.label,
              fieldType: tag.fieldType,
              isRequired: tag.isRequired
            });
          }
        }

        // Supprimer les tags qui ne sont plus dans la liste locale
        const deletedTags = tags.filter(original =>
          !localTags.some(local => local.id === original.id)
        );
        for (const tag of deletedTags) {
          if (!isMountedRef.current) return;
          await deleteTag(tag.id);
        }
      }

      if (!isMountedRef.current) return;
      setHasChanges(false);
      setHasTagChanges(false);
      showToast('Configuration sauvegardée avec succès', 'success');
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error('Erreur lors de la sauvegarde:', error);
      showToast('Erreur lors de la sauvegarde', 'error');
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
          <View style={styles.column}>
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

            {/* TAGS SECTION */}
            <View style={styles.activeCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                  <Tags size={20} color="#A855F7" strokeWidth={1.5} />
                </View>
                <View style={styles.headerContent}>
                  <Text style={styles.cardTitle}>Tags personnalisés</Text>
                  <Text style={styles.cardSubtitle}>
                    Créer des modificateurs pour vos articles
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: '#A855F7' }]}
                  onPress={() => setIsCreatingTag(true)}
                  disabled={isCreatingTag}
                >
                  <Plus size={16} color="#FFFFFF" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Liste des tags */}
              {tagsLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              ) : tagsError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{tagsError}</Text>
                </View>
              ) : (
                <View style={styles.itemTypesGrid}>
                  {localTags.length === 0 && !isCreatingTag ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        Aucun tag configuré
                      </Text>
                      <Text style={styles.emptySubtext}>
                        Ajoutez votre premier tag pour commencer
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Créer les rangées de 2 éléments pour les tags existants */}
                      {Array.from({ length: Math.ceil(localTags.length / 2) }, (_, rowIndex) => {
                        const startIndex = rowIndex * 2;
                        const rowTags = localTags.slice(startIndex, startIndex + 2);
                        const isLastRow = startIndex + 2 >= localTags.length;
                        const hasOddNumberInLastRow = isLastRow && rowTags.length === 1;

                        return (
                          <View key={rowIndex} style={styles.itemTypesRow}>
                            {rowTags.map((tag) => (
                              <View key={tag.id} style={styles.itemTypeColumn}>
                                <TagCard
                                  tag={tag}
                                  isEditing={localEditingTagId === tag.id}
                                  onEdit={() => setLocalEditingTagId(tag.id)}
                                  onSave={(data) => handleUpdateTag(tag.id, data)}
                                  onCancel={() => setLocalEditingTagId(null)}
                                  onDelete={() => handleDeleteTag(tag)}
                                  onConfigure={() => setConfiguringTagId(tag.id)}
                                />
                              </View>
                            ))}

                            {/* Si création et dernière rangée avec nombre impair, ajouter le formulaire */}
                            {isCreatingTag && hasOddNumberInLastRow ? (
                              <View style={styles.itemTypeColumn}>
                                <View style={styles.itemTypeCard}>
                                  <View style={styles.itemTypeCardHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                                      <Text style={[styles.iconText, { color: '#A855F7' }]}>
                                        {getTagInitials(newTagLabel || 'Nouveau')}
                                      </Text>
                                    </View>

                                    <View style={styles.editContentContainer}>
                                      <View style={styles.editInputContainer}>
                                        <TextInput
                                          style={styles.editInput}
                                          value={newTagLabel}
                                          onChangeText={setNewTagLabel}
                                          placeholder="Nom du tag (ex: Cuisson)"
                                          autoFocus
                                        />
                                      </View>
                                    </View>

                                    <View style={styles.cardActions}>
                                      <TouchableOpacity
                                        style={[styles.actionButton, styles.validateButton, !newTagLabel.trim() && styles.disabledButton]}
                                        onPress={handleCreateTag}
                                        disabled={!newTagLabel.trim()}
                                      >
                                        <Check size={16} color="#FFFFFF" strokeWidth={2} />
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={[styles.actionButton, styles.cancelButton]}
                                        onPress={() => {
                                          setIsCreatingTag(false);
                                          setNewTagName('');
                                          setNewTagLabel('');
                                          setNewTagFieldType('select');
                                          setNewTagIsRequired(false);
                                        }}
                                      >
                                        <X size={16} color="#EF4444" strokeWidth={2} />
                                      </TouchableOpacity>
                                    </View>
                                  </View>

                                  {/* Options de tag en pleine largeur */}
                                  <View style={styles.editDepartmentRow}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={[styles.departmentBadgeText, { color: '#64748B', marginBottom: 6, fontSize: 11 }]}>
                                        Type de champ
                                      </Text>
                                      <TouchableOpacity
                                        style={[styles.departmentBadge, { backgroundColor: '#A855F7' }]}
                                        onPress={() => {
                                          const types: TagFieldType[] = ['select', 'multi-select', 'number', 'text', 'toggle'];
                                          const currentIndex = types.indexOf(newTagFieldType);
                                          const nextIndex = (currentIndex + 1) % types.length;
                                          setNewTagFieldType(types[nextIndex]);
                                        }}
                                      >
                                        <Text style={styles.departmentBadgeText}>
                                          {getTagFieldTypeLabel(newTagFieldType)}
                                        </Text>
                                      </TouchableOpacity>
                                    </View>

                                    <View style={{ flex: 1 }}>
                                      <Text style={[styles.departmentBadgeText, { color: '#64748B', marginBottom: 6, fontSize: 11 }]}>
                                        Requis
                                      </Text>
                                      <TouchableOpacity
                                        style={[
                                          styles.fullWidthDepartmentButton,
                                          newTagIsRequired ? styles.kitchenButtonActive : styles.kitchenButton
                                        ]}
                                        onPress={() => setNewTagIsRequired(!newTagIsRequired)}
                                      >
                                        <Text style={[
                                          styles.fullWidthDepartmentText,
                                          newTagIsRequired && styles.fullWidthDepartmentTextActive
                                        ]}>
                                          {newTagIsRequired ? 'Obligatoire' : 'Optionnel'}
                                        </Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </View>
                              </View>
                            ) : (
                              rowTags.length === 1 && !isCreatingTag && (
                                <View style={styles.itemTypeEmptyColumn} />
                              )
                            )}
                          </View>
                        );
                      })}

                      {/* Formulaire de création sur nouvelle rangée (si nombre pair de tags ou aucun tag) */}
                      {isCreatingTag && localTags.length % 2 === 0 && (
                        <View style={styles.itemTypesRow}>
                          <View style={styles.itemTypeColumn}>
                            <View style={styles.itemTypeCard}>
                              <View style={styles.itemTypeCardHeader}>
                                <View style={[styles.iconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                                  <Text style={[styles.iconText, { color: '#A855F7' }]}>
                                    {getTagInitials(newTagLabel || 'Nouveau')}
                                  </Text>
                                </View>

                                <View style={styles.editContentContainer}>
                                  <View style={styles.editInputContainer}>
                                    <TextInput
                                      style={styles.editInput}
                                      value={newTagLabel}
                                      onChangeText={setNewTagLabel}
                                      placeholder="Nom du tag (ex: Cuisson)"
                                      autoFocus
                                    />
                                  </View>
                                </View>

                                <View style={styles.cardActions}>
                                  <TouchableOpacity
                                    style={[styles.actionButton, styles.validateButton, !newTagLabel.trim() && styles.disabledButton]}
                                    onPress={handleCreateTag}
                                    disabled={!newTagLabel.trim()}
                                  >
                                    <Check size={16} color="#FFFFFF" strokeWidth={2} />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={() => {
                                      setIsCreatingTag(false);
                                      setNewTagLabel('');
                                      setNewTagFieldType('select');
                                      setNewTagIsRequired(false);
                                    }}
                                  >
                                    <X size={16} color="#EF4444" strokeWidth={2} />
                                  </TouchableOpacity>
                                </View>
                              </View>

                              {/* Options de tag en pleine largeur */}
                              <View style={styles.editDepartmentRow}>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.departmentBadgeText, { color: '#64748B', marginBottom: 6, fontSize: 11 }]}>
                                    Type de champ
                                  </Text>
                                  <TouchableOpacity
                                    style={[styles.departmentBadge, { backgroundColor: '#A855F7' }]}
                                    onPress={() => {
                                      const types: TagFieldType[] = ['select', 'multi-select', 'number', 'text', 'toggle'];
                                      const currentIndex = types.indexOf(newTagFieldType);
                                      const nextIndex = (currentIndex + 1) % types.length;
                                      setNewTagFieldType(types[nextIndex]);
                                    }}
                                  >
                                    <Text style={styles.departmentBadgeText}>
                                      {getTagFieldTypeLabel(newTagFieldType)}
                                    </Text>
                                  </TouchableOpacity>
                                </View>

                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.departmentBadgeText, { color: '#64748B', marginBottom: 6, fontSize: 11 }]}>
                                    Requis
                                  </Text>
                                  <TouchableOpacity
                                    style={[
                                      styles.fullWidthDepartmentButton,
                                      newTagIsRequired ? styles.kitchenButtonActive : styles.kitchenButton
                                    ]}
                                    onPress={() => setNewTagIsRequired(!newTagIsRequired)}
                                  >
                                    <Text style={[
                                      styles.fullWidthDepartmentText,
                                      newTagIsRequired && styles.fullWidthDepartmentTextActive
                                    ]}>
                                      {newTagIsRequired ? 'Obligatoire' : 'Optionnel'}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
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

        {(hasChanges || hasTagChanges) && (
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

        {/* Modale de configuration des options */}
        <TagOptionsModal
          visible={configuringTagId !== null}
          tag={configuringTag}
          onClose={() => setConfiguringTagId(null)}
          onSave={handleSaveTagOptions}
        />
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
  column: {
    flexDirection: 'column',
    gap: 20,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  optionInput: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  optionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  optionActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionDefaultButton: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FBBF24',
  },
  optionActionText: {
    fontSize: 18,
    color: '#94A3B8',
  },
  optionDefaultText: {
    color: '#F59E0B',
  },
  optionValidateButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  optionCancelButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  optionDeleteButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F8F4FF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#A855F7',
    borderStyle: 'dashed',
    gap: 8,
  },
  addOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A855F7',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalCancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSaveButton: {
    backgroundColor: '#A855F7',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSaveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});