import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Switch } from 'react-native';
import { Plus, Trash2, Check, Utensils, Tags as TagsIcon, ChefHat, Wine, Users, Eye, LayoutDashboard } from 'lucide-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AVAILABLE_ICONS } from '~/components/ui/IconSelector';
import { useItemTypes } from '~/hooks/useItemTypes';
import { useTags } from '~/hooks/useTags';
import { useAccountConfig } from '~/hooks/useAccountConfig';
import { useToast } from '~/components/ToastProvider';
import { ItemType } from '~/types/item-type.types';
import { Tag, TagFieldType, TagOption } from '~/types/tag.types';
import { SlidePanel } from '~/components/ui/SlidePanel';
import { ItemTypeFormPanel } from './ItemTypeFormPanel';
import { TagFormPanel } from './TagFormPanel';
import { usePanelPortal } from '~/hooks/usePanelPortal';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import { extractApiError, showApiError } from '~/lib/apiErrorHandler';

type TabType = 'item-types' | 'tags' | 'views';

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

export default function ConfigurationRestoPage() {
  const [activeTab, setActiveTab] = useState<TabType>('item-types');
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editingItemType, setEditingItemType] = useState<ItemType | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState<ItemType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompactSidebar, setIsCompactSidebar] = useState(false);

  const { renderPanel, clearPanel } = usePanelPortal();
  const { itemTypes, createItemType, updateItemType, deleteItemType } = useItemTypes();
  const { tags, createTag, updateTag, deleteTag, bulkCreateOptions, bulkDeleteOptions } = useTags();
  const {
    teamEnabled,
    kitchenEnabled,
    barEnabled,
    roomEnabled,
    kitchenViewMode,
    barViewMode,
    updateConfig,
    isLoading: configLoading
  } = useAccountConfig();
  const { showToast } = useToast();

  const openSidePanelForTag = (tag?: Tag) => {
    setEditingTag(tag || null);
    setEditingItemType(null);
    setSidePanelVisible(true);
  };

  const openSidePanelForItemType = (itemType?: ItemType) => {
    setEditingItemType(itemType || null);
    setEditingTag(null);
    setSidePanelVisible(true);
  };

  const closeSidePanel = useCallback(() => {
    setSidePanelVisible(false);
    setEditingTag(null);
    setEditingItemType(null);
    clearPanel();
  }, [clearPanel]);

  const handleDeleteTagClick = useCallback((tag: Tag) => {
    setTagToDelete(tag);
  }, []);

  const handleConfirmDeleteTag = useCallback(async () => {
    if (!tagToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTag(tagToDelete.id);
      showToast('Tag supprimé avec succès', 'success');
      setTagToDelete(null);
    } catch (error) {
      console.error('Error deleting tag:', error);
      showToast('Erreur lors de la suppression du tag', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [tagToDelete, deleteTag, showToast]);

  const handleCancelDeleteTag = useCallback(() => {
    setTagToDelete(null);
  }, []);

  const handleDeleteItemTypeClick = useCallback((itemType: ItemType) => {
    setItemTypeToDelete(itemType);
  }, []);

  const handleConfirmDeleteItemType = useCallback(async () => {
    if (!itemTypeToDelete) return;

    setIsDeleting(true);
    try {
      await deleteItemType(itemTypeToDelete.id);
      showToast('Type d\'article supprimé avec succès', 'success');
      setItemTypeToDelete(null);
    } catch (error) {
      console.error('Error deleting item type:', error);
      showToast('Erreur lors de la suppression du type d\'article', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [itemTypeToDelete, deleteItemType, showToast]);

  const handleCancelDeleteItemType = useCallback(() => {
    setItemTypeToDelete(null);
  }, []);

  const handleLayoutChange = useCallback((event: any) => {
    const { width } = event.nativeEvent.layout;
    // Basculer en mode compact si la largeur est inférieure à 700px
    setIsCompactSidebar(width < 700);
  }, []);

  const handleSaveTag = useCallback(async (tagData: Partial<Tag>, options?: Partial<TagOption>[]) => {
    if (editingTag) {
      await updateTag(editingTag.id, tagData);

      if (options && options.length > 0) {
        const newOptions = options.filter(opt => !opt.id);
        if (newOptions.length > 0) {
          await bulkCreateOptions(editingTag.id, newOptions);
        }
      }
    } else {
      const createdTag = await createTag(tagData);

      if (options && options.length > 0 && createdTag.id) {
        await bulkCreateOptions(createdTag.id, options);
      }
    }
    showToast(editingTag ? 'Tag modifié' : 'Tag créé', 'success');
    closeSidePanel();
  }, [editingTag, createTag, updateTag, bulkCreateOptions, showToast, closeSidePanel]);

  const handleSaveItemType = useCallback(async (itemTypeData: Partial<ItemType>) => {
    try {
      if (editingItemType) {
        await updateItemType(editingItemType.id, itemTypeData);
      } else {
        await createItemType(itemTypeData);
      }
      showToast(editingItemType ? 'Type d\'article modifié' : 'Type d\'article créé', 'success');
      closeSidePanel();
    } catch (error) {
      showApiError(error, showToast, editingItemType ? 'Erreur lors de la modification du type d\'article' : 'Erreur lors de la création du type d\'article');
    }
  }, [editingItemType, updateItemType, createItemType, showToast, closeSidePanel]);

  // Synchroniser le panel avec le portal global
  useEffect(() => {
    if (sidePanelVisible) {
      renderPanel(
        <SlidePanel visible={true} onClose={closeSidePanel} width="35%" minWidth={350} maxWidth={600}>
          {activeTab === 'tags' ? (
            <TagFormPanel
              tag={editingTag}
              onSave={handleSaveTag}
              onCancel={closeSidePanel}
              onBulkDeleteOptions={bulkDeleteOptions}
            />
          ) : (
            <ItemTypeFormPanel
              itemType={editingItemType}
              onSave={handleSaveItemType}
              onCancel={closeSidePanel}
            />
          )}
        </SlidePanel>
      );
    } else if (!sidePanelVisible) {
      clearPanel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidePanelVisible, activeTab, editingTag, editingItemType]);

  return (
    <View style={styles.container} onLayout={handleLayoutChange}>
      <View style={styles.content}>
        {/* Sidebar Navigation */}
        <View style={[styles.sidebar, isCompactSidebar && styles.sidebarCompact]}>
          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar && styles.sidebarTabCompact,
              activeTab === 'item-types' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('item-types')}
            activeOpacity={1}
          >
            <Utensils size={20} color={activeTab === 'item-types' ? '#6366F1' : '#64748B'} strokeWidth={2} />
            {!isCompactSidebar && (
              <Text style={[styles.sidebarTabText, activeTab === 'item-types' && styles.sidebarTabTextActive]}>
                Types d'articles
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar && styles.sidebarTabCompact,
              activeTab === 'tags' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('tags')}
            activeOpacity={1}
          >
            <TagsIcon size={20} color={activeTab === 'tags' ? '#A855F7' : '#64748B'} strokeWidth={2} />
            {!isCompactSidebar && (
              <Text style={[styles.sidebarTabText, activeTab === 'tags' && styles.sidebarTabTextActive]}>
                Tags personnalisés
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar && styles.sidebarTabCompact,
              activeTab === 'views' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('views')}
            activeOpacity={1}
          >
            <Eye size={20} color={activeTab === 'views' ? '#3B82F6' : '#64748B'} strokeWidth={2} />
            {!isCompactSidebar && (
              <Text style={[styles.sidebarTabText, activeTab === 'views' && styles.sidebarTabTextActive]}>
                Gestion Module
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {activeTab === 'item-types' && (
            <ItemTypesTab
              itemTypes={itemTypes}
              onCreateItemType={() => openSidePanelForItemType()}
              onEditItemType={(itemType) => openSidePanelForItemType(itemType)}
              onDeleteItemType={handleDeleteItemTypeClick}
            />
          )}
          {activeTab === 'tags' && (
            <TagsTab
              tags={tags}
              onCreateTag={() => openSidePanelForTag()}
              onEditTag={(tag) => openSidePanelForTag(tag)}
              onDeleteTag={handleDeleteTagClick}
            />
          )}
          {activeTab === 'views' && (
            <ViewsTab
              roomEnabled={roomEnabled}
              teamEnabled={teamEnabled}
              kitchenEnabled={kitchenEnabled}
              barEnabled={barEnabled}
              kitchenViewMode={kitchenViewMode}
              barViewMode={barViewMode}
              updateConfig={updateConfig}
              configLoading={configLoading}
            />
          )}
        </View>

        {/* Panel rendu via usePanelPortal - pas de rendu local */}
      </View>

      {/* Modal de confirmation pour la suppression de tag */}
      <DeleteConfirmationModal
        isVisible={!!tagToDelete}
        onClose={handleCancelDeleteTag}
        onConfirm={handleConfirmDeleteTag}
        entityName={tagToDelete?.label || ''}
        entityType="le tag"
        isLoading={isDeleting}
        usePortal={true}
        portalName="delete-tag-modal"
      />

      {/* Modal de confirmation pour la suppression de type d'article */}
      <DeleteConfirmationModal
        isVisible={!!itemTypeToDelete}
        onClose={handleCancelDeleteItemType}
        onConfirm={handleConfirmDeleteItemType}
        entityName={itemTypeToDelete?.name || ''}
        entityType="le type d'article"
        isLoading={isDeleting}
        usePortal={true}
        portalName="delete-item-type-modal"
      />
    </View>
  );
}

// Item Types Tab
interface ItemTypesTabProps {
  itemTypes: ItemType[];
  onCreateItemType: () => void;
  onEditItemType: (itemType: ItemType) => void;
  onDeleteItemType: (itemType: ItemType) => void;
}

const ItemTypesTab: React.FC<ItemTypesTabProps> = ({ itemTypes, onCreateItemType, onEditItemType, onDeleteItemType }) => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Types d'articles</Text>
          <Text style={styles.tabSubtitle}>Gérer les catégories de votre menu</Text>
        </View>
        <TouchableOpacity style={[styles.createButton, { backgroundColor: '#6366F1' }]} onPress={onCreateItemType}>
          <Plus size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.createButtonText}>Nouveau type</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.tagsList}
        showsVerticalScrollIndicator={false}
      >
        {itemTypes.length === 0 ? (
          <View style={styles.emptyState}>
            <Utensils size={48} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Aucun type d'article configuré</Text>
            <Text style={styles.emptyStateText}>Créez votre premier type pour commencer</Text>
            <TouchableOpacity style={[styles.emptyStateButton, { borderColor: '#6366F1' }]} onPress={onCreateItemType}>
              <Plus size={20} color="#6366F1" strokeWidth={2} />
              <Text style={[styles.emptyStateButtonText, { color: '#6366F1' }]}>Créer un type</Text>
            </TouchableOpacity>
          </View>
        ) : (
          itemTypes.map((itemType) => (
            <ItemTypeListItem
              key={itemType.id}
              itemType={itemType}
              onEdit={() => onEditItemType(itemType)}
              onDelete={() => onDeleteItemType(itemType)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

// Tags Tab
interface TagsTabProps {
  tags: Tag[];
  onCreateTag: () => void;
  onEditTag: (tag: Tag) => void;
  onDeleteTag: (tag: Tag) => void;
}

const TagsTab: React.FC<TagsTabProps> = ({ tags, onCreateTag, onEditTag, onDeleteTag }) => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Tags personnalisés</Text>
          <Text style={styles.tabSubtitle}>Créer des modificateurs pour vos articles</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={onCreateTag}>
          <Plus size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.createButtonText}>Nouveau tag</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.tagsList}
        showsVerticalScrollIndicator={false}
      >
        {tags.length === 0 ? (
          <View style={styles.emptyState}>
            <TagsIcon size={48} color="#CBD5E1" strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Aucun tag configuré</Text>
            <Text style={styles.emptyStateText}>Créez votre premier tag pour commencer</Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={onCreateTag}>
              <Plus size={20} color="#A855F7" strokeWidth={2} />
              <Text style={styles.emptyStateButtonText}>Créer un tag</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tags.map((tag) => (
            <TagListItem
              key={tag.id}
              tag={tag}
              onEdit={() => onEditTag(tag)}
              onDelete={() => onDeleteTag(tag)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

// Views Tab
interface ViewsTabProps {
  roomEnabled: boolean;
  teamEnabled: boolean;
  kitchenEnabled: boolean;
  barEnabled: boolean;
  kitchenViewMode: 'columns' | 'tickets';
  barViewMode: 'columns' | 'tickets';
  updateConfig: (config: {
    roomEnabled?: boolean;
    teamEnabled?: boolean;
    kitchenEnabled?: boolean;
    barEnabled?: boolean;
    kitchenViewMode?: 'columns' | 'tickets';
    barViewMode?: 'columns' | 'tickets';
  }) => Promise<any>;
  configLoading: boolean;
}

const ViewsTab: React.FC<ViewsTabProps> = ({
  roomEnabled,
  teamEnabled,
  kitchenEnabled,
  barEnabled,
  kitchenViewMode,
  barViewMode,
  updateConfig,
  configLoading
}) => {
  const { showToast } = useToast();
  const [localRoomEnabled, setLocalRoomEnabled] = useState(roomEnabled);
  const [localTeamEnabled, setLocalTeamEnabled] = useState(teamEnabled);
  const [localKitchenEnabled, setLocalKitchenEnabled] = useState(kitchenEnabled);
  const [localBarEnabled, setLocalBarEnabled] = useState(barEnabled);
  const [localKitchenViewMode, setLocalKitchenViewMode] = useState<'columns' | 'tickets'>(kitchenViewMode);
  const [localBarViewMode, setLocalBarViewMode] = useState<'columns' | 'tickets'>(barViewMode);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalRoomEnabled(roomEnabled);
    setLocalTeamEnabled(teamEnabled);
    setLocalKitchenEnabled(kitchenEnabled);
    setLocalBarEnabled(barEnabled);
    setLocalKitchenViewMode(kitchenViewMode);
    setLocalBarViewMode(barViewMode);
  }, [roomEnabled, teamEnabled, kitchenEnabled, barEnabled, kitchenViewMode, barViewMode]);

  useEffect(() => {
    const changed =
      localRoomEnabled !== roomEnabled ||
      localTeamEnabled !== teamEnabled ||
      localKitchenEnabled !== kitchenEnabled ||
      localBarEnabled !== barEnabled ||
      localKitchenViewMode !== kitchenViewMode ||
      localBarViewMode !== barViewMode;
    setHasChanges(changed);
  }, [localRoomEnabled, localTeamEnabled, localKitchenEnabled, localBarEnabled, localKitchenViewMode, localBarViewMode, roomEnabled, teamEnabled, kitchenEnabled, barEnabled, kitchenViewMode, barViewMode]);

  const handleSaveChanges = async () => {
    if (!hasChanges) return;

    try {
      await updateConfig({
        roomEnabled: localRoomEnabled,
        teamEnabled: localTeamEnabled,
        kitchenEnabled: localKitchenEnabled,
        barEnabled: localBarEnabled,
        kitchenViewMode: localKitchenViewMode,
        barViewMode: localBarViewMode
      });
      setHasChanges(false);
      showToast('Configuration des vues sauvegardée avec succès', 'success');
    } catch (error) {
      const info = extractApiError(error);
      if (info.status === 409) {
        // Revert all local state on conflict (active orders exist)
        setLocalRoomEnabled(roomEnabled);
        setLocalTeamEnabled(teamEnabled);
        setLocalKitchenEnabled(kitchenEnabled);
        setLocalBarEnabled(barEnabled);
        setLocalKitchenViewMode(kitchenViewMode);
        setLocalBarViewMode(barViewMode);
      }
      showToast(info.message || 'Erreur lors de la sauvegarde de la configuration', 'error');
    }
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Gestion Module</Text>
          <Text style={styles.tabSubtitle}>Activer ou désactiver les modules de l'application</Text>
        </View>
        {hasChanges && (
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: '#10B981' }]}
            onPress={handleSaveChanges}
            disabled={configLoading}
          >
            <Check size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.createButtonText}>Enregistrer</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.viewsScrollContainer}
        contentContainerStyle={styles.viewsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.viewsCardsWrapper}>
        {/* Vue Salles */}
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <LayoutDashboard size={24} color="#F59E0B" strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Salles</Text>
                <Text style={styles.viewCardDescription}>Gestion des salles et plan de table</Text>
              </View>
              <Switch
                value={localRoomEnabled}
                onValueChange={setLocalRoomEnabled}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor={localRoomEnabled ? '#FFFFFF' : '#F3F4F6'}
                disabled={configLoading}
              />
            </View>
          </View>

        {/* Vue Équipe */}
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Users size={24} color="#3B82F6" strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Équipe</Text>
                <Text style={styles.viewCardDescription}>Gestion des utilisateurs et profils</Text>
              </View>
              <Switch
                value={localTeamEnabled}
                onValueChange={setLocalTeamEnabled}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor={localTeamEnabled ? '#FFFFFF' : '#F3F4F6'}
                disabled={configLoading}
              />
            </View>
          </View>

        {/* Vue Cuisine */}
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <ChefHat size={24} color="#10B981" strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Cuisine</Text>
                <Text style={styles.viewCardDescription}>Préparation des plats</Text>
              </View>
              <Switch
                value={localKitchenEnabled}
                onValueChange={setLocalKitchenEnabled}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor={localKitchenEnabled ? '#FFFFFF' : '#F3F4F6'}
                disabled={configLoading}
              />
            </View>

            {/* Mode d'affichage Cuisine - affiché seulement si activé */}
            {localKitchenEnabled && (
              <View style={styles.viewModeSection}>
                <Text style={styles.viewModeTitle}>Mode d'affichage</Text>
                <View style={styles.viewModeOptions}>
                  <ViewModeMockup
                    type="tickets"
                    isSelected={localKitchenViewMode === 'tickets'}
                    onSelect={() => setLocalKitchenViewMode('tickets')}
                    disabled={configLoading}
                  />
                  <ViewModeMockup
                    type="columns"
                    isSelected={localKitchenViewMode === 'columns'}
                    onSelect={() => setLocalKitchenViewMode('columns')}
                    disabled={configLoading}
                  />
                </View>
              </View>
            )}
          </View>

        {/* Vue Bar */}
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                <Wine size={24} color="#A855F7" strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Bar</Text>
                <Text style={styles.viewCardDescription}>Préparation des boissons</Text>
              </View>
              <Switch
                value={localBarEnabled}
                onValueChange={setLocalBarEnabled}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor={localBarEnabled ? '#FFFFFF' : '#F3F4F6'}
                disabled={configLoading}
              />
            </View>

            {/* Mode d'affichage Bar - affiché seulement si activé */}
            {localBarEnabled && (
              <View style={styles.viewModeSection}>
                <Text style={styles.viewModeTitle}>Mode d'affichage</Text>
                <View style={styles.viewModeOptions}>
                  <ViewModeMockup
                    type="tickets"
                    isSelected={localBarViewMode === 'tickets'}
                    onSelect={() => setLocalBarViewMode('tickets')}
                    disabled={configLoading}
                  />
                  <ViewModeMockup
                    type="columns"
                    isSelected={localBarViewMode === 'columns'}
                    onSelect={() => setLocalBarViewMode('columns')}
                    disabled={configLoading}
                  />
                </View>
              </View>
            )}
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
};

// Item Type List Item
interface ItemTypeListItemProps {
  itemType: ItemType;
  onEdit: () => void;
  onDelete: () => void;
}

const ItemTypeListItem: React.FC<ItemTypeListItemProps> = React.memo(({ itemType, onEdit, onDelete }) => {
  const isBar = itemType.type === 'bar';
  const iconColor = isBar ? '#A855F7' : '#10B981';
  const backgroundColor = isBar ? '#FAF5FF' : '#F0FDF4';

  // Récupérer l'icône enregistrée
  const iconData = AVAILABLE_ICONS.find(i => i.name === itemType.icon);
  const iconName = iconData?.name || 'glass-wine';

  return (
    <Pressable>
      <View style={styles.tagItem}>
        <View style={styles.tagItemHeader}>
          <View style={[styles.tagItemIcon, { backgroundColor }]}>
            <MaterialCommunityIcons name={iconName as any} size={20} color={iconColor} />
          </View>
          <View style={styles.tagItemContent}>
            <Text style={styles.tagItemTitle}>{itemType.name}</Text>
            <View style={styles.tagItemMeta}>
              <View style={[styles.tagBadge, { backgroundColor, borderColor: iconColor }]}>
                <Text style={[styles.tagBadgeText, { color: iconColor }]}>
                  {isBar ? 'Bar' : 'Cuisine'}
                </Text>
              </View>
              <View style={[styles.tagBadge, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
                <Text style={[styles.tagBadgeText, { color: '#64748B' }]}>
                  Niveau {itemType.priorityOrder}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.tagItemActions}>
            <Pressable style={styles.tagActionButton} onPress={onEdit}>
              <Text style={styles.tagActionButtonText}>Modifier</Text>
            </Pressable>
            <Pressable style={[styles.tagActionButton, styles.tagActionButtonDanger]} onPress={onDelete}>
              <Trash2 size={16} color="#EF4444" strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

ItemTypeListItem.displayName = 'ItemTypeListItem';

// Tag List Item
interface TagListItemProps {
  tag: Tag;
  onEdit: () => void;
  onDelete: () => void;
}

const TagListItem: React.FC<TagListItemProps> = React.memo(({ tag, onEdit, onDelete }) => {
  const optionsCount = tag.options?.length || 0;
  const optionsPreview = tag.options?.slice(0, 3).map(opt => opt.label).join(', ') || '';
  const hasMore = optionsCount > 3;

  return (
    <Pressable>
      <View style={styles.tagItem}>
        <View style={styles.tagItemHeader}>
          <View style={styles.tagItemIcon}>
            <TagsIcon size={20} color="#A855F7" strokeWidth={2} />
          </View>
          <View style={styles.tagItemContent}>
            <Text style={styles.tagItemTitle}>{tag.label}</Text>
            <View style={styles.tagItemMeta}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{getTagFieldTypeLabel(tag.fieldType)}</Text>
              </View>
              {tag.isRequired && (
                <View style={[styles.tagBadge, styles.tagBadgeRequired]}>
                  <Text style={styles.tagBadgeText}>Obligatoire</Text>
                </View>
              )}
              {(tag.fieldType === 'select' || tag.fieldType === 'multi-select') && (
                <View style={[styles.tagBadge, optionsCount === 0 ? styles.tagBadgeWarning : styles.tagBadgeSuccess]}>
                  <Text style={styles.tagBadgeText}>{optionsCount} option{optionsCount > 1 ? 's' : ''}</Text>
                </View>
              )}
            </View>
            {optionsPreview && (
              <Text style={styles.tagItemOptions}>
                {optionsPreview}{hasMore ? '...' : ''}
              </Text>
            )}
          </View>
          <View style={styles.tagItemActions}>
            <Pressable style={styles.tagActionButton} onPress={onEdit}>
              <Text style={styles.tagActionButtonText}>Modifier</Text>
            </Pressable>
            <Pressable style={[styles.tagActionButton, styles.tagActionButtonDanger]} onPress={onDelete}>
              <Trash2 size={16} color="#EF4444" strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

TagListItem.displayName = 'TagListItem';

// View Mode Mockup Component
interface ViewModeMockupProps {
  type: 'columns' | 'tickets';
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const ViewModeMockup: React.FC<ViewModeMockupProps> = ({ type, isSelected, onSelect, disabled }) => {
  return (
    <TouchableOpacity
      style={[
        styles.mockupContainer,
        isSelected && styles.mockupContainerSelected
      ]}
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.mockupContent}>
        {type === 'columns' ? (
          // Maquette Columns : 3 colonnes avec mini cards
          <>
            <View style={styles.mockupColumnsView}>
              {/* Colonne EN ATTENTE */}
              <View style={styles.mockupColumn}>
                <View style={[styles.mockupColumnHeader, { backgroundColor: '#FEF3C7' }]}>
                  <View style={styles.mockupColumnHeaderLine} />
                </View>
                <View style={styles.mockupColumnCards}>
                  <View style={[styles.mockupCard, { backgroundColor: '#FFFBEB' }]} />
                  <View style={[styles.mockupCard, { backgroundColor: '#FFFBEB' }]} />
                </View>
              </View>

              {/* Colonne EN COURS */}
              <View style={styles.mockupColumn}>
                <View style={[styles.mockupColumnHeader, { backgroundColor: '#FFD1AD' }]}>
                  <View style={styles.mockupColumnHeaderLine} />
                </View>
                <View style={styles.mockupColumnCards}>
                  <View style={[styles.mockupCard, { backgroundColor: '#FFF8F0' }]} />
                </View>
              </View>

              {/* Colonne PRÊT */}
              <View style={styles.mockupColumn}>
                <View style={[styles.mockupColumnHeader, { backgroundColor: '#DBEAFE' }]}>
                  <View style={styles.mockupColumnHeaderLine} />
                </View>
                <View style={styles.mockupColumnCards}>
                  <View style={[styles.mockupCard, { backgroundColor: '#DBEAFE' }]} />
                </View>
              </View>
            </View>
            <Text style={styles.mockupLabel}>Vue Colonnes</Text>
          </>
        ) : (
          // Maquette Tickets : rangée horizontale de tickets
          <>
            <View style={styles.mockupTicketsView}>
              <View style={[styles.mockupTicket, { backgroundColor: '#FFF8F0' }]}>
                <View style={styles.mockupTicketHeader} />
                <View style={styles.mockupTicketLine} />
                <View style={styles.mockupTicketLine} />
                <View style={styles.mockupTicketLine} />
                <View style={styles.mockupTicketLine} />
                <View style={styles.mockupTicketLine} />
              </View>
              <View style={[styles.mockupTicket, { backgroundColor: '#FFFBEB' }]}>
                <View style={styles.mockupTicketHeader} />
                <View style={styles.mockupTicketLine} />
                <View style={styles.mockupTicketLine} />
                <View style={styles.mockupTicketLine} />
                <View style={styles.mockupTicketLine} />
              </View>
              <View style={[styles.mockupTicket, { backgroundColor: '#DBEAFE' }]}>
                <View style={styles.mockupTicketHeader} />
                <View style={styles.mockupTicketLine} />
                <View style={styles.mockupTicketLine} />
                <View style={styles.mockupTicketLine} />
              </View>
              <View style={[styles.mockupTicket, styles.mockupTicketPartial, { backgroundColor: '#FEE2E2' }]}>
                <View style={styles.mockupTicketHeader} />
                <View style={styles.mockupTicketLine} />
                <View style={styles.mockupTicketLine} />
                <View style={styles.mockupTicketLine} />
                <View style={styles.mockupTicketLine} />
              </View>
            </View>
            <Text style={styles.mockupLabel}>Vue Tickets</Text>
          </>
        )}
      </View>

      {/* Checkmark si sélectionné */}
      {isSelected && (
        <View style={styles.mockupCheckmark}>
          <Check size={16} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    padding: 16,
    gap: 8,
  },
  sidebarCompact: {
    width: 72,
    padding: 8,
  },
  sidebarTab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  sidebarTabCompact: {
    justifyContent: 'center',
    padding: 14,
    gap: 0,
  },
  sidebarTabActive: {
    backgroundColor: '#F1F5F9',
  },
  sidebarTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  sidebarTabTextActive: {
    color: '#1E293B',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 24,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A855F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tagsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A855F7',
    gap: 8,
    marginTop: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A855F7',
  },
  tagItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagItemContent: {
    flex: 1,
    gap: 6,
  },
  tagItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  tagItemMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tagBadge: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagBadgeRequired: {
    backgroundColor: '#F59E0B',
  },
  tagBadgeSuccess: {
    backgroundColor: '#10B981',
  },
  tagBadgeWarning: {
    backgroundColor: '#EF4444',
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tagItemOptions: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  tagItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tagActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  tagActionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tagActionButtonDanger: {
    backgroundColor: '#FEF2F2',
  },
  // Views Tab specific styles
  viewsScrollContainer: {
    flex: 1,
  },
  viewsContainer: {
    paddingBottom: 24,
  },
  viewsCardsWrapper: {
    gap: 16,
  },
  viewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  viewIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCardContent: {
    flex: 1,
  },
  viewCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  viewCardDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  // View mode section styles
  viewModeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  viewModeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  viewModeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  // Mockup container styles
  mockupContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 12,
    position: 'relative',
    minHeight: 140,
  },
  mockupContainerSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  mockupContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mockupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  mockupCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Columns mockup styles
  mockupColumnsView: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  mockupColumn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  mockupColumnHeader: {
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  mockupColumnHeaderLine: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 1,
  },
  mockupColumnCards: {
    padding: 3,
    gap: 3,
  },
  mockupCard: {
    height: 20,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  // Tickets mockup styles
  mockupTicketsView: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    overflow: 'hidden',
  },
  mockupTicket: {
    width: 38,
    borderRadius: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    gap: 3,
    flexShrink: 0,
  },
  mockupTicketPartial: {
    opacity: 0.5,
  },
  mockupTicketHeader: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 2,
    width: '80%',
  },
  mockupTicketLine: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 1,
    width: '100%',
  },
});
