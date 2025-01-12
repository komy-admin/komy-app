import { Alert, DimensionValue, ScrollView, useWindowDimensions, View } from "react-native";
import { Input, Tabs, TabsContent, TabsList, TabsTrigger, Text, Button, ForkTable, NumberInput } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import React, { useEffect, useState } from "react";
import { Item, filterItem } from "~/types/item.types";
import { ItemTypes } from "~/types/item-type.enum";
import { itemApiService, ItemApiService } from "~/api/item.api";
import { itemTypeApiService } from "~/api/item-type.api";
import { cn, getItemTypeText } from "~/lib/utils";
import { FilterBar } from '~/components/filters/Filter';
import { ItemType } from '~/types/item-type.types';
import { FilterConfig } from '~/types/filter.types';
import { ForkSelect } from '~/components/ui/select';
import { TextInput } from 'react-native';
import { useFilter } from "~/hooks/useFilter";

export default function MenuPage() {
  // State management
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [items, setItems] = useState<Item[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('Filtrage');
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    itemTypeId: ''
  });
  
  const defaultOption = {
    value: '',
    label: 'Choisissez une catégorie',
    id: ''
  };
  
  const [selectedOption, setSelectedOption] = useState(defaultOption);

  const {
    data,
    loading,
    error,
    updateFilter,
    clearFilters,
    changePage,
    queryParams
  } = useFilter({ config: filterItem, service: itemApiService as ItemApiService });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [itemsResponse, typesResponse] = await Promise.all([
          itemApiService.getAll(),
          itemTypeApiService.getAll()
        ]);
        setItems(itemsResponse.data);
        setItemTypes(typesResponse.data);
      } catch (err) {
        console.error('Error loading initial data:', err);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Update items when filter data changes
  useEffect(() => {
    if (data) {
      setItems(data.data);
    }
  }, [data]);

  // Handlers
  const handleCreateItem = () => {
    setTitle('Création d\'un article');
    setIsEditing(false);
    setCurrentItem(null);
    setSelectedOption(defaultOption);
    setFormData({
      name: '',
      price: 0,
      itemTypeId: ''
    });
  };

  const handleEditItem = (id: string) => {
    setTitle('Modification d\'un article');
    const item = items.find(item => item.id === id)
    if (!item) return
    setIsEditing(true);
    setCurrentItem(item);
    setSelectedOption({
      value: item.itemType?.name || '',
      label: item.itemType?.name || '',
      id: item.itemType?.id || ''
    });
    setFormData({
      name: item.name,
      price: item.price,
      itemTypeId: item.itemType?.id || ''
    });
  };

  const handleCancelEditorCreate = () => {
    setTitle('Filtrage');
    setIsEditing(false);
    setCurrentItem(null);
    setSelectedOption(defaultOption);
    setFormData({
      name: '',
      price: 0,
      itemTypeId: ''
    });
  };

  const submitItemAction = async () => {
    const item: Item = {
      id: currentItem?.id,
      ...formData,
      itemType: {
        id: selectedOption.id,
        name: selectedOption.value
      }
    };

    try {
      if (isEditing && item.id) {
        await itemApiService.update(item.id, item);
        setItems(items.map(i => i.id === item.id ? item : i));
      } else {
        const newItem = await itemApiService.create(item);
        setItems([...items, newItem]);
      }
      handleCancelEditorCreate();
    } catch (err) {
      console.error('Error in submitItemAction:', err);
      Alert.alert('Error', 'Failed to save item');
    }
  };

  const submitItemDelete = async (id: string) => {
    try {
      await itemApiService.delete(id);
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error in deleteItem:', err);
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const renderSidePanelContent = () => {
    if (title === 'Filtrage') {
      return (
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
      );
    }

    if (title.includes('article')) {
      return (
        <>
          <Text style={{
            textTransform: 'uppercase',
            fontWeight: '700',
            fontSize: 14,
            color: '#2A2E33',
            backgroundColor: '#F1F1F1',
            marginVertical: 4,
            padding: 5,
            paddingLeft: 16,
          }}>
            Informations
          </Text>
          <View style={{ flex: 1, padding: 15, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <View>
              <TextInput
                value={formData.name}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Nom de l'article"
                style={{ borderWidth: 1, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF', color: '#2A2E33', marginVertical: 8, padding: 10 }}
              />
              <ForkSelect
                style={{ marginVertical: 8 }}
                choices={itemTypes.map(type => ({ label: type.name, value: type.name, id: type.id }))}
                selectedValue={selectedOption}
                onValueChange={(value) => {
                  if (value) {
                    const itemType = itemTypes.find(type => type.name === value.value);
                    if (itemType) {
                      setSelectedOption({
                        value: itemType.name,
                        label: itemType.name,
                        id: itemType.id!
                      });
                      setFormData(prev => ({ ...prev, itemTypeId: itemType.id! }));
                    }
                  }
                }}
              />
              <NumberInput
                style={{ marginVertical: 8 }}
                value={formData.price}
                onChangeText={(value) => setFormData(prev => ({
                  ...prev, 
                  price: value === null ? 0 : value
                }))}
                decimalPlaces={2}
                min={0}
                max={1000}
                currency="€"
                placeholder="0.00"
              />
            </View>
            <View>
              <Button
                onPress={submitItemAction}
                style={{ backgroundColor: '#2A2E33', borderRadius: 10, height: 45 }}
              >
                <Text style={{ color: '#FBFBFB', fontWeight: '400', fontSize: 16}}>
                  {isEditing ? 'Enregistrer les modifications' : 'Confirmer la création'}
                </Text>
              </Button>
              <Button 
                onPress={handleCancelEditorCreate} 
                style={{ backgroundColor: '#FBFBFB', borderRadius: 0, marginTop: 5 }}
              >
                <Text style={{ color: '#2A2E33', fontWeight: '300', fontSize: 16, textDecorationLine: 'underline'}}>
                  Annuler
                </Text>
              </Button>
            </View>
          </View>
        </>
      );
    }

    return null;
  };

  const { width } = useWindowDimensions()
  
  const itemTableColumns = [
    {
      label: 'Nom',
      key: 'name',
      width: '60%',
    },
    {
      label: 'Prix',
      key: 'price',
      width: '20%',
    },
    {
      label: 'Statut',
      key: 'statut',
      width: '15%',
    },
    {
      label: '',
      key: 'delete',
      width: '5%',
    },

  ];

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel title={title} width={width / 5}>
        {renderSidePanelContent()}
      </SidePanel>
      <View style={{ flex: 1 }}>
        <Tabs
          style={{ flex: 1 }}
          value={activeTab}
          onValueChange={(newValue: string) => {
            if (newValue !== 'ALL') {
              updateFilter('itemTypeId', newValue);
            } else {
              updateFilter('itemTypeId', '');
            }
            setActiveTab(newValue);
          }}
          className="w-full mx-auto flex-col gap-1.5"
        >
          <View className="flex flex-row justify-between w-full" style={{ backgroundColor: '#FBFBFB', height: 50 }}>
            <TabsList className="flex-row w-[500px] h-full">
              <TabsTrigger value="ALL" className="flex-1 flex-row h-full">
                <Text
                  className="pr-2"
                  style={{ color: activeTab === 'ALL' ? '#2A2E33' : '#A0A0A0' }}
                >
                  Tous
                </Text>
              </TabsTrigger>
              {itemTypes.map((type) => (
                <TabsTrigger key={type.id} value={type.id!} className="flex-1 flex-row h-full">
                  <Text
                    className="pr-2"
                    style={{ color: activeTab === type.id ? '#2A2E33' : '#A0A0A0' }}
                  >
                    {type.name}
                  </Text>
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              onPress={handleCreateItem}
              className="w-[200px] h-[50px] flex items-center justify-center"
              style={{ backgroundColor: '#2A2E33', borderRadius: 0 }}
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
          <TabsContent style={{ flex: 1 }} value={activeTab}>
            <ForkTable 
              data={items}
              columns={itemTableColumns}
              onRowPress={handleEditItem}
              onRowDelete={submitItemDelete}
            />
          </TabsContent>
        </Tabs>
      </View>
    </View>
  );
}