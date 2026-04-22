import { useWindowDimensions, View, Text, Pressable, TouchableOpacity, Platform, StyleSheet } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger, ForkTable } from "~/components/ui";
import { AppHeader } from '~/components/ui/AppHeader';
import { TabBadgeItem } from '~/components/ui/TabBadgeItem';
import { HeaderActionButton } from '~/components/ui/HeaderActionButton';
import { SidePanel } from "~/components/SidePanel";
import { SlidePanel } from "~/components/ui/SlidePanel";
import { DeleteConfirmPanel } from "~/components/ui/DeleteConfirmPanel";
import { usePanelPortal } from '~/hooks/usePanelPortal';
import { useState, useCallback, useMemo, useEffect } from "react";
import { MenuFilters } from '~/components/filters/MenuFilters';
import { X, PlusCircle, Layers, Lock } from 'lucide-react-native';
import { ItemFormPanel } from '@/components/admin/ItemForm/ItemFormPanel';
import { MenuFormContent } from '@/components/admin/MenuForm/MenuFormContent';
import { useMenuPage } from '~/hooks/useMenuPage';
import { colors } from '~/theme';

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
    panelType, currentItem, currentMenu, closePanel,
    handleCreateItem, handleEditItem, handleSaveItem,
    handleCreateMenu, handleEditMenu, handleBulkMenuSave,
    createMenuCategoryItem, loadMenuCategoryItems,
    pendingDeleteId, pendingDeleteType, pendingDeleteName, confirmDelete, clearPendingDelete,
    getItemActions, getMenuActions, getTousActions, handleTousRowPress,
    itemTableColumns, menuTableColumns, tousColumns,
  } = useMenuPage();

  // Compteurs par tab
  const menuTabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts['menus'] = filteredMenus.length;
    let total = filteredMenus.length;
    for (const type of itemTypes) {
      if (!type.id) continue;
      const count = items.filter(i => i.itemTypeId === type.id).length;
      counts[type.id] = count;
      total += count;
    }
    counts['tous'] = total;
    return counts;
  }, [items, itemTypes, filteredMenus]);

  // Close panel helper (ferme le panel + reset state)
  const handleClosePanel = useCallback(() => {
    closePanel();
    clearPanel();
  }, [closePanel, clearPanel]);

  // ============================================================
  // Sync panel type → usePanelPortal
  // ============================================================

  useEffect(() => {
    if (panelType === 'item') {
      renderPanel(
        <SlidePanel visible={true} onClose={handleClosePanel} width={430}>
          <ItemFormPanel
            item={currentItem}
            itemTypes={itemTypes}
            tags={tags}
            activeTab={activeTab}
            onSave={handleSaveItem}
            onCancel={handleClosePanel}
          />
        </SlidePanel>
      );
    } else if (panelType === 'menu') {
      renderPanel(
        <SlidePanel visible={true} onClose={handleClosePanel} width={430}>
          <MenuFormContent
            menu={currentMenu}
            items={items}
            itemTypes={itemTypes}
            onSave={handleBulkMenuSave}
            onCancel={handleClosePanel}
            onLoadMenuCategoryItems={loadMenuCategoryItems}
            onCreateMenuCategoryItem={createMenuCategoryItem}
          />
        </SlidePanel>
      );
    } else {
      clearPanel();
    }
  }, [panelType, currentItem, currentMenu, handleClosePanel, renderPanel, clearPanel, itemTypes, tags, activeTab, items, handleSaveItem, handleBulkMenuSave, loadMenuCategoryItems, createMenuCategoryItem]);

  // Panel de création — choix Article / Menu
  const openCreatePanel = useCallback(() => {
    renderPanel(
      <CreatePanel
        onClose={() => clearPanel()}
        onCreateItem={() => handleCreateItem()}
        onCreateMenu={() => handleCreateMenu()}
        hasItemTypes={itemTypes.length > 0}
      />
    );
  }, [renderPanel, clearPanel, handleCreateItem, handleCreateMenu, itemTypes.length]);

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
          style={{ flex: 1, backgroundColor: colors.white }}
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mx-auto flex-col"
        >
          {/* Tabs bar */}
          <AppHeader
            rightSlot={
              <HeaderActionButton label="AJOUTER" onPress={openCreatePanel} />
            }
            tabs={
              <TabsList className="flex-row justify-start h-full" style={{ height: 60 }}>
                <TabsTrigger value="tous" className="">
                  <TabBadgeItem
                    name="Tous"
                    stats={`${menuTabCounts['tous'] || 0} élément${(menuTabCounts['tous'] || 0) !== 1 ? 's' : ''}`}
                    isActive={activeTab === 'tous'}
                  />
                </TabsTrigger>
                <TabsTrigger value="menus" className="">
                  <TabBadgeItem
                    name="Menus"
                    stats={`${menuTabCounts['menus'] || 0} menu${(menuTabCounts['menus'] || 0) !== 1 ? 's' : ''}`}
                    isActive={activeTab === 'menus'}
                  />
                </TabsTrigger>
                {itemTypes.filter(type => type.id).map((type) => (
                  <TabsTrigger key={type.id} value={type.id!} className="">
                    <TabBadgeItem
                      name={type.name}
                      stats={`${menuTabCounts[type.id!] || 0} article${(menuTabCounts[type.id!] || 0) !== 1 ? 's' : ''}`}
                      isActive={activeTab === type.id}
                    />
                  </TabsTrigger>
                ))}
              </TabsList>
            }
          />

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

      <DeleteConfirmPanel
        visible={!!pendingDeleteId}
        onClose={clearPendingDelete}
        onConfirm={confirmDelete}
        entityName={`"${pendingDeleteName}"`}
        entityType={pendingDeleteType === 'menu' ? 'le menu' : "l'article"}
      />
    </View>
  );
}

// ============================================================
// Composant — Panel de création (Article / Menu)
// ============================================================

function CreatePanel({ onClose, onCreateItem, onCreateMenu, hasItemTypes }: {
  onClose: () => void;
  onCreateItem: () => void;
  onCreateMenu: () => void;
  hasItemTypes: boolean;
}) {
  return (
    <SlidePanel visible={true} onClose={onClose} width={430}>
      <View style={styles.createPanel}>
        <View style={styles.createPanelHeader}>
          <Text style={styles.createPanelTitle}>Ajouter</Text>
          <Pressable onPress={onClose}>
            <X size={24} color={colors.neutral[500]} strokeWidth={2} />
          </Pressable>
        </View>
        <View style={styles.createPanelContent}>
          <Text style={styles.createPanelSubtitle}>Choisissez le type de création</Text>
          <TouchableOpacity
            style={[styles.createPanelCardArticle, !hasItemTypes && styles.createPanelCardDisabled]}
            onPress={hasItemTypes ? onCreateItem : undefined}
            activeOpacity={hasItemTypes ? 0.7 : 1}
          >
            <View style={[styles.createPanelIconArticle, !hasItemTypes && styles.createPanelIconDisabled]}>
              {hasItemTypes
                ? <PlusCircle size={22} color={colors.brand.dark} strokeWidth={2.5} />
                : <Lock size={18} color={colors.gray[400]} strokeWidth={2} />
              }
            </View>
            <View style={styles.createPanelCardContent}>
              <Text style={[styles.createPanelCardTitleArticle, !hasItemTypes && styles.createPanelCardTitleDisabled]}>Article</Text>
              <Text style={[styles.createPanelCardDescArticle, !hasItemTypes && styles.createPanelCardDescDisabled]}>Ajouter un nouvel article au catalogue</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.createPanelDividerRow}>
            <View style={styles.createPanelDividerLine} />
            <Text style={styles.createPanelDividerText}>ou</Text>
            <View style={styles.createPanelDividerLine} />
          </View>
          <TouchableOpacity
            style={[styles.createPanelCardMenu, !hasItemTypes && styles.createPanelCardDisabled]}
            onPress={hasItemTypes ? onCreateMenu : undefined}
            activeOpacity={hasItemTypes ? 0.7 : 1}
          >
            <View style={[styles.createPanelIconMenu, !hasItemTypes && styles.createPanelIconDisabled]}>
              {hasItemTypes
                ? <Layers size={22} color={colors.brand.dark} strokeWidth={2.5} />
                : <Lock size={18} color={colors.gray[400]} strokeWidth={2} />
              }
            </View>
            <View style={styles.createPanelCardContent}>
              <Text style={[styles.createPanelCardTitleMenu, !hasItemTypes && styles.createPanelCardTitleDisabled]}>Menu</Text>
              <Text style={[styles.createPanelCardDescMenu, !hasItemTypes && styles.createPanelCardDescDisabled]}>Composer un menu avec des catégories d'articles</Text>
            </View>
          </TouchableOpacity>
          {!hasItemTypes && (
            <Text style={styles.createPanelHint}>
              Créez des types d'articles avant de pouvoir ajouter des articles ou des menus.
            </Text>
          )}
        </View>
      </View>
    </SlidePanel>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  createPanel: {
    flex: 1,
    backgroundColor: colors.white,
  },
  createPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  createPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  createPanelContent: {
    flex: 1,
    padding: 20,
  },
  createPanelSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[500],
    marginBottom: 20,
  },
  createPanelCardArticle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.brand.dark,
    gap: 14,
  },
  createPanelCardMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.brand.dark,
    gap: 14,
  },
  createPanelIconArticle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPanelIconMenu: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPanelCardContent: {
    flex: 1,
  },
  createPanelCardTitleArticle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.brand.dark,
    marginBottom: 2,
  },
  createPanelCardDescArticle: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  createPanelCardTitleMenu: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.brand.dark,
    marginBottom: 2,
  },
  createPanelCardDescMenu: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  createPanelCardDisabled: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[300],
    borderStyle: 'dashed' as const,
  },
  createPanelIconDisabled: {
    backgroundColor: colors.neutral[100],
  },
  createPanelCardTitleDisabled: {
    color: colors.gray[400],
  },
  createPanelCardDescDisabled: {
    color: colors.neutral[400],
  },
  createPanelDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  createPanelDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  createPanelDividerText: {
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '400',
    color: colors.gray[400],
  },
  createPanelHint: {
    fontSize: 12,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
