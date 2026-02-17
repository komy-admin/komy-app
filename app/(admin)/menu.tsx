import { useWindowDimensions, View, ScrollView, Text, Pressable, Platform, StyleSheet } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger, ForkTable } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import { SlidePanel } from "~/components/ui/SlidePanel";
import { usePanelPortal } from '~/hooks/usePanelPortal';
import { useState, useCallback } from "react";
import { MenuFilters } from '~/components/filters/MenuFilters';
import { X, Tag, LayoutList } from 'lucide-react-native';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import { ItemFormModal } from '@/components/admin/ItemForm/ItemFormModal';
import { MenuFormModal } from '@/components/admin/MenuForm/MenuFormModal';
import { useMenuPage } from '~/hooks/useMenuPage';

export default function MenuPage() {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const { renderPanel, clearPanel } = usePanelPortal();
  const { width } = useWindowDimensions();

  const {
    activeTab, setActiveTab,
    filters, setFilters, handleClearFilters,
    items, itemTypes, tags,
    loading, menusLoading,
    filteredItems, filteredMenus, tousSections,
    itemFormView, currentItem, handleCreateItem, handleEditItem, handleCloseItemModal, handleSaveItem,
    isDeleteItemModalVisible, itemToDelete, isDeleting, confirmDeleteItem, handleCloseDeleteItemModal,
    menuFormView, currentMenu, handleCreateMenu, handleEditMenu, handleCloseMenuModal, handleBulkMenuSave,
    isDeleteMenuModalVisible, menuToDelete, isDeletingMenu, confirmDeleteMenu, handleCloseDeleteMenuModal,
    createMenuCategoryItem, loadMenuCategoryItems,
    getItemActions, getMenuActions, getTousActions, handleTousRowPress,
    itemTableColumns, menuTableColumns, tousColumns,
  } = useMenuPage();

  // Panel de création — appel direct sans état intermédiaire
  const openCreatePanel = useCallback(() => {
    const closePanel = () => clearPanel();
    renderPanel(
      <CreatePanel
        onClose={closePanel}
        onCreateItem={() => { closePanel(); handleCreateItem(); }}
        onCreateMenu={() => { closePanel(); handleCreateMenu(); }}
      />
    );
  }, [renderPanel, clearPanel, handleCreateItem, handleCreateMenu]);

  // Modals — early return quand visibles
  if (itemFormView.isVisible) {
    return (
      <ItemFormModal
        visible={itemFormView.isVisible}
        mode={itemFormView.mode}
        item={currentItem}
        itemTypes={itemTypes}
        tags={tags}
        activeTab={activeTab}
        onClose={handleCloseItemModal}
        onSave={async (getFormData) => {
          const formData = getFormData();
          if (!formData.isValid) return false;
          try {
            await handleSaveItem(formData.data);
            return true;
          } catch { return false; }
        }}
      />
    );
  }

  if (menuFormView.isVisible) {
    return (
      <MenuFormModal
        visible={menuFormView.isVisible}
        mode={menuFormView.mode}
        menu={currentMenu}
        items={items}
        itemTypes={itemTypes}
        onClose={handleCloseMenuModal}
        onCreateMenuCategoryItem={createMenuCategoryItem}
        onLoadMenuCategoryItems={loadMenuCategoryItems}
        onSave={async (getFormData) => {
          const formData = getFormData();
          if (!formData.isValid) return false;
          try {
            await handleBulkMenuSave(formData.data);
            return true;
          } catch { return false; }
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel
        title="Filtrage"
        width={width / 4}
        isCollapsed={isPanelCollapsed}
        onCollapsedChange={setIsPanelCollapsed}
      >
        <MenuFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
        />
      </SidePanel>

      <View style={{ flex: 1 }}>
        <Tabs
          style={{ flex: 1, backgroundColor: '#FFFFFF' }}
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mx-auto flex-col"
        >
          {/* Tabs bar */}
          <View style={{ backgroundColor: '#FBFBFB', height: 50, flexDirection: 'row' }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              bounces={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ alignItems: 'center' }}
            >
              <TabsList className="flex-row justify-start h-full" style={{ paddingTop: 4, height: 50 }}>
                <TabsTrigger value="tous" className="flex-row h-full" style={{ width: 100, minWidth: 100 }}>
                  <Text style={{ color: activeTab === 'tous' ? '#2A2E33' : '#A0A0A0' }}>Tous</Text>
                </TabsTrigger>
                <TabsTrigger value="menus" className="flex-row h-full" style={{ width: 100, minWidth: 100 }}>
                  <Text style={{ color: activeTab === 'menus' ? '#2A2E33' : '#A0A0A0' }}>Menus</Text>
                </TabsTrigger>
                {itemTypes.map((type) => (
                  <TabsTrigger
                    key={type.id}
                    value={type.id!}
                    className="flex-row h-full"
                    style={{ minWidth: 100, paddingHorizontal: 10 }}
                  >
                    <Text style={{ color: activeTab === type.id ? '#2A2E33' : '#A0A0A0' }}>{type.name}</Text>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollView>

            <Pressable onPress={openCreatePanel} style={styles.createButton}>
              <Text style={styles.createButtonText}>AJOUTER</Text>
            </Pressable>
          </View>

          {/* Content */}
          <TabsContent style={{ flex: 1 }} value={activeTab}>
            {activeTab === 'tous' ? (
              <ForkTable
                data={[]}
                sections={tousSections}
                columns={tousColumns}
                onRowPress={handleTousRowPress}
                useActionMenu={true}
                getActions={getTousActions}
                isLoading={loading || menusLoading}
                loadingMessage="Chargement..."
                emptyMessage="Aucun élément trouvé"
              />
            ) : activeTab === 'menus' ? (
              <ForkTable
                data={filteredMenus}
                columns={menuTableColumns}
                onRowPress={handleEditMenu}
                useActionMenu={true}
                getActions={getMenuActions}
                isLoading={menusLoading}
                loadingMessage="Chargement des menus..."
                emptyMessage="Aucun menu trouvé"
              />
            ) : (
              <ForkTable
                data={filteredItems}
                columns={itemTableColumns}
                onRowPress={handleEditItem}
                useActionMenu={true}
                getActions={getItemActions}
                isLoading={loading}
                loadingMessage="Chargement des articles..."
                emptyMessage="Aucun article trouvé"
              />
            )}
          </TabsContent>
        </Tabs>
      </View>

      <DeleteConfirmationModal
        isVisible={isDeleteItemModalVisible}
        onClose={handleCloseDeleteItemModal}
        onConfirm={confirmDeleteItem}
        entityName={itemToDelete?.name || ''}
        entityType="l'article"
        isLoading={isDeleting}
      />

      <DeleteConfirmationModal
        isVisible={isDeleteMenuModalVisible}
        onClose={handleCloseDeleteMenuModal}
        onConfirm={confirmDeleteMenu}
        entityName={menuToDelete?.name || ''}
        entityType="le menu"
        isLoading={isDeletingMenu}
      />
    </View>
  );
}

// ============================================================
// Composant — Panel de création (Article / Menu)
// ============================================================

function CreatePanel({ onClose, onCreateItem, onCreateMenu }: {
  onClose: () => void;
  onCreateItem: () => void;
  onCreateMenu: () => void;
}) {
  return (
    <SlidePanel visible={true} onClose={onClose} width={420}>
      <View style={styles.createPanel}>
        <View style={styles.createPanelHeader}>
          <Text style={styles.createPanelTitle}>Ajouter</Text>
          <Pressable onPress={onClose}>
            <X size={24} color="#64748B" strokeWidth={2} />
          </Pressable>
        </View>
        <View style={styles.createPanelContent}>
          <Text style={styles.createPanelSubtitle}>Choisissez le type de création</Text>
          <Pressable style={styles.createPanelCard} onPress={onCreateItem}>
            <View style={styles.createPanelIconArticle}>
              <Tag size={32} color="#6366F1" strokeWidth={2} />
            </View>
            <View style={styles.createPanelCardContent}>
              <Text style={styles.createPanelCardTitle}>Article</Text>
              <Text style={styles.createPanelCardDesc}>Ajouter un nouvel article au catalogue</Text>
            </View>
          </Pressable>
          <Pressable style={styles.createPanelCard} onPress={onCreateMenu}>
            <View style={styles.createPanelIconMenu}>
              <LayoutList size={32} color="#F59E0B" strokeWidth={2} />
            </View>
            <View style={styles.createPanelCardContent}>
              <Text style={styles.createPanelCardTitle}>Menu</Text>
              <Text style={styles.createPanelCardDesc}>Composer un menu avec des catégories d'articles</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </SlidePanel>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  createButton: {
    backgroundColor: '#2A2E33',
    height: 50,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  createButtonText: {
    fontSize: 14,
    color: '#FBFBFB',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  createPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  createPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  createPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  createPanelContent: {
    flex: 1,
    padding: 20,
  },
  createPanelSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 20,
  },
  createPanelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  createPanelIconArticle: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  createPanelIconMenu: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  createPanelCardContent: {
    flex: 1,
  },
  createPanelCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  createPanelCardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});
