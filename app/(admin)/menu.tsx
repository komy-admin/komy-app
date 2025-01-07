import { Alert, DimensionValue, ScrollView, useWindowDimensions, View } from "react-native";
import { Input, Tabs, TabsContent, TabsList, TabsTrigger, Text, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Button } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import React, { useEffect, useState } from "react";
import { Item } from "~/types/item.types";
import { ItemTypes } from "~/types/item-type.enum";
import { itemsApi } from "~/api/items.api";
import { itemTypeApi } from "~/api/itemTypes.api";
import { cn, getItemTypeText } from "~/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/components/ui/select';
import { ItemTable } from "~/components/admin/ItemTable";
import { FilterBar } from '~/components/filters/Filter';
import { useFilter } from '~/components/filters/useFilter';
import { ItemTypeTypes } from '~/types/item-type.types';
import { FilterConfig } from '~/types/filter.types';

export default function MenuPage() {
  // State management
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [items, setItems] = useState<Item[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemTypeTypes[]>([]);
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
  const columnWidths = ['65%', '15%', '15%', '5%'] as DimensionValue[];

  // Filter configuration
  const filterItem: FilterConfig<Item>[] = [
    { 
      field: 'name', 
      type: 'text',
      label: 'Nom'
    },
    { 
      field: 'price', 
      type: 'number',
      label: 'Prix',
      operator: 'between'
    },
    { 
      field: 'itemTypeId', 
      type: 'select',
      label: 'Type',
      operator: 'in',
      options: itemTypes.map(type => ({ 
        label: type.name, 
        value: type.id || '' 
      })),
    }
  ];

  const {
    data,
    loading,
    error,
    updateFilter,
    clearFilters,
    changePage,
    queryParams
  } = useFilter({ config: filterItem, model: 'item' });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [itemsResponse, typesResponse] = await Promise.all([
          itemsApi.getItems(''),
          itemTypeApi.getItemTypes()
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

  const handleEditItem = (item: Item) => {
    setTitle('Modification d\'un article');
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
        await itemsApi.updateItem(item.id, item);
        setItems(items.map(i => i.id === item.id ? item : i));
      } else {
        const newItem = await itemsApi.createItem(item);
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
      await itemsApi.deleteItem(id);
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error in deleteItem:', err);
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const renderSidePanelContent = () => {
    if (title === 'Filtrage') {
      return (
        <View style={{ padding: 16 }}>
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
            padding: 5,
            paddingLeft: 16,
          }}>
            Informations
          </Text>
          <View style={{ flex: 1, padding: 15, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <View>
              <Input
                style={{ marginVertical: 8, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF', paddingVertical: 20, color: '#2A2E33' }}
                placeholder="Nom de l'article"
                value={formData.name}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, name: text }))}
              />
              <Select 
                value={selectedOption} 
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
              >
                <SelectTrigger className='w-100'>
                  <SelectValue
                    className='text-foreground text-sm native:text-lg'
                    placeholder='Choisissez une catégorie'
                  />
                </SelectTrigger>
                <SelectContent className='w-100'>
                  <SelectGroup>
                    <SelectLabel>Catégories</SelectLabel>
                    {itemTypes.map(type => (
                      <SelectItem 
                        key={type.id} 
                        label={type.name} 
                        value={type.name}
                      >
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <input
                type="number"
                placeholder="0.00 €"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  price: e.target.value === '' ? 0 : parseFloat(e.target.value)
                }))}
                style={{
                  marginTop: '8px',
                  marginBottom: '8px',
                  padding: '8px',
                  border: '1px solid #D7D7D7',
                  borderRadius: '5px',
                  backgroundColor: '#FFFFFF',
                  fontWeight: '300',
                  color: '#2A2E33',
                }}
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

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel title={title}>
        {renderSidePanelContent()}
      </SidePanel>
      <View style={{ flex: 1 }}>
        <Tabs
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
            <TabsList className="flex-row h-full" style={{ width: 'auto' }}>
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
          <TabsContent value={activeTab}>
            <ItemTable 
              data={items}
              columnWidths={columnWidths}
              onRowPress={handleEditItem}
              deleteItem={submitItemDelete}
            />
          </TabsContent>
        </Tabs>
      </View>
    </View>
  );
}