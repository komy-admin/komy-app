import { Alert, useWindowDimensions, View, ScrollView, Text, StyleSheet } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, ForkTable } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import React, { useEffect, useState } from "react";
import { Item } from "~/types/item.types";
import { itemApiService } from "~/api/item.api";
import { itemTypeApiService } from "~/api/item-type.api";
import { FilterBar } from '~/components/filters/Filter';
import { ItemType } from '~/types/item-type.types';
import { FilterConfig } from '~/hooks/useFilter/types';
import { useFilter } from "~/hooks/useFilter";
import { CustomModal } from "~/components/CustomModal";
import { MenuForm } from "~/components/form/MenuForm";
import { useToast } from '~/components/ToastProvider';

export default function MenuPage() {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [items, setItems] = useState<Item[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const { showToast } = useToast();
  
  const filterItem: FilterConfig<Item>[] = [
    { 
      field: 'name', 
      type: 'text',
      label: 'Nom',
      operator: 'like',
      show: true
    },
    { 
      currency: '€',
      field: 'price', 
      type: 'number',
      label: 'Prix',
      operator: 'between',
      show: true
    },
    { 
      field: 'itemTypeId', 
      type: 'text',
      label: 'ItempType',
      operator: '=',
      show: false
    },
  ];

  const { updateFilter, loading, clearFilters, queryParams } = useFilter<Item>({
    config: filterItem,
    service: itemApiService,
    onDataChange: (response) => setItems(response.data)
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const { data } = await itemTypeApiService.getAll()
        setItemTypes(data);
      } catch (err) {
        console.error('Error loading initial data:', err);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleCreateItem = () => {
    setCurrentItem(null);
    setIsModalVisible(true);
  };

  const handleEditItem = (id: string) => {
    const item = items.find(item => item.id === id);
    if (!item) return;
    setCurrentItem(item);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setCurrentItem(null);
  };

  const handleSaveItem = async (item: Item) => {
    try {
      const itemType = itemTypes.find(type => type.id === item.itemType?.id);
      if (!itemType) {
        throw new Error("Type not found");
      }

      const itemWithType = {
        ...item,
        itemType: itemType
      };

      if (item.id) {
        await itemApiService.update(item.id, itemWithType);
        if (activeTab !== "ALL" && itemWithType.itemType.id !== activeTab) {
          setItems(prevItems => prevItems.filter(i => i.id !== item.id));
        } else {
          setItems(prevItems => prevItems.map(i => i.id === item.id ? itemWithType : i));
        }
        showToast('Article modifié avec succès', 'success');
      } else {
        const newItem = await itemApiService.create(itemWithType);
        if (activeTab === "ALL" || activeTab === itemWithType.itemType.id) {
          setItems(prevItems => [...prevItems, { ...newItem, itemType }]);
        }
        showToast('Article créé avec succès', 'success');
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving item:', err);
      showToast('Erreur lors de la sauvegarde de l\'article', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    const item = items.find(item => item.id === id);
    if (!item) return;
    setItemToDelete(item);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      await itemApiService.delete(itemToDelete.id);
      setItems(items.filter(item => item.id !== itemToDelete.id));
      showToast('Article supprimé avec succès', 'success');
    } catch (err) {
      console.error('Error deleting item:', err);
      showToast('Erreur lors de la suppression de l\'article', 'error');
    } finally {
      setIsDeleteModalVisible(false);
      setItemToDelete(null);
    }
  };

  const { width, height } = useWindowDimensions();
  
  const itemTableColumns = [
    {
      label: 'Nom',
      key: 'name',
      width: '50%',
    },
    {
      label: 'Prix',
      key: 'price',
      width: '20%',
    },
    {
      label: 'Statut',
      key: 'statut',
      width: '20%',
    },
    {
      key: 'actions',
      width: '10%',
    }
  ];

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel 
        title="Filtrage" 
        width={width / 4} 
        isCollapsed={isPanelCollapsed} 
        onCollapsedChange={setIsPanelCollapsed}
      >
        <View style={{ padding: 15 }}>
          <FilterBar
            config={filterItem}
            onUpdateFilter={updateFilter}
            onClearFilters={() => {
              setActiveTab('ALL')
              clearFilters()
            }}
            activeFilters={queryParams.filters || []}
          />
        </View>
      </SidePanel>
      <View style={{ flex: 1 }}>
        <Tabs
          style={{ flex: 1, backgroundColor: '#FFFFFF' }}
          value={activeTab}
          onValueChange={(newValue: string) => {
            if (newValue !== 'ALL') {
              updateFilter('itemTypeId', newValue);
            } else {
              updateFilter('itemTypeId', '');
            }
            setActiveTab(newValue);
          }}
          className="w-full mx-auto flex-col"
        >
          <View 
            style={{ 
              backgroundColor: '#FBFBFB', 
              height: 50, 
              flexDirection: 'row',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ 
                flex: 1, 
                maxWidth: '80%' 
              }}
              contentContainerStyle={{
                alignItems: 'center'
              }}
            >
              <TabsList 
                className="flex-row justify-start h-full" 
                style={{ 
                  paddingTop: 4,
                  height: 50,
                }}
              >
                <TabsTrigger value="ALL" className="flex-row h-full" style={{ width: 100, minWidth: 100 }}>
                  <Text
                    style={{ color: activeTab === 'ALL' ? '#2A2E33' : '#A0A0A0' }}
                  >
                    Tous
                  </Text>
                </TabsTrigger>
                {itemTypes.map((type) => (
                  <TabsTrigger 
                    key={type.id} 
                    value={type.id!} 
                    className="flex-row h-full" 
                    style={{ width: 100, minWidth: 100 }}
                  >
                    <Text
                      style={{ color: activeTab === type.id ? '#2A2E33' : '#A0A0A0' }}
                    >
                      {type.name}
                    </Text>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollView>
            
            <View 
              style={{ 
                width: 200, 
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: '#FBFBFB',
                zIndex: 10,
                shadowColor: '#000',
                shadowOffset: { width: -4, height: 0 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
              }}
            >
              <Button
                onPress={handleCreateItem}
                className="w-[200px] h-[50px] flex items-center justify-center"
                style={{ 
                  backgroundColor: '#2A2E33', 
                  borderRadius: 0, 
                  height: 50,
                  width: 200,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: '#FBFBFB',
                    fontWeight: '500',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                  }}
                >
                  Créer un article
                </Text>
              </Button>
            </View>
          </View>
          
          <TabsContent style={{ flex: 1 }} value={activeTab}>
            <ForkTable 
              data={items}
              columns={itemTableColumns}
              onRowPress={handleEditItem}
              onRowDelete={handleDeleteItem}
            />
          </TabsContent>
        </Tabs>
      </View>

      <CustomModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        width={600}
        height={560}
        title={currentItem ? "Modifier l'article" : "Créer un article"}
      >
        <MenuForm
          item={currentItem}
          itemTypes={itemTypes}
          onSave={handleSaveItem}
          onCancel={handleCloseModal}
          activeTab={activeTab}
        />
      </CustomModal>

      <CustomModal
        isVisible={isDeleteModalVisible}
        onClose={() => {
          setIsDeleteModalVisible(false);
          setItemToDelete(null);
        }}
        width={600}
        height={320}
        title="Confirmation de suppression"
        titleColor="#FF4444"
      >
        <View style={styles.deleteModalContent}>
          <View style={{ paddingTop: 20 }}>
            <Text style={styles.deleteMessage}>
              Êtes-vous sûr de vouloir supprimer l'article {itemToDelete?.name} ?
            </Text>
            <Text style={styles.deleteWarning}>
              {'(Cette action est irréversible.)'}
            </Text>
          </View>
          <View style={styles.deleteButtonContainer}>
            <Button
                onPress={confirmDelete}
                style={styles.deleteButton}
                variant="destructive"
              >
                <Text style={styles.deleteButtonText}>Supprimer</Text>
            </Button>
            <Button
              onPress={() => {
                setIsDeleteModalVisible(false);
                setItemToDelete(null);
              }}
              variant="ghost"
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Button>
          </View>
        </View>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  deleteModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteMessage: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: '#2A2E33',
  },
  deleteWarning: {
    fontSize: 14,
    color: '#FF4444',
    marginBottom: 40,
    textAlign: 'center',
  },
  deleteButtonContainer: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
    marginBottom: 7,
  },
  cancelButtonText: {
    color: '#2A2E33',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});