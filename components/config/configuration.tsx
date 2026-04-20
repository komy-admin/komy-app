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
import { getColorWithOpacity } from '~/lib/color-utils';
import { colors } from '~/theme';

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

export default function ConfigurationRestoPage({ isCompactSidebar }: { isCompactSidebar?: boolean | null }) {
  const [activeTab, setActiveTab] = useState<TabType>('item-types');
  const [sidePanelVisible, setSidePanelVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editingItemType, setEditingItemType] = useState<ItemType | null>(null);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState<ItemType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { renderPanel, clearPanel } = usePanelPortal();
  const { itemTypes, createItemType, updateItemType, deleteItemType } = useItemTypes();
  const { tags, createTag, updateTag, deleteTag } = useTags();
  const {
    teamEnabled,
    kitchenEnabled,
    barEnabled,
    roomEnabled,
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
      showApiError(error, showToast, 'Erreur lors de la suppression du tag');
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
      showApiError(error, showToast, 'Erreur lors de la suppression du type d\'article');
    } finally {
      setIsDeleting(false);
    }
  }, [itemTypeToDelete, deleteItemType, showToast]);

  const handleCancelDeleteItemType = useCallback(() => {
    setItemTypeToDelete(null);
  }, []);

  const handleSaveTag = useCallback(async (tagData: Partial<Tag>, options?: Partial<TagOption>[]) => {
    const payload = {
      ...tagData,
      ...(options !== undefined ? { options } : {}),
    } as Partial<Tag>;

    if (editingTag) {
      await updateTag(editingTag.id, payload);
    } else {
      await createTag(payload);
    }
    showToast(editingTag ? 'Tag modifié' : 'Tag créé', 'success');
    closeSidePanel();
  }, [editingTag, createTag, updateTag, showToast, closeSidePanel]);

  const handleSaveItemType = useCallback(async (itemTypeData: Partial<ItemType>) => {
    if (editingItemType) {
      await updateItemType(editingItemType.id, itemTypeData);
    } else {
      await createItemType(itemTypeData);
    }
    showToast(editingItemType ? 'Type d\'article modifié' : 'Type d\'article créé', 'success');
    closeSidePanel();
  }, [editingItemType, updateItemType, createItemType, showToast, closeSidePanel]);

  // Synchroniser le panel avec le portal global
  useEffect(() => {
    if (sidePanelVisible) {
      renderPanel(
        <SlidePanel visible={true} onClose={closeSidePanel} width={430}>
          {activeTab === 'tags' ? (
            <TagFormPanel
              tag={editingTag}
              onSave={handleSaveTag}
              onCancel={closeSidePanel}
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
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Sidebar Navigation */}
        <View style={[styles.sidebar, isCompactSidebar !== false && styles.sidebarCompact]}>
          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar !== false && styles.sidebarTabCompact,
              activeTab === 'item-types' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('item-types')}
            activeOpacity={1}
          >
            <Utensils size={20} color={activeTab === 'item-types' ? colors.brand.dark : colors.neutral[500]} strokeWidth={2} />
            {isCompactSidebar === false && (
              <Text style={[styles.sidebarTabText, activeTab === 'item-types' && styles.sidebarTabTextActive]}>
                Types d'articles
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar !== false && styles.sidebarTabCompact,
              activeTab === 'tags' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('tags')}
            activeOpacity={1}
          >
            <TagsIcon size={20} color={activeTab === 'tags' ? colors.brand.dark : colors.neutral[500]} strokeWidth={2} />
            {isCompactSidebar === false && (
              <Text style={[styles.sidebarTabText, activeTab === 'tags' && styles.sidebarTabTextActive]}>
                Tags personnalisés
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar !== false && styles.sidebarTabCompact,
              activeTab === 'views' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('views')}
            activeOpacity={1}
          >
            <Eye size={20} color={activeTab === 'views' ? colors.brand.dark : colors.neutral[500]} strokeWidth={2} />
            {isCompactSidebar === false && (
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
        <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.brand.dark }]} onPress={onCreateItemType}>
          <Text style={styles.createButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.tagsList}
        showsVerticalScrollIndicator={false}
      >
        {itemTypes.length === 0 ? (
          <View style={styles.emptyState}>
            <Utensils size={48} color={colors.neutral[300]} strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Aucun type d'article configuré</Text>
            <Text style={styles.emptyStateText}>Créez votre premier type pour commencer</Text>
            <TouchableOpacity style={[styles.emptyStateButton, { borderColor: colors.brand.dark }]} onPress={onCreateItemType}>
              <Plus size={20} color={colors.brand.dark} strokeWidth={2} />
              <Text style={[styles.emptyStateButtonText, { color: colors.brand.dark }]}>Créer un type</Text>
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
          <Text style={styles.createButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.tagsList}
        showsVerticalScrollIndicator={false}
      >
        {tags.length === 0 ? (
          <View style={styles.emptyState}>
            <TagsIcon size={48} color={colors.neutral[300]} strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Aucun tag configuré</Text>
            <Text style={styles.emptyStateText}>Créez votre premier tag pour commencer</Text>
            <TouchableOpacity style={[styles.emptyStateButton, { borderColor: colors.brand.dark }]} onPress={onCreateTag}>
              <Plus size={20} color={colors.brand.dark} strokeWidth={2} />
              <Text style={[styles.emptyStateButtonText, { color: colors.brand.dark }]}>Créer un tag</Text>
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
  updateConfig: (config: {
    roomEnabled?: boolean;
    teamEnabled?: boolean;
    kitchenEnabled?: boolean;
    barEnabled?: boolean;
  }) => Promise<any>;
  configLoading: boolean;
}

const ViewsTab: React.FC<ViewsTabProps> = ({
  roomEnabled,
  teamEnabled,
  kitchenEnabled,
  barEnabled,
  updateConfig,
  configLoading
}) => {
  const { showToast } = useToast();
  const [localRoomEnabled, setLocalRoomEnabled] = useState(roomEnabled);
  const [localTeamEnabled, setLocalTeamEnabled] = useState(teamEnabled);
  const [localKitchenEnabled, setLocalKitchenEnabled] = useState(kitchenEnabled);
  const [localBarEnabled, setLocalBarEnabled] = useState(barEnabled);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalRoomEnabled(roomEnabled);
    setLocalTeamEnabled(teamEnabled);
    setLocalKitchenEnabled(kitchenEnabled);
    setLocalBarEnabled(barEnabled);
  }, [roomEnabled, teamEnabled, kitchenEnabled, barEnabled]);

  useEffect(() => {
    const changed =
      localRoomEnabled !== roomEnabled ||
      localTeamEnabled !== teamEnabled ||
      localKitchenEnabled !== kitchenEnabled ||
      localBarEnabled !== barEnabled;
    setHasChanges(changed);
  }, [localRoomEnabled, localTeamEnabled, localKitchenEnabled, localBarEnabled, roomEnabled, teamEnabled, kitchenEnabled, barEnabled]);

  const handleSaveChanges = async () => {
    if (!hasChanges) return;

    try {
      await updateConfig({
        roomEnabled: localRoomEnabled,
        teamEnabled: localTeamEnabled,
        kitchenEnabled: localKitchenEnabled,
        barEnabled: localBarEnabled,
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
            style={[styles.createButton, { backgroundColor: colors.brand.dark }]}
            onPress={handleSaveChanges}
            disabled={configLoading}
          >
            <Check size={20} color={colors.white} strokeWidth={2} />
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
              <View style={[styles.viewIconWrapper, { backgroundColor: getColorWithOpacity(colors.brand.dark, 0.08) }]}>
                <LayoutDashboard size={24} color={colors.brand.dark} strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Salles</Text>
                <Text style={styles.viewCardDescription}>Gestion des salles et plan de table</Text>
              </View>
              <Switch
                value={localRoomEnabled}
                onValueChange={setLocalRoomEnabled}
                trackColor={{ false: colors.gray[300], true: colors.success.base }}
                thumbColor={localRoomEnabled ? colors.white : colors.gray[100]}
                disabled={configLoading}
              />
            </View>
          </View>

        {/* Vue Équipe */}
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: getColorWithOpacity(colors.brand.dark, 0.08) }]}>
                <Users size={24} color={colors.brand.dark} strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Équipe</Text>
                <Text style={styles.viewCardDescription}>Gestion des utilisateurs et profils</Text>
              </View>
              <Switch
                value={localTeamEnabled}
                onValueChange={setLocalTeamEnabled}
                trackColor={{ false: colors.gray[300], true: colors.success.base }}
                thumbColor={localTeamEnabled ? colors.white : colors.gray[100]}
                disabled={configLoading}
              />
            </View>
          </View>

        {/* Vue Cuisine */}
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: getColorWithOpacity(colors.brand.dark, 0.08) }]}>
                <ChefHat size={24} color={colors.brand.dark} strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Cuisine</Text>
                <Text style={styles.viewCardDescription}>Préparation des plats</Text>
              </View>
              <Switch
                value={localKitchenEnabled}
                onValueChange={setLocalKitchenEnabled}
                trackColor={{ false: colors.gray[300], true: colors.success.base }}
                thumbColor={localKitchenEnabled ? colors.white : colors.gray[100]}
                disabled={configLoading}
              />
            </View>

          </View>

        {/* Vue Bar */}
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: getColorWithOpacity(colors.brand.dark, 0.08) }]}>
                <Wine size={24} color={colors.brand.dark} strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Bar</Text>
                <Text style={styles.viewCardDescription}>Préparation des boissons</Text>
              </View>
              <Switch
                value={localBarEnabled}
                onValueChange={setLocalBarEnabled}
                trackColor={{ false: colors.gray[300], true: colors.success.base }}
                thumbColor={localBarEnabled ? colors.white : colors.gray[100]}
                disabled={configLoading}
              />
            </View>

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

  // Récupérer l'icône enregistrée
  const iconData = AVAILABLE_ICONS.find(i => i.name === itemType.icon);
  const iconName = iconData?.name || 'glass-wine';

  return (
    <Pressable>
      <View style={styles.tagItem}>
        <View style={styles.tagItemHeader}>
          <View style={styles.tagItemIcon}>
            <MaterialCommunityIcons name={iconName as any} size={20} color={colors.brand.dark} />
          </View>
          <View style={styles.tagItemContent}>
            <Text style={styles.tagItemTitle}>{itemType.name}</Text>
            <View style={styles.tagItemMeta}>
              <View style={[styles.tagBadge, { backgroundColor: isBar ? colors.neutral[50] : colors.success.bg, borderColor: isBar ? colors.purple.base : colors.success.base }]}>
                <Text style={[styles.tagBadgeText, { color: isBar ? colors.purple.base : colors.success.base }]}>
                  {isBar ? 'Bar' : 'Cuisine'}
                </Text>
              </View>
              <View style={[styles.tagBadge, { backgroundColor: colors.neutral[100], borderColor: colors.neutral[300] }]}>
                <Text style={[styles.tagBadgeText, { color: colors.neutral[500] }]}>
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
              <Trash2 size={16} color={colors.error.base} strokeWidth={1.5} />
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
            <TagsIcon size={20} color={colors.brand.dark} strokeWidth={2} />
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
            {!!optionsPreview && (
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
              <Trash2 size={16} color={colors.error.base} strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

TagListItem.displayName = 'TagListItem';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    backgroundColor: colors.white,
    borderLeftWidth: 1,
    borderLeftColor: colors.neutral[200],
    borderRightWidth: 1,
    borderRightColor: colors.neutral[200],
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
    backgroundColor: colors.neutral[100],
  },
  sidebarTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[500],
  },
  sidebarTabTextActive: {
    color: colors.neutral[800],
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
    color: colors.neutral[800],
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.dark,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    minHeight: 44,
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    color: colors.neutral[500],
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.neutral[400],
    marginBottom: 8,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.brand.dark,
    gap: 8,
    marginTop: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand.dark,
  },
  tagItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  tagItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: getColorWithOpacity(colors.brand.dark, 0.08),
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
    color: colors.neutral[800],
  },
  tagItemMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tagBadge: {
    backgroundColor: colors.purple.base,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagBadgeRequired: {
    backgroundColor: colors.warning.base,
  },
  tagBadgeSuccess: {
    backgroundColor: colors.success.base,
  },
  tagBadgeWarning: {
    backgroundColor: colors.error.base,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  tagItemOptions: {
    fontSize: 13,
    color: colors.neutral[500],
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
    backgroundColor: colors.neutral[100],
  },
  tagActionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  tagActionButtonDanger: {
    backgroundColor: colors.error.bg,
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
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
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
    color: colors.neutral[800],
    marginBottom: 4,
  },
  viewCardDescription: {
    fontSize: 14,
    color: colors.neutral[500],
  },
});
